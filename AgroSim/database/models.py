from sqlalchemy import Column, Integer, Float, String, DateTime, JSON, Index, Boolean
from sqlalchemy.sql import func
from database.db import Base

class Region(Base):
    __tablename__ = "regions"
    id        = Column(Integer, primary_key=True, index=True)
    name      = Column(String, index=True)
    latitude  = Column(Float)
    longitude = Column(Float)
    soil_type = Column(String)
    area_ha   = Column(Float)
    is_deleted = Column(Boolean, nullable=False, default=False)
    user_id = Column(Integer, nullable=True)


class WeatherData(Base):
    __tablename__ = "weather_data"
    id                  = Column(Integer, primary_key=True, index=True)
    region_id           = Column(Integer, index=True)
    date                = Column(DateTime, index=True)
    temperature         = Column(Float)
    precipitation       = Column(Float)
    humidity            = Column(Float)
    wind_speed          = Column(Float)
    et0_evapotranspiration = Column(Float, nullable=True)
    solar_radiation     = Column(Float, nullable=True)

class SimulationResult(Base):
    __tablename__ = "simulation_results"
    id               = Column(Integer, primary_key=True, index=True)
    region_id        = Column(Integer, index=True)
    created_at       = Column(DateTime, server_default=func.now(), index=True)
    days             = Column(Float)
    initial_moisture = Column(Float)
    initial_temp     = Column(Float)
    daily_rain       = Column(Float)
    time_points      = Column(JSON)
    moisture_data    = Column(JSON)
    temperature_data = Column(JSON)

class User(Base):
      __tablename__ = "users"
      id              = Column(Integer, primary_key=True, index=True)
      email           = Column(String, unique=True, index=True, nullable=False)
      hashed_password = Column(String, nullable=False)
      first_name      = Column(String, nullable=True)
      last_name       = Column(String, nullable=True)
