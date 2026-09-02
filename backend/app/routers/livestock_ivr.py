"""
PashuRaksha — IVR-Ready Endpoints
=================================
Simplified request/response for integration with
Exotel/Twilio DTMF-based IVR systems.
"""

from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime

from ..livestock_triage import evaluate_report, SYMPTOM_CODES, generate_report_id
from ..schemas_livestock import IVRReportRequest, IVRAdvisoryResponse

router = APIRouter(prefix="/livestock/ivr", tags=["Livestock IVR"])

SPECIES_MAP = {1: "cattle", 2: "buffalo", 3: "goat", 4: "sheep", 5: "poultry"}
DISTRICT_MAP = {
    "PUN": "PUNE", "AHM": "AHMEDNAGAR", "NAS": "NASHIK",
    "KOL": "KOLHAPUR", "SAN": "SANGLI", "SOL": "SOLAPUR",
    "NAG": "NAGPUR", "LAT": "LATUR", "JAL": "JALGAON",
}

# Pre-built advisory templates
ADVISORY_TEMPLATES = {
    "en": {
        "default": "PashuRaksha Advisory: Maintain hygiene in animal sheds. Isolate sick animals immediately. Contact your nearest veterinary dispensary. Helpline: 1800-233-0418.",
        "fmd": "FMD Alert: Do not move cattle or buffalo. Look for blisters on mouth and feet. Report to your taluka veterinary officer. Vaccination is available under NADCP.",
        "lsd": "Lumpy Skin Disease Alert: Use mosquito nets in sheds. Apply insect repellent. Separate affected cattle. LSD vaccine available free at taluka dispensary.",
        "ppr": "PPR Alert for goat and sheep owners: Watch for fever, nasal discharge, diarrhea. Do not sell sick animals. PPR vaccination is free under national programme.",
        "ai_h5n1": "Avian Influenza Alert: Report sudden poultry deaths to 1800-233-0418 immediately. Do not consume dead birds. Sanitize poultry sheds. Cooperation required for culling if confirmed.",
    },
    "hi": {
        "default": "पशुरक्षा सलाह: पशु बाड़े में स्वच्छता बनाए रखें। बीमार पशुओं को तुरंत अलग करें। निकटतम पशु चिकित्सालय से संपर्क करें। हेल्पलाइन: 1800-233-0418।",
        "fmd": "खुरपका-मुंहपका रोग चेतावनी: मवेशियों को इधर-उधर न ले जाएं। मुंह और खुरों पर छाले देखें। तालुका पशु चिकित्सा अधिकारी को सूचित करें।",
        "lsd": "लम्पी त्वचा रोग: बाड़ों में मच्छरदानी लगाएं। कीट विरोधी दवा लगाएं। प्रभावित मवेशियों को अलग करें। एलएसडी टीका तालुका औषधालय में मुफ्त उपलब्ध।",
    },
    "mr": {
        "default": "पशुरक्षा सूचना: गोठ्यामध्ये स्वच्छता राखा. आजारी जनावरांना ताबडतोब वेगळे करा. जवळच्या पशुवैद्यकीय दवाखान्याशी संपर्क करा. हेल्पलाइन: 1800-233-0418.",
        "fmd": "खुरकत-लाळखुरकत आजार सूचना: गुरे इतरत्र हलवू नका. तोंड आणि खुरांवर फोड तपासा. तालुका पशुवैद्यकीय अधिकाऱ्यांना कळवा.",
        "lsd": "गाठीदार त्वचा रोग: गोठ्यात मच्छरदाणी लावा. बाधित जनावरे वेगळी करा. एलएसडी लस तालुका दवाखान्यात मोफत उपलब्ध.",
    },
}


@router.post("/report")
def ivr_submit_report(req: IVRReportRequest):
    """Accept a simplified IVR report via DTMF codes."""
    species = SPECIES_MAP.get(req.species_code, "cattle")

    # Convert numeric symptom codes to symptom names
    symptoms = [SYMPTOM_CODES.get(code, f"unknown_{code}") for code in req.symptom_codes]

    # Resolve district
    district_id = DISTRICT_MAP.get(req.district_code or "", "PUNE")

    # Run triage
    triage = evaluate_report(
        species=species,
        symptoms=symptoms,
        num_affected=req.num_affected,
        num_dead=req.num_dead,
        severity="severe" if req.num_dead >= 3 else "moderate",
    )

    report_id = generate_report_id()
    # IVR response: keep it simple for TTS
    suspected = triage["suspected_diseases"][0]["name"] if triage["suspected_diseases"] else "Unknown"

    return {
        "report_id": report_id,
        "status": "received",
        "species": species,
        "symptoms": symptoms,
        "district_id": district_id,
        "triage_summary": triage["triage_notes"],
        "suspected_disease": suspected,
        "alert_generated": triage["alert_recommended"],
        "tts_message": f"Your report has been received. Report number {report_id}. "
                       f"Suspected disease: {suspected}. "
                       f"{'An alert has been generated. A veterinary officer will contact you.' if triage['alert_recommended'] else 'Thank you for reporting. Please monitor your animals.'}"
    }


@router.get("/advisory", response_model=IVRAdvisoryResponse)
def ivr_advisory(
    district_code: Optional[str] = None,
    disease: Optional[str] = None,
    language: str = Query("en", description="Language: en|hi|mr"),
):
    """Return a TTS-friendly advisory string."""
    lang = language if language in ADVISORY_TEMPLATES else "en"
    templates = ADVISORY_TEMPLATES[lang]
    district_id = DISTRICT_MAP.get(district_code or "", "PUNE")

    if disease and disease in templates:
        advisory_text = templates[disease]
        disease_risk = disease.upper()
    else:
        advisory_text = templates["default"]
        disease_risk = "GENERAL"

    # Resolve district name
    district_names = {
        "PUNE": "Pune", "AHMEDNAGAR": "Ahmednagar", "NASHIK": "Nashik",
        "KOLHAPUR": "Kolhapur", "SANGLI": "Sangli", "SOLAPUR": "Solapur",
        "NAGPUR": "Nagpur", "LATUR": "Latur", "JALGAON": "Jalgaon",
    }

    return IVRAdvisoryResponse(
        language=lang,
        advisory_text=advisory_text,
        disease_risk=disease_risk,
        district_name=district_names.get(district_id, district_id),
    )
