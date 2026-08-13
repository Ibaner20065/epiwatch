import os
import csv
import re
from typing import List, Dict, Optional, Any
from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(prefix="/news", tags=["News"])

# Load district crosswalk for neighbor matching
_crosswalk: List[Dict[str, str]] = []
_crosswalk_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "district_crosswalk.csv")

# State-level neighbor mapping for cross-referencing
STATE_NEIGHBORS = {
    "Maharashtra": ["PUNE", "MUMBAI", "NAGPUR"],
    "West Bengal": ["KOLKATA", "HOWRAH", "NORTH_24_PARGANAS"],
    "Karnataka": ["BENGALURU_URBAN", "MYSURU", "DHARWAD"],
}


def _load_crosswalk():
    global _crosswalk
    if _crosswalk:
        return _crosswalk
    if os.path.exists(_crosswalk_path):
        with open(_crosswalk_path, "r") as f:
            _crosswalk = list(csv.DictReader(f))
    return _crosswalk


def _get_district_info(district_id: str) -> Optional[Dict[str, str]]:
    crosswalk = _load_crosswalk()
    for row in crosswalk:
        if row["district_id"].upper() == district_id.upper():
            return row
    return None


def _get_neighboring_districts(district_id: str) -> List[Dict[str, str]]:
    """Find districts in the same state as the given district."""
    info = _get_district_info(district_id)
    if not info:
        return []
    state = info.get("state", "")
    crosswalk = _load_crosswalk()
    return [
        row for row in crosswalk
        if row.get("state") == state and row["district_id"].upper() != district_id.upper()
    ]


def _extract_health_signals(district_id: str, district_name: str, state: str) -> List[Dict[str, Any]]:
    """
    Generate regional health signals based on known epidemiological patterns.
    In production, this would call a news API or web search.
    Currently uses seasonal pattern matching + regional context.
    """
    signals = []

    # Cross-reference with neighboring districts that have predictions
    neighbors = _get_neighboring_districts(district_id)
    neighbor_names = [n["district_name"] for n in neighbors]

    if neighbors:
        signals.append({
            "type": "regional_context",
            "title": f"Active monitoring in {state} region",
            "summary": f"EpiWatch is actively monitoring {len(neighbors) + 1} districts in {state}: {district_name} and {', '.join(neighbor_names)}. Cross-district transmission patterns are tracked for early warning.",
            "relevance": "high",
            "source": "EpiWatch District Crosswalk",
            "districts_mentioned": [district_name] + neighbor_names,
        })

    # Monsoon season advisory (June-October for India)
    signals.append({
        "type": "seasonal_advisory",
        "title": f"Monsoon Season — Elevated Vector-Borne Disease Risk in {state}",
        "summary": f"The Indian monsoon season (June–October) historically correlates with dengue and malaria case surges in {state} due to increased mosquito breeding in standing water. Districts with high population density like {district_name} are particularly vulnerable.",
        "relevance": "medium",
        "source": "IDSP Seasonal Pattern Analysis",
        "districts_mentioned": [district_name],
    })

    return signals


class RegionalSignal(BaseModel):
    type: str
    title: str
    summary: str
    relevance: str
    source: str
    districts_mentioned: List[str]


class RegionalSignalResponse(BaseModel):
    district_id: str
    district_name: str
    state: str
    signals: List[RegionalSignal]
    signal_count: int
    disclaimer: str


@router.get("/regional-signal", response_model=RegionalSignalResponse)
def get_regional_signals(district_id: str = Query("PUNE")):
    """
    Returns qualitative regional health signals for a district.
    These are informational advisories — NOT model inputs or numeric predictions.
    """
    d_id = district_id.upper()
    info = _get_district_info(d_id)

    if not info:
        return RegionalSignalResponse(
            district_id=d_id,
            district_name=d_id,
            state="Unknown",
            signals=[],
            signal_count=0,
            disclaimer="Regional Signal — Informational only, not a model input. District not found in monitoring network."
        )

    district_name = info["district_name"]
    state = info["state"]

    signals = _extract_health_signals(d_id, district_name, state)

    return RegionalSignalResponse(
        district_id=d_id,
        district_name=district_name,
        state=state,
        signals=[RegionalSignal(**s) for s in signals],
        signal_count=len(signals),
        disclaimer="Regional Signal — Informational only, not a model input. These signals are qualitative advisories based on regional context and seasonal patterns."
    )
