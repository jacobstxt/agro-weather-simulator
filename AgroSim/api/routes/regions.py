from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
import asyncio

from database.db import get_db
from database.models import Region

router = APIRouter()

class RegionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    soil_type: str = Field(min_length=1, max_length=50)
    area_ha: float = Field(gt=0, le=100000)

@router.post("/")
async def create_region(region: RegionCreate, db: Session = Depends(get_db)):
    db_region = Region(**region.dict())
    await asyncio.to_thread(lambda: (db.add(db_region), db.commit(), db.refresh(db_region)))
    return db_region

@router.get("/")
async def get_regions(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    total, regions = await asyncio.to_thread(
        lambda: (
            db.query(Region).count(),
            db.query(Region).offset(skip).limit(limit).all()
        )
    )
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "regions": regions
    }

@router.get("/{region_id}")
async def get_region(region_id: int, db: Session = Depends(get_db)):
    region = await asyncio.to_thread(
        lambda: db.query(Region).filter(Region.id == region_id).first()
    )
    if not region:
        return {"error": "Region not found"}
    return region