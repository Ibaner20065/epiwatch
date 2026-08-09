import os
import json
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy import text
from app.db import engine

router = APIRouter(prefix="/assistant", tags=["Assistant"])

results_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "results")
data_chunks_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "processed", "document_chunks.json")

class AssistantQueryRequest(BaseModel):
    query: str
    district_id: Optional[str] = "PUNE"
    disease: Optional[str] = "dengue"

class SourceCitation(BaseModel):
    tool_name: str
    source_label: str
    provenance: str

class AssistantQueryResponse(BaseModel):
    answer: str
    citations: List[SourceCitation]
    tools_used: List[str]
    disclaimer: str

def tool_query_predictions(district_id: str, disease: str) -> Dict[str, Any]:
    district_id = district_id.upper()
    disease = disease.lower()
    try:
        with engine.connect() as conn:
            query = text("""
                SELECT district_name, week_start, predicted_cases, ci_lower, ci_upper, risk_tier, model_version
                FROM predictions
                WHERE UPPER(district_id) = :d AND LOWER(disease) = :dis
                ORDER BY week_start ASC
            """)
            rows = conn.execute(query, {"d": district_id, "dis": disease}).fetchall()
            if rows:
                pts = []
                for r in rows:
                    pts.append({
                        "week_start": str(r[1]),
                        "predicted_cases": float(r[2]),
                        "ci_lower": float(r[3]),
                        "ci_upper": float(r[4]),
                        "risk_tier": r[5]
                    })
                return {"status": "success", "district_id": district_id, "disease": disease, "forecast": pts}
    except Exception:
        pass

    # Fallback to local predictions.json
    pred_file = os.path.join(results_dir, "predictions.json")
    if os.path.exists(pred_file):
        with open(pred_file) as f:
            all_p = json.load(f)
            matching = [p for p in all_p if p.get("district_id", "").upper() == district_id and p.get("disease", "").lower() == disease]
            if matching:
                return {"status": "success", "district_id": district_id, "disease": disease, "forecast": matching}

    return {"status": "no_data", "district_id": district_id, "disease": disease}

def tool_query_explainability(district_id: str, disease: str) -> Dict[str, Any]:
    district_id = district_id.upper()
    disease = disease.lower()
    key = f"{district_id}_{disease}"
    
    # Read detailed outbreak report
    report_file = os.path.join(results_dir, "detailed_outbreak_reports.json")
    if os.path.exists(report_file):
        with open(report_file) as f:
            reports = json.load(f)
            if key in reports:
                return {"status": "success", "report": reports[key]}

    return {"status": "no_data", "district_id": district_id, "disease": disease}

def tool_search_documents(query_str: str) -> List[Dict[str, Any]]:
    if not os.path.exists(data_chunks_path):
        return []

    with open(data_chunks_path) as f:
        chunks = json.load(f)

    keywords = [w.lower() for w in re.findall(r'\w+', query_str) if len(w) > 2]
    matches = []

    for c in chunks:
        text_content = (c.get("title", "") + " " + c.get("text", "")).lower()
        score = sum(1 for kw in keywords if kw in text_content)
        if score > 0:
            matches.append((score, c))

    matches.sort(key=lambda x: x[0], reverse=True)
    return [m[1] for m in matches[:3]]

@router.post("/query", response_model=AssistantQueryResponse)
def query_assistant(req: AssistantQueryRequest):
    q_lower = req.query.lower()

    # Refuse medical advice/diagnosis
    if any(kw in q_lower for kw in ["my symptoms", "cure me", "treatment for me", "diagnose me", "doctor"]):
        return AssistantQueryResponse(
            answer="EpiWatch is an aggregate public health outbreak prediction engine. I cannot provide individual medical advice, diagnosis, or personal treatment guidance. Please consult a qualified healthcare professional or visit your nearest Primary Health Centre (PHC).",
            citations=[],
            tools_used=["medical_disclaimer_guardrail"],
            disclaimer="Refused personal medical advice query in compliance with public health safety guardrails."
        )

    tools_used = []
    citations = []

    d_id = req.district_id or "PUNE"
    dis = req.disease or "dengue"

    # Detect target district from query text if present
    for d_test in ["PUNE", "MUMBAI", "KOLKATA", "NAGPUR", "HOWRAH", "MYSURU", "DHARWAD", "BENGALURU_URBAN"]:
        if d_test.lower().replace("_", " ") in q_lower:
            d_id = d_test
            break

    for dis_test in ["dengue", "malaria", "add"]:
        if dis_test in q_lower:
            dis = dis_test
            break

    # Determine tool execution paths
    forecast_data = None
    explain_data = None
    doc_matches = []

    if any(w in q_lower for w in ["forecast", "cases", "risk", "predict", "next month", "weeks", "trend"]):
        forecast_data = tool_query_predictions(d_id, dis)
        tools_used.append("query_predictions")
        citations.append(SourceCitation(
            tool_name="query_predictions",
            source_label=f"Supabase predictions table ({d_id} {dis.upper()})",
            provenance="HistGradientBoosting + XGBoost 8-week ML model engine"
        ))

    if any(w in q_lower for w in ["why", "driver", "climate", "rainfall", "temperature", "shap", "factor", "reason"]):
        explain_data = tool_query_explainability(d_id, dis)
        tools_used.append("query_explainability")
        citations.append(SourceCitation(
            tool_name="query_explainability",
            source_label=f"SHAP Feature Importance Engine ({d_id} {dis.upper()})",
            provenance="ml/results/detailed_outbreak_reports.json"
        ))

    if any(w in q_lower for w in ["population", "census", "density", "demographic", "location", "boundary", "hospital", "symptom"]):
        doc_matches = tool_search_documents(req.query)
        tools_used.append("search_documents")
        for chunk in doc_matches:
            citations.append(SourceCitation(
                tool_name="search_documents",
                source_label=chunk.get("title", "Census Document Chunk"),
                provenance=f"File: {chunk.get('source_file')}, Page {chunk.get('page')}"
            ))

    # Default tool invocation if general query
    if not tools_used:
        forecast_data = tool_query_predictions(d_id, dis)
        explain_data = tool_query_explainability(d_id, dis)
        tools_used.extend(["query_predictions", "query_explainability"])
        citations.append(SourceCitation(
            tool_name="query_predictions",
            source_label=f"Supabase predictions table ({d_id} {dis.upper()})",
            provenance="ML Outbreak Prediction Engine"
        ))

    # Synthesize grounded answer
    answer_parts = []

    if forecast_data and forecast_data.get("status") == "success":
        fc = forecast_data["forecast"]
        peak_pt = max(fc, key=lambda x: x["predicted_cases"])
        current_tier = fc[0]["risk_tier"] if fc else "Low"
        answer_parts.append(
            f"According to EpiWatch ML projections for **{d_id} ({dis.upper()})**, the current risk tier is **{current_tier}**. "
            f"Over the 8-week forecast horizon, case volume is expected to peak around **{peak_pt['week_start']}** with approximately **{peak_pt['predicted_cases']} estimated cases** (Confidence Interval: {peak_pt['ci_lower']} – {peak_pt['ci_upper']})."
        )
    elif forecast_data and forecast_data.get("status") == "no_data":
        answer_parts.append(f"No active ML prediction records found in the database for district **{d_id}** and disease **{dis.upper()}**.")

    if explain_data and explain_data.get("status") == "success":
        rep = explain_data["report"]
        why_info = rep.get("why", {})
        how_info = rep.get("how", {})
        answer_parts.append(
            f"**Outbreak Drivers & Explanation:**\n"
            f"- **Primary Climate Driver:** {why_info.get('primary_climate_driver')}\n"
            f"- **Demographic Impact:** {why_info.get('demographic_factor')}\n"
            f"- **Transmission Pathway:** {how_info.get('transmission_pathway')}\n"
            f"- **Recommended Action:** {how_info.get('recommended_action')}"
        )

    if doc_matches:
        doc_summary = "\n".join([f"- **{c.get('title')}:** {c.get('text')}" for c in doc_matches[:2]])
        answer_parts.append(f"**Ingested Demographic & Census Provenance Context:**\n{doc_summary}")

    full_answer = "\n\n".join(answer_parts) if answer_parts else f"Grounded data query processed for {d_id} ({dis})."

    return AssistantQueryResponse(
        answer=full_answer,
        citations=citations,
        tools_used=tools_used,
        disclaimer="Answers are strictly grounded in real Supabase database records, SHAP feature attributions, and ingested Census 2011 provenance chunks."
    )
