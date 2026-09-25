"""LADIP FastAPI REST Service
Clean, scalable backend architecture exposing patient profiles, longitudinal timelines,
prospective drug checks, and prescription OCR scanning for mobile and client applications.
"""
import base64
import io
import logging
from datetime import date, timedelta
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.config import DB_PATH
from src.faers.bulk_loader import FAERSDatabase
from src.patient.memory import PatientStore
from src.patient.models import Medication, PatientProfile, Symptom
from src.patient.report_parser import MedicalReportParser
from src.analysis.signal_matcher import SignalMatcher
from src.safety.drug_checker import DrugSafetyChecker
from src.explanations.pharmacology import PharmacologyExplainer
from src.normalization.rxnorm import normalize_drug_name

logger = logging.getLogger(__name__)

app = FastAPI(
    title="LADIP Clinical Decision Support API",
    version="1.0.0",
    description="REST API for Longitudinal Adverse Drug Interaction Prediction and Patient Safety Portal",
)

# Enable CORS for mobile apps, Expo Go, and external web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service Singletons
db = FAERSDatabase(DB_PATH)
store = PatientStore()
matcher = SignalMatcher(db=db)
checker = DrugSafetyChecker(db=db)
explainer = PharmacologyExplainer()
parser = MedicalReportParser()


# ==============================================================================
# PYDANTIC DATA CONTRACTS
# ==============================================================================
class CheckDrugRequest(BaseModel):
    drug_name: str = Field(..., description="Name of the medicine patient wants to check")
    dose: float = Field(default=0.0, description="Dosage amount")
    dose_unit: str = Field(default="mg", description="Dosage unit (mg, mcg, ml, etc.)")


class ScanBase64Request(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded image string of prescription or medical report")
    file_type: str = Field(default="image", description="File type: image or pdf")


# ==============================================================================
# REST ENDPOINTS
# ==============================================================================
@app.get("/api/v1/health")
def health_check():
    stats = db.get_stats()
    return {
        "status": "healthy",
        "service": "LADIP Pharmacovigilance API",
        "faers_database": stats,
    }


@app.get("/api/v1/patients")
def list_patients():
    """Retrieve all available patient profiles."""
    profiles = store.list_all()
    results = []
    for p in profiles:
        active_meds = p.get_active_medications()
        results.append({
            "patient_id": p.patient_id,
            "name": p.name or p.patient_id,
            "age": p.age,
            "sex": p.sex,
            "weight": p.weight,
            "conditions": p.conditions,
            "allergies": p.allergies,
            "active_medications_count": len(active_meds),
            "symptoms_count": len(p.symptoms),
        })
    return {"patients": results}


@app.get("/api/v1/patients/{patient_id}")
def get_patient(patient_id: str):
    """Retrieve complete electronic health record for a patient."""
    p = store.get(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    return p.to_dict()


@app.get("/api/v1/patients/{patient_id}/schedule")
def get_patient_daily_schedule(patient_id: str):
    """Generate patient-friendly daily dosing schedule slots (Morning, Afternoon, Evening, Bedtime)."""
    p = store.get(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    active_meds = p.get_active_medications()
    morning = []
    afternoon = []
    evening = []
    bedtime = []

    for m in active_meds:
        freq = (m.frequency or "QD").upper()
        item = {
            "drug_name": m.drug_name,
            "normalized_name": m.normalized_name,
            "dose": f"{m.dose:g} {m.dose_unit}",
            "route": m.route,
            "instructions": f"Take with water. Prescribed: {m.frequency}",
        }

        if freq in ["QD", "ONCE DAILY", "DAILY"]:
            # Default statins to evening/bedtime, others to morning
            if "statin" in m.normalized_name:
                bedtime.append(item)
            else:
                morning.append(item)
        elif freq in ["BID", "TWICE DAILY"]:
            morning.append(item)
            evening.append(item)
        elif freq in ["TID", "THREE TIMES DAILY"]:
            morning.append(item)
            afternoon.append(item)
            evening.append(item)
        elif freq in ["QID"]:
            morning.append(item)
            afternoon.append(item)
            evening.append(item)
            bedtime.append(item)
        else:
            morning.append(item)

    return {
        "patient_id": p.patient_id,
        "name": p.name,
        "slots": {
            "morning": {"title": "Morning (8:00 AM)", "items": morning},
            "afternoon": {"title": "Afternoon (1:00 PM)", "items": afternoon},
            "evening": {"title": "Evening (7:00 PM)", "items": evening},
            "bedtime": {"title": "Bedtime (10:00 PM)", "items": bedtime},
        },
    }


@app.get("/api/v1/patients/{patient_id}/alerts")
def get_patient_alerts(patient_id: str, include_suppressed: bool = False):
    """Retrieve evaluated pharmacovigilance safety signals with alert fatigue filtering."""
    p = store.get(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    alerts = matcher.match_patient(p)
    filtered = []

    for a in alerts:
        if not a.is_suppressed or include_suppressed:
            # Generate pharmacological rationale
            expl = explainer.explain(a.combo_drugs, a.adverse_event, a.prr, a.case_count)
            filtered.append({
                "combo_str": a.combo_str,
                "combo_drugs": a.combo_drugs,
                "adverse_event": a.adverse_event,
                "severity_tier": a.severity_tier,
                "prr": a.prr,
                "chi_squared": a.chi_squared,
                "case_count": a.case_count,
                "signal_strength": a.signal_strength,
                "patient_has_matching_symptom": a.patient_has_matching_symptom,
                "matching_symptom_name": a.matching_symptom_name,
                "temporal_score": a.temporal_score,
                "is_suppressed": a.is_suppressed,
                "suppression_reason": a.suppression_reason,
                "alert_priority_score": a.alert_priority_score,
                "trigger_drug": a.trigger_drug,
                "clinical_rationale": a.clinical_rationale,
                "mechanism": expl["mechanism"],
                "recommendation": expl["recommendation"],
            })

    return {
        "patient_id": p.patient_id,
        "total_alerts": len(alerts),
        "active_alerts_count": sum(1 for a in alerts if not a.is_suppressed),
        "suppressed_alerts_count": sum(1 for a in alerts if a.is_suppressed),
        "alerts": filtered,
    }


@app.post("/api/v1/patients/{patient_id}/check-drug")
def check_new_drug(patient_id: str, req: CheckDrugRequest):
    """Prospective drug safety check: Is this new medicine safe for the patient to take?"""
    p = store.get(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    assessment = checker.assess_new_drug(
        profile=p,
        new_drug_name=req.drug_name,
        dose=req.dose,
        dose_unit=req.dose_unit,
    )

    return {
        "patient_id": p.patient_id,
        "patient_name": p.name,
        "new_drug": assessment.new_drug_raw,
        "normalized_ingredient": assessment.new_drug_normalized,
        "safety_status": assessment.overall_safety_status,
        "risk_color": assessment.risk_color,
        "allergy_warnings": assessment.allergy_flags,
        "vulnerability_warnings": assessment.vulnerability_flags,
        "flagged_interactions": assessment.flagged_combinations,
        "recommendation": assessment.recommendation,
    }


@app.post("/api/v1/patients/{patient_id}/scan-report")
async def scan_prescription_file(
    patient_id: str,
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
):
    """Scan prescription / lab report image or PDF using OCR/Gemini and add extracted meds to patient profile."""
    p = store.get(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    if file:
        content = await file.read()
        ext = file.filename.split(".")[-1].lower() if file.filename else "image"
        file_type = "pdf" if ext == "pdf" else "image"
        extracted = parser.parse_report(content, file_type=file_type, default_patient_id=patient_id)
    elif raw_text:
        extracted = parser.parse_report(raw_text, file_type="text", default_patient_id=patient_id)
    else:
        raise HTTPException(status_code=400, detail="Must provide either an uploaded file or raw_text")

    # Merge extracted details into persistent patient memory
    updated_profile = store.merge_records(p, extracted)

    # Immediately run a safety check on any newly discovered medications
    alerts = matcher.match_patient(updated_profile)
    active_alerts = [a for a in alerts if not a.is_suppressed]

    return {
        "status": "success",
        "message": f"Successfully parsed document and updated records for {updated_profile.name}",
        "extracted_medications": [m.drug_name for m in extracted.medications],
        "extracted_symptoms": [s.description for s in extracted.symptoms],
        "extracted_allergies": extracted.allergies,
        "immediate_alerts": [
            {
                "combo": a.combo_str,
                "adverse_event": a.adverse_event,
                "tier": a.severity_tier,
                "priority": a.alert_priority_score,
            }
            for a in active_alerts
        ],
    }


@app.post("/api/v1/patients/{patient_id}/scan-base64")
def scan_prescription_base64(patient_id: str, req: ScanBase64Request):
    """Accept base64-encoded image from React Native mobile camera/gallery, extract medications, and update profile."""
    p = store.get(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    try:
        # Strip header if present (e.g. data:image/jpeg;base64,...)
        b64_str = req.image_base64
        if "," in b64_str:
            b64_str = b64_str.split(",")[1]
        img_bytes = base64.b64decode(b64_str)

        extracted = parser.parse_report(img_bytes, file_type="image", default_patient_id=patient_id)
        updated_profile = store.merge_records(p, extracted)
        alerts = matcher.match_patient(updated_profile)
        active_alerts = [a for a in alerts if not a.is_suppressed]

        return {
            "status": "success",
            "message": f"Successfully scanned prescription for {updated_profile.name}",
            "extracted_medications": [m.drug_name for m in extracted.medications],
            "extracted_symptoms": [s.description for s in extracted.symptoms],
            "immediate_alerts": [
                {
                    "combo": a.combo_str,
                    "adverse_event": a.adverse_event,
                    "tier": a.severity_tier,
                    "priority": a.alert_priority_score,
                }
                for a in active_alerts
            ],
        }
    except Exception as e:
        logger.error(f"Error processing base64 image: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse image: {str(e)}")
