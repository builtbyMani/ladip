"""LADIP FastAPI REST Service
Clean, scalable backend architecture exposing patient profiles, longitudinal timelines,
prospective drug checks, and prescription OCR scanning for mobile and client applications.
"""
import base64
import logging
from datetime import date
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
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

ASSETS_DIR = Path(__file__).resolve().parent / "assets"

app = FastAPI(
    title="LADIP Clinical Decision Support API",
    version="2.0.0",
    description=(
        "REST API for Longitudinal Adverse Drug Interaction Prediction (LADIP) "
        "and Patient Safety Portal powered by FDA FAERS disproportionality analysis."
    ),
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


class SimulateComboRequest(BaseModel):
    drugs: List[str] = Field(..., description="List of medication names to evaluate for multi-drug disproportionality")


# ==============================================================================
# CUSTOM 404 PAGE & EXCEPTION HANDLER
# ==============================================================================
def _render_editorial_404_html(path: str, detail: str) -> str:
    year = date.today().year
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>404 Page Not Found | LADIP — Temporal Pharmacovigilance</title>
  <meta name="description" content="The requested clinical resource or API route could not be found on the LADIP Pharmacovigilance server." />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="alternate icon" href="/favicon.ico" />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    * {{ box-sizing: border-box; }}
    html, body {{
      margin: 0; padding: 0;
      background: #FFFFFF; color: #1A1A1A;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      overflow-x: hidden; max-width: 100vw;
    }}
    .wrap {{
      max-width: 760px; margin: 0 auto; padding: 48px 24px;
      min-height: 100dvh; display: flex; flex-direction: column; justify-content: space-between;
    }}
    a.logo {{
      display: inline-flex; align-items: center; gap: 8px;
      text-decoration: none; color: #1A1A1A;
    }}
    .logo-text {{ font-family: 'Playfair Display', Georgia, serif; font-size: 1.65rem; font-weight: 700; }}
    .logo-dot {{
      width: 18px; height: 18px; border-radius: 50%; background: #D4A5E5;
      color: #1A1A1A; font-size: 10px; font-weight: 800;
      display: inline-flex; align-items: center; justify-content: center;
    }}
    .card {{
      border-top: 2px solid #DC2626; border-bottom: 1px solid #E5E5E0;
      padding: 36px 0; margin: 32px 0;
    }}
    .eyebrow {{
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: #DC2626;
    }}
    .big-num {{
      font-family: 'Playfair Display', Georgia, serif; font-size: clamp(3rem, 8vw, 5rem);
      font-weight: 900; line-height: 1; margin: 8px 0 12px 0;
    }}
    h1 {{
      font-family: 'Playfair Display', Georgia, serif; font-size: clamp(1.5rem, 4vw, 2.2rem);
      margin: 0 0 12px 0;
    }}
    p {{ color: #6B6B6B; line-height: 1.6; margin: 0 0 24px 0; }}
    code {{
      font-family: 'JetBrains Mono', monospace; background: #F5F5F0;
      padding: 2px 6px; border-radius: 4px; color: #1A1A1A; word-break: break-all;
    }}
    .cta {{
      display: inline-block; background: #1A1A1A; color: #FFFFFF;
      text-decoration: none; padding: 12px 24px; border-radius: 9999px;
      font-weight: 600; font-size: 0.88rem; margin-right: 10px; margin-bottom: 10px;
    }}
    .cta-outline {{
      display: inline-block; background: #FFFFFF; color: #1A1A1A;
      border: 1px solid #E5E5E0; text-decoration: none; padding: 12px 24px;
      border-radius: 9999px; font-weight: 600; font-size: 0.88rem; margin-bottom: 10px;
    }}
    footer {{
      border-top: 1px solid #E5E5E0; padding-top: 20px;
      font-size: 0.8rem; color: #6B6B6B;
      display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px;
    }}
    footer a {{ color: #1A1A1A; text-decoration: none; font-weight: 600; margin-left: 12px; }}
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <a href="/" class="logo" title="Return to LADIP Home">
        <span class="logo-text">LADIP</span>
        <span class="logo-dot">✓</span>
      </a>
    </header>
    <main class="card" id="not-found-card">
      <div class="eyebrow">HTTP 404 — RESOURCE NOT FOUND</div>
      <div class="big-num">404</div>
      <h1>Clinical Endpoint or Page Not Found</h1>
      <p>{detail} (Requested path: <code>{path}</code>).</p>
      <div>
        <a href="/" class="cta">Return to API Portal</a>
        <a href="/docs" class="cta-outline">OpenAPI Documentation</a>
      </div>
    </main>
    <footer>
      <span>&copy; {year} LADIP — Longitudinal Adverse Drug Interaction Predictor.</span>
      <div>
        <a href="/api/v1/health">System Health</a>
        <a href="/api/v1/patients">Patient Registry</a>
        <a href="/docs">API Reference</a>
      </div>
    </footer>
  </div>
  <script type="module">
    import("https://cdn.jsdelivr.net/npm/motion@12/+esm")
      .then((m) => m.animate("#not-found-card", {{ opacity: [0, 1], transform: ["translateY(14px)", "translateY(0px)"] }}, {{ type: "spring", stiffness: 120, damping: 18 }}))
      .catch(() => {{}});
  </script>
</body>
</html>"""


@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    accept = request.headers.get("accept", "")
    if exc.status_code == 404 and "text/html" in accept and not request.url.path.startswith("/api"):
        return HTMLResponse(
            content=_render_editorial_404_html(request.url.path, str(exc.detail)),
            status_code=404,
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "code": exc.status_code,
            "detail": exc.detail,
            "path": request.url.path,
        },
    )


# ==============================================================================
# ROOT & FAVICON ENDPOINTS
# ==============================================================================
@app.get("/")
def root_portal(request: Request):
    """Root API status and navigation links."""
    year = date.today().year
    payload = {
        "status": "healthy",
        "service": "LADIP Clinical Decision Support API",
        "version": "2.0.0",
        "copyright": f"© {year} LADIP Contributors",
        "links": {
            "health": "/api/v1/health",
            "patients": "/api/v1/patients",
            "simulate": "/api/v1/simulate",
            "docs": "/docs",
        },
    }
    if "text/html" in request.headers.get("accept", ""):
        return HTMLResponse(
            content=f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LADIP — Longitudinal Adverse Drug Interaction Predictor API</title>
  <meta name="description" content="LADIP REST API and Clinical Decision Support Engine for longitudinal multi-drug pharmacovigilance." />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body style="font-family: sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; color: #1A1A1A;">
  <h1><a href="/" style="color: #1A1A1A; text-decoration: none;">LADIP ✓</a></h1>
  <p>Longitudinal Adverse Drug Interaction Predictor — Clinical REST Service</p>
  <ul>
    <li><a href="/docs">Interactive OpenAPI Documentation (/docs)</a></li>
    <li><a href="/api/v1/health">System Health (/api/v1/health)</a></li>
    <li><a href="/api/v1/patients">Patient Cohort Registry (/api/v1/patients)</a></li>
  </ul>
  <footer style="margin-top: 40px; color: #6B6B6B; font-size: 13px;">&copy; {year} LADIP Contributors</footer>
</body>
</html>"""
        )
    return payload


@app.get("/favicon.ico", include_in_schema=False)
def get_favicon_ico():
    ico_path = ASSETS_DIR / "favicon.ico"
    if ico_path.exists():
        return FileResponse(ico_path, media_type="image/x-icon")
    raise HTTPException(status_code=404, detail="Favicon not found")


@app.get("/favicon.svg", include_in_schema=False)
def get_favicon_svg():
    svg_path = ASSETS_DIR / "favicon.svg"
    if svg_path.exists():
        return FileResponse(svg_path, media_type="image/svg+xml")
    raise HTTPException(status_code=404, detail="Favicon SVG not found")


# ==============================================================================
# REST ENDPOINTS (BOTH /api/v1/... AND /api/... ALIASES FOR ZERO BROKEN LINKS)
# ==============================================================================
@app.get("/api/v1/health")
@app.get("/api/health")
def health_check():
    stats = db.get_stats()
    return {
        "status": "healthy",
        "service": "LADIP Pharmacovigilance API",
        "copyright_year": date.today().year,
        "faers_database": stats,
    }


@app.get("/api/v1/patients")
@app.get("/api/patients")
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
    return {"status": "success", "patients": results}


@app.get("/api/v1/patients/{patient_id}")
@app.get("/api/patients/{patient_id}")
def get_patient(patient_id: str):
    """Retrieve complete electronic health record for a patient."""
    p = store.get(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    return p.to_dict()


@app.get("/api/v1/patients/{patient_id}/schedule")
@app.get("/api/patients/{patient_id}/schedule")
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
        "status": "success",
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
@app.get("/api/patients/{patient_id}/alerts")
@app.get("/api/patients/{patient_id}/analysis")
def get_patient_alerts(patient_id: str, include_suppressed: bool = False):
    """Retrieve evaluated pharmacovigilance safety signals with alert fatigue filtering."""
    p = store.get(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    alerts = matcher.match_patient(p)
    filtered = []

    for a in alerts:
        if not a.is_suppressed or include_suppressed:
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
        "status": "success",
        "patient_id": p.patient_id,
        "total_alerts": len(alerts),
        "active_alerts_count": sum(1 for a in alerts if not a.is_suppressed),
        "suppressed_alerts_count": sum(1 for a in alerts if a.is_suppressed),
        "alerts": filtered,
    }


@app.post("/api/v1/patients/{patient_id}/check-drug")
@app.post("/api/patients/{patient_id}/check-drug")
def check_new_drug(patient_id: str, req: CheckDrugRequest):
    """Prospective drug safety check: Is this new medicine safe for the patient to take?"""
    p = store.get(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    cleaned_drug = (req.drug_name or "").strip()
    if not cleaned_drug or not any(ch.isalpha() for ch in cleaned_drug):
        raise HTTPException(status_code=400, detail="Medication name must contain valid letters and not be empty")
    if req.dose < 0:
        raise HTTPException(status_code=400, detail="Dosage amount must be non-negative")

    assessment = checker.assess_new_drug(
        profile=p,
        new_drug_name=cleaned_drug,
        dose=req.dose,
        dose_unit=req.dose_unit,
    )

    return {
        "status": "success",
        "message": f"Safety check completed for {cleaned_drug} on patient {p.name}",
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


@app.post("/api/v1/simulate")
@app.post("/api/simulate")
def simulate_drug_combination(req: SimulateComboRequest):
    """Ad-hoc prospective simulation for arbitrary drug combinations."""
    tokens = [d.strip() for d in req.drugs if d and d.strip()]
    if len(tokens) < 2:
        raise HTTPException(status_code=400, detail="Provide at least two medications to simulate interactions")
    signals = db.query_signals(tokens)
    return {
        "status": "success",
        "drugs": tokens,
        "signals_count": len(signals),
        "signals": signals,
    }


@app.post("/api/v1/patients/{patient_id}/scan-report")
@app.post("/api/patients/{patient_id}/scan-report")
async def scan_prescription_file(
    patient_id: str,
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
):
    """Scan prescription / lab report image, PDF, or text using OCR/Gemini and add extracted meds to patient profile."""
    p = store.get(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    try:
        if file is not None:
            content = await file.read()
            if not content:
                raise HTTPException(status_code=400, detail="Uploaded clinical document is empty (0 bytes)")
            ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else "image"
            if ext == "pdf":
                file_type = "pdf"
            elif ext in ("txt", "text", "md", "csv"):
                file_type = "text"
            else:
                file_type = "image"
            if file_type == "image":
                content = parser.compress_image_bytes(content)
            extracted = parser.parse_report(content, file_type=file_type, default_patient_id=patient_id)
        elif raw_text and raw_text.strip():
            extracted = parser.parse_report(raw_text.strip(), file_type="text", default_patient_id=patient_id)
        else:
            raise HTTPException(status_code=400, detail="Must provide either an uploaded file or non-empty raw_text")
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        logger.error(f"Error parsing uploaded clinical report: {exc}")
        raise HTTPException(status_code=400, detail=f"Failed to parse clinical document: {str(exc)}")

    updated_profile = store.merge_records(p, extracted)
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
@app.post("/api/patients/{patient_id}/scan")
def scan_prescription_base64(patient_id: str, req: ScanBase64Request):
    """Accept base64-encoded image from React Native mobile camera/gallery, extract medications, and update profile."""
    p = store.get(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    if not req.image_base64 or not req.image_base64.strip():
        raise HTTPException(status_code=400, detail="image_base64 payload must not be empty")

    try:
        b64_str = req.image_base64.strip()
        if "," in b64_str:
            b64_str = b64_str.split(",")[1]
        img_bytes = base64.b64decode(b64_str)
        if not img_bytes:
            raise ValueError("Decoded base64 payload is empty (0 bytes)")
        compressed_bytes = parser.compress_image_bytes(img_bytes)

        extracted = parser.parse_report(compressed_bytes, file_type="image", default_patient_id=patient_id)
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
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=f"Invalid image payload: {str(ve)}")
    except Exception as e:
        logger.error(f"Error processing base64 image: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to parse image: {str(e)}")
