from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
import asyncio

from database.db import get_db
from database.models import Region
from services.nominatim import search_location

router = APIRouter()

class RegionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    soil_type: str = Field(min_length=1, max_length=50)
    area_ha: float = Field(gt=0, le=100000)

@router.post("/")
async def create_region(region: RegionCreate, db: Session = Depends(get_db)):
    db_region = Region(**region.model_dump())
    await asyncio.to_thread(lambda: (db.add(db_region), db.commit(), db.refresh(db_region)))
    return db_region

@router.get("/search")
async def search_region_location(
    query: str = Query(min_length=2),
    country_code: str = Query(default="ua")
):
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    try:
        results = await search_location(query, country_code=country_code)
        if not results:
            return {"results": [], "message": "Nothing found"}
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Nominatim API error: {str(e)}")

@router.get("/")
async def get_regions(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    name: str = Query(default=None),
    db: Session = Depends(get_db)
):
    query = db.query(Region).filter(Region.is_deleted == False)
    if name:
        query = query.filter(Region.name.ilike(f"%{name}%"))

    total = await asyncio.to_thread(query.count)
    regions = await asyncio.to_thread(lambda: query.offset(skip).limit(limit).all())

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "regions": regions
    }

@router.get("/{region_id}")
async def get_region(region_id: int, db: Session = Depends(get_db)):
    region = await asyncio.to_thread(
        lambda: db.query(Region).filter(Region.id == region_id, Region.is_deleted == False).first()
    )
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")
    return region


@router.delete("/{region_id}")
async def delete_region(region_id: int, db: Session = Depends(get_db)):
    region = await asyncio.to_thread(
        lambda: db.query(Region).filter(Region.id == region_id).first()
    )

    if not region:
        raise HTTPException(status_code=404, detail="Region not found")

    # Видалення
    region.is_deleted = True
    await asyncio.to_thread(
        lambda: (db.refresh(region), db.commit())
    )

    return {"message": f"Region {region_id} deleted successfully"}