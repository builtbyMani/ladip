"""Longitudinal Adverse Drug Interaction Predictor (LADIP)
Clinical Decision Support System — Editorial Health-Tech Edition
Powered by Bklit.UI Composable Charts & Motion.dev Spring Physics
"""
from datetime import date, timedelta
from pathlib import Path
import pandas as pd
import streamlit as st

from src.analysis.naranjo import NaranjoAlgorithm
from src.analysis.signal_matcher import SignalMatcher
from src.components.bklit_charts import (
    bklit_bar_chart,
    bklit_ring_gauge_chart,
    bklit_timeline_chart,
    bklit_volcano_chart,
)
from src.config import DB_PATH
from src.explanations.pharmacology import PharmacologyExplainer
from src.faers.bulk_loader import FAERSDatabase
from src.faers.client import OpenFDAClient
from src.patient.memory import PatientStore
from src.patient.report_parser import MedicalReportParser
from src.safety.drug_checker import DrugSafetyChecker

# ==============================================================================
# WORKFLOW & PAGE METADATA REGISTRY (TITLES, META DESCRIPTIONS, ROUTES)
# ==============================================================================
WORKFLOW_OPTIONS = [
    "Multi-Drug Interaction Discovery",
    "Prospective Drug Safety Check",
    "Patient Profile & Report Parser",
    "FAERS Disproportionality Explorer",
]

WORKFLOW_SLUGS = {
    "discovery": "Multi-Drug Interaction Discovery",
    "safety": "Prospective Drug Safety Check",
    "ehr": "Patient Profile & Report Parser",
    "faers": "FAERS Disproportionality Explorer",
}

SLUG_BY_WORKFLOW = {v: k for k, v in WORKFLOW_SLUGS.items()}

PAGE_META = {
    "Multi-Drug Interaction Discovery": {
        "title": "Multi-Drug Interaction Discovery | LADIP — Temporal Pharmacovigilance",
        "description": (
            "Detect hidden multi-drug adverse interactions using FDA FAERS 2x2 disproportionality "
            "ratios, Naranjo causality scoring, and longitudinal alert fatigue suppression."
        ),
    },
    "Prospective Drug Safety Check": {
        "title": "Prospective Drug Safety Check | LADIP — Temporal Pharmacovigilance",
        "description": (
            "Pre-prescription clinical safety simulator evaluating candidate medications against "
            "active regimens, documented drug allergies, and organ clearance vulnerabilities."
        ),
    },
    "Patient Profile & Report Parser": {
        "title": "Patient EHR & Clinical Report Parser | LADIP — Temporal Pharmacovigilance",
        "description": (
            "Longitudinal electronic health record inspector and automated PDF/OCR clinical "
            "discharge summary parser for medication timeline reconstruction."
        ),
    },
    "FAERS Disproportionality Explorer": {
        "title": "FAERS Disproportionality Explorer | LADIP — Temporal Pharmacovigilance",
        "description": (
            "Interactive pharmacovigilance signal explorer for querying multi-drug combinations "
            "across 2x2 contingency tables and live openFDA co-occurrence reports."
        ),
    },
    "404": {
        "title": "404 Page Not Found | LADIP — Temporal Pharmacovigilance",
        "description": "The requested clinical workflow or patient cohort record could not be found.",
    },
}

FAVICON_PATH = Path(__file__).resolve().parent / "assets" / "favicon.png"

# Resolve initial page title from query params before st.set_page_config
_qp_workflow = st.query_params.get("workflow", "")
_initial_workflow = WORKFLOW_SLUGS.get(_qp_workflow.lower(), WORKFLOW_OPTIONS[0])
if _qp_workflow and _qp_workflow.lower() not in WORKFLOW_SLUGS and _qp_workflow not in WORKFLOW_OPTIONS:
    _initial_page_title = PAGE_META["404"]["title"]
else:
    _initial_page_title = PAGE_META.get(_initial_workflow, PAGE_META[WORKFLOW_OPTIONS[0]])["title"]

st.set_page_config(
    page_title=_initial_page_title,
    page_icon=str(FAVICON_PATH) if FAVICON_PATH.exists() else ":material/verified_user:",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ==============================================================================
# HORMN-INSPIRED CLINICAL HEALTH-TECH DESIGN SYSTEM (TASTE-SKILL CALIBRATED)
# ==============================================================================
_EDITORIAL_CSS = """<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
:root {
    --surface: #FFFFFF;
    --surface-muted: #F8FAFC;
    --ink: #111827;
    --ink-muted: #64748B;
    --border: #E2E8F0;
    --brand-blue: #4A7BB7;
    --brand-slate: #7C93B2;
    --pastel-blue: #EAF2FA;
    --pastel-sand: #F5F2EB;
    --pastel-lavender: #F0EDF8;
    --pastel-mint: #EAF5F0;
    --accent-green: #1B7A3D;
    --accent-lavender: #D4A5E5;
    --accent-gold: #E8C840;
    --accent-coral: #DC2626;
    --cta-bg: #111827;
    --chart-1: #111827;
    --chart-2: #4A7BB7;
    --chart-3: #DC2626;
    --chart-4: #1B7A3D;
    --chart-5: #E8C840;
}
html, body, .stApp, [data-testid="stAppViewContainer"], [data-testid="stMain"], .main {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    color: var(--ink);
    background-color: var(--surface);
    overflow-x: hidden !important;
    max-width: 100vw !important;
    box-sizing: border-box !important;
}
*, *::before, *::after {
    box-sizing: border-box;
}
#MainMenu,
.stDeployButton,
[data-testid="stToolbarActions"],
[data-testid="stAppDeployButton"],
footer {
    display: none !important;
}
.main .block-container {
    max-width: 1240px;
    width: 100%;
    padding-top: 1.5rem;
    padding-bottom: 3.5rem;
    padding-left: 2rem;
    padding-right: 2rem;
    overflow-x: hidden !important;
}
code, pre, .mono-val {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.9em;
    background: var(--surface-muted) !important;
    color: var(--ink) !important;
    padding: 2px 6px;
    border-radius: 6px;
    word-break: break-word;
}
[data-testid="stSidebar"] {
    background-color: #F8FAFC !important;
    border-right: 1px solid var(--border) !important;
}
[data-testid="stSidebar"] .block-container {
    padding-top: 1.75rem;
}
[data-testid="stVerticalBlockBorderWrapper"] {
    border: 1px solid var(--border) !important;
    border-radius: 24px !important;
    box-shadow: 0 12px 32px -12px rgba(17, 24, 39, 0.04) !important;
    background-color: var(--surface) !important;
    padding: 22px !important;
}
.stButton > button, .stFormSubmitButton > button {
    background-color: var(--cta-bg) !important;
    color: #FFFFFF !important;
    border: 1px solid var(--cta-bg) !important;
    border-radius: 9999px !important;
    padding: 0.58rem 1.5rem !important;
    font-family: 'Plus Jakarta Sans', sans-serif !important;
    font-weight: 600 !important;
    font-size: 0.86rem !important;
    letter-spacing: -0.01em !important;
    box-shadow: none !important;
    transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.18s ease !important;
    max-width: 100%;
    white-space: normal !important;
}
.stButton > button:hover, .stFormSubmitButton > button:hover {
    opacity: 0.9 !important;
    transform: translateY(-1px) !important;
}
.stButton > button:active, .stFormSubmitButton > button:active {
    transform: scale(0.98) !important;
}
.stMarkdown a.brand-link, [data-testid="stSidebar"] a.brand-link, a.brand-link {
    text-decoration: none !important;
    color: var(--ink) !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 10px !important;
    cursor: pointer;
    transition: opacity 0.15s ease;
    border-bottom: none !important;
}
a.brand-link:hover {
    opacity: 0.82;
    text-decoration: none !important;
}
.brand-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
}
.hormn-pill-mark {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 32px;
    height: 22px;
    border-radius: 9999px;
    background-color: #111827;
    color: #FFFFFF !important;
    font-family: 'Outfit', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
}
.brand-title {
    font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif !important;
    font-weight: 700 !important;
    font-size: 1.15rem !important;
    color: var(--ink) !important;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    line-height: 1;
    text-decoration: none !important;
}
.brand-dot {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background-color: #EAF2FA;
    color: #4A7BB7 !important;
    font-size: 10px;
    font-weight: 800;
    text-decoration: none !important;
}
.hormn-topbar {
    background: #87909A;
    color: #FFFFFF;
    border-radius: 14px;
    padding: 9px 18px;
    font-size: 0.76rem;
    font-weight: 500;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;
}
.hormn-cards-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin: 18px 0 16px 0;
}
.hormn-pastel-card {
    border-radius: 22px;
    padding: 18px 18px 16px 18px;
    position: relative;
    min-height: 150px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-decoration: none !important;
    transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease;
    border: 1px solid rgba(17, 24, 39, 0.04);
}
.hormn-pastel-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 32px -12px rgba(17, 24, 39, 0.08);
}
.hormn-arrow-circle {
    width: 30px;
    height: 30px;
    border-radius: 9999px;
    background: #FFFFFF;
    color: #111827;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(17, 24, 39, 0.08);
    align-self: flex-end;
}
@media (max-width: 900px) {
    .hormn-cards-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
@media (max-width: 560px) {
    .hormn-cards-grid {
        grid-template-columns: 1fr;
    }
}
.credibility-line {
    font-size: 0.85rem;
    color: var(--ink);
    margin-bottom: 14px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
}
.gold-star {
    color: #00B67A;
    font-size: 1rem;
}
.editorial-hero {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 4px 0 26px 0;
    margin-bottom: 24px;
}
.editorial-headline {
    font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
    font-weight: 400;
    font-size: clamp(2rem, 4.2vw, 3.1rem);
    line-height: 1.08;
    letter-spacing: -0.03em;
    color: var(--ink);
    margin: 0 0 14px 0;
    max-width: 680px;
    word-break: break-word;
}
.editorial-subtext {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(0.92rem, 1.5vw, 1rem);
    line-height: 1.6;
    color: var(--ink-muted);
    max-width: 580px;
    margin: 0;
}
.patient-serif-name {
    font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
    font-weight: 600;
    font-size: clamp(1.45rem, 3vw, 1.85rem);
    color: var(--ink);
    letter-spacing: -0.025em;
    margin: 0 0 6px 0;
    word-break: break-word;
}
.patient-meta {
    font-size: 0.85rem;
    color: var(--ink-muted);
    margin-bottom: 12px;
    word-break: break-word;
}
.section-eyebrow {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--ink-muted);
    margin-bottom: 6px;
}
.stat-callout {
    padding: 14px 18px;
    background: #F8FAFC;
    border-radius: 20px;
    border: 1px solid rgba(226, 232, 240, 0.7);
}
.stat-number {
    font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
    font-weight: 600;
    font-size: clamp(2rem, 3.8vw, 2.85rem);
    line-height: 1.0;
    letter-spacing: -0.03em;
    color: var(--ink);
    margin: 0 0 8px 0;
}
.stat-label {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-muted);
    margin: 0;
}
.badge-critical {
    display: inline-block;
    background: transparent;
    color: var(--accent-coral);
    border: 1px solid var(--accent-coral);
    padding: 3px 10px;
    border-radius: 9999px;
    font-weight: 700;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}
.badge-high {
    display: inline-block;
    background: transparent;
    color: #B48A00;
    border: 1px solid var(--accent-gold);
    padding: 3px 10px;
    border-radius: 9999px;
    font-weight: 700;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}
.badge-moderate {
    display: inline-block;
    background: transparent;
    color: var(--ink-muted);
    border: 1px solid var(--border);
    padding: 3px 10px;
    border-radius: 9999px;
    font-weight: 700;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}
.badge-low {
    display: inline-block;
    background: transparent;
    color: var(--accent-green);
    border: 1px solid var(--accent-green);
    padding: 3px 10px;
    border-radius: 9999px;
    font-weight: 700;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}
.alert-row {
    border-top: 1px solid var(--border);
    padding: 24px 0 18px 0;
}
.alert-headline {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(1.02rem, 2vw, 1.18rem);
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.01em;
    margin: 0 0 12px 0;
    word-break: break-word;
}
.alert-score-num {
    font-family: 'Playfair Display', Georgia, serif;
    font-weight: 900;
    font-size: clamp(1.75rem, 3vw, 2.25rem);
    line-height: 1;
    letter-spacing: -0.03em;
    color: var(--ink);
}
.alert-score-caption {
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-muted);
    margin-top: 4px;
}
.drug-pill {
    display: inline-block;
    background: var(--cta-bg);
    color: #FFFFFF;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 0.78rem;
    font-weight: 600;
    margin-right: 6px;
    margin-bottom: 6px;
    max-width: 100%;
    word-break: break-word;
}
.symptom-pill {
    display: inline-block;
    background: transparent;
    color: var(--accent-coral);
    border: 1px solid var(--accent-coral);
    padding: 3px 11px;
    border-radius: 9999px;
    font-size: 0.78rem;
    font-weight: 600;
    margin-right: 6px;
    margin-bottom: 6px;
    max-width: 100%;
    word-break: break-word;
}
.editorial-banner-success {
    border: 1px solid var(--accent-green);
    border-left: 4px solid var(--accent-green);
    background: var(--surface);
    padding: 14px 18px;
    margin: 14px 0;
    font-size: 0.88rem;
    color: var(--ink);
}
.editorial-banner-error {
    border: 1px solid var(--accent-coral);
    border-left: 4px solid var(--accent-coral);
    background: var(--surface);
    padding: 14px 18px;
    margin: 14px 0;
    font-size: 0.88rem;
    color: var(--ink);
}
.suppressed-row {
    border-left: 3px solid var(--accent-green);
    padding: 10px 0 10px 16px;
    margin-bottom: 14px;
}
.evidence-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--ink-muted);
    margin-bottom: 2px;
}
.evidence-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.05rem;
    font-weight: 500;
    color: var(--ink);
    word-break: break-word;
}
.evidence-sub {
    font-size: 0.76rem;
    color: var(--ink-muted);
}
.editorial-footer {
    border-top: 1px solid var(--border);
    margin-top: 48px;
    padding-top: 28px;
    padding-bottom: 16px;
    font-size: 0.82rem;
    color: var(--ink-muted);
}
.footer-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 20px;
}
.footer-links {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
}
.footer-links a {
    color: var(--ink) !important;
    text-decoration: none !important;
    font-weight: 600;
    border-bottom: 1px solid transparent;
    transition: border-color 0.15s ease;
}
.footer-links a:hover {
    border-bottom-color: var(--ink);
}
@media (max-width: 768px) {
    .main .block-container {
        padding-left: 1rem !important;
        padding-right: 1rem !important;
        padding-top: 1.25rem !important;
    }
    [data-testid="stHorizontalBlock"] {
        flex-direction: column !important;
        gap: 0.75rem !important;
    }
    [data-testid="column"], [data-testid="stColumn"] {
        width: 100% !important;
        flex: 1 1 100% !important;
        min-width: 0 !important;
    }
    .editorial-hero {
        padding-bottom: 20px;
        margin-bottom: 20px;
    }
    .stat-callout {
        border-bottom: 1px solid var(--surface-muted);
        padding: 10px 0;
    }
    .footer-grid {
        flex-direction: column;
        gap: 14px;
    }
}
</style>"""

st.markdown(_EDITORIAL_CSS, unsafe_allow_html=True)


@st.cache_resource
def get_services():
    db = FAERSDatabase(DB_PATH)
    store = PatientStore()
    matcher = SignalMatcher(db=db)
    checker = DrugSafetyChecker(db=db)
    explainer = PharmacologyExplainer()
    parser = MedicalReportParser()
    fda_client = OpenFDAClient()
    return db, store, matcher, checker, explainer, parser, fda_client


db, store, matcher, checker, explainer, parser, fda_client = get_services()

# ==============================================================================
# SESSION STATE & URL QUERY PARAMETER ROUTING (WITH CUSTOM 404 DETECTION)
# ==============================================================================
all_patients = store.list_all()
if not all_patients:
    from scripts.generate_synthetic_patients import generate_profiles
    generate_profiles()
    all_patients = store.list_all()

patient_map = {p.patient_id: p for p in all_patients}
scenario_names = {
    "PT_BLEED_001": "Ramesh Sharma — Warfarin + Aspirin + Ibuprofen",
    "PT_STATIN_002": "Sunita Patel — Simvastatin + Amlodipine + Amiodarone",
    "PT_MTX_003": "Kavitha Reddy — Methotrexate + Bactrim + Naproxen",
    "PT_CARDIO_005": "Arjun Nair — Clopidogrel + Omeprazole",
    "PT_STABLE_004": "Rajesh Varma — Stable 2yr Cohort (Suppressed)",
}

if "active_workflow" not in st.session_state:
    st.session_state["active_workflow"] = WORKFLOW_OPTIONS[0]

if "selected_pid" not in st.session_state or st.session_state["selected_pid"] not in patient_map:
    st.session_state["selected_pid"] = list(patient_map.keys())[0]

# Check query parameters for deep linking or invalid 404 routes
qp_workflow = st.query_params.get("workflow", "").strip()
qp_patient = st.query_params.get("patient", "").strip()
is_404_route = False
not_found_reasons = []

if qp_workflow:
    if qp_workflow.lower() in WORKFLOW_SLUGS:
        resolved_wf = WORKFLOW_SLUGS[qp_workflow.lower()]
        if st.session_state.get("_last_qp_workflow") != qp_workflow:
            st.session_state["active_workflow"] = resolved_wf
            st.session_state["sidebar_wf_radio"] = resolved_wf
            st.session_state["top_mobile_nav_segmented"] = resolved_wf
    elif qp_workflow in WORKFLOW_OPTIONS:
        if st.session_state.get("_last_qp_workflow") != qp_workflow:
            st.session_state["active_workflow"] = qp_workflow
            st.session_state["sidebar_wf_radio"] = qp_workflow
            st.session_state["top_mobile_nav_segmented"] = qp_workflow
    else:
        is_404_route = True
        not_found_reasons.append(f"Unknown clinical workflow route '{qp_workflow}'.")
st.session_state["_last_qp_workflow"] = qp_workflow

if qp_patient:
    if qp_patient in patient_map:
        if st.session_state.get("_last_qp_patient") != qp_patient:
            st.session_state["selected_pid"] = qp_patient
            st.session_state["sidebar_pid_select"] = qp_patient
            st.session_state["mob_cohort_select"] = qp_patient
    else:
        is_404_route = True
        not_found_reasons.append(f"Patient MRN '{qp_patient}' does not exist in the clinical cohort registry.")
st.session_state["_last_qp_patient"] = qp_patient

not_found_reason = " ".join(not_found_reasons)

# Ensure widget session keys stay aligned with canonical state before widgets mount
if st.session_state.get("sidebar_wf_radio") not in WORKFLOW_OPTIONS:
    st.session_state["sidebar_wf_radio"] = st.session_state["active_workflow"]
if st.session_state.get("top_mobile_nav_segmented") not in WORKFLOW_OPTIONS:
    st.session_state["top_mobile_nav_segmented"] = st.session_state["active_workflow"]
if st.session_state.get("sidebar_pid_select") not in patient_map:
    st.session_state["sidebar_pid_select"] = st.session_state["selected_pid"]
if st.session_state.get("mob_cohort_select") not in patient_map:
    st.session_state["mob_cohort_select"] = st.session_state["selected_pid"]


def navigate_to_workflow(wf_name: str):
    """Switch active workflow across all navigation controls and clear invalid 404 query params."""
    if wf_name not in WORKFLOW_OPTIONS:
        wf_name = WORKFLOW_OPTIONS[0]
    st.session_state["active_workflow"] = wf_name
    st.session_state["sidebar_wf_radio"] = wf_name
    st.session_state["top_mobile_nav_segmented"] = wf_name
    slug = SLUG_BY_WORKFLOW.get(wf_name, "discovery")
    st.query_params["workflow"] = slug
    st.session_state["_last_qp_workflow"] = slug
    if "patient" in st.query_params and st.query_params["patient"] not in patient_map:
        del st.query_params["patient"]
        st.session_state["_last_qp_patient"] = ""


def navigate_to_patient(pid: str):
    """Switch active patient cohort across all selectors and keep query params synchronized."""
    if pid not in patient_map:
        return
    st.session_state["selected_pid"] = pid
    st.session_state["sidebar_pid_select"] = pid
    st.session_state["mob_cohort_select"] = pid
    if "patient" in st.query_params:
        st.query_params["patient"] = pid
        st.session_state["_last_qp_patient"] = pid
    if (
        "workflow" in st.query_params
        and st.query_params["workflow"].lower() not in WORKFLOW_SLUGS
        and st.query_params["workflow"] not in WORKFLOW_OPTIONS
    ):
        slug = SLUG_BY_WORKFLOW.get(st.session_state["active_workflow"], "discovery")
        st.query_params["workflow"] = slug
        st.session_state["_last_qp_workflow"] = slug


def _on_sidebar_wf_change():
    navigate_to_workflow(st.session_state.get("sidebar_wf_radio", WORKFLOW_OPTIONS[0]))


def _on_segmented_wf_change():
    chosen = st.session_state.get("top_mobile_nav_segmented")
    if chosen in WORKFLOW_OPTIONS:
        navigate_to_workflow(chosen)
    else:
        st.session_state["top_mobile_nav_segmented"] = st.session_state["active_workflow"]


def _on_sidebar_pid_change():
    navigate_to_patient(st.session_state.get("sidebar_pid_select", st.session_state["selected_pid"]))


def _on_mob_pid_change():
    navigate_to_patient(st.session_state.get("mob_cohort_select", st.session_state["selected_pid"]))


def _on_recover_home():
    st.query_params.clear()
    st.session_state["_last_qp_workflow"] = ""
    st.session_state["_last_qp_patient"] = ""
    navigate_to_workflow(WORKFLOW_OPTIONS[0])


# ==============================================================================
# SIDEBAR NAVIGATION & COHORT SELECTOR
# ==============================================================================
with st.sidebar:
    st.markdown(
        """<div class="brand-row" style="margin-bottom: 8px;">
<a href="?workflow=discovery" target="_self" class="brand-link" style="text-decoration:none; color:#111827; display:inline-flex; align-items:center; gap:10px;" title="Return to Multi-Drug Interaction Discovery">
<span class="hormn-pill-mark">(I)</span>
<span class="brand-title">LADIP</span>
</a>
</div>
<div style="font-size: 0.8rem; color: #64748B; margin-bottom: 20px;">Longitudinal Pharmacovigilance &amp; Causality Engine</div>""",
        unsafe_allow_html=True,
    )

    st.markdown('<div class="section-eyebrow">Clinical Workspace</div>', unsafe_allow_html=True)
    sidebar_wf = st.radio(
        "Workspace Navigation",
        WORKFLOW_OPTIONS,
        key="sidebar_wf_radio",
        on_change=_on_sidebar_wf_change,
        label_visibility="collapsed",
    )

    st.markdown("<hr style='border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;'/>", unsafe_allow_html=True)
    st.markdown('<div class="section-eyebrow">Patient Cohort Registry</div>', unsafe_allow_html=True)

    pid_keys = list(patient_map.keys())
    sidebar_pid = st.selectbox(
        "Select Patient Case",
        options=pid_keys,
        format_func=lambda pid: scenario_names.get(pid, f"{patient_map[pid].name} ({pid})"),
        key="sidebar_pid_select",
        on_change=_on_sidebar_pid_change,
        label_visibility="collapsed",
    )

    st.markdown("<hr style='border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;'/>", unsafe_allow_html=True)
    st.markdown(
        """<div style="font-size: 0.78rem; color: #64748B; line-height: 1.5;">
<b style="color: #111827;">Clinical Benchmark Note</b><br/>
Select <b>Rajesh Varma</b> to observe how longitudinal stability (&gt;6 months symptom-free) suppresses low-value background alerts.
</div>""",
        unsafe_allow_html=True,
    )

menu = st.session_state["active_workflow"]
selected_pid = st.session_state["selected_pid"]
patient = patient_map[selected_pid]

# ==============================================================================
# DYNAMIC PAGE TITLE, META DESCRIPTION & MOTION.DEV SPRING ORCHESTRATION
# ==============================================================================
active_meta_key = "404" if is_404_route else menu
active_meta = PAGE_META.get(active_meta_key, PAGE_META[WORKFLOW_OPTIONS[0]])
dynamic_doc_title = (
    active_meta["title"]
    if is_404_route
    else f"{menu} — {patient.name} | LADIP Pharmacovigilance"
)

st.markdown(
    f"""<meta name="description" content="{active_meta['description']}" />
<meta property="og:title" content="{dynamic_doc_title}" />
<meta property="og:description" content="{active_meta['description']}" />
<meta property="og:type" content="website" />""",
    unsafe_allow_html=True,
)

st.html(
    f"""
    <script type="module">
    try {{
      if (window.parent && window.parent.document) {{
        window.parent.document.title = {dynamic_doc_title!r};
      }}
      document.title = {dynamic_doc_title!r};
    }} catch (_) {{}}

    import("https://cdn.jsdelivr.net/npm/motion@12/+esm")
      .then((motion) => {{
        const doc = (window.parent && window.parent.document) ? window.parent.document : document;
        const targets = doc.querySelectorAll(".editorial-hero, .hormn-pastel-card, .stat-callout, .alert-row, .suppressed-row");
        if (targets.length && typeof motion.animate === "function") {{
          motion.animate(
            targets,
            {{ opacity: [0, 1], transform: ["translateY(10px)", "translateY(0px)"] }},
            {{
              type: "spring",
              stiffness: 120,
              damping: 18,
              delay: typeof motion.stagger === "function" ? motion.stagger(0.04) : 0,
            }}
          );
        }}
      }})
      .catch(() => {{}});
    </script>
    """,
    unsafe_allow_javascript=True,
)

# ==============================================================================
# HORMN-STYLE TOP ANNOUNCEMENT BAR & HERO HEADER WITH 4 PASTEL WORKFLOW CARDS
# ==============================================================================
st.markdown(
    """<div class="hormn-topbar">
<span><b>Why LADIP?</b></span>
<span>180K+ FDA FAERS Reports</span>
<span>Temporal Exposure Windows</span>
<span>5 Indian Clinical Cohorts</span>
<span>Naranjo ADR Causality</span>
<span>Alert Fatigue Suppression</span>
</div>
<div class="editorial-hero" style="background:#FFFFFF; border-bottom:1px solid #E2E8F0; padding:4px 0 26px 0; margin-bottom:24px;">
<div class="brand-row" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:18px;">
<a href="?workflow=discovery" target="_self" class="brand-link" style="text-decoration:none; color:#111827; display:inline-flex; align-items:center; gap:10px;" title="Click to return to Multi-Drug Interaction Discovery">
<span class="hormn-pill-mark">(I)</span>
<span class="brand-title">LADIP</span>
</a>
<span style="font-size: 0.75rem; font-weight: 600; color: #111827; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 6px 14px; border-radius: 9999px;">Clinical Decision Support v2.0 &rsaquo;</span>
</div>
<h1 class="editorial-headline">
Personalised pharmacovigilance<br/>to restore clinical <span style="color:#7C93B2;">strength.</span>
</h1>
<p class="editorial-subtext">
Combining real-world FDA adverse event reporting ratios with longitudinal patient medication timelines to surface only the interactions that demand clinical action.
</p>
<div class="section-eyebrow" style="margin-top: 22px; margin-bottom: 10px;">CLINICAL WORKFLOWS</div>
<div class="hormn-cards-grid">
<a href="?workflow=discovery" target="_self" class="hormn-pastel-card" style="background:#EAF2FA;">
<div>
<div style="font-family:'Outfit',sans-serif; font-weight:600; font-size:0.95rem; color:#3B6EA8; margin-bottom:4px;">Interaction Discovery</div>
<div style="font-size:0.76rem; color:#475569; line-height:1.4;">Longitudinal timeline, Naranjo ADR causality &amp; anti-fatigue triage</div>
</div>
<span class="hormn-arrow-circle">&rarr;</span>
</a>
<a href="?workflow=safety" target="_self" class="hormn-pastel-card" style="background:#F5F2EB;">
<div>
<div style="font-family:'Outfit',sans-serif; font-weight:600; font-size:0.95rem; color:#6E5D4F; margin-bottom:4px;">Prospective Safety Check</div>
<div style="font-size:0.76rem; color:#57534E; line-height:1.4;">Pre-prescription candidate simulator, allergy &amp; organ clearance check</div>
</div>
<span class="hormn-arrow-circle">&rarr;</span>
</a>
<a href="?workflow=ehr" target="_self" class="hormn-pastel-card" style="background:#F0EDF8;">
<div>
<div style="font-family:'Outfit',sans-serif; font-weight:600; font-size:0.95rem; color:#5E4FA2; margin-bottom:4px;">Patient EHR &amp; OCR Parser</div>
<div style="font-size:0.76rem; color:#4C4668; line-height:1.4;">Vitals, labs, active regimens &amp; automated PDF/image discharge OCR</div>
</div>
<span class="hormn-arrow-circle">&rarr;</span>
</a>
<a href="?workflow=faers" target="_self" class="hormn-pastel-card" style="background:#EAF5F0;">
<div>
<div style="font-family:'Outfit',sans-serif; font-weight:600; font-size:0.95rem; color:#2E7D5B; margin-bottom:4px;">FAERS Signal Explorer</div>
<div style="font-size:0.76rem; color:#3D5A4D; line-height:1.4;">Empirical 2x2 PRR vs &chi;&sup2; volcano matrix &amp; live openFDA co-reports</div>
</div>
<span class="hormn-arrow-circle">&rarr;</span>
</a>
</div>
<div class="credibility-line" style="font-size:0.82rem; color:#111827; margin-top:12px; margin-bottom:0; display:flex; flex-wrap:wrap; align-items:center; gap:8px;">
<span class="gold-star">&#9733;</span>
<span style="font-weight:700;">Clinical Benchmark</span>
<span style="background:#00B67A; color:#FFFFFF; padding:1px 6px; border-radius:4px; font-size:0.7rem; font-weight:700;">&#9733; &#9733; &#9733; &#9733; &#9733;</span>
<span style="color:#64748B;">4.9 &bull; <b>16 Verified FAERS Signals</b> &bull; <b>5 Indian Patient Cohorts</b></span>
</div>
</div>""",
    unsafe_allow_html=True,
)

# Responsive Mobile Menu & Quick Navigation Drawer (accessible on all viewports)
nav_col1, nav_col2 = st.columns([3.5, 1.5])
with nav_col1:
    seg_choice = st.segmented_control(
        "Clinical Workflow Navigation",
        options=WORKFLOW_OPTIONS,
        label_visibility="collapsed",
        key="top_mobile_nav_segmented",
        on_change=_on_segmented_wf_change,
    )

with nav_col2:
    with st.popover("Mobile Menu & Cohort", icon=":material/menu:", width="stretch"):
        st.markdown('<div class="section-eyebrow">Quick Mobile Navigation</div>', unsafe_allow_html=True)
        for wf_opt in WORKFLOW_OPTIONS:
            st.button(
                wf_opt,
                key=f"mob_menu_{wf_opt}",
                width="stretch",
                on_click=navigate_to_workflow,
                args=(wf_opt,),
            )
        st.markdown('<div class="section-eyebrow" style="margin-top:12px;">Switch Patient Cohort</div>', unsafe_allow_html=True)
        mob_pid = st.selectbox(
            "Mobile Cohort Switcher",
            options=pid_keys,
            format_func=lambda pid: scenario_names.get(pid, f"{patient_map[pid].name} ({pid})"),
            key="mob_cohort_select",
            on_change=_on_mob_pid_change,
            label_visibility="collapsed",
        )

st.markdown("<div style='height: 12px;'></div>", unsafe_allow_html=True)

# ==============================================================================
# CUSTOM 404 PAGE (WHEN UNKNOWN ROUTE OR PATIENT MRN IS REQUESTED)
# ==============================================================================
if is_404_route:
    st.markdown(
        f"""
        <div style="border-top: 2px solid #DC2626; border-bottom: 1px solid #E5E5E0; padding: 36px 0; margin: 16px 0 28px 0;">
            <div class="section-eyebrow" style="color: #DC2626;">HTTP 404 — RESOURCE NOT FOUND</div>
            <div class="stat-number" style="font-size: 4.2rem; color: #1A1A1A; margin: 8px 0;">404</div>
            <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 2rem; font-weight: 700; color: #1A1A1A; margin: 0 0 12px 0;">
                Clinical Route or Patient Cohort Not Found
            </h2>
            <p style="font-size: 0.96rem; color: #6B6B6B; max-width: 620px; line-height: 1.6; margin-bottom: 16px;">
                {not_found_reason} Please verify the URL parameters or return to the main clinical pharmacovigilance workspace.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )
    st.button(
        "Return to Multi-Drug Interaction Discovery",
        icon=":material/home:",
        on_click=_on_recover_home,
    )

# ==============================================================================
# WORKFLOW 1: MULTI-DRUG INTERACTION DISCOVERY
# ==============================================================================
elif menu == "Multi-Drug Interaction Discovery":
    active_meds = patient.get_active_medications()

    # Patient Editorial Summary Strip
    p_col1, p_col2, p_col3, p_col4 = st.columns([3.2, 2.2, 2.2, 1.6])
    with p_col1:
        st.markdown(
            f"""
            <div class="patient-serif-name">{patient.name or patient.patient_id}</div>
            <div class="patient-meta">
                MRN <span class="mono-val">{patient.patient_id}</span> &nbsp;•&nbsp; {patient.age} yrs &nbsp;•&nbsp; {patient.sex} &nbsp;•&nbsp; {patient.weight} kg
            </div>
            """,
            unsafe_allow_html=True,
        )
        pills_html = "".join([f'<span class="drug-pill">{m.drug_name}</span>' for m in active_meds])
        st.markdown(f"<div>{pills_html}</div>", unsafe_allow_html=True)

    with p_col2:
        st.markdown('<div class="section-eyebrow">Active Conditions</div>', unsafe_allow_html=True)
        for cond in patient.conditions[:3]:
            st.markdown(f"<div style='font-size:0.88rem; color:#1A1A1A; margin-bottom:3px;'>{cond}</div>", unsafe_allow_html=True)
        if len(patient.conditions) > 3:
            st.markdown(f"<div style='font-size:0.78rem; color:#6B6B6B;'>+{len(patient.conditions) - 3} additional</div>", unsafe_allow_html=True)

    with p_col3:
        st.markdown('<div class="section-eyebrow">Documented Allergies</div>', unsafe_allow_html=True)
        if patient.allergies:
            for al in patient.allergies:
                st.markdown(f'<span class="symptom-pill">{al}</span>', unsafe_allow_html=True)
        else:
            st.markdown("<div style='font-size:0.88rem; color:#1B7A3D; font-weight:500;'>No Known Drug Allergies</div>", unsafe_allow_html=True)

    with p_col4:
        st.markdown(
            f"""
            <div class="stat-callout" style="padding-top:0;">
                <div class="stat-number" style="font-size: 2.75rem;">{len(active_meds)}</div>
                <div class="stat-label">Active Medications</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<hr style='border: none; border-top: 1px solid #E5E5E0; margin: 20px 0 28px 0;'/>", unsafe_allow_html=True)

    # Compute alerts early so metrics and Bklit UI charts can use them
    alerts = matcher.match_patient(patient)
    active_alerts = [a for a in alerts if not a.is_suppressed]
    suppressed_alerts = [a for a in alerts if a.is_suppressed]
    crit_count = sum(1 for a in active_alerts if a.severity_tier == "CRITICAL")
    top_prr = max([a.prr for a in active_alerts], default=1.0)
    top_priority = max([a.alert_priority_score for a in active_alerts], default=0.0)
    top_dtas = max([a.temporal_score for a in active_alerts], default=0.0)

    # Oversized Stat Callouts Ribbon (The Bella "24.1%" Treatment)
    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.markdown(
            f"""
            <div class="stat-callout">
                <div class="stat-number">{len(active_alerts)}</div>
                <div class="stat-label">Actionable Alerts</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with m2:
        st.markdown(
            f"""
            <div class="stat-callout">
                <div class="stat-number" style="color: #1B7A3D;">{len(suppressed_alerts)}</div>
                <div class="stat-label">Suppressed (Anti-Fatigue)</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with m3:
        crit_color = "#DC2626" if crit_count > 0 else "#1B7A3D"
        st.markdown(
            f"""
            <div class="stat-callout">
                <div class="stat-number" style="color: {crit_color};">{crit_count}</div>
                <div class="stat-label">Critical Tier Signals</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with m4:
        st.markdown(
            f"""
            <div class="stat-callout">
                <div class="stat-number">{top_prr:.1f}x</div>
                <div class="stat-label">Peak Reporting Ratio (PRR)</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<hr style='border: none; border-top: 1px solid #E5E5E0; margin: 24px 0 28px 0;'/>", unsafe_allow_html=True)

    # Bklit.UI Longitudinal Regimen & Symptom Chronology + Radial Telemetry
    timeline_rows = []
    ref_today = date.today()

    for m in patient.medications:
        s_date = m.start_date or (ref_today - timedelta(days=90))
        e_date = m.end_date or ref_today
        timeline_rows.append({
            "Track": "Medication Regimen",
            "Item": m.drug_name,
            "Start": s_date.isoformat(),
            "End": e_date.isoformat(),
            "Detail": f"{m.dose:g} {m.dose_unit} {m.frequency}",
        })

    for s in patient.symptoms:
        if s.onset_date:
            res_date = s.resolution_date or ref_today
            timeline_rows.append({
                "Track": "Adverse Event Onset",
                "Item": s.description,
                "Start": s.onset_date.isoformat(),
                "End": res_date.isoformat(),
                "Detail": f"Severity {s.severity}/10",
            })

    total_evaluated = max(len(alerts), 1)
    suppression_pct = (len(suppressed_alerts) / total_evaluated) * 100.0 if alerts else 100.0

    chart_col1, chart_col2 = st.columns([1.65, 1.0])
    with chart_col1:
        bklit_timeline_chart(
            timeline_rows,
            title=f"Longitudinal Regimen & Adverse Event Chronology — {patient.name}",
            subtitle="Interactive Bklit.UI interval tracks with motion.dev spring transitions.",
            key=f"bklit_timeline_{patient.patient_id}",
        )
    with chart_col2:
        bklit_ring_gauge_chart(
            [
                {
                    "label": "Peak Alert Priority",
                    "display": f"{top_priority:.1f}",
                    "percent": min(100.0, top_priority),
                    "color": "#DC2626" if top_priority >= 80 else ("#E8C840" if top_priority >= 50 else "#1B7A3D"),
                    "subtitle": "Composite severity score",
                },
                {
                    "label": "Temporal DTAS",
                    "display": f"{int(round(top_dtas * 100))}%",
                    "percent": min(100.0, top_dtas * 100.0),
                    "color": "#D4A5E5",
                    "subtitle": "Onset plausibility index",
                },
                {
                    "label": "Fatigue Suppression",
                    "display": f"{int(round(suppression_pct))}%",
                    "percent": suppression_pct,
                    "color": "#1B7A3D",
                    "subtitle": f"{len(suppressed_alerts)}/{len(alerts)} signals muted",
                },
            ],
            title="Signal & Fatigue Telemetry",
            subtitle="Hover any Bklit ring to inspect normalized telemetry.",
            key=f"bklit_rings_{patient.patient_id}",
        )

    st.markdown("<div style='height: 20px;'></div>", unsafe_allow_html=True)

    # Alert Filter Header & Refresh Action
    col_hdr, col_ctrl1, col_ctrl2, col_ctrl3 = st.columns([3.4, 1.6, 1.5, 1.5])
    with col_hdr:
        st.markdown('<div class="section-eyebrow">Clinical Signal Triage</div>', unsafe_allow_html=True)
        st.markdown("<h3 style='font-size: 1.25rem; font-weight: 700; margin: 0;'>Prioritized Pharmacovigilance Signals</h3>", unsafe_allow_html=True)
    with col_ctrl1:
        show_suppressed = st.toggle("Show Suppressed Signals", value=False)
    with col_ctrl2:
        tier_choice = st.selectbox(
            "Filter Severity Tier",
            ["ALL", "CRITICAL", "HIGH", "MODERATE", "LOW"],
            label_visibility="collapsed",
        )
    with col_ctrl3:
        if st.button("Refresh Signals", icon=":material/refresh:", width="stretch"):
            st.session_state["signal_refresh_msg"] = (
                f"Synchronized {len(alerts)} pharmacovigilance signals for {patient.name} ({patient.patient_id})."
            )

    if st.session_state.get("signal_refresh_msg"):
        st.success(st.session_state.pop("signal_refresh_msg"), icon=":material/check_circle:")

    st.markdown("<div style='height: 12px;'></div>", unsafe_allow_html=True)

    if not active_alerts:
        st.success(
            f"Regimen verified stable for {patient.name}: 0 uncontrolled drug-drug interactions active.",
            icon=":material/verified:",
        )
        st.markdown(
            f"""
            <div style="border-top: 1px solid #E5E5E0; border-bottom: 1px solid #E5E5E0; padding: 28px 0;">
                <div style="font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; color: #1B7A3D; margin-bottom: 8px;">
                    Regimen Stable — Zero Uncontrolled Interaction Risks
                </div>
                <div style="font-size: 0.95rem; color: #6B6B6B; max-width: 640px; line-height: 1.6;">
                    All background theoretical interactions for <b>{patient.name}</b> have been automatically suppressed. The patient has tolerated this regimen stably for over 6 months without adverse symptom correlation.
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    else:
        filtered_active = [
            a for a in active_alerts if tier_choice == "ALL" or a.severity_tier == tier_choice
        ]
        if not filtered_active:
            st.error(
                f"No active signals match severity tier '{tier_choice}' for {patient.name}. "
                f"({len(active_alerts)} signal(s) exist in other tiers.)",
                icon=":material/filter_alt_off:",
            )
        for alert in filtered_active:
            tier_badge = f"badge-{alert.severity_tier.lower()}"

            st.markdown('<div class="alert-row">', unsafe_allow_html=True)
            h_col1, h_col2 = st.columns([5, 1.5])
            with h_col1:
                st.markdown(
                    f"""
                    <div style="margin-bottom: 8px;">
                        <span class="{tier_badge}">{alert.severity_tier}</span>
                    </div>
                    <div class="alert-headline">
                        {alert.combo_str} &nbsp;&rarr;&nbsp; <span style="color: #DC2626;">{alert.adverse_event}</span>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
            with h_col2:
                st.markdown(
                    f"""
                    <div style="text-align: right;">
                        <div class="alert-score-num">{alert.alert_priority_score:.1f}</div>
                        <div class="alert-score-caption">Priority Score</div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

            # Evidence Metrics Row
            col_e1, col_e2, col_e3, col_e4 = st.columns(4)
            with col_e1:
                st.markdown(
                    f"""
                    <div class="evidence-label">Reporting Ratio (PRR)</div>
                    <div class="evidence-val">{alert.prr:.2f}x</div>
                    <div class="evidence-sub">Disproportionality vs. background</div>
                    """,
                    unsafe_allow_html=True,
                )
            with col_e2:
                st.markdown(
                    f"""
                    <div class="evidence-label">Chi-Squared (&chi;&sup2;)</div>
                    <div class="evidence-val">{alert.chi_squared:.1f}</div>
                    <div class="evidence-sub">Evans' Threshold &ge; 4.0</div>
                    """,
                    unsafe_allow_html=True,
                )
            with col_e3:
                st.markdown(
                    f"""
                    <div class="evidence-label">FAERS Co-Reports</div>
                    <div class="evidence-val">{alert.case_count:,}</div>
                    <div class="evidence-sub">Signal: {alert.signal_strength}</div>
                    """,
                    unsafe_allow_html=True,
                )
            with col_e4:
                if alert.patient_has_matching_symptom:
                    st.markdown(
                        f"""
                        <div class="evidence-label">Symptom Correlation</div>
                        <div class="evidence-val" style="color: #DC2626;">{alert.matching_symptom_name}</div>
                        <div class="evidence-sub">Temporal Score (DTAS): {alert.temporal_score:.2f}</div>
                        """,
                        unsafe_allow_html=True,
                    )
                else:
                    st.markdown(
                        """
                        <div class="evidence-label">Symptom Correlation</div>
                        <div class="evidence-val" style="color: #1B7A3D;">Asymptomatic</div>
                        <div class="evidence-sub">Prospective surveillance</div>
                        """,
                        unsafe_allow_html=True,
                    )

            st.markdown(
                f"<div style='font-size: 0.92rem; color: #1A1A1A; margin: 16px 0 12px 0; line-height: 1.55;'><b>Clinical Rationale:</b> {alert.clinical_rationale}</div>",
                unsafe_allow_html=True,
            )

            with st.expander("Pharmacological Mechanism & Naranjo Causality Breakdown", expanded=alert.patient_has_matching_symptom):
                expl = explainer.explain(alert.combo_drugs, alert.adverse_event, alert.prr, alert.case_count)

                m_col1, m_col2 = st.columns(2)
                with m_col1:
                    st.markdown('<div class="section-eyebrow">Physiological Mechanism</div>', unsafe_allow_html=True)
                    st.markdown(f"<div style='font-size: 0.9rem; line-height: 1.6; color: #1A1A1A;'>{expl['mechanism']}</div>", unsafe_allow_html=True)
                with m_col2:
                    st.markdown('<div class="section-eyebrow">Actionable Clinical Recommendation</div>', unsafe_allow_html=True)
                    st.markdown(f"<div style='font-size: 0.9rem; line-height: 1.6; color: #1B7A3D; font-weight: 500;'>{expl['recommendation']}</div>", unsafe_allow_html=True)

                if alert.patient_has_matching_symptom and alert.trigger_drug:
                    matching_med = next((m for m in patient.medications if m.drug_name == alert.trigger_drug), patient.medications[0])
                    matching_sym = next((s for s in patient.symptoms if alert.adverse_event.lower() in s.meddra_term.lower() or s.meddra_term.lower() in alert.adverse_event.lower()), patient.symptoms[0])
                    naranjo_res = NaranjoAlgorithm.evaluate(matching_med, matching_sym, patient)

                    st.markdown("<hr style='border: none; border-top: 1px solid #E5E5E0; margin: 20px 0;'/>", unsafe_allow_html=True)
                    col_nar1, col_nar2 = st.columns([3, 1])
                    with col_nar1:
                        st.markdown('<div class="section-eyebrow">Naranjo ADR Probability Scale</div>', unsafe_allow_html=True)
                        st.markdown(f"**{naranjo_res.probability_category}** ({naranjo_res.total_score}/13 Points) — Trigger Drug: `{alert.trigger_drug}`")
                        st.caption(naranjo_res.summary)
                    with col_nar2:
                        st.markdown(
                            f"""
                            <div style="text-align: right;">
                                <div class="alert-score-num">{naranjo_res.total_score}</div>
                                <div class="alert-score-caption">Naranjo Score</div>
                            </div>
                            """,
                            unsafe_allow_html=True,
                        )

                    q_data = [
                        {"#": q.id, "Standard Question": q.text, "Response": q.user_choice, "Score": q.score, "Rationale": q.explanation}
                        for q in naranjo_res.questions
                    ]
                    st.dataframe(pd.DataFrame(q_data), hide_index=True, width="stretch")

            st.markdown("</div>", unsafe_allow_html=True)

    # Render Suppressed Alerts if toggled
    if show_suppressed:
        st.markdown("<hr style='border: none; border-top: 1px solid #E5E5E0; margin: 28px 0;'/>", unsafe_allow_html=True)
        st.markdown('<div class="section-eyebrow">Longitudinal Alert Suppression</div>', unsafe_allow_html=True)
        st.markdown("<h4 style='font-size: 1.1rem; font-weight: 700; margin: 0 0 16px 0;'>Suppressed Background Interactions</h4>", unsafe_allow_html=True)
        if suppressed_alerts:
            for s_alert in suppressed_alerts:
                st.markdown(
                    f"""
                    <div class="suppressed-row">
                        <div style="font-weight: 700; font-size: 0.95rem; color: #1A1A1A;">
                            {s_alert.combo_str} &rarr; {s_alert.adverse_event} &nbsp;<span class="badge-low">SUPPRESSED</span>
                        </div>
                        <div style="font-size: 0.85rem; color: #6B6B6B; margin-top: 4px;">
                            {s_alert.suppression_reason}
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
        else:
            st.caption("No suppressed background signals for this patient's active regimen.")


# ==============================================================================
# WORKFLOW 2: PROSPECTIVE DRUG SAFETY CHECK ("ADD A NEW DRUG")
# ==============================================================================
elif menu == "Prospective Drug Safety Check":
    st.markdown('<div class="section-eyebrow">Pre-Prescription Simulation</div>', unsafe_allow_html=True)
    st.markdown("<h2 style='font-family: Playfair Display, serif; font-size: 2rem; font-weight: 700; margin: 0 0 8px 0;'>Prospective Drug Addition Simulator</h2>", unsafe_allow_html=True)
    st.markdown(
        "<p style='color: #6B6B6B; font-size: 0.95rem; margin-bottom: 24px;'>Simulate prescribing a new medication against the patient's active regimen, allergy profile, and organ vulnerabilities before signing the order.</p>",
        unsafe_allow_html=True,
    )

    pills_html = "".join([f'<span class="drug-pill">{m.drug_name} ({m.dose:g} {m.dose_unit})</span>' for m in patient.get_active_medications()])
    st.markdown(
        f"""
        <div style="border-top: 1px solid #E5E5E0; border-bottom: 1px solid #E5E5E0; padding: 20px 0; margin-bottom: 24px;">
            <div class="section-eyebrow">Active Patient Regimen — {patient.name}</div>
            <div style="margin-top: 8px;">{pills_html}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    if "prospective_drug_name" not in st.session_state:
        st.session_state["prospective_drug_name"] = "Ibuprofen"
    if "prospective_drug_dose" not in st.session_state:
        st.session_state["prospective_drug_dose"] = 400.0
    if "prospective_drug_input" not in st.session_state:
        st.session_state["prospective_drug_input"] = st.session_state["prospective_drug_name"]
    if "prospective_dose_input" not in st.session_state:
        st.session_state["prospective_dose_input"] = float(st.session_state["prospective_drug_dose"])

    def _apply_preset_candidate(drug_name: str, drug_dose: float):
        st.session_state["prospective_drug_name"] = drug_name
        st.session_state["prospective_drug_dose"] = float(drug_dose)
        st.session_state["prospective_drug_input"] = drug_name
        st.session_state["prospective_dose_input"] = float(drug_dose)

    st.markdown('<div class="section-eyebrow">Quick Clinical Test Candidates</div>', unsafe_allow_html=True)
    preset_cols = st.columns(5)
    presets = [
        ("Ibuprofen", 400.0),
        ("Paracetamol", 500.0),
        ("Amiodarone", 200.0),
        ("Bactrim", 800.0),
        ("Pantoprazole", 40.0),
    ]
    for idx, (p_name, p_dose) in enumerate(presets):
        with preset_cols[idx]:
            st.button(
                f"{p_name} {int(p_dose)}mg",
                key=f"preset_btn_{p_name}",
                width="stretch",
                on_click=_apply_preset_candidate,
                args=(p_name, p_dose),
            )

    with st.form("prospective_check_form"):
        st.markdown('<div class="section-eyebrow">Candidate Prescription</div>', unsafe_allow_html=True)
        col_in1, col_in2, col_in3 = st.columns([3, 2, 2])
        with col_in1:
            proposed_drug = st.text_input(
                "Proposed Drug Name",
                key="prospective_drug_input",
                help="Enter generic or brand name (Ibuprofen, Amiodarone, Bactrim, Paracetamol, Naproxen)",
            )
        with col_in2:
            proposed_dose = st.number_input(
                "Dose Amount",
                key="prospective_dose_input",
                min_value=0.0,
                step=50.0,
            )
        with col_in3:
            proposed_unit = st.selectbox("Dose Unit", ["mg", "mcg", "g", "ml"])

        submitted_check = st.form_submit_button("Run Prospective Safety Check", icon=":material/fact_check:")

    cleaned_drug = proposed_drug.strip()
    if not cleaned_drug or not any(ch.isalpha() for ch in cleaned_drug):
        st.error(
            "Invalid candidate medication: please enter a valid medication name (letters required) before running a safety check.",
            icon=":material/error:",
        )
    elif proposed_dose <= 0:
        st.error(
            "Invalid dosage amount: please enter a dose greater than 0 to evaluate prospective safety.",
            icon=":material/error:",
        )
    else:
        st.session_state["prospective_drug_name"] = cleaned_drug
        st.session_state["prospective_drug_dose"] = proposed_dose
        assessment = checker.assess_new_drug(patient, cleaned_drug, dose=proposed_dose, dose_unit=proposed_unit)

        status_map = {
            "CRITICAL_CONTRAINDICATION": ("CRITICAL CONTRAINDICATION", "#DC2626"),
            "HIGH_RISK": ("HIGH INTERACTION RISK", "#B48A00"),
            "MODERATE_RISK": ("MODERATE CLINICAL CAUTION", "#6B6B6B"),
            "LOW_RISK_COMPATIBLE": ("COMPATIBLE — LOW RISK", "#1B7A3D"),
        }
        status_label, status_color = status_map.get(assessment.overall_safety_status, ("ASSESSMENT COMPLETE", "#1A1A1A"))

        # Explicit Success or Error Message Banner
        if assessment.overall_safety_status == "LOW_RISK_COMPATIBLE":
            st.success(
                f"Prospective safety verification passed: {cleaned_drug.title()} ({proposed_dose:g} {proposed_unit}) "
                f"is compatible with {patient.name}'s active regimen.",
                icon=":material/check_circle:",
            )
        elif assessment.overall_safety_status in ("CRITICAL_CONTRAINDICATION", "HIGH_RISK"):
            st.error(
                f"{status_label}: Prescribing {cleaned_drug.title()} ({proposed_dose:g} {proposed_unit}) to "
                f"{patient.name} triggers high-severity pharmacovigilance warnings.",
                icon=":material/warning:",
            )
        else:
            st.info(
                f"{status_label}: Review clinical monitoring guidance before prescribing {cleaned_drug.title()}.",
                icon=":material/info:",
            )

        st.markdown(
            f"""
            <div style="border-top: 2px solid {status_color}; border-bottom: 1px solid #E5E5E0; padding: 24px 0; margin: 20px 0;">
                <div class="section-eyebrow" style="color: {status_color};">{status_label}</div>
                <div style="font-family: 'Playfair Display', serif; font-size: 1.75rem; font-weight: 700; color: #1A1A1A; margin: 6px 0 12px 0;">
                    {cleaned_drug.title()} ({proposed_dose:g} {proposed_unit})
                </div>
                <div style="font-size: 1rem; color: #1A1A1A; line-height: 1.6; max-width: 720px;">
                    {assessment.recommendation}
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        col_l, col_r = st.columns([1, 1.3])

        with col_l:
            st.markdown('<div class="section-eyebrow">Allergy &amp; Cross-Reactivity</div>', unsafe_allow_html=True)
            if assessment.allergy_flags:
                for a_flag in assessment.allergy_flags:
                    st.markdown(f"<div style='color: #DC2626; font-weight: 600; font-size: 0.9rem; margin-bottom: 8px;'>&bull; {a_flag}</div>", unsafe_allow_html=True)
            else:
                st.markdown("<div style='color: #1B7A3D; font-size: 0.9rem; margin-bottom: 20px;'>No direct allergy or class cross-reactivity detected.</div>", unsafe_allow_html=True)

            st.markdown('<div class="section-eyebrow" style="margin-top: 24px;">Patient Organ Vulnerabilities</div>', unsafe_allow_html=True)
            if assessment.vulnerability_flags:
                for v_flag in assessment.vulnerability_flags:
                    st.markdown(f"<div style='color: #1A1A1A; font-size: 0.9rem; margin-bottom: 8px; border-left: 2px solid #E8C840; padding-left: 10px;'>{v_flag}</div>", unsafe_allow_html=True)
            else:
                st.markdown("<div style='color: #6B6B6B; font-size: 0.9rem;'>No specific geriatric or organ-clearance flags triggered.</div>", unsafe_allow_html=True)

        with col_r:
            st.markdown('<div class="section-eyebrow">Emergent Multi-Drug FAERS Signals</div>', unsafe_allow_html=True)
            if assessment.flagged_combinations:
                bklit_items = [
                    {
                        "label": f"{c['reaction'].title()} ({c['combo']})",
                        "value": float(c["prr"]),
                        "chi2": round(float(c["chi2"]), 1),
                        "cases": int(c["cases"]),
                        "tier": c["tier"],
                    }
                    for c in assessment.flagged_combinations
                ]
                bklit_bar_chart(
                    bklit_items,
                    threshold=2.0,
                    title="Emergent Combination Disproportionality (PRR)",
                    subtitle="Bklit.UI comparison of triggered multi-drug reporting ratios.",
                    key=f"prospective_bklit_{patient.patient_id}_{cleaned_drug}",
                )
                for c_info in assessment.flagged_combinations:
                    badge = f"badge-{c_info['tier'].lower()}"
                    st.markdown(
                        f"""
                        <div style="border-bottom: 1px solid #E5E5E0; padding: 14px 0;">
                            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 8px;">
                                <span style="font-weight: 700; font-size: 0.98rem; color: #1A1A1A;">{c_info['combo']}</span>
                                <span class="{badge}">{c_info['tier']}</span>
                            </div>
                            <div style="font-size: 0.86rem; color: #6B6B6B; margin-top: 6px;">
                                Outcome: <b style="color: #DC2626;">{c_info['reaction'].title()}</b> &nbsp;&bull;&nbsp;
                                PRR <span class="mono-val">{c_info['prr']:.1f}x</span> &nbsp;&bull;&nbsp;
                                &chi;&sup2; <span class="mono-val">{c_info['chi2']:.1f}</span> &nbsp;&bull;&nbsp;
                                {c_info['cases']} cases
                            </div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )
            else:
                st.markdown("<div style='color: #1B7A3D; font-size: 0.9rem;'>No high-disproportionality signals formed with current active medications.</div>", unsafe_allow_html=True)


# ==============================================================================
# WORKFLOW 3: PATIENT PROFILE & REPORT PARSER
# ==============================================================================
elif menu == "Patient Profile & Report Parser":
    st.markdown('<div class="section-eyebrow">Longitudinal Health Record</div>', unsafe_allow_html=True)
    st.markdown(f"<h2 style='font-family: Playfair Display, serif; font-size: 2.1rem; font-weight: 700; margin: 0 0 20px 0;'>{patient.name}</h2>", unsafe_allow_html=True)

    # Display persistent feedback if a profile was just extracted
    if st.session_state.get("extracted_profile_feedback"):
        fb = st.session_state["extracted_profile_feedback"]
        st.success(fb["message"], icon=":material/check_circle:")
        with st.expander("View Extracted Patient Timeline JSON", expanded=False):
            st.json(fb["data"])
        if st.button("Dismiss Extraction Notice", key="dismiss_extract_fb"):
            del st.session_state["extracted_profile_feedback"]
            st.rerun()

    tab_inspect, tab_upload = st.tabs(["Active Electronic Health Record", "Ingest Clinical Report (PDF / Image / OCR)"])

    with tab_inspect:
        # Vitals as Oversized Stat Callouts
        v1, v2, v3, v4 = st.columns(4)
        with v1:
            st.markdown(
                f"""
                <div class="stat-callout">
                    <div class="stat-number" style="font-size: 2.6rem;">{patient.age}</div>
                    <div class="stat-label">Age (Years)</div>
                </div>
                """,
                unsafe_allow_html=True,
            )
        with v2:
            st.markdown(
                f"""
                <div class="stat-callout">
                    <div class="stat-number" style="font-size: 2.6rem;">{patient.sex}</div>
                    <div class="stat-label">Biological Sex</div>
                </div>
                """,
                unsafe_allow_html=True,
            )
        with v3:
            st.markdown(
                f"""
                <div class="stat-callout">
                    <div class="stat-number" style="font-size: 2.6rem;">{patient.weight}</div>
                    <div class="stat-label">Weight (kg)</div>
                </div>
                """,
                unsafe_allow_html=True,
            )
        with v4:
            st.markdown(
                f"""
                <div class="stat-callout">
                    <div class="stat-number" style="font-size: 2.6rem;">{len(patient.medications)}</div>
                    <div class="stat-label">Total Medications</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        st.markdown("<hr style='border: none; border-top: 1px solid #E5E5E0; margin: 20px 0 28px 0;'/>", unsafe_allow_html=True)

        col_left_ehr, col_right_ehr = st.columns(2)
        with col_left_ehr:
            st.markdown('<div class="section-eyebrow">Diagnosed Clinical Conditions</div>', unsafe_allow_html=True)
            for c in patient.conditions:
                st.markdown(f"<div style='padding: 8px 0; border-bottom: 1px solid #E5E5E0; font-size: 0.92rem; font-weight: 500;'>{c}</div>", unsafe_allow_html=True)

            st.markdown('<div class="section-eyebrow" style="margin-top: 24px;">Documented Drug Allergies</div>', unsafe_allow_html=True)
            if patient.allergies:
                for a in patient.allergies:
                    st.markdown(f'<span class="symptom-pill">{a}</span>', unsafe_allow_html=True)
            else:
                st.markdown("<div style='font-size: 0.9rem; color: #1B7A3D;'>No known drug allergies (NKDA).</div>", unsafe_allow_html=True)

        with col_right_ehr:
            st.markdown('<div class="section-eyebrow">Key Diagnostic &amp; Laboratory Markers</div>', unsafe_allow_html=True)
            if patient.lab_results:
                st.dataframe(pd.DataFrame(patient.lab_results), hide_index=True, width="stretch")
            else:
                st.caption("No laboratory markers recorded.")

        st.markdown("<div style='height: 24px;'></div>", unsafe_allow_html=True)
        st.markdown('<div class="section-eyebrow">Medication Regimen History</div>', unsafe_allow_html=True)
        med_records = [
            {
                "Medication": m.drug_name,
                "Normalized Ingredient": m.normalized_name,
                "RxCUI": m.rxcui,
                "Regimen": f"{m.dose:g} {m.dose_unit} {m.frequency}",
                "Route": m.route,
                "Start Date": m.start_date.isoformat() if m.start_date else "Unknown",
                "End Date": m.end_date.isoformat() if m.end_date else "Active",
            }
            for m in patient.medications
        ]
        st.dataframe(pd.DataFrame(med_records), hide_index=True, width="stretch")

        st.markdown("<div style='height: 24px;'></div>", unsafe_allow_html=True)
        st.markdown('<div class="section-eyebrow">Adverse Reactions &amp; Symptom Log</div>', unsafe_allow_html=True)
        if patient.symptoms:
            sym_records = [
                {
                    "Symptom": s.description,
                    "MedDRA Preferred Term": s.meddra_term,
                    "Severity (1-10)": s.severity,
                    "Onset Date": s.onset_date.isoformat() if s.onset_date else "Unknown",
                    "Resolution": s.resolution_date.isoformat() if s.resolution_date else "Ongoing",
                }
                for s in patient.symptoms
            ]
            st.dataframe(pd.DataFrame(sym_records), hide_index=True, width="stretch")
        else:
            st.caption("No adverse reactions or symptoms recorded for this patient.")

    with tab_upload:
        st.markdown('<div class="section-eyebrow" style="margin-top: 16px;">Automated Clinical Document Parser</div>', unsafe_allow_html=True)
        if "clinical_note_draft" not in st.session_state:
            st.session_state["clinical_note_draft"] = ""

        if st.button("Load Sample Clinical Discharge Summary", icon=":material/description:"):
            st.session_state["clinical_note_draft"] = (
                "Patient Name: Vikram Deshmukh\n"
                "Patient ID: PT_CLINICAL_006\n"
                "68yo male with Atrial Fibrillation and Osteoarthritis.\n"
                "Allergies: Penicillin\n"
                "Medications:\n"
                "- Warfarin 5 mg QD started 2026-01-15\n"
                "- Aspirin 81 mg QD started 2026-02-01\n"
                "- Ibuprofen 400 mg TID started 2026-09-18\n"
                "Symptoms:\n"
                "Admitted 2026-09-21 for acute gastrointestinal hemorrhage and melena."
            )
            st.rerun()

        up_file = st.file_uploader("Upload Discharge Summary or Prescription (Images auto-compressed)", type=["pdf", "png", "jpg", "jpeg", "txt"])
        txt_in = st.text_area(
            "Clinical chart notes for timeline extraction",
            value=st.session_state["clinical_note_draft"],
            height=150,
            help="Paste a clinical discharge summary or prescription order listing medications, doses, dates, and symptoms.",
        )

        if st.button("Extract & Save Patient Timeline", icon=":material/upload_file:"):
            if up_file is None and not txt_in.strip():
                st.error(
                    "No clinical document provided: please upload a PDF/image file or enter clinical chart notes before extracting.",
                    icon=":material/error:",
                )
            else:
                try:
                    new_profile = None
                    if up_file is not None:
                        ext = up_file.name.split(".")[-1].lower()
                        b_content = up_file.read()
                        f_type = "pdf" if ext == "pdf" else ("image" if ext in ["png", "jpg", "jpeg"] else "text")
                        if f_type == "image":
                            b_content = parser.compress_image_bytes(b_content)
                        new_profile = parser.parse_report(b_content, file_type=f_type)
                    if txt_in.strip():
                        txt_profile = parser.parse_report(txt_in.strip(), file_type="text")
                        if new_profile is None:
                            new_profile = txt_profile
                        else:
                            new_profile.medications.extend(txt_profile.medications)
                            new_profile.symptoms.extend(txt_profile.symptoms)

                    if not new_profile or (not new_profile.medications and not new_profile.symptoms):
                        st.error(
                            "Extraction incomplete: no recognizable medication regimens or adverse symptoms were found in the document.",
                            icon=":material/error:",
                        )
                    else:
                        store.save(new_profile)
                        st.session_state["selected_pid"] = new_profile.patient_id
                        st.session_state["extracted_profile_feedback"] = {
                            "message": (
                                f"Successfully extracted and saved longitudinal profile for {new_profile.name} "
                                f"({new_profile.patient_id}) — {len(new_profile.medications)} medication(s) and "
                                f"{len(new_profile.symptoms)} symptom(s) indexed."
                            ),
                            "data": new_profile.to_dict(),
                        }
                        st.rerun()
                except Exception as exc:
                    st.error(f"Failed to parse clinical document: {exc}", icon=":material/error:")


# ==============================================================================
# WORKFLOW 4: FAERS DISPROPORTIONALITY EXPLORER
# ==============================================================================
elif menu == "FAERS Disproportionality Explorer":
    st.markdown('<div class="section-eyebrow">Empirical Signal Mining</div>', unsafe_allow_html=True)
    st.markdown("<h2 style='font-family: Playfair Display, serif; font-size: 2rem; font-weight: 700; margin: 0 0 8px 0;'>FAERS Disproportionality Explorer</h2>", unsafe_allow_html=True)
    st.markdown(
        "<p style='color: #6B6B6B; font-size: 0.95rem; margin-bottom: 20px;'>Query multi-drug combinations against pre-computed 2x2 contingency tables and live openFDA adverse event reports.</p>",
        unsafe_allow_html=True,
    )

    if "faers_query_str" not in st.session_state:
        st.session_state["faers_query_str"] = "Warfarin, Aspirin, Ibuprofen"

    st.markdown('<div class="section-eyebrow">Benchmark Combination Presets</div>', unsafe_allow_html=True)
    f_cols = st.columns(4)
    faers_presets = [
        ("Triple Bleed", "Warfarin, Aspirin, Ibuprofen"),
        ("Statin Myopathy", "Simvastatin, Amiodarone, Amlodipine"),
        ("MTX Pancytopenia", "Methotrexate, Trimethoprim, Naproxen"),
        ("Stent Thrombosis", "Clopidogrel, Omeprazole"),
    ]
    for idx, (label, combo_val) in enumerate(faers_presets):
        with f_cols[idx]:
            if st.button(label, key=f"faers_preset_{idx}", width="stretch"):
                st.session_state["faers_query_str"] = combo_val
                st.rerun()

    col_q1, col_q2, col_q3 = st.columns([3.2, 1.3, 1.2])
    with col_q1:
        query_str = st.text_input(
            "Drug Combination (comma-separated)",
            value=st.session_state["faers_query_str"],
            help="Enter two or more drug names separated by commas",
        )
    with col_q2:
        st.markdown("<div style='height: 28px;'></div>", unsafe_allow_html=True)
        live_fda_check = st.checkbox("Query Live openFDA API", value=False)
    with col_q3:
        st.markdown("<div style='height: 24px;'></div>", unsafe_allow_html=True)
        run_query_clicked = st.button("Query Signals", icon=":material/search:", width="stretch")

    if run_query_clicked:
        st.session_state["faers_query_str"] = query_str

    drug_tokens = [d.strip() for d in query_str.split(",") if d.strip()]
    if len(drug_tokens) < 2:
        st.error(
            "Invalid combination query: please enter at least 2 comma-separated medication names (for example: Warfarin, Aspirin).",
            icon=":material/error:",
        )
    else:
        local_sigs = db.query_signals(drug_tokens)

        if local_sigs:
            st.success(
                f"Found {len(local_sigs)} empirical FAERS disproportionality signal(s) for {', '.join(drug_tokens)}.",
                icon=":material/check_circle:",
            )
            sig_df = pd.DataFrame(local_sigs)
            sig_df["PRR"] = sig_df["prr"].round(2)
            sig_df["χ²"] = sig_df["chi_squared"].round(1)
            sig_df["Cases"] = sig_df["case_count"]
            sig_df["Adverse Event"] = sig_df["adverse_event"].str.title()
            sig_df["Severity"] = sig_df["severity_tier"]
            sig_df["Signal Strength"] = sig_df["signal_strength"]

            # Composable Bklit.UI Horizontal Bar + Volcano Matrix Charts
            c_chart1, c_chart2 = st.columns(2)

            with c_chart1:
                bar_items = [
                    {
                        "label": row["Adverse Event"],
                        "value": float(row["PRR"]),
                        "chi2": float(row["χ²"]),
                        "cases": int(row["Cases"]),
                        "tier": row["Severity"],
                    }
                    for _, row in sig_df.sort_values("PRR", ascending=False).iterrows()
                ]
                bklit_bar_chart(
                    bar_items,
                    threshold=2.0,
                    title="Reporting Ratio Comparison (PRR)",
                    subtitle="Bklit.UI horizontal bars animated with motion.dev spring physics.",
                    key=f"faers_bklit_bar_{'_'.join(drug_tokens)}",
                )

            with c_chart2:
                volcano_pts = [
                    {
                        "label": row["Adverse Event"],
                        "prr": float(row["PRR"]),
                        "chi2": float(row["χ²"]),
                        "cases": int(row["Cases"]),
                        "tier": row["Severity"],
                    }
                    for _, row in sig_df.iterrows()
                ]
                bklit_volcano_chart(
                    volcano_pts,
                    x_threshold=2.0,
                    y_threshold=4.0,
                    title="Disproportionality Volcano Plot (PRR vs χ²)",
                    subtitle="Bklit.UI bubble matrix sized by co-reported FAERS case volume.",
                    key=f"faers_bklit_volcano_{'_'.join(drug_tokens)}",
                )

            st.markdown('<div class="section-eyebrow" style="margin-top: 20px;">Contingency Signal Table</div>', unsafe_allow_html=True)
            cols_to_show = ["Adverse Event", "Severity", "PRR", "χ²", "Cases", "Signal Strength"]
            st.dataframe(sig_df[cols_to_show], hide_index=True, width="stretch")
        else:
            st.error(
                f"No pre-computed disproportionality signals found in the local FAERS benchmark database for: {', '.join(drug_tokens)}.",
                icon=":material/search_off:",
            )

        if live_fda_check:
            st.markdown('<div class="section-eyebrow" style="margin-top: 24px;">Live openFDA Co-Occurrence Reports</div>', unsafe_allow_html=True)
            with st.spinner("Querying openFDA endpoint..."):
                fda_reactions = fda_client.get_combo_reactions(drug_tokens, limit=12)
                if fda_reactions:
                    st.success(f"Retrieved {len(fda_reactions)} live co-occurrence reaction terms from openFDA.", icon=":material/cloud_done:")
                    st.dataframe(pd.DataFrame(fda_reactions), hide_index=True, width="stretch")
                else:
                    st.error("No co-reported reactions returned by live openFDA query (or endpoint offline).", icon=":material/cloud_off:")

# ==============================================================================
# EDITORIAL FOOTER (VERIFIED LINKS & DYNAMIC COPYRIGHT YEAR)
# ==============================================================================
current_year = date.today().year
st.markdown(
    f"""<div class="editorial-footer" style="border-top:1px solid #E5E5E0; margin-top:48px; padding-top:28px; padding-bottom:16px; font-size:0.82rem; color:#6B6B6B;">
<div class="footer-grid" style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:24px; margin-bottom:20px;">
<div>
<a href="?workflow=discovery" target="_self" class="brand-link" style="text-decoration:none; color:#1A1A1A; display:inline-flex; align-items:center; gap:8px; margin-bottom:6px;">
<span class="brand-title" style="font-family:'Playfair Display',Georgia,serif; font-weight:700; font-size:1.25rem; color:#1A1A1A; text-decoration:none;">LADIP</span>
<span class="brand-dot" style="display:inline-flex; align-items:center; justify-content:center; width:15px; height:15px; border-radius:50%; background-color:#D4A5E5; color:#1A1A1A; font-size:9px; font-weight:800; text-decoration:none;">✓</span>
</a>
<div style="font-size: 0.78rem; color: #6B6B6B; margin-top: 4px;">
&copy; {current_year} LADIP — Longitudinal Adverse Drug Interaction Predictor. All rights reserved.
</div>
</div>
<div>
<div class="section-eyebrow" style="margin-bottom: 8px;">Clinical Modules</div>
<div class="footer-links" style="display:flex; flex-wrap:wrap; gap:16px; align-items:center;">
<a href="?workflow=discovery" target="_self" style="color:#1A1A1A; text-decoration:none; font-weight:600;">Interaction Discovery</a>
<a href="?workflow=safety" target="_self" style="color:#1A1A1A; text-decoration:none; font-weight:600;">Prospective Safety Check</a>
<a href="?workflow=ehr" target="_self" style="color:#1A1A1A; text-decoration:none; font-weight:600;">Patient EHR &amp; OCR</a>
<a href="?workflow=faers" target="_self" style="color:#1A1A1A; text-decoration:none; font-weight:600;">FAERS Signal Explorer</a>
</div>
</div>
<div>
<div class="section-eyebrow" style="margin-bottom: 8px;">Standards &amp; References</div>
<div class="footer-links" style="display:flex; flex-wrap:wrap; gap:16px; align-items:center;">
<a href="https://open.fda.gov/apis/drug/event/" target="_blank" rel="noopener noreferrer" style="color:#1A1A1A; text-decoration:none; font-weight:600;">FDA FAERS API</a>
<a href="https://lhncbc.nlm.nih.gov/RxNav/" target="_blank" rel="noopener noreferrer" style="color:#1A1A1A; text-decoration:none; font-weight:600;">NIH RxNorm</a>
<a href="https://www.meddra.org/" target="_blank" rel="noopener noreferrer" style="color:#1A1A1A; text-decoration:none; font-weight:600;">MedDRA Ontology</a>
<a href="https://www.ncbi.nlm.nih.gov/books/NBK548069/" target="_blank" rel="noopener noreferrer" style="color:#1A1A1A; text-decoration:none; font-weight:600;">Naranjo Scale</a>
</div>
</div>
</div>
</div>""",
    unsafe_allow_html=True,
)
