from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from ..db import engine
from ..models import District
from ..schemas import DistrictSchema

router = APIRouter(prefix="/districts", tags=["Districts"])

def get_db():
    with Session(engine) as session:
        yield session

@router.get("", response_model=List[DistrictSchema])
def list_districts(db: Session = Depends(get_db)):
    return db.query(District).all()

@router.get("/{district_id}", response_model=DistrictSchema)
def get_district(district_id: str, db: Session = Depends(get_db)):
    d = db.query(District).filter(District.id == district_id.upper()).first()
    if not d:
        raise HTTPException(status_code=404, detail="District not found")
    return d
