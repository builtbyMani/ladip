"""Longitudinal Adverse Drug Interaction Predictor (LADIP)
Clinical Decision Support System - Hackathon Showcase Edition
"""
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from src.analysis.disproportionality import DisproportionalityEngine
from src.analysis.naranjo import NaranjoAlgorithm
from src.analysis.severity import MedDRASeverityClassifier, SeverityTier
from src.analysis.signal_matcher import SignalMatcher
from src.analysis.temporal import TemporalEngine
from src.config import DB_PATH
from src.explanations.pharmacology import PharmacologyExplainer
from src.faers.bulk_loader import FAERSDatabase
from src.faers.client import OpenFDAClient
from src.normalization.rxnorm import normalize_drug_name
from src.patient.memory import PatientStore
from src.patient.models import Medication, PatientProfile, Symptom
from src.patient.report_parser import MedicalReportParser
from src.safety.drug_checker import DrugSafetyChecker

st.set_page_config(
    page_title="LADIP | Temporal Pharmacovigilance CDS",
    page_icon="💊",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Impeccable Design: High-Agency Clinical CSS
st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    code, pre, .mono-val {
        font-family: 'JetBrains Mono', monospace !important;
    }

    /* Top Clinical Header */
    .clinical-header {
        background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 24px 28px;
        color: #F8FAFC;
        margin-bottom: 24px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
    }
    .clinical-title {
        font-size: 1.85rem;
        font-weight: 800;
        letter-spacing: -0.025em;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .clinical-tagline {
        font-size: 0.95rem;
        color: #94A3B8;
        margin-top: 6px;
        margin-bottom: 0;
    }
    .hackathon-badge {
        display: inline-block;
        background: #0284C7;
        color: #FFFFFF;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 3px 8px;
        border-radius: 9999px;
        margin-left: 8px;
        vertical-align: middle;
    }

    /* Patient Banner */
    .patient-card {
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 10px;
        padding: 18px 22px;
        margin-bottom: 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    /* Severity Tiers */
    .badge-critical {
        background-color: #FEF2F2;
        color: #DC2626;
        border: 1px solid #FECACA;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 0.8rem;
        letter-spacing: 0.03em;
    }
    .badge-high {
        background-color: #FFF7ED;
        color: #EA580C;
        border: 1px solid #FFEDD5;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 0.8rem;
        letter-spacing: 0.03em;
    }
    .badge-moderate {
        background-color: #FFFBEB;
        color: #D97706;
        border: 1px solid #FDE68A;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 0.8rem;
        letter-spacing: 0.03em;
    }
    .badge-low {
        background-color: #F0FDF4;
        color: #16A34A;
        border: 1px solid #BBF7D0;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 0.8rem;
        letter-spacing: 0.03em;
    }

    /* Metric stat callouts */
    .metric-bubble {
        background: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        padding: 12px 16px;
        text-align: left;
    }
    .metric-bubble-label {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        color: #64748B;
        letter-spacing: 0.05em;
    }
    .metric-bubble-val {
        font-size: 1.3rem;
        font-weight: 800;
        color: #0F172A;
        margin-top: 2px;
        font-family: 'JetBrains Mono', monospace;
    }

    /* Suppressed Alert box */
    .suppressed-alert {
        background-color: #F8FAFC;
        border-left: 4px solid #94A3B8;
        border-top: 1px solid #E2E8F0;
        border-right: 1px solid #E2E8F0;
        border-bottom: 1px solid #E2E8F0;
        border-radius: 6px;
        padding: 12px 16px;
        margin-bottom: 10px;
        opacity: 0.85;
    }

    /* Drug tags */
    .drug-tag {
        display: inline-block;
        background: #F1F5F9;
        color: #334155;
        border: 1px solid #CBD5E1;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 600;
        margin-right: 4px;
    }
    .symptom-tag {
        display: inline-block;
        background: #FEE2E2;
        color: #991B1B;
        border: 1px solid #FCA5A5;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 600;
        margin-right: 4px;
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
    st.markdown("### 💊 LADIP System")
    st.caption("Temporal Pharmacovigilance & Multi-Drug Interaction Predictor")

    menu = st.radio(
        "Navigation",
        [
            "Multi-Drug Interaction Discovery",
            "Prospective Drug Safety Check",
            "Patient Profile & Report Parser",
            "FAERS Disproportionality Explorer",
        ],
        index=0,
    )

    st.markdown("---")
    st.markdown("#### 🇮🇳 Hackathon Patient Cohort")

    all_patients = store.list_all()
    if not all_patients:
        st.warning("No patients loaded. Regenerate using the button below.")
        if st.button("Generate Demo Patients"):
            from scripts.generate_synthetic_patients import generate_profiles
            generate_profiles()
            st.rerun()
        st.stop()

    # Pre-select based on clinical demo scenario
    patient_map = {p.patient_id: p for p in all_patients}
    scenario_names = {
        "PT_BLEED_001": "🚨 Ramesh Sharma (Warfarin + Aspirin + Ibuprofen)",
        "PT_STATIN_002": "🚨 Sunita Patel (Simvastatin + Amlodipine + Amiodarone)",
        "PT_MTX_003": "🚨 Kavitha Reddy (Methotrexate + Bactrim + Naproxen)",
        "PT_CARDIO_005": "⚠️ Arjun Nair (Clopidogrel + Omeprazole)",
        "PT_STABLE_004": "🛡️ Rajesh Varma (Stable 2yr Cohort - Anti-Fatigue Demo)",
    }

    selected_pid = st.selectbox(
        "Select Demo Patient Case",
        options=list(patient_map.keys()),
        format_func=lambda pid: scenario_names.get(pid, f"{patient_map[pid].name} ({pid})"),
    )
    patient = patient_map[selected_pid]

    st.markdown("---")
    st.caption("⚡ **Hackathon Tip:** Switch to **Rajesh Varma** to demonstrate how the **Alert Fatigue Engine** suppresses false alarms for patients on long-term stable therapy.")


# ==============================================================================
# HEADER BANNER
# ==============================================================================
st.markdown(
    """
    <div class="clinical-header">
        <div class="clinical-title">
            <span>🛡️ LADIP: Longitudinal Adverse Drug Interaction Predictor</span>
            <span class="hackathon-badge">Hackathon Edition</span>
        </div>
        <div class="clinical-tagline">
            Next-Generation Temporal Pharmacovigilance System Solving <b>Alert Fatigue</b> via FAERS Disproportionality Mining, MedDRA Severity Tiering, and Longitudinal Causality Scoring.
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)


# ==============================================================================
# WORKFLOW 1: MULTI-DRUG INTERACTION DISCOVERY
# ==============================================================================
if menu == "Multi-Drug Interaction Discovery":
    # Patient Summary Bar
    with st.container(border=True):
        c1, c2, c3, c4 = st.columns([3, 2, 2, 2])
        with c1:
            st.markdown(f"### {patient.name or patient.patient_id}")
            st.caption(f"MRN: `{patient.patient_id}` | Age: **{patient.age}y** | Sex: **{patient.sex}** | Weight: **{patient.weight} kg**")
        with c2:
            st.markdown("**Active Conditions:**")
            for cond in patient.conditions[:2]:
                st.markdown(f"• {cond}")
            if len(patient.conditions) > 2:
                st.caption(f"+{len(patient.conditions) - 2} more")
        with c3:
            st.markdown("**Documented Allergies:**")
            if patient.allergies:
                for al in patient.allergies:
                    st.error(f"⚠️ {al}", icon="🚫")
            else:
                st.success("No Known Drug Allergies (NKDA)", icon="✅")
        with c4:
            st.markdown("**Regimen Size:**")
            st.markdown(f"**{len(patient.get_active_medications())} Active Medications**")
            st.caption(f"{len(patient.symptoms)} Active Symptoms Logged")

    st.markdown("#### 📅 Longitudinal Regimen & Symptom Chronology")

    # Plotly Timeline Gantt Chart
    timeline_rows = []
    ref_today = date.today()

    for m in patient.medications:
        s_date = m.start_date or (ref_today - timedelta(days=90))
        e_date = m.end_date or ref_today
        timeline_rows.append({
            "Track": "Medications",
            "Item": m.drug_name,
            "Start": s_date.isoformat(),
            "End": e_date.isoformat(),
            "Color": "#1E40AF",
            "Dose": f"{m.dose} {m.dose_unit} {m.frequency}",
        })

    for s in patient.symptoms:
        if s.onset_date:
            res_date = s.resolution_date or ref_today
            timeline_rows.append({
                "Track": "Adverse Events",
                "Item": f"⚠️ {s.description}",
                "Start": s.onset_date.isoformat(),
                "End": res_date.isoformat(),
                "Color": "#DC2626",
                "Dose": f"Severity {s.severity}/10",
            })

    if timeline_rows:
        with st.container(border=True):
            df_timeline = pd.DataFrame(timeline_rows)
            fig = px.timeline(
                df_timeline,
                x_start="Start",
                x_end="End",
                y="Item",
                color="Track",
                hover_data=["Dose"],
                color_discrete_map={"Medications": "#3B82F6", "Adverse Events": "#EF4444"},
                height=260,
            )
            fig.update_yaxes(
                autorange="reversed",
                title="",
                showgrid=True,
                gridcolor="rgba(148, 163, 184, 0.2)",
                tickfont=dict(size=13, family="Plus Jakarta Sans, sans-serif"),
            )
            fig.update_xaxes(
                title=dict(text="Longitudinal Timeline", font=dict(size=12)),
                showgrid=True,
                gridcolor="rgba(148, 163, 184, 0.2)",
                tickfont=dict(size=11),
            )
            fig.update_layout(
                margin=dict(l=10, r=10, t=10, b=10),
                legend=dict(
                    orientation="h",
                    yanchor="bottom",
                    y=1.05,
                    xanchor="right",
                    x=1,
                    font=dict(size=12),
                ),
                plot_bgcolor="rgba(0,0,0,0)",
                paper_bgcolor="rgba(0,0,0,0)",
            )
            st.plotly_chart(fig)

    st.markdown("---")

    # Alert Fatigue Filter Bar
    col_hdr, col_ctrl1, col_ctrl2 = st.columns([4, 2, 2])
    with col_hdr:
        st.markdown("### 🚨 Prioritized Pharmacovigilance Alerts")
        st.caption("Signals sorted by severity, multi-drug synergy, and temporal proximity to symptoms.")
    with col_ctrl1:
        show_suppressed = st.toggle("Show Suppressed Alerts (Anti-Fatigue)", value=False)
    with col_ctrl2:
        tier_choice = st.selectbox("Filter Tier", ["ALL", "CRITICAL", "HIGH", "MODERATE", "LOW"])

    alerts = matcher.match_patient(patient)
    active_alerts = [a for a in alerts if not a.is_suppressed]
    suppressed_alerts = [a for a in alerts if a.is_suppressed]

    # Metrics ribbon
    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.markdown(
            f"""
            <div class="metric-bubble">
                <div class="metric-bubble-label">Actionable Alerts</div>
                <div class="metric-bubble-val">{len(active_alerts)}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with m2:
        st.markdown(
            f"""
            <div class="metric-bubble">
                <div class="metric-bubble-label">Suppressed Alerts</div>
                <div class="metric-bubble-val" style="color: #64748B;">{len(suppressed_alerts)} <span style="font-size:0.8rem; font-weight:500;">(Anti-Fatigue)</span></div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with m3:
        crit_count = sum(1 for a in active_alerts if a.severity_tier == "CRITICAL")
        st.markdown(
            f"""
            <div class="metric-bubble">
                <div class="metric-bubble-label">Critical / Life-Threatening</div>
                <div class="metric-bubble-val" style="color: {'#DC2626' if crit_count > 0 else '#16A34A'};">{crit_count}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with m4:
        symptom_matched = sum(1 for a in active_alerts if a.patient_has_matching_symptom)
        st.markdown(
            f"""
            <div class="metric-bubble">
                <div class="metric-bubble-label">Symptom Correlated</div>
                <div class="metric-bubble-val" style="color: #0284C7;">{symptom_matched}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<div style='height: 16px;'></div>", unsafe_allow_html=True)

    if not active_alerts:
        with st.container(border=True):
            st.success(
                f"🛡️ **No Uncontrolled Clinical Risks Detected for {patient.name}.** "
                f"Any low-grade theoretical interactions have been suppressed because this patient has tolerated their regimen stably for >6 months without symptoms.",
                icon="✅",
            )
    else:
        for alert in active_alerts:
            if tier_choice != "ALL" and alert.severity_tier != tier_choice:
                continue

            tier_badge = f"badge-{alert.severity_tier.lower()}"
            with st.container(border=True):
                # Alert Header
                h_col1, h_col2 = st.columns([5, 2])
                with h_col1:
                    st.markdown(
                        f"""
                        <div style="font-size: 1.2rem; font-weight: 800; color: #0F172A; display: flex; align-items: center; gap: 8px;">
                            <span>⚠️ {alert.combo_str}</span>
                            <span style="color: #64748B; font-weight: 500;">➔</span>
                            <span style="color: #DC2626;">{alert.adverse_event}</span>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )
                with h_col2:
                    st.markdown(
                        f"""
                        <div style="text-align: right;">
                            <span class="{tier_badge}">{alert.severity_tier}</span>
                            <span style="background: #0F172A; color: white; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; font-family: monospace; margin-left: 6px;">Score: {alert.alert_priority_score:.0f}/100</span>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )

                st.markdown("<div style='height: 8px;'></div>", unsafe_allow_html=True)

                # Key Evidence Metrics
                col_e1, col_e2, col_e3, col_e4 = st.columns(4)
                with col_e1:
                    st.markdown(f"**PRR (Ratio):** `{alert.prr:.2f}x`")
                    st.caption("Proportional Reporting Ratio")
                with col_e2:
                    st.markdown(f"**χ² Statistic:** `{alert.chi_squared:.1f}`")
                    st.caption("Evans' Threshold: χ² ≥ 4.0")
                with col_e3:
                    st.markdown(f"**FAERS Cases:** `{alert.case_count:,}`")
                    st.caption(f"Signal: **{alert.signal_strength}**")
                with col_e4:
                    if alert.patient_has_matching_symptom:
                        st.markdown(f"**Patient Symptom:** 🔴 `{alert.matching_symptom_name}`")
                        st.caption(f"Temporal Match: **{alert.temporal_score:.2f}**")
                    else:
                        st.markdown("**Patient Symptom:** 🟢 Asymptomatic")
                        st.caption("Prospective Surveillance")

                st.markdown(f"**Clinical Context:** {alert.clinical_rationale}")

                # Detailed Pharmacological & Causality Drilldown
                with st.expander("🔬 Pharmacological Mechanism & Naranjo Causality Assessment", expanded=alert.patient_has_matching_symptom):
                    expl = explainer.explain(alert.combo_drugs, alert.adverse_event, alert.prr, alert.case_count)

                    st.markdown("##### 🧬 Physiological Mechanism")
                    st.info(expl["mechanism"], icon="ℹ️")

                    st.markdown("##### 🩺 Actionable Clinical Recommendation")
                    st.warning(expl["recommendation"], icon="👨‍⚕️")

                    # If patient has matching symptom, render Naranjo causality scorecard
                    if alert.patient_has_matching_symptom and alert.trigger_drug:
                        matching_med = next((m for m in patient.medications if m.drug_name == alert.trigger_drug), patient.medications[0])
                        matching_sym = next((s for s in patient.symptoms if alert.adverse_event.lower() in s.meddra_term.lower() or s.meddra_term.lower() in alert.adverse_event.lower()), patient.symptoms[0])
                        naranjo_res = NaranjoAlgorithm.evaluate(matching_med, matching_sym, patient)

                        st.markdown("---")
                        col_nar1, col_nar2 = st.columns([3, 1])
                        with col_nar1:
                            st.markdown(f"##### Naranjo ADR Causality: **{naranjo_res.probability_category}** ({naranjo_res.total_score}/13 Points)")
                            st.caption(naranjo_res.summary)
                        with col_nar2:
                            st.markdown(
                                f"""
                                <div style="background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 6px; padding: 8px; text-align: center;">
                                    <div style="font-size: 0.75rem; color: #64748B; font-weight: 600;">TRIGGER DRUG</div>
                                    <div style="font-size: 0.95rem; color: #0F172A; font-weight: 700;">{alert.trigger_drug}</div>
                                </div>
                                """,
                                unsafe_allow_html=True,
                            )

                        # Formatted Naranjo Table
                        q_data = [
                            {"#": q.id, "Standard Question": q.text, "Response": q.user_choice, "Score": q.score, "Rationale": q.explanation}
                            for q in naranjo_res.questions
                        ]
                        st.dataframe(pd.DataFrame(q_data), hide_index=True)

    # Render Suppressed Alerts if toggled
    if show_suppressed and suppressed_alerts:
        st.markdown("#### 🛡️ Suppressed Interactions (Filtered to Prevent Alert Fatigue)")
        for s_alert in suppressed_alerts:
            st.markdown(
                f"""
                <div class="suppressed-alert">
                    <span style="font-weight: 700; color: #475569;">[SUPPRESSED] {s_alert.combo_str} ➔ {s_alert.adverse_event} ({s_alert.severity_tier})</span><br/>
                    <span style="font-size: 0.85rem; color: #64748B;">Rationale: {s_alert.suppression_reason}</span>
                </div>
                """,
                unsafe_allow_html=True,
            )


# ==============================================================================
# WORKFLOW 2: PROSPECTIVE DRUG SAFETY CHECK ("ADD A NEW DRUG")
# ==============================================================================
elif menu == "Prospective Drug Safety Check":
    st.markdown("### ⚡ Prospective Drug Addition Safety Simulator")
    st.caption("Simulate prescribing a new drug to the patient's existing regimen. Evaluates allergy cross-reactivity, organ vulnerabilities, and multi-drug interaction explosions in real time.")

    with st.container(border=True):
        st.markdown(f"**Patient:** {patient.name} (`{patient.patient_id}`) | Age: **{patient.age}y** | Weight: **{patient.weight} kg**")
        st.markdown("**Current Active Regimen:** " + " • ".join([f"`{m.drug_name}` ({m.dose} {m.dose_unit})" for m in patient.get_active_medications()]))

    with st.form("prospective_check_form"):
        st.markdown("##### ➕ Propose New Medication Addition")
        col_in1, col_in2, col_in3 = st.columns([3, 2, 2])
        with col_in1:
            proposed_drug = st.text_input("Proposed Drug Name", value="Ibuprofen", placeholder="e.g. Ibuprofen, Amiodarone, Bactrim, Ciprofloxacin, Naproxen")
        with col_in2:
            proposed_dose = st.number_input("Dose", value=400.0, step=50.0)
        with col_in3:
            proposed_unit = st.selectbox("Unit", ["mg", "mcg", "g", "ml"])

        submit_check = st.form_submit_button("🔍 Run Prospective Risk Simulation", type="primary")

    if proposed_drug.strip():
        assessment = checker.assess_new_drug(patient, proposed_drug.strip(), dose=proposed_dose, dose_unit=proposed_unit)

        status_headers = {
            "CRITICAL_CONTRAINDICATION": ("🔴 CONTRAINDICATED: LETHAL OR CRITICAL RISK", "#DC2626", "#FEF2F2"),
            "HIGH_RISK": ("🟠 HIGH RISK: CLINICALLY SIGNIFICANT INTERACTION", "#EA580C", "#FFF7ED"),
            "MODERATE_RISK": ("🟡 MODERATE RISK: CLINICAL CAUTION REQUIRED", "#D97706", "#FFFBEB"),
            "LOW_RISK_COMPATIBLE": ("🟢 COMPATIBLE: NO HIGH-CONFIDENCE DISPROPORTIONALITY", "#16A34A", "#F0FDF4"),
        }
        title, color, bg = status_headers.get(assessment.overall_safety_status, ("ASSESSMENT", "#0F172A", "#F8FAFC"))

        st.markdown(
            f"""
            <div style="background-color: {bg}; border: 2px solid {color}; border-radius: 8px; padding: 20px; margin-top: 20px; margin-bottom: 20px;">
                <h3 style="color: {color}; margin: 0 0 8px 0; font-size: 1.3rem;">{title}</h3>
                <p style="font-size: 1.05rem; font-weight: 600; color: #0F172A; margin: 0;">{assessment.recommendation}</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        col_l, col_r = st.columns(2)

        with col_l:
            with st.container(border=True):
                st.markdown("#### 🚫 Allergy & Cross-Reactivity Screening")
                if assessment.allergy_flags:
                    for a_flag in assessment.allergy_flags:
                        st.error(a_flag, icon="🚨")
                else:
                    st.success("No direct allergy or class cross-reactivity detected with patient allergy profile.", icon="✅")

                st.markdown("---")
                st.markdown("#### 🩺 Patient Organ Vulnerabilities")
                if assessment.vulnerability_flags:
                    for v_flag in assessment.vulnerability_flags:
                        st.warning(v_flag, icon="⚠️")
                else:
                    st.info("No specific geriatric or organ-clearance vulnerability flags triggered.", icon="ℹ️")

        with col_r:
            with st.container(border=True):
                st.markdown("#### 💥 Multi-Drug FAERS Interaction Signals Formed")
                if assessment.flagged_combinations:
                    for c_info in assessment.flagged_combinations:
                        badge = f"badge-{c_info['tier'].lower()}"
                        st.markdown(
                            f"""
                            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-weight: 700; color: #0F172A;">{c_info['combo']}</span>
                                    <span class="{badge}">{c_info['tier']}</span>
                                </div>
                                <div style="font-size: 0.85rem; color: #475569; margin-top: 4px;">
                                    Adverse Event: <b style="color: #DC2626;">{c_info['reaction'].title()}</b> | PRR: <b class="mono-val">{c_info['prr']:.1f}x</b> | χ²: <b class="mono-val">{c_info['chi2']:.1f}</b> ({c_info['cases']} cases)
                                </div>
                            </div>
                            """,
                            unsafe_allow_html=True,
                        )
                else:
                    st.success("No high-disproportionality signals generated with current regimen.", icon="✅")


# ==============================================================================
# WORKFLOW 3: PATIENT PROFILE & REPORT PARSER
# ==============================================================================
elif menu == "Patient Profile & Report Parser":
    st.markdown("### 👤 Patient Clinical Profile & Automated Report Ingestion")
    st.caption("Inspect longitudinal medical records or upload unstructured clinical reports (PDF / Scanned Image / Discharge Summary) for automated timeline parsing.")

    tab_inspect, tab_upload = st.tabs(["📋 Active Patient Electronic Health Record", "📄 Ingest New Medical Report (PDF / Image / OCR)"])

    with tab_inspect:
        with st.container(border=True):
            col_p1, col_p2, col_p3, col_p4 = st.columns(4)
            col_p1.metric("Patient Name", patient.name)
            col_p2.metric("MRN / ID", patient.patient_id)
            col_p3.metric("Age / Sex", f"{patient.age}y / {patient.sex}")
            col_p4.metric("Weight", f"{patient.weight} kg")

        col_left_ehr, col_right_ehr = st.columns(2)

        with col_left_ehr:
            with st.container(border=True):
                st.markdown("#### 🩺 Diagnosed Clinical Conditions")
                for c in patient.conditions:
                    st.markdown(f"- **{c}**")

                st.markdown("---")
                st.markdown("#### 🏷️ Documented Drug Allergies")
                if patient.allergies:
                    for a in patient.allergies:
                        st.error(f"Allergic: {a}", icon="🚫")
                else:
                    st.info("No known drug allergies (NKDA).")

        with col_right_ehr:
            with st.container(border=True):
                st.markdown("#### 🧪 Key Diagnostic & Lab Markers")
                if patient.lab_results:
                    st.dataframe(pd.DataFrame(patient.lab_results), hide_index=True)
                else:
                    st.caption("No lab tests recorded.")

        st.markdown("#### 💊 Active & Historical Medications")
        med_records = []
        for m in patient.medications:
            med_records.append({
                "Drug Name": m.drug_name,
                "Generic Ingredient": m.normalized_name,
                "RxCUI": m.rxcui,
                "Dosing Regimen": f"{m.dose} {m.dose_unit} {m.frequency}",
                "Route": m.route,
                "Start Date": m.start_date.isoformat() if m.start_date else "Unknown",
                "End Date": m.end_date.isoformat() if m.end_date else "Active",
            })
        st.dataframe(pd.DataFrame(med_records), hide_index=True)

        st.markdown("#### ⚠️ Documented Adverse Reactions & Symptoms")
        sym_records = []
        for s in patient.symptoms:
            sym_records.append({
                "Symptom Description": s.description,
                "MedDRA Preferred Term": s.meddra_term,
                "Severity Score (1-10)": s.severity,
                "Onset Date": s.onset_date.isoformat() if s.onset_date else "Unknown",
                "Resolution Date": s.resolution_date.isoformat() if s.resolution_date else "Ongoing",
            })
        st.dataframe(pd.DataFrame(sym_records), hide_index=True)

    with tab_upload:
        with st.container(border=True):
            st.markdown("##### Upload Clinical Discharge Summary, Prescription, or Scanned Chart")
            up_file = st.file_uploader("Upload Document", type=["pdf", "png", "jpg", "jpeg", "txt"])
            txt_in = st.text_area("Or paste clinical text notes:", height=140, placeholder="e.g. 68yo male with Atrial Fibrillation admitted for acute GI bleed 3 days after initiating Ibuprofen...")

            if st.button("🚀 Process & Ingest Clinical Record", type="primary"):
                if up_file:
                    ext = up_file.name.split(".")[-1].lower()
                    b_content = up_file.read()
                    f_type = "pdf" if ext == "pdf" else ("image" if ext in ["png", "jpg", "jpeg"] else "text")
                    new_profile = parser.parse_report(b_content, file_type=f_type)
                elif txt_in.strip():
                    new_profile = parser.parse_report(txt_in, file_type="text")
                else:
                    st.warning("Please upload a file or paste clinical text.")
                    new_profile = None

                if new_profile:
                    store.save(new_profile)
                    st.success(f"Successfully extracted timeline for patient: {new_profile.patient_id} ({new_profile.name})")
                    st.json(new_profile.to_dict())
                    st.rerun()


# ==============================================================================
# WORKFLOW 4: FAERS DISPROPORTIONALITY EXPLORER
# ==============================================================================
elif menu == "FAERS Disproportionality Explorer":
    st.markdown("### 🔍 FAERS Disproportionality Signal Explorer")
    st.caption("Directly query multi-drug combinations against the FDA Adverse Event Reporting System database (25M+ reports) and inspect quantitative PRR, ROR, and Chi-Squared distributions.")

    col_q1, col_q2 = st.columns([3, 1])
    with col_q1:
        query_str = st.text_input("Enter Drug Combination (comma-separated)", value="Warfarin, Aspirin, Ibuprofen")
    with col_q2:
        live_fda_check = st.checkbox("Live openFDA Query", value=False)

    if query_str.strip():
        drug_tokens = [d.strip() for d in query_str.split(",") if d.strip()]
        st.markdown(f"#### Signal Results for: **{' + '.join([d.title() for d in drug_tokens])}**")

        local_sigs = db.query_signals(drug_tokens)

        if local_sigs:
            sig_df = pd.DataFrame(local_sigs)
            sig_df["PRR"] = sig_df["prr"].round(2)
            sig_df["χ²"] = sig_df["chi_squared"].round(1)
            sig_df["Cases"] = sig_df["case_count"]
            sig_df["Adverse Event"] = sig_df["adverse_event"].str.title()
            sig_df["Severity"] = sig_df["severity_tier"]
            sig_df["Signal Strength"] = sig_df["signal_strength"]

            cols_to_show = ["Adverse Event", "Severity", "PRR", "χ²", "Cases", "Signal Strength"]
            st.dataframe(sig_df[cols_to_show], hide_index=True)

            # Interactive Volcano Bubble Plot
            st.markdown("##### 🌋 Disproportionality Volcano Plot (PRR vs χ²)")
            fig_volcano = px.scatter(
                sig_df,
                x="PRR",
                y="χ²",
                size="Cases",
                color="Severity",
                hover_name="Adverse Event",
                color_discrete_map={"CRITICAL": "#DC2626", "HIGH": "#EA580C", "MODERATE": "#D97706", "LOW": "#16A34A"},
                labels={"PRR": "Proportional Reporting Ratio (PRR)", "χ²": "Chi-Squared (χ²)"},
                height=380,
            )
            fig_volcano.add_vline(x=2.0, line_dash="dash", line_color="#94A3B8", annotation_text="Evans' PRR ≥ 2.0")
            fig_volcano.update_xaxes(showgrid=True, gridcolor="rgba(148, 163, 184, 0.2)")
            fig_volcano.update_yaxes(showgrid=True, gridcolor="rgba(148, 163, 184, 0.2)")
            fig_volcano.update_layout(
                plot_bgcolor="rgba(0,0,0,0)",
                paper_bgcolor="rgba(0,0,0,0)",
                margin=dict(l=20, r=20, t=20, b=20),
            )
            with st.container(border=True):
                st.plotly_chart(fig_volcano)
        else:
            st.info("No exact pre-computed signals in local SQLite database for this combination.")

        if live_fda_check:
            st.markdown("##### 🌐 Live openFDA Co-Occurrence Reactions")
            with st.spinner("Connecting to openFDA API..."):
                fda_reactions = fda_client.get_combo_reactions(drug_tokens, limit=12)
                if fda_reactions:
                    st.dataframe(pd.DataFrame(fda_reactions), hide_index=True)
                else:
                    st.info("No co-reported reactions returned by openFDA.")
