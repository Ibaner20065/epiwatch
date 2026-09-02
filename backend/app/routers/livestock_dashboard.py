"""
PashuRaksha — Official Dashboard Router
========================================
Aggregated KPIs, trends, and comparisons for
district/state veterinary officials.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import Optional, List
from datetime import datetime, timedelta

from ..db import engine
from ..models_livestock import (
    SymptomReport, MortalityEvent, LivestockAlert,
    AnimalRecord, VaccinationRecord, LabSample,
    LivestockDistrict,
)
from ..schemas_livestock import DashboardSummary, DashboardTrendPoint

router = APIRouter(prefix="/livestock/dashboard", tags=["Livestock Dashboard"])


def get_db():
    with Session(engine) as session:
        yield session


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(
    district_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Aggregate KPIs for the dashboard."""
    try:
        one_week_ago = datetime.utcnow() - timedelta(days=7)

        # District info
        district_name = district_id or "All Maharashtra"
        if district_id:
            d = db.query(LivestockDistrict).filter(LivestockDistrict.id == district_id.upper()).first()
            if d:
                district_name = d.name

        # Reports this week
        rq = db.query(func.count(SymptomReport.id)).filter(SymptomReport.reported_at >= one_week_ago)
        if district_id:
            rq = rq.filter(SymptomReport.district_id == district_id.upper())
        total_reports = rq.scalar() or 0

        # Active alerts
        aq = db.query(func.count(LivestockAlert.id)).filter(LivestockAlert.status == "active")
        if district_id:
            aq = aq.filter(LivestockAlert.district_id == district_id.upper())
        active_alerts = aq.scalar() or 0

        # Total animals
        anq = db.query(func.count(AnimalRecord.id)).filter(AnimalRecord.is_active == True)
        if district_id:
            anq = anq.filter(AnimalRecord.district_id == district_id.upper())
        total_animals = anq.scalar() or 0

        # Vaccinated animals
        vq = db.query(func.count(func.distinct(VaccinationRecord.animal_id)))
        if district_id:
            vq = vq.filter(VaccinationRecord.district_id == district_id.upper())
        vaccinated = vq.scalar() or 0
        vacc_pct = round((vaccinated / total_animals * 100), 1) if total_animals > 0 else 0.0

        # Mortality rate (deaths / affected this week)
        deaths_q = db.query(func.sum(SymptomReport.num_dead)).filter(SymptomReport.reported_at >= one_week_ago)
        affected_q = db.query(func.sum(SymptomReport.num_affected)).filter(SymptomReport.reported_at >= one_week_ago)
        if district_id:
            deaths_q = deaths_q.filter(SymptomReport.district_id == district_id.upper())
            affected_q = affected_q.filter(SymptomReport.district_id == district_id.upper())
        total_deaths = deaths_q.scalar() or 0
        total_affected = affected_q.scalar() or 1
        mortality_rate = round((total_deaths / total_affected * 100), 2)

        # Pending lab samples
        lq = db.query(func.count(LabSample.id)).filter(LabSample.status.in_(["collected", "in_transit", "received", "testing"]))
        if district_id:
            lq = lq.filter(LabSample.district_id == district_id.upper())
        pending_samples = lq.scalar() or 0

        # Active diseases
        dq = db.query(func.distinct(SymptomReport.suspected_disease)).filter(
            SymptomReport.reported_at >= one_week_ago,
            SymptomReport.suspected_disease != None,
        )
        if district_id:
            dq = dq.filter(SymptomReport.district_id == district_id.upper())
        diseases_active = [r[0] for r in dq.all() if r[0]]

        return DashboardSummary(
            district_id=district_id or "ALL",
            district_name=district_name,
            total_reports_this_week=total_reports,
            active_alerts=active_alerts,
            vaccination_coverage_pct=vacc_pct,
            mortality_rate=mortality_rate,
            pending_lab_samples=pending_samples,
            total_animals_registered=total_animals,
            diseases_active=diseases_active,
        )
    except Exception as e:
        return DashboardSummary(
            district_id=district_id or "ALL",
            district_name="Error loading dashboard",
            diseases_active=[],
        )


@router.get("/trends")
def dashboard_trends(
    district_id: Optional[str] = None,
    disease: Optional[str] = None,
    weeks: int = Query(12, le=52),
    db: Session = Depends(get_db),
):
    """Weekly trend data for charts."""
    try:
        trends = []
        now = datetime.utcnow()

        for w in range(weeks - 1, -1, -1):
            week_start = now - timedelta(weeks=w + 1)
            week_end = now - timedelta(weeks=w)

            rq = db.query(
                func.coalesce(func.sum(SymptomReport.num_affected), 0),
                func.coalesce(func.sum(SymptomReport.num_dead), 0),
                func.count(SymptomReport.id),
            ).filter(
                SymptomReport.reported_at >= week_start,
                SymptomReport.reported_at < week_end,
            )
            if district_id:
                rq = rq.filter(SymptomReport.district_id == district_id.upper())
            if disease:
                rq = rq.filter(SymptomReport.suspected_disease == disease)

            row = rq.first()
            cases = row[0] if row else 0
            deaths = row[1] if row else 0
            report_count = row[2] if row else 0

            # Alert count for this week
            aq = db.query(func.count(LivestockAlert.id)).filter(
                LivestockAlert.triggered_at >= week_start,
                LivestockAlert.triggered_at < week_end,
            )
            if district_id:
                aq = aq.filter(LivestockAlert.district_id == district_id.upper())
            alert_count = aq.scalar() or 0

            trends.append({
                "week_start": week_start.strftime("%Y-%m-%d"),
                "reported_cases": int(cases),
                "deaths": int(deaths),
                "reports": int(report_count),
                "alerts": int(alert_count),
            })

        return {"district_id": district_id or "ALL", "disease": disease or "ALL", "trends": trends}
    except Exception as e:
        return {"district_id": district_id or "ALL", "trends": [], "error": str(e)}


@router.get("/leaderboard")
def district_leaderboard(db: Session = Depends(get_db)):
    """District-level comparative metrics."""
    try:
        one_week_ago = datetime.utcnow() - timedelta(days=7)
        districts = db.query(LivestockDistrict).all()

        leaderboard = []
        for d in districts:
            reports = db.query(func.count(SymptomReport.id)).filter(
                SymptomReport.district_id == d.id,
                SymptomReport.reported_at >= one_week_ago,
            ).scalar() or 0

            active_alerts = db.query(func.count(LivestockAlert.id)).filter(
                LivestockAlert.district_id == d.id,
                LivestockAlert.status == "active",
            ).scalar() or 0

            deaths = db.query(func.coalesce(func.sum(SymptomReport.num_dead), 0)).filter(
                SymptomReport.district_id == d.id,
                SymptomReport.reported_at >= one_week_ago,
            ).scalar() or 0

            leaderboard.append({
                "district_id": d.id,
                "district_name": d.name,
                "division": d.division,
                "reports_this_week": reports,
                "active_alerts": active_alerts,
                "deaths_this_week": int(deaths),
                "total_livestock": d.total_livestock,
            })

        leaderboard.sort(key=lambda x: x["active_alerts"], reverse=True)
        return {"leaderboard": leaderboard}
    except Exception as e:
        return {"leaderboard": [], "error": str(e)}


@router.get("/response-time")
def response_time_stats(
    district_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Average time from report → acknowledgement."""
    try:
        q = db.query(LivestockAlert).filter(LivestockAlert.acknowledged_at != None)
        if district_id:
            q = q.filter(LivestockAlert.district_id == district_id.upper())

        alerts = q.all()
        if not alerts:
            return {"avg_response_minutes": 0, "total_acknowledged": 0}

        total_minutes = sum(
            (a.acknowledged_at - a.triggered_at).total_seconds() / 60
            for a in alerts
            if a.acknowledged_at and a.triggered_at
        )
        avg = round(total_minutes / len(alerts), 1)

        return {
            "district_id": district_id or "ALL",
            "avg_response_minutes": avg,
            "total_acknowledged": len(alerts),
        }
    except Exception as e:
        return {"avg_response_minutes": 0, "error": str(e)}
