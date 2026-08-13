from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import GovtScheme
from ..schemas import GovtSchemeSchema
from typing import List

router = APIRouter(prefix="/benefits", tags=["benefits"])

@router.get("/{disease_id}", response_model=List[GovtSchemeSchema])
def get_benefits(disease_id: str, db: Session = Depends(get_db)):
    schemes = db.query(GovtScheme).filter(GovtScheme.disease_id == disease_id.lower()).all()
    if not schemes:
        # Mock fallback data for demo
        return [{
            "disease_id": disease_id,
            "scheme_name": "Ayushman Bharat PM-JAY",
            "covering_body": "Central",
            "max_coverage_amount": "₹5,00,000 per family/year",
            "eligibility_summary": "SC/ST, no adult earner, SECC 2011 criteria",
            "application_link": "https://pmjay.gov.in",
            "helpline": "14555"
        }]
    return schemes
