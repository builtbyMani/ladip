"""Signal matcher combining FAERS disproportionality, patient timelines, and alert fatigue suppression."""
from dataclasses import dataclass
from datetime import date
from itertools import combinations
from typing import Any, Dict, List, Optional, Tuple

from src.config import MAX_STABILITY_MONTHS_SUPPRESSION, MIN_CASE_COUNT, MIN_CHI2_THRESHOLD, MIN_PRR_THRESHOLD
from src.faers.bulk_loader import FAERSDatabase
from src.normalization.rxnorm import normalize_drug_name
from src.patient.models import Medication, PatientProfile, Symptom
from src.analysis.severity import SeverityTier, MedDRASeverityClassifier
from src.analysis.temporal import TemporalEngine


@dataclass
class ClinicalAlert:
    combo_drugs: List[str]
    combo_str: str
    combo_size: int
    adverse_event: str
    severity_tier: str  # CRITICAL, HIGH, MODERATE, LOW
    prr: float
    chi_squared: float
    case_count: int
    signal_strength: str
    patient_has_matching_symptom: bool
    matching_symptom_name: Optional[str]
    temporal_score: float  # 0.0 to 1.0
    is_suppressed: bool
    suppression_reason: Optional[str]
    alert_priority_score: float  # 0 to 100 composite ranking
    trigger_drug: Optional[str]
    clinical_rationale: str


class SignalMatcher:
    def __init__(self, db: Optional[FAERSDatabase] = None):
        self.db = db or FAERSDatabase()

    def match_patient(self, profile: PatientProfile, target_date: Optional[date] = None) -> List[ClinicalAlert]:
        """Scan patient active medications for FAERS multi-drug interaction signals and score clinical priority."""
        ref_date = target_date or date.today()
        active_meds = profile.get_active_medications(ref_date)
        if len(active_meds) < 2:
            return []

        # Get normalized names
        norm_to_med: Dict[str, Medication] = {}
        for m in active_meds:
            norm = m.normalized_name or normalize_drug_name(m.drug_name)["normalized"]
            norm_to_med[norm] = m

        active_norm_drugs = sorted(list(norm_to_med.keys()))
        patient_symptoms = [s for s in profile.symptoms if s.onset_date is None or s.onset_date <= ref_date]

        # Generate combos of size 2, 3, 4, 5
        alerts: List[ClinicalAlert] = []
        seen_pairs = set()

        for k in range(2, min(5, len(active_norm_drugs) + 1)):
            for combo in combinations(active_norm_drugs, k):
                signals = self.db.query_signals(list(combo))
                for sig in signals:
                    key = (tuple(combo), sig["adverse_event"])
                    if key in seen_pairs:
                        continue
                    seen_pairs.add(key)

                    alert = self._evaluate_signal_alert(
                        combo=list(combo),
                        sig=sig,
                        norm_to_med=norm_to_med,
                        patient_symptoms=patient_symptoms,
                        ref_date=ref_date,
                    )
                    alerts.append(alert)

        # Sort: Non-suppressed first, then by priority score descending
        alerts.sort(key=lambda a: (not a.is_suppressed, a.alert_priority_score), reverse=True)
        return alerts

    def _evaluate_signal_alert(
        self,
        combo: List[str],
        sig: Dict[str, Any],
        norm_to_med: Dict[str, Medication],
        patient_symptoms: List[Symptom],
        ref_date: date,
    ) -> ClinicalAlert:
        adverse_event = sig["adverse_event"].lower()
        prr = float(sig.get("prr", 0.0))
        chi2 = float(sig.get("chi_squared", 0.0))
        case_count = int(sig.get("case_count", 0))
        severity = sig.get("severity_tier", "MODERATE")

        # Determine combo duration (how long have ALL drugs in this combo been concurrently active)
        start_dates = [
            norm_to_med[d].start_date
            for d in combo
            if d in norm_to_med and norm_to_med[d].start_date
        ]
        latest_start = max(start_dates) if start_dates else ref_date
        months_stable = max(0.0, (ref_date - latest_start).days / 30.4375)

        # Trigger drug is the one started most recently
        trigger_norm = None
        trigger_drug = None
        if start_dates:
            for d in combo:
                if norm_to_med.get(d) and norm_to_med[d].start_date == latest_start:
                    trigger_norm = d
                    trigger_drug = norm_to_med[d].drug_name
                    break

        # Check if patient exhibits matching symptom
        matching_symptom: Optional[Symptom] = None
        for sym in patient_symptoms:
            s_term = sym.meddra_term.lower()
            if adverse_event in s_term or s_term in adverse_event:
                matching_symptom = sym
                break

        has_match = matching_symptom is not None

        # Temporal correlation score
        temporal_score = 0.3
        if matching_symptom and trigger_norm and trigger_norm in norm_to_med:
            t_res = TemporalEngine.evaluate_pair(norm_to_med[trigger_norm], matching_symptom)
            temporal_score = t_res.temporal_score

        # Alert Fatigue Suppression Rules
        is_suppressed = False
        suppression_reason = None

        # Rule 1: Evans' criteria not met AND patient has no symptoms
        if not (prr >= MIN_PRR_THRESHOLD and chi2 >= MIN_CHI2_THRESHOLD and case_count >= MIN_CASE_COUNT):
            if not has_match:
                is_suppressed = True
                suppression_reason = f"Evans' criteria not satisfied (PRR={prr:.1f} < 2.0 or Chi2={chi2:.1f} < 4.0) and patient is asymptomatic."

        # Rule 2: Patient has taken the exact combination stably for > 6 months with NO symptoms
        if not is_suppressed and not has_match and months_stable >= MAX_STABILITY_MONTHS_SUPPRESSION:
            # If not critical, suppress to avoid clinician alert fatigue
            if severity != SeverityTier.CRITICAL:
                is_suppressed = True
                suppression_reason = (
                    f"Alert Fatigue Suppression: Patient has tolerated combo stably for {months_stable:.1f} months "
                    f"without reported {adverse_event}."
                )

        # Priority score (0-100)
        # Severity weights: CRITICAL=40, HIGH=25, MODERATE=15, LOW=5
        sev_weight = {"CRITICAL": 40, "HIGH": 25, "MODERATE": 15, "LOW": 5}.get(severity, 10)
        # Signal statistical weight (up to 30)
        stat_weight = min(30.0, (prr * 3.0) + min(15.0, chi2 / 5.0))
        # Temporal weight (up to 30)
        temp_weight = 30.0 * temporal_score if has_match else (10.0 if not is_suppressed else 0.0)

        priority_score = round(min(100.0, sev_weight + stat_weight + temp_weight), 1)

        # Clinical rationale summary
        combo_display = " + ".join([norm_to_med[d].drug_name for d in combo if d in norm_to_med])
        rationale = (
            f"FAERS reports {case_count} cases of {adverse_event.title()} for [{combo_display}] "
            f"(PRR={prr:.1f}, χ²={chi2:.1f}). "
        )
        if has_match:
            rationale += f"ACTIVE PATIENT SYMPTOM DETECTED: {matching_symptom.description} (Temporal Match: {temporal_score:.2f})."
        elif is_suppressed:
            rationale += f"Suppressed: {suppression_reason}"

        return ClinicalAlert(
            combo_drugs=combo,
            combo_str=combo_display,
            combo_size=len(combo),
            adverse_event=adverse_event.title(),
            severity_tier=severity,
            prr=prr,
            chi_squared=chi2,
            case_count=case_count,
            signal_strength=sig.get("signal_strength", "MODERATE"),
            patient_has_matching_symptom=has_match,
            matching_symptom_name=matching_symptom.description if matching_symptom else None,
            temporal_score=temporal_score,
            is_suppressed=is_suppressed,
            suppression_reason=suppression_reason,
            alert_priority_score=priority_score,
            trigger_drug=trigger_drug,
            clinical_rationale=rationale,
        )
