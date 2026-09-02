"""
PashuRaksha — Livestock Symptom & Mortality Reporting Router
============================================================
Endpoints for submitting symptom reports, mortality events,
and batch-syncing offline reports. Auto-runs triage on each
submission and generates alerts when thresholds are breached.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from ..db import engine
from ..models_livestock import SymptomReport, MortalityEvent, LivestockAlert, LivestockDistrict
from ..schemas_livestock import (
    SymptomReportCreate, SymptomReportSchema,
    MortalityEventCreate, MortalityEventSchema,
    BatchSyncRequest, BatchSyncResponse,
    LivestockDistrictSchema,
)
from ..livestock_triage import (
    evaluate_report, build_alert_message,
    generate_report_id, generate_alert_id, generate_event_id,
)

router = APIRouter(prefix="/livestock", tags=["Livestock Reports"])


def get_db():
    with Session(engine) as session:
        yield session


# ── Districts ──────────────────────────────────────────────────────

@router.get("/districts", response_model=List[LivestockDistrictSchema])
def list_livestock_districts(db: Session = Depends(get_db)):
    """List all Maharashtra livestock districts."""
    try:
        districts = db.query(LivestockDistrict).all()
        if districts:
            return districts
    except Exception:
        pass

    # Static fallback
    import json, os
    fallback_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "..", "data", "raw", "livestock", "district_livestock.json"
    )
    if os.path.exists(fallback_path):
        with open(fallback_path) as f:
            data = json.load(f)
        return [
            LivestockDistrictSchema(
                id=d["id"], name=d["name"], state=d.get("state", "Maharashtra"),
                division=d.get("division"), lat=d["lat"], lon=d["lon"],
                cattle_population=d.get("livestock_census", {}).get("cattle", 0),
                buffalo_population=d.get("livestock_census", {}).get("buffalo", 0),
                goat_population=d.get("livestock_census", {}).get("goat", 0),
                sheep_population=d.get("livestock_census", {}).get("sheep", 0),
                poultry_population=d.get("livestock_census", {}).get("poultry", 0),
                total_livestock=d.get("livestock_census", {}).get("total", 0),
            )
            for d in data
        ]
    return []


# ── Symptom Reports ───────────────────────────────────────────────

@router.post("/reports/symptom", response_model=SymptomReportSchema)
def submit_symptom_report(report: SymptomReportCreate, db: Session = Depends(get_db)):
    """Submit a symptom report from a farmer or field worker."""
    report_id = generate_report_id()

    # Run triage engine
    triage_result = evaluate_report(
        species=report.species,
        symptoms=report.symptoms,
        num_affected=report.num_affected,
        num_dead=report.num_dead,
        severity=report.severity,
    )

    # Determine suspected disease from triage
    suspected_disease = report.suspected_disease
    if not suspected_disease and triage_result["suspected_diseases"]:
        suspected_disease = triage_result["suspected_diseases"][0]["disease_id"]

    db_report = SymptomReport(
        report_id=report_id,
        district_id=report.district_id.upper(),
        block=report.block,
        village=report.village,
        species=report.species,
        breed=report.breed,
        num_affected=report.num_affected,
        num_dead=report.num_dead,
        symptoms=report.symptoms,
        severity=report.severity,
        suspected_disease=suspected_disease,
        description=report.description,
        reporter_type=report.reporter_type,
        reporter_name=report.reporter_name,
        reporter_phone=report.reporter_phone,
        lat=report.lat,
        lon=report.lon,
        photo_urls=report.photo_urls,
        animal_id=report.animal_id,
        reported_at=datetime.utcnow(),
        offline_synced=report.offline_synced,
        triage_result=triage_result,
        language=report.language,
    )

    try:
        db.add(db_report)
        db.commit()
        db.refresh(db_report)

        # Auto-generate alert if triage recommends it
        if triage_result["alert_recommended"]:
            _create_alert_from_triage(db, db_report, triage_result)

        return db_report
    except Exception as e:
        db.rollback()
        # Return an unsaved response with triage result for offline mode
        return SymptomReportSchema(
            id=0,
            report_id=f"UNSAVED-{report_id}",
            district_id=report.district_id.upper(),
            block=report.block,
            village=report.village,
            species=report.species,
            breed=report.breed,
            num_affected=report.num_affected,
            num_dead=report.num_dead,
            symptoms=report.symptoms,
            severity=report.severity,
            suspected_disease=suspected_disease,
            description=report.description,
            reporter_type=report.reporter_type,
            reporter_name=report.reporter_name,
            reporter_phone=report.reporter_phone,
            lat=report.lat,
            lon=report.lon,
            reported_at=datetime.utcnow(),
            offline_synced=False,
            triage_result=triage_result,
            language=report.language,
        )


def _create_alert_from_triage(db: Session, report: SymptomReport, triage: dict):
    """Create an alert record from triage results."""
    disease_name = "Unknown"
    disease_id = None
    if triage["suspected_diseases"]:
        disease_name = triage["suspected_diseases"][0]["name"]
        disease_id = triage["suspected_diseases"][0]["disease_id"]

    messages = build_alert_message(
        disease_name=disease_name,
        species=report.species,
        village=report.village,
        block=report.block,
        district=report.district_id,
        num_affected=report.num_affected,
        num_dead=report.num_dead,
        reason=triage["alert_reason"] or "Triage threshold breached",
    )

    alert = LivestockAlert(
        alert_id=generate_alert_id(),
        alert_type="triage_auto",
        severity=triage["alert_severity"] or "watch",
        status="active",
        district_id=report.district_id,
        block=report.block,
        village=report.village,
        disease=disease_id,
        species=report.species,
        message_en=messages["en"],
        message_hi=messages["hi"],
        message_mr=messages["mr"],
        triggered_by_report_id=report.report_id,
        triggered_at=datetime.utcnow(),
        details_json={
            "triage": triage,
            "report_id": report.report_id,
        },
    )
    db.add(alert)
    db.commit()


# ── Mortality Events ──────────────────────────────────────────────

@router.post("/reports/mortality", response_model=MortalityEventSchema)
def submit_mortality_event(event: MortalityEventCreate, db: Session = Depends(get_db)):
    """Submit a mortality event."""
    event_id = generate_event_id()

    db_event = MortalityEvent(
        event_id=event_id,
        district_id=event.district_id.upper(),
        block=event.block,
        village=event.village,
        species=event.species,
        num_dead=event.num_dead,
        suspected_cause=event.suspected_cause,
        reported_by=event.reported_by,
        reporter_phone=event.reporter_phone,
        lat=event.lat,
        lon=event.lon,
        reported_at=datetime.utcnow(),
    )

    try:
        db.add(db_event)
        db.commit()
        db.refresh(db_event)

        # Auto-alert for significant mortality
        if event.num_dead >= 3:
            triage = evaluate_report(
                species=event.species,
                symptoms=["sudden_death"],
                num_affected=event.num_dead,
                num_dead=event.num_dead,
                severity="mass_mortality" if event.num_dead >= 10 else "severe",
            )
            if triage["alert_recommended"]:
                messages = build_alert_message(
                    disease_name=event.suspected_cause or "Unknown",
                    species=event.species,
                    village=event.village,
                    block=event.block,
                    district=event.district_id,
                    num_affected=event.num_dead,
                    num_dead=event.num_dead,
                    reason=triage["alert_reason"] or "Mortality spike",
                )
                alert = LivestockAlert(
                    alert_id=generate_alert_id(),
                    alert_type="mortality_spike",
                    severity=triage["alert_severity"] or "warning",
                    status="active",
                    district_id=event.district_id.upper(),
                    block=event.block,
                    village=event.village,
                    disease=event.suspected_cause,
                    species=event.species,
                    message_en=messages["en"],
                    message_hi=messages["hi"],
                    message_mr=messages["mr"],
                    triggered_at=datetime.utcnow(),
                    details_json={"mortality_event_id": event_id, "num_dead": event.num_dead},
                )
                db.add(alert)
                db.commit()

        return db_event
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── Query Reports ─────────────────────────────────────────────────

@router.get("/reports", response_model=List[SymptomReportSchema])
def list_reports(
    district_id: Optional[str] = None,
    block: Optional[str] = None,
    species: Optional[str] = None,
    disease: Optional[str] = None,
    severity: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
):
    """Query symptom reports with filters."""
    q = db.query(SymptomReport)
    if district_id:
        q = q.filter(SymptomReport.district_id == district_id.upper())
    if block:
        q = q.filter(SymptomReport.block == block)
    if species:
        q = q.filter(SymptomReport.species == species)
    if disease:
        q = q.filter(SymptomReport.suspected_disease == disease)
    if severity:
        q = q.filter(SymptomReport.severity == severity)
    if date_from:
        q = q.filter(SymptomReport.reported_at >= date_from)
    if date_to:
        q = q.filter(SymptomReport.reported_at <= date_to)

    return q.order_by(SymptomReport.reported_at.desc()).limit(limit).all()


@router.get("/reports/{report_id}", response_model=SymptomReportSchema)
def get_report(report_id: str, db: Session = Depends(get_db)):
    """Get a single report by report_id."""
    report = db.query(SymptomReport).filter(SymptomReport.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found")
    return report


# ── Batch Sync (Offline) ─────────────────────────────────────────

@router.post("/reports/batch-sync", response_model=BatchSyncResponse)
def batch_sync_reports(batch: BatchSyncRequest, db: Session = Depends(get_db)):
    """Batch upload reports queued during offline operation."""
    synced = 0
    failed = 0
    report_ids = []
    errors = []

    for report_data in batch.reports:
        try:
            report_data.offline_synced = True
            report_id = generate_report_id()

            triage_result = evaluate_report(
                species=report_data.species,
                symptoms=report_data.symptoms,
                num_affected=report_data.num_affected,
                num_dead=report_data.num_dead,
                severity=report_data.severity,
            )

            suspected_disease = report_data.suspected_disease
            if not suspected_disease and triage_result["suspected_diseases"]:
                suspected_disease = triage_result["suspected_diseases"][0]["disease_id"]

            db_report = SymptomReport(
                report_id=report_id,
                district_id=report_data.district_id.upper(),
                block=report_data.block,
                village=report_data.village,
                species=report_data.species,
                breed=report_data.breed,
                num_affected=report_data.num_affected,
                num_dead=report_data.num_dead,
                symptoms=report_data.symptoms,
                severity=report_data.severity,
                suspected_disease=suspected_disease,
                description=report_data.description,
                reporter_type=report_data.reporter_type,
                reporter_name=report_data.reporter_name,
                reporter_phone=report_data.reporter_phone,
                lat=report_data.lat,
                lon=report_data.lon,
                photo_urls=report_data.photo_urls,
                animal_id=report_data.animal_id,
                reported_at=datetime.utcnow(),
                offline_synced=True,
                triage_result=triage_result,
                language=report_data.language,
            )
            db.add(db_report)
            db.commit()
            db.refresh(db_report)

            if triage_result["alert_recommended"]:
                _create_alert_from_triage(db, db_report, triage_result)

            report_ids.append(report_id)
            synced += 1
        except Exception as e:
            db.rollback()
            failed += 1
            errors.append(str(e))

    return BatchSyncResponse(synced=synced, failed=failed, report_ids=report_ids, errors=errors)


# ── Triage-only endpoint (no DB save) ────────────────────────────

@router.post("/triage/evaluate")
def evaluate_triage_only(report: SymptomReportCreate):
    """Run triage evaluation without saving to DB (useful for offline preview)."""
    result = evaluate_report(
        species=report.species,
        symptoms=report.symptoms,
        num_affected=report.num_affected,
        num_dead=report.num_dead,
        severity=report.severity,
    )
    return result
