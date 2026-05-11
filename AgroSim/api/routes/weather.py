from fastapi import APIRouter, Depends, Request, BackgroundTasks, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import date
import asyncio
import threading
import traceback

from math_engine.ode import runge_kutta_4, build_daily_interpolators, soil_moisture_ode, SOIL_PARAMS
from math_engine.interpolation import fill_missing_weather_data
from math_engine.integration import growing_degree_days
from math_engine.differentiation import generate_alerts
from database.db import get_db
from database.models import SimulationResult, WeatherData, Region, User
from database.task_store import create_task, update_task, fail_task, get_task
from services.open_meteo import fetch_weather_data
from services.auth import get_current_user
from logger import logger
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()
task_counter = 0
_task_lock = threading.Lock()


class SimulationRequest(BaseModel):
  region_id: int = Field(default=1, ge=1)
  days: float = Field(default=30.0, gt=0, le=365)
  initial_moisture: float = Field(default=50.0, ge=0, le=500)
  initial_temp: float = Field(default=15.0, ge=-50, le=60)
  daily_rain: float = Field(default=5.0, ge=0, le=200)
  solar_radiation: float = Field(default=200.0, ge=0, le=1000)

class InterpolationRequest(BaseModel):
  known_days: list[float] = Field(min_length=2)
  known_values: list[float] = Field(min_length=2)
  all_days: list[float] = Field(min_length=2)

class IntegrationRequest(BaseModel):
  temperatures: list[float] = Field(min_length=2)
  base_temp: float = Field(default=10.0, ge=-50, le=50)

class AlertRequest(BaseModel):
  times: list[float] = Field(min_length=2)
  moisture: list[float] = Field(min_length=2)
  threshold: float = Field(default=-2.0, le=0)

class WeatherFetchRequest(BaseModel):
  region_id: int = Field(ge=1)
  date_from: date
  date_to: date

  @model_validator(mode='after')
  def validate_date_range(self):
      if self.date_from and self.date_to:
          if self.date_to <= self.date_from:
              raise ValueError('date_to must be after date_from')
          if (self.date_to - self.date_from).days > 365:
              raise ValueError('Date range cannot exceed 365 days')
      return self


def run_simulation(task_id: int, req: SimulationRequest, user_id: int):
  from database.db import SessionLocal
  from datetime import date, timedelta
  from services.open_meteo import fetch_weather_data
  import asyncio

  db = SessionLocal()
  try:
      region = db.query(Region).filter(Region.id == req.region_id).first()
      if not region:
          fail_task(task_id, f"Region {req.region_id} not found")
          return

      date_to   = date.today()
      date_from = date_to - timedelta(days=int(req.days))

      weather_records = db.query(WeatherData).filter(
          WeatherData.region_id == req.region_id,
          WeatherData.date >= date_from,
          WeatherData.date <= date_to
      ).order_by(WeatherData.date).all()

      expected_days = int(req.days)
      if len(weather_records) < expected_days:
          loop = asyncio.new_event_loop()
          weather_data = loop.run_until_complete(
              fetch_weather_data(
                  latitude=region.latitude,
                  longitude=region.longitude,
                  date_from=date_from,
                  date_to=date_to
              )
          )
          loop.close()

          existing_dates = {r.date.date() if hasattr(r.date, 'date') else r.date for r in weather_records}
          records = []
          for day in weather_data:
              day_date = day["date"].date() if hasattr(day["date"], 'date') else day["date"]
              if day_date not in existing_dates:
                  records.append(WeatherData(
                      region_id              = req.region_id,
                      date                   = day["date"],
                      temperature            = day["temperature"],
                      precipitation          = day["precipitation"],
                      humidity               = day["humidity"],
                      wind_speed             = day["wind_speed"],
                      et0_evapotranspiration = day["et0_evapotranspiration"],
                      solar_radiation        = day["solar_radiation"],
                  ))
          if records:
              db.add_all(records)
              db.commit()
          weather_records = db.query(WeatherData).filter(
              WeatherData.region_id == req.region_id,
              WeatherData.date >= date_from,
              WeatherData.date <= date_to
          ).order_by(WeatherData.date).all()

      # Build daily arrays — missing values fall back to safe defaults
      daily_rain = [r.precipitation          if r.precipitation          is not None else 0.0  for r in weather_records]
      daily_et0  = [r.et0_evapotranspiration if r.et0_evapotranspiration is not None else 0.0  for r in weather_records]
      daily_temp = [r.temperature             if r.temperature             is not None else 15.0 for r in weather_records]

      # Cubic spline interpolators — smooth continuous signal between daily points
      rain_fn = build_daily_interpolators(daily_rain, req.days)
      et0_fn  = build_daily_interpolators(daily_et0,  req.days)
      temp_fn = build_daily_interpolators(daily_temp, req.days)

      # Soil-type specific physical limits
      soil_key = (region.soil_type or "loam").lower().replace(" ", "_")
      params   = SOIL_PARAMS.get(soil_key, SOIL_PARAMS["loam"])

      def simulation_func(t, y):
          return soil_moisture_ode(
              t, y,
              rain_fn=rain_fn,
              et0_fn=et0_fn,
              temp_fn=temp_fn,
              crop_coefficient=1.0,
              field_capacity=params["field_capacity"],
              wilting_point=params["wilting_point"],
          )

      t, y = runge_kutta_4(
          simulation_func,
          [req.initial_moisture, req.initial_temp],
          0, req.days
      )

      moisture    = [row[0] for row in y]
      temperature = [row[1] for row in y]

      avg_rain = sum(daily_rain) / len(daily_rain) if daily_rain else req.daily_rain

      result = SimulationResult(
          region_id        = req.region_id,
          user_id          = user_id,
          days             = req.days,
          initial_moisture = req.initial_moisture,
          initial_temp     = req.initial_temp,
          daily_rain       = avg_rain,
          time_points      = t,
          moisture_data    = moisture,
          temperature_data = temperature
      )
      db.add(result)
      db.commit()
      db.refresh(result)

      update_task(task_id, {
          "simulation_id":     result.id,
          "time":              t,
          "moisture":          moisture,
          "temperature":       temperature,
          "used_real_weather": any(r.et0_evapotranspiration is not None for r in weather_records),
          "avg_rain":          round(avg_rain, 2),
          "soil_type":         region.soil_type,
          "field_capacity":    params["field_capacity"],
          "wilting_point":     params["wilting_point"],
      })
  except Exception as e:
      logger.error(f"Simulation task {task_id} failed:\n{traceback.format_exc()}")
      fail_task(task_id, str(e))
  finally:
      db.close()


@router.post("/simulate")
@limiter.limit("10/minute")
async def simulate(
      request: Request,
      req: SimulationRequest,
      background_tasks: BackgroundTasks,
      db: Session = Depends(get_db),
      current_user: User = Depends(get_current_user)
):
  region = await asyncio.to_thread(
      lambda: db.query(Region).filter(
          Region.id == req.region_id,
          Region.is_deleted.is_(False),
          Region.user_id == current_user.id
      ).first()
  )

  if not region:
      raise HTTPException(
          status_code=404,
          detail=f"Region with id {req.region_id} not found"
      )

  global task_counter
  with _task_lock:
      task_counter += 1
      task_id = task_counter

  create_task(task_id)
  background_tasks.add_task(run_simulation, task_id, req, current_user.id)

  return {"task_id": task_id, "status": "running"}


@router.get("/simulate/count")
async def get_simulation_count(
      db: Session = Depends(get_db),
      current_user: User = Depends(get_current_user)
):
  total = await asyncio.to_thread(
      lambda: db.query(SimulationResult).filter(
          SimulationResult.user_id == current_user.id
      ).count()
  )
  return {"total": total}


@router.get("/simulate/status/{task_id}")
async def get_simulation_status(task_id: int):
  task = get_task(task_id)
  if not task:
      raise HTTPException(status_code=404, detail="Task not found")
  return {"task_id": task_id, **task}


@router.get("/simulate/{simulation_id}")
async def get_simulation(simulation_id: int, db: Session = Depends(get_db), current_user : User = Depends(get_current_user)):
  result = await asyncio.to_thread(
      lambda: db.query(SimulationResult).filter(
          SimulationResult.id == simulation_id,
          SimulationResult.user_id == current_user.id
      ).first()
  )
  if not result:
      raise HTTPException(status_code=404, detail="Simulation not found")
  return {
      "simulation_id":  result.id,
      "region_id":      result.region_id,
      "created_at":     result.created_at,
      "time":           result.time_points,
      "moisture":       result.moisture_data,
      "temperature":    result.temperature_data
  }


@router.get("/simulate/region/{region_id}")
async def get_region_simulations(
      region_id: int,
      skip: int = Query(default=0, ge=0),
      limit: int = Query(default=10, ge=1, le=100),
      db: Session = Depends(get_db),
      current_user: User = Depends(get_current_user)
):
  region = await asyncio.to_thread(
      lambda: db.query(Region).filter(
          Region.id == region_id,
          Region.is_deleted.is_(False),
          Region.user_id == current_user.id
      ).first()
  )
  if not region:
      raise HTTPException(status_code=404, detail="Region not found")

  query = db.query(SimulationResult).filter(
      SimulationResult.region_id == region_id,
      SimulationResult.user_id == current_user.id
  )
  total = await asyncio.to_thread(query.count)
  results = await asyncio.to_thread(
      lambda: query.order_by(SimulationResult.created_at.desc())
      .offset(skip)
      .limit(limit)
      .all()
  )

  return {
      "total": total,
      "skip": skip,
      "limit": limit,
      "simulations": [
          {"id": r.id, "created_at": r.created_at, "days": r.days}
          for r in results
      ]
  }


@router.post("/interpolate")
async def interpolate(req: InterpolationRequest):
  result = await asyncio.to_thread(
      fill_missing_weather_data,
      req.known_days, req.known_values, req.all_days
  )
  return {"interpolated": result}


@router.post("/growing-degree-days")
async def calc_gdd(req: IntegrationRequest):
  gdd = await asyncio.to_thread(
      growing_degree_days,
      req.temperatures, req.base_temp
  )
  return {"growing_degree_days": round(gdd, 2)}


@router.post("/alerts")
async def get_alerts(req: AlertRequest):
  alerts = await asyncio.to_thread(
      generate_alerts,
      req.times, req.moisture, req.threshold
  )
  return {"alerts": alerts, "count": len(alerts)}


@router.post("/fetch")
async def fetch_weather(req: WeatherFetchRequest, db: Session = Depends(get_db),  current_user: User = Depends(get_current_user)):
  region = await asyncio.to_thread(
      lambda: db.query(Region).filter(Region.id == req.region_id,Region.user_id == current_user.id).first()
  )
  if not region:
      raise HTTPException(status_code=404, detail=f"Region with id {req.region_id} not found")

  try:
      weather_data = await fetch_weather_data(
          latitude=region.latitude,
          longitude=region.longitude,
          date_from=req.date_from,
          date_to=req.date_to
      )
  except Exception as e:
      raise HTTPException(status_code=502, detail=f"Open-Meteo API error: {str(e)}")

  records = []
  for day in weather_data:
      record = WeatherData(
          region_id              = req.region_id,
          date                   = day["date"],
          temperature            = day["temperature"],
          precipitation          = day["precipitation"],
          humidity               = day["humidity"],
          wind_speed             = day["wind_speed"],
          et0_evapotranspiration = day["et0_evapotranspiration"],
          solar_radiation        = day["solar_radiation"],
      )
      records.append(record)

  def replace_records():
      db.query(WeatherData).filter(
          WeatherData.region_id == req.region_id,
          WeatherData.date >= req.date_from,
          WeatherData.date <= req.date_to
      ).delete()
      db.add_all(records)
      db.commit()

  await asyncio.to_thread(replace_records)

  return {
      "message": f"Successfully fetched {len(records)} days of weather data",
      "region_id": req.region_id,
      "date_from": req.date_from,
      "date_to": req.date_to,
      "records_count": len(records)
  }


@router.get("/data/{region_id}")
async def get_weather_data(
      region_id: int,
      date_from: date = None,
      date_to: date = None,
      db: Session = Depends(get_db),
      current_user: User = Depends(get_current_user)
  ):
      region = await asyncio.to_thread(
          lambda: db.query(Region).filter(
              Region.id == region_id,
              Region.user_id == current_user.id
          ).first()
      )
      if not region:
          raise HTTPException(status_code=404, detail=f"Region with id {region_id} not found")

      def query_data():
          q = db.query(WeatherData).filter(WeatherData.region_id == region_id)
          if date_from:
              q = q.filter(WeatherData.date >= date_from)
          if date_to:
              q = q.filter(WeatherData.date <= date_to)
          return q.order_by(WeatherData.date).all()

      records = await asyncio.to_thread(query_data)

      return {
          "region_id": region_id,
          "region_name": region.name,
          "records_count": len(records),
          "data": [
              {
                  "date": r.date,
                  "temperature": r.temperature,
                  "precipitation": r.precipitation,
                  "humidity": r.humidity,
                  "wind_speed": r.wind_speed,
                  "et0_evapotranspiration": r.et0_evapotranspiration,
                  "solar_radiation": r.solar_radiation,
              }
              for r in records
          ]
      }
