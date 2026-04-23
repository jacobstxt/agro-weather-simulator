from fastapi import APIRouter, Depends, Request, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, validator
from datetime import date
import functools
import asyncio

from math_engine.ode import runge_kutta_4, soil_moisture_temperature
from math_engine.interpolation import fill_missing_weather_data
from math_engine.integration import growing_degree_days
from math_engine.differentiation import generate_alerts
from database.db import get_db
from database.models import SimulationResult, WeatherData, Region
from database.task_store import create_task, update_task, fail_task, get_task
from services.open_meteo import fetch_weather_data
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()
task_counter = 0


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

    @validator('date_to')
    def date_to_must_be_after_date_from(cls, date_to, values):
        if 'date_from' in values and date_to <= values['date_from']:
            raise ValueError('date_to must be after date_from')
        return date_to


def run_simulation(task_id: int, req: SimulationRequest):
    from database.db import SessionLocal
    db = SessionLocal()
    try:
        f = functools.partial(
            soil_moisture_temperature,
            rain=req.daily_rain,
            solar=req.solar_radiation
        )
        t, y = runge_kutta_4(f, [req.initial_moisture, req.initial_temp], 0, req.days)

        moisture    = [row[0] for row in y]
        temperature = [row[1] for row in y]

        result = SimulationResult(
            region_id        = req.region_id,
            days             = req.days,
            initial_moisture = req.initial_moisture,
            initial_temp     = req.initial_temp,
            daily_rain       = req.daily_rain,
            time_points      = t,
            moisture_data    = moisture,
            temperature_data = temperature
        )
        db.add(result)
        db.commit()
        db.refresh(result)

        update_task(task_id, {
            "simulation_id": result.id,
            "time":          t,
            "moisture":      moisture,
            "temperature":   temperature
        })
    except Exception as e:
        fail_task(task_id, str(e))
    finally:
        db.close()


@router.post("/simulate")
@limiter.limit("10/minute")
async def simulate(request: Request, req: SimulationRequest, background_tasks: BackgroundTasks):
    global task_counter
    task_counter += 1
    task_id = task_counter

    create_task(task_id)
    background_tasks.add_task(run_simulation, task_id, req)

    return {"task_id": task_id, "status": "running"}


@router.get("/simulate/status/{task_id}")
async def get_simulation_status(task_id: int):
    task = get_task(task_id)
    if not task:
        return {"error": "Task not found"}
    return {"task_id": task_id, **task}


@router.get("/simulate/{simulation_id}")
async def get_simulation(simulation_id: int, db: Session = Depends(get_db)):
    result = await asyncio.to_thread(
        lambda: db.query(SimulationResult).filter(
            SimulationResult.id == simulation_id
        ).first()
    )
    if not result:
        return {"error": "Simulation not found"}
    return {
        "simulation_id":  result.id,
        "region_id":      result.region_id,
        "created_at":     result.created_at,
        "time":           result.time_points,
        "moisture":       result.moisture_data,
        "temperature":    result.temperature_data
    }

@router.get("/simulate/region/{region_id}")
async def get_region_simulations(region_id: int, db: Session = Depends(get_db)):
    results = await asyncio.to_thread(
        lambda: db.query(SimulationResult).filter(
            SimulationResult.region_id == region_id
        ).all()
    )
    return {
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
async def fetch_weather(req: WeatherFetchRequest, db: Session = Depends(get_db)):
    region = await asyncio.to_thread(
        lambda: db.query(Region).filter(Region.id == req.region_id).first()
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

    await asyncio.to_thread(
        lambda: db.query(WeatherData).filter(
            WeatherData.region_id == req.region_id,
            WeatherData.date >= req.date_from,
            WeatherData.date <= req.date_to
        ).delete()
    )

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

    await asyncio.to_thread(
        lambda: (db.add_all(records), db.commit())
    )

    return {
        "message": f"Successfully fetched {len(records)} days of weather data",
        "region_id": req.region_id,
        "date_from": req.date_from,
        "date_to": req.date_to,
        "records_count": len(records)
    }