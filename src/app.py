"""Longitudinal Adverse Drug Interaction Predictor (LADIP)
Clinical Decision Support System — Editorial Health-Tech Edition
"""
from datetime import date, timedelta
import pandas as pd
import plotly.express as px
import streamlit as st

from src.analysis.naranjo import NaranjoAlgorithm
from src.analysis.signal_matcher import SignalMatcher
from src.config import DB_PATH
from src.explanations.pharmacology import PharmacologyExplainer
from src.faers.bulk_loader import FAERSDatabase
from src.faers.client import OpenFDAClient
from src.patient.memory import PatientStore
from src.patient.report_parser import MedicalReportParser
from src.safety.drug_checker import DrugSafetyChecker

st.set_page_config(
    page_title="LADIP — Temporal Pharmacovigilance",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ==============================================================================
# EDITORIAL HEALTH-TECH DESIGN SYSTEM (BELLA-INSPIRED, ZERO AI SLOP)
# ==============================================================================
st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    :root {
        --surface: #FFFFFF;
        --surface-muted: #F5F5F0;
        --ink: #1A1A1A;
        --ink-muted: #6B6B6B;
        --border: #E5E5E0;
        --accent-green: #1B7A3D;
        --accent-lavender: #D4A5E5;
        --accent-gold: #E8C840;
        --accent-coral: #DC2626;
        --cta-bg: #1A1A1A;
    }

    /* Base App & Typography */
    html, body, .stApp, [class*="css"] {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        color: var(--ink);
        background-color: var(--surface);
    }

    .main .block-container {
        max-width: 1180px;
        padding-top: 2.5rem;
        padding-bottom: 4rem;
    }

    code, pre, .mono-val {
        font-family: 'JetBrains Mono', monospace !important;
        font-size: 0.9em;
        background: var(--surface-muted) !important;
        color: var(--ink) !important;
        padding: 2px 6px;
        border-radius: 4px;
    }

    /* Sidebar Editorial Styling */
    [data-testid="stSidebar"] {
        background-color: var(--surface) !important;
        border-right: 1px solid var(--border) !important;
    }
    [data-testid="stSidebar"] .block-container {
        padding-top: 2rem;
    }

    /* Remove shadows & style native containers */
    [data-testid="stVerticalBlockBorderWrapper"] {
        border: 1px solid var(--border) !important;
        border-radius: 0px !important;
        box-shadow: none !important;
        background-color: var(--surface) !important;
        padding: 24px !important;
    }

    /* Black Pill CTA Buttons */
    .stButton > button, .stFormSubmitButton > button {
        background-color: var(--cta-bg) !important;
        color: #FFFFFF !important;
        border: 1px solid var(--cta-bg) !important;
        border-radius: 9999px !important;
        padding: 0.6rem 1.6rem !important;
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        font-weight: 600 !important;
        font-size: 0.88rem !important;
        letter-spacing: -0.01em !important;
        box-shadow: none !important;
        transition: transform 0.15s ease, opacity 0.15s ease !important;
    }
    .stButton > button:hover, .stFormSubmitButton > button:hover {
        opacity: 0.88 !important;
        transform: translateY(-1px) !important;
    }
    .stButton > button:active, .stFormSubmitButton > button:active {
        transform: scale(0.98) !important;
    }

    /* Editorial Brand Mark */
    .brand-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 18px;
    }
    .brand-title {
        font-family: 'Playfair Display', Georgia, serif;
        font-weight: 700;
        font-size: 1.65rem;
        color: var(--ink);
        letter-spacing: -0.02em;
        line-height: 1;
    }
    .brand-dot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background-color: var(--accent-lavender);
        color: #FFFFFF;
        font-size: 10px;
        font-weight: 700;
    }

    /* Star Credibility Line */
    .credibility-line {
        font-size: 0.85rem;
        color: var(--ink);
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .gold-star {
        color: var(--accent-gold);
        font-size: 1rem;
    }

    /* Editorial Hero Section */
    .editorial-hero {
        background: var(--surface);
        border-bottom: 1px solid var(--border);
        padding: 8px 0 36px 0;
        margin-bottom: 36px;
    }
    .editorial-headline {
        font-family: 'Playfair Display', Georgia, serif;
        font-weight: 700;
        font-size: 2.85rem;
        line-height: 1.08;
        letter-spacing: -0.025em;
        color: var(--ink);
        margin: 0 0 18px 0;
        max-width: 680px;
    }
    .editorial-subtext {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 1rem;
        line-height: 1.6;
        color: var(--ink-muted);
        max-width: 580px;
        margin: 0;
    }

    /* Patient Editorial Strip */
    .patient-strip {
        border-bottom: 1px solid var(--border);
        padding: 0 0 28px 0;
        margin-bottom: 32px;
    }
    .patient-serif-name {
        font-family: 'Playfair Display', Georgia, serif;
        font-weight: 700;
        font-size: 1.85rem;
        color: var(--ink);
        letter-spacing: -0.02em;
        margin: 0 0 6px 0;
    }
    .patient-meta {
        font-size: 0.85rem;
        color: var(--ink-muted);
        margin-bottom: 12px;
    }
    .section-eyebrow {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--ink-muted);
        margin-bottom: 6px;
    }

    /* Oversized Stat Callouts (The Bella 24.1% Treatment) */
    .stat-callout {
        padding: 8px 0;
    }
    .stat-number {
        font-family: 'Playfair Display', Georgia, serif;
        font-weight: 900;
        font-size: 3.4rem;
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

    /* Outlined Severity Badges (Zero Filled Slop) */
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

    /* Editorial Alert Row */
    .alert-row {
        border-top: 1px solid var(--border);
        padding: 28px 0 20px 0;
    }
    .alert-headline {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 1.18rem;
        font-weight: 700;
        color: var(--ink);
        letter-spacing: -0.01em;
        margin: 0 0 12px 0;
    }
    .alert-score-num {
        font-family: 'Playfair Display', Georgia, serif;
        font-weight: 900;
        font-size: 2.25rem;
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

    /* Black Pill Drug Tags & Outlined Symptom Tags */
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
    }

    /* Suppressed Alert Editorial Bar */
    .suppressed-row {
        border-left: 3px solid var(--accent-green);
        padding: 10px 0 10px 16px;
        margin-bottom: 14px;
    }

    /* Evidence Metric Cell */
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
    }
    .evidence-sub {
        font-size: 0.76rem;
        color: var(--ink-muted);
    }
    </style>
    """,
    unsafe_allow_html=True,
)


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
# SIDEBAR NAVIGATION & DEMO SELECTOR
# ==============================================================================
with st.sidebar:
    st.markdown(
        """
        <div class="brand-row" style="margin-bottom: 6px;">
            <span class="brand-title">LADIP</span>
            <span class="brand-dot">✓</span>
        </div>
        <div style="font-size: 0.8rem; color: #6B6B6B; margin-bottom: 24px;">
            Longitudinal Pharmacovigilance &amp; Causality Engine
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.markdown('<div class="section-eyebrow">Clinical Workspace</div>', unsafe_allow_html=True)
    menu = st.radio(
        "Workspace Navigation",
        [
            "Multi-Drug Interaction Discovery",
            "Prospective Drug Safety Check",
            "Patient Profile & Report Parser",
            "FAERS Disproportionality Explorer",
        ],
        index=0,
        label_visibility="collapsed",
    )

    st.markdown("<hr style='border: none; border-top: 1px solid #E5E5E0; margin: 24px 0;'/>", unsafe_allow_html=True)
    st.markdown('<div class="section-eyebrow">Patient Cohort Registry</div>', unsafe_allow_html=True)

    all_patients = store.list_all()
    if not all_patients:
        st.warning("No patient profiles found in local store.")
        if st.button("Initialize Patient Cohort"):
            from scripts.generate_synthetic_patients import generate_profiles
            generate_profiles()
            st.rerun()
        st.stop()

    patient_map = {p.patient_id: p for p in all_patients}
    scenario_names = {
        "PT_BLEED_001": "● Ramesh Sharma — Warfarin + Aspirin + Ibuprofen",
        "PT_STATIN_002": "● Sunita Patel — Simvastatin + Amlodipine + Amiodarone",
        "PT_MTX_003": "● Kavitha Reddy — Methotrexate + Bactrim + Naproxen",
        "PT_CARDIO_005": "● Arjun Nair — Clopidogrel + Omeprazole",
        "PT_STABLE_004": "● Rajesh Varma — Stable 2yr Cohort (Suppressed)",
    }

    selected_pid = st.selectbox(
        "Select Patient Case",
        options=list(patient_map.keys()),
        format_func=lambda pid: scenario_names.get(pid, f"{patient_map[pid].name} ({pid})"),
        label_visibility="collapsed",
    )
    patient = patient_map[selected_pid]

    st.markdown("<hr style='border: none; border-top: 1px solid #E5E5E0; margin: 24px 0;'/>", unsafe_allow_html=True)
    st.markdown(
        """
        <div style="font-size: 0.78rem; color: #6B6B6B; line-height: 1.5;">
            <b style="color: #1A1A1A;">Clinical Benchmark Note</b><br/>
            Select <b>Rajesh Varma</b> to observe how longitudinal stability (&gt;6 months symptom-free) suppresses low-value background alerts.
        </div>
        """,
        unsafe_allow_html=True,
    )


# ==============================================================================
# EDITORIAL HERO HEADER
# ==============================================================================
st.markdown(
    """
    <div class="editorial-hero">
        <div class="brand-row">
            <span class="brand-title">LADIP</span>
            <span class="brand-dot">✓</span>
        </div>
        <div class="credibility-line">
            <span class="gold-star">★</span>
            <span><b>16 Benchmark Signals</b> &nbsp;•&nbsp; <b>5 Clinical Cohorts</b> &nbsp;•&nbsp; <b>FAERS 2x2 Disproportionality</b></span>
        </div>
        <h1 class="editorial-headline">
            Temporal Pharmacovigilance<br/>
            That Actually Stops<br/>
            Alert Fatigue.
        </h1>
        <p class="editorial-subtext">
            Combining real-world FDA adverse event reporting ratios with patient-specific medication timelines to surface only the interactions that demand clinical action.
        </p>
    </div>
    """,
    unsafe_allow_html=True,
)


# ==============================================================================
# WORKFLOW 1: MULTI-DRUG INTERACTION DISCOVERY
# ==============================================================================
if menu == "Multi-Drug Interaction Discovery":
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

    st.markdown("<hr style='border: none; border-top: 1px solid #E5E5E0; margin: 20px 0 32px 0;'/>", unsafe_allow_html=True)

    # Compute alerts early so metrics and charts can use them
    alerts = matcher.match_patient(patient)
    active_alerts = [a for a in alerts if not a.is_suppressed]
    suppressed_alerts = [a for a in alerts if a.is_suppressed]
    crit_count = sum(1 for a in active_alerts if a.severity_tier == "CRITICAL")
    symptom_matched = sum(1 for a in active_alerts if a.patient_has_matching_symptom)

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
        top_prr = max([a.prr for a in active_alerts], default=1.0)
        st.markdown(
            f"""
            <div class="stat-callout">
                <div class="stat-number">{top_prr:.1f}x</div>
                <div class="stat-label">Peak Reporting Ratio (PRR)</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<hr style='border: none; border-top: 1px solid #E5E5E0; margin: 28px 0 32px 0;'/>", unsafe_allow_html=True)

    # Longitudinal Regimen & Symptom Chronology
    st.markdown('<div class="section-eyebrow">Longitudinal Chronology</div>', unsafe_allow_html=True)
    st.markdown("<h3 style='font-size: 1.25rem; font-weight: 700; margin: 0 0 16px 0;'>Medication Overlap &amp; Adverse Event Timeline</h3>", unsafe_allow_html=True)

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
            "Detail": f"{m.dose} {m.dose_unit} {m.frequency}",
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

    if timeline_rows:
        df_timeline = pd.DataFrame(timeline_rows)
        fig = px.timeline(
            df_timeline,
            x_start="Start",
            x_end="End",
            y="Item",
            color="Track",
            hover_data=["Detail"],
            color_discrete_map={
                "Medication Regimen": "#D4A5E5",
                "Adverse Event Onset": "#DC2626",
            },
            height=250,
        )
        fig.update_yaxes(
            autorange="reversed",
            title="",
            showgrid=False,
            tickfont=dict(size=13, family="Plus Jakarta Sans, sans-serif", color="#1A1A1A"),
        )
        fig.update_xaxes(
            title="",
            showgrid=True,
            gridcolor="#E5E5E0",
            gridwidth=1,
            griddash="dot",
            tickfont=dict(size=11, family="Plus Jakarta Sans, sans-serif", color="#6B6B6B"),
        )
        fig.update_layout(
            margin=dict(l=0, r=0, t=10, b=10),
            legend=dict(
                title="",
                orientation="h",
                yanchor="bottom",
                y=1.04,
                xanchor="left",
                x=0,
                font=dict(size=12, family="Plus Jakarta Sans, sans-serif", color="#1A1A1A"),
            ),
            plot_bgcolor="#FFFFFF",
            paper_bgcolor="#FFFFFF",
        )
        st.plotly_chart(fig, width="stretch")

    st.markdown("<div style='height: 24px;'></div>", unsafe_allow_html=True)

    # Alert Filter Header
    col_hdr, col_ctrl1, col_ctrl2 = st.columns([4, 2, 2])
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

    st.markdown("<div style='height: 12px;'></div>", unsafe_allow_html=True)

    if not active_alerts:
        st.markdown(
            f"""
            <div style="border-top: 1px solid #E5E5E0; border-bottom: 1px solid #E5E5E0; padding: 32px 0;">
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
        for alert in active_alerts:
            if tier_choice != "ALL" and alert.severity_tier != tier_choice:
                continue

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
    if show_suppressed and suppressed_alerts:
        st.markdown("<hr style='border: none; border-top: 1px solid #E5E5E0; margin: 28px 0;'/>", unsafe_allow_html=True)
        st.markdown('<div class="section-eyebrow">Longitudinal Alert Suppression</div>', unsafe_allow_html=True)
        st.markdown("<h4 style='font-size: 1.1rem; font-weight: 700; margin: 0 0 16px 0;'>Suppressed Background Interactions</h4>", unsafe_allow_html=True)
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

    pills_html = "".join([f'<span class="drug-pill">{m.drug_name} ({m.dose} {m.dose_unit})</span>' for m in patient.get_active_medications()])
    st.markdown(
        f"""
        <div style="border-top: 1px solid #E5E5E0; border-bottom: 1px solid #E5E5E0; padding: 20px 0; margin-bottom: 28px;">
            <div class="section-eyebrow">Active Patient Regimen — {patient.name}</div>
            <div style="margin-top: 8px;">{pills_html}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    with st.form("prospective_check_form"):
        st.markdown('<div class="section-eyebrow">Candidate Prescription</div>', unsafe_allow_html=True)
        col_in1, col_in2, col_in3 = st.columns([3, 2, 2])
        with col_in1:
            proposed_drug = st.text_input("Proposed Drug Name", value="Ibuprofen", placeholder="e.g. Ibuprofen, Amiodarone, Bactrim, Naproxen")
        with col_in2:
            proposed_dose = st.number_input("Dose Amount", value=400.0, step=50.0)
        with col_in3:
            proposed_unit = st.selectbox("Dose Unit", ["mg", "mcg", "g", "ml"])

        st.form_submit_button("Run Prospective Safety Check")

    if proposed_drug.strip():
        assessment = checker.assess_new_drug(patient, proposed_drug.strip(), dose=proposed_dose, dose_unit=proposed_unit)

        status_map = {
            "CRITICAL_CONTRAINDICATION": ("CRITICAL CONTRAINDICATION", "#DC2626"),
            "HIGH_RISK": ("HIGH INTERACTION RISK", "#B48A00"),
            "MODERATE_RISK": ("MODERATE CLINICAL CAUTION", "#6B6B6B"),
            "LOW_RISK_COMPATIBLE": ("COMPATIBLE — LOW RISK", "#1B7A3D"),
        }
        status_label, status_color = status_map.get(assessment.overall_safety_status, ("ASSESSMENT COMPLETE", "#1A1A1A"))

        st.markdown(
            f"""
            <div style="border-top: 2px solid {status_color}; border-bottom: 1px solid #E5E5E0; padding: 28px 0; margin: 28px 0;">
                <div class="section-eyebrow" style="color: {status_color};">{status_label}</div>
                <div style="font-family: 'Playfair Display', serif; font-size: 1.75rem; font-weight: 700; color: #1A1A1A; margin: 6px 0 12px 0;">
                    {proposed_drug.strip().title()} ({proposed_dose:g} {proposed_unit})
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
                for c_info in assessment.flagged_combinations:
                    badge = f"badge-{c_info['tier'].lower()}"
                    st.markdown(
                        f"""
                        <div style="border-bottom: 1px solid #E5E5E0; padding: 14px 0;">
                            <div style="display: flex; justify-content: space-between; align-items: baseline;">
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

        st.markdown("<div style='height: 28px;'></div>", unsafe_allow_html=True)
        st.markdown('<div class="section-eyebrow">Medication Regimen History</div>', unsafe_allow_html=True)
        med_records = [
            {
                "Medication": m.drug_name,
                "Normalized Ingredient": m.normalized_name,
                "RxCUI": m.rxcui,
                "Regimen": f"{m.dose} {m.dose_unit} {m.frequency}",
                "Route": m.route,
                "Start Date": m.start_date.isoformat() if m.start_date else "Unknown",
                "End Date": m.end_date.isoformat() if m.end_date else "Active",
            }
            for m in patient.medications
        ]
        st.dataframe(pd.DataFrame(med_records), hide_index=True, width="stretch")

        st.markdown("<div style='height: 24px;'></div>", unsafe_allow_html=True)
        st.markdown('<div class="section-eyebrow">Adverse Reactions &amp; Symptom Log</div>', unsafe_allow_html=True)
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

    with tab_upload:
        st.markdown('<div class="section-eyebrow" style="margin-top: 16px;">Automated Clinical Document Parser</div>', unsafe_allow_html=True)
        up_file = st.file_uploader("Upload Discharge Summary or Prescription", type=["pdf", "png", "jpg", "jpeg", "txt"])
        txt_in = st.text_area(
            "Or paste clinical chart notes directly",
            height=140,
            placeholder="e.g. 68yo male with Atrial Fibrillation admitted for acute GI hemorrhage 3 days after initiating Ibuprofen...",
        )

        if st.button("Extract & Save Patient Timeline"):
            if up_file:
                ext = up_file.name.split(".")[-1].lower()
                b_content = up_file.read()
                f_type = "pdf" if ext == "pdf" else ("image" if ext in ["png", "jpg", "jpeg"] else "text")
                new_profile = parser.parse_report(b_content, file_type=f_type)
            elif txt_in.strip():
                new_profile = parser.parse_report(txt_in, file_type="text")
            else:
                st.warning("Please upload a document or paste clinical text.")
                new_profile = None

            if new_profile:
                store.save(new_profile)
                st.success(f"Extracted longitudinal profile for {new_profile.name} ({new_profile.patient_id})")
                st.json(new_profile.to_dict())
                st.rerun()


# ==============================================================================
# WORKFLOW 4: FAERS DISPROPORTIONALITY EXPLORER
# ==============================================================================
elif menu == "FAERS Disproportionality Explorer":
    st.markdown('<div class="section-eyebrow">Empirical Signal Mining</div>', unsafe_allow_html=True)
    st.markdown("<h2 style='font-family: Playfair Display, serif; font-size: 2rem; font-weight: 700; margin: 0 0 8px 0;'>FAERS Disproportionality Explorer</h2>", unsafe_allow_html=True)
    st.markdown(
        "<p style='color: #6B6B6B; font-size: 0.95rem; margin-bottom: 24px;'>Query multi-drug combinations against pre-computed 2x2 contingency tables and live openFDA adverse event reports.</p>",
        unsafe_allow_html=True,
    )

    col_q1, col_q2 = st.columns([3, 1])
    with col_q1:
        query_str = st.text_input("Drug Combination (comma-separated)", value="Warfarin, Aspirin, Ibuprofen")
    with col_q2:
        st.markdown("<div style='height: 28px;'></div>", unsafe_allow_html=True)
        live_fda_check = st.checkbox("Query Live openFDA API", value=False)

    if query_str.strip():
        drug_tokens = [d.strip() for d in query_str.split(",") if d.strip()]
        local_sigs = db.query_signals(drug_tokens)

        if local_sigs:
            sig_df = pd.DataFrame(local_sigs)
            sig_df["PRR"] = sig_df["prr"].round(2)
            sig_df["χ²"] = sig_df["chi_squared"].round(1)
            sig_df["Cases"] = sig_df["case_count"]
            sig_df["Adverse Event"] = sig_df["adverse_event"].str.title()
            sig_df["Severity"] = sig_df["severity_tier"]
            sig_df["Signal Strength"] = sig_df["signal_strength"]

            # Bella-Inspired Horizontal Bar Comparison + Volcano Plot
            c_chart1, c_chart2 = st.columns(2)

            with c_chart1:
                st.markdown('<div class="section-eyebrow" style="margin-top: 16px;">Reporting Ratio Comparison (PRR)</div>', unsafe_allow_html=True)
                fig_bars = px.bar(
                    sig_df.sort_values("PRR", ascending=True),
                    x="PRR",
                    y="Adverse Event",
                    orientation="h",
                    color="Severity",
                    color_discrete_map={
                        "CRITICAL": "#D4A5E5",
                        "HIGH": "#E8C840",
                        "MODERATE": "#1B7A3D",
                        "LOW": "#1B7A3D",
                    },
                    height=340,
                )
                fig_bars.update_layout(
                    plot_bgcolor="#FFFFFF",
                    paper_bgcolor="#FFFFFF",
                    margin=dict(l=0, r=10, t=10, b=10),
                    showlegend=False,
                )
                fig_bars.update_xaxes(
                    showgrid=True,
                    gridcolor="#E5E5E0",
                    griddash="dot",
                    title="Proportional Reporting Ratio (PRR)",
                    tickfont=dict(family="Plus Jakarta Sans, sans-serif", size=11, color="#6B6B6B"),
                )
                fig_bars.update_yaxes(
                    title="",
                    showgrid=False,
                    tickfont=dict(family="Plus Jakarta Sans, sans-serif", size=12, color="#1A1A1A"),
                )
                st.plotly_chart(fig_bars, width="stretch")

            with c_chart2:
                st.markdown('<div class="section-eyebrow" style="margin-top: 16px;">Disproportionality Volcano Plot (PRR vs &chi;&sup2;)</div>', unsafe_allow_html=True)
                fig_volcano = px.scatter(
                    sig_df,
                    x="PRR",
                    y="χ²",
                    size="Cases",
                    color="Severity",
                    hover_name="Adverse Event",
                    color_discrete_map={
                        "CRITICAL": "#DC2626",
                        "HIGH": "#E8C840",
                        "MODERATE": "#D4A5E5",
                        "LOW": "#1B7A3D",
                    },
                    labels={"PRR": "Proportional Reporting Ratio (PRR)", "χ²": "Chi-Squared (χ²)"},
                    height=340,
                )
                fig_volcano.add_vline(x=2.0, line_dash="dot", line_color="#6B6B6B", annotation_text="Evans PRR ≥ 2.0")
                fig_volcano.update_xaxes(showgrid=True, gridcolor="#E5E5E0", griddash="dot")
                fig_volcano.update_yaxes(showgrid=True, gridcolor="#E5E5E0", griddash="dot")
                fig_volcano.update_layout(
                    plot_bgcolor="#FFFFFF",
                    paper_bgcolor="#FFFFFF",
                    margin=dict(l=10, r=10, t=10, b=10),
                    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1, title=""),
                )
                st.plotly_chart(fig_volcano, width="stretch")

            st.markdown('<div class="section-eyebrow" style="margin-top: 16px;">Contingency Signal Table</div>', unsafe_allow_html=True)
            cols_to_show = ["Adverse Event", "Severity", "PRR", "χ²", "Cases", "Signal Strength"]
            st.dataframe(sig_df[cols_to_show], hide_index=True, width="stretch")
        else:
            st.info("No pre-computed signals in local benchmark database for this combination.")

        if live_fda_check:
            st.markdown('<div class="section-eyebrow" style="margin-top: 24px;">Live openFDA Co-Occurrence Reports</div>', unsafe_allow_html=True)
            with st.spinner("Querying openFDA endpoint..."):
                fda_reactions = fda_client.get_combo_reactions(drug_tokens, limit=12)
                if fda_reactions:
                    st.dataframe(pd.DataFrame(fda_reactions), hide_index=True, width="stretch")
                else:
                    st.info("No co-reported reactions returned by openFDA.")
