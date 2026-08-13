from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Precaution
from ..schemas import PrecautionSchema

router = APIRouter(prefix="/precautions", tags=["precautions"])

@router.get("/{disease_id}", response_model=PrecautionSchema)
def get_precautions(disease_id: str, db: Session = Depends(get_db)):
    precaution = db.query(Precaution).filter(Precaution.disease_id == disease_id.lower()).first()
    if not precaution:
        # Fallback/mock data for demo if not seeded
        return {
            "disease_id": disease_id,
            "individual_precautions": ["Eliminate stagnant water within 100m of home", "Use ODOMOS/mosquito nets during dusk hours"],
            "community_precautions": ["Report stagnant water to ward office", "Support larvicide drives"],
            "early_warning_symptoms": ["High fever", "Severe headache", "Joint pain behind eyes"],
            "high_risk_groups": ["Children under 10", "Elderly", "Pregnant women", "Immunocompromised"],
            "govt_helpline": "104",
            "seasonal_window": "Monsoon & Post-monsoon"
        }
    return precaution
