from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from math_engine.ode import SOIL_PARAMS

VALID_SOIL_TYPES = list(SOIL_PARAMS.keys())
import asyncio

from database.db import get_db
from database.models import Region,User
from services.auth import get_current_user
from services.nominatim import search_location

router = APIRouter()

class RegionCreate(BaseModel):
      name: str = Field(min_length=1, max_length=100)
      latitude: float = Field(ge=-90, le=90)
      longitude: float = Field(ge=-180, le=180)
      soil_type: str = Field(pattern=f"^({'|'.join(VALID_SOIL_TYPES)})$")
      area_ha: float = Field(gt=0, le=100000)

class RegionUpdate(BaseModel):
      name: str | None = Field(default=None, min_length=1, max_length=100)
      latitude: float | None = Field(default=None, ge=-90, le=90)
      longitude: float | None = Field(default=None, ge=-180, le=180)
      soil_type: str | None = Field(default=None, pattern=f"^({'|'.join(VALID_SOIL_TYPES)})$")
      area_ha: float | None = Field(default=None, gt=0, le=100000)

@router.post("/")
async def create_region(
      region: RegionCreate,
      db: Session = Depends(get_db),
      current_user: User = Depends(get_current_user)
  ):
      db_region = Region(**region.model_dump(), user_id=current_user.id)
      await asyncio.to_thread(lambda: (db.add(db_region), db.commit(), db.refresh(db_region)))
      return db_region

@router.get("/soil-types")
async def get_soil_types():
    return {
        "soil_types": [
            {"key": k, "field_capacity": v["field_capacity"], "wilting_point": v["wilting_point"]}
            for k, v in SOIL_PARAMS.items()
        ]
    }


@router.get("/search")
async def search_region_location(
      query: str = Query(min_length=2, max_length=100),
      country_code: str = Query(default="ua"),
      current_user: User = Depends(get_current_user)
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
      db: Session = Depends(get_db),
      current_user: User = Depends(get_current_user)
  ):
      query = db.query(Region).filter(Region.is_deleted.is_(False), Region.user_id == current_user.id)
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
async def get_region(
      region_id: int,
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
      return region

@router.patch("/{region_id}")
async def update_region(
    region_id: int,
    region_data: RegionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_region = await asyncio.to_thread(
        lambda: db.query(Region).filter(
            Region.id == region_id,
            Region.user_id == current_user.id,
            Region.is_deleted.is_(False)
        ).first()
    )
    if not db_region:
        raise HTTPException(status_code=404, detail="Region not found")

    update_dict = region_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(db_region, key, value)

    await asyncio.to_thread(lambda: (db.commit(), db.refresh(db_region)))
    return db_region


@router.delete("/{region_id}")
async def delete_region(
      region_id: int,
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
          raise HTTPException(status_code=404, detail="Region not found")

      region.is_deleted = True
      await asyncio.to_thread(lambda: (db.commit(), db.refresh(region)))
      return {"message": f"Region {region_id} deleted successfully"}

