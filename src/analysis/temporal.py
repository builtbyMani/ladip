"""Temporal correlation engine analyzing drug-symptom timelines, overlap windows, and dechallenge/rechallenge."""
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Dict, List, Optional, Tuple, Any

from src.patient.models import Medication, PatientProfile, Symptom


@dataclass
class TemporalAssociationResult:
    drug_name: str
    symptom_name: str
    days_to_onset: Optional[int]
    temporal_category: str  # ACUTE_ONSET, SUBACUTE_ONSET, CHRONIC_EXPOSURE, PRECEDING_SYMPTOM, STABLE_LONG_TERM
    temporal_score: float  # 0.0 to 1.0
    dechallenge_positive: Optional[bool]
    rechallenge_positive: Optional[bool]
    dose_response_signal: bool
    summary: str


@dataclass
class MultiDrugOverlapWindow:
    start_date: date
    end_date: Optional[date]
    active_drugs: List[str]
    trigger_drug: Optional[str]  # Drug added latest before symptom
    concurrent_symptoms: List[str]


class TemporalEngine:
    """Computes clinical temporal plausibility between patient drug regimens and adverse events."""

    @classmethod
    def evaluate_pair(cls, med: Medication, sym: Symptom) -> TemporalAssociationResult:
        """Compute Drug-Symptom Temporal Association Score (DTAS)."""
        if not med.start_date or not sym.onset_date:
            return TemporalAssociationResult(
                drug_name=med.drug_name,
                symptom_name=sym.description,
                days_to_onset=None,
                temporal_category="UNKNOWN_DATES",
                temporal_score=0.3,
                dechallenge_positive=None,
                rechallenge_positive=None,
                dose_response_signal=False,
                summary="Insufficient date information to evaluate temporal causality.",
            )

        days_to_onset = (sym.onset_date - med.start_date).days

        # Case 1: Symptom preceded drug
        if days_to_onset < 0:
            return TemporalAssociationResult(
                drug_name=med.drug_name,
                symptom_name=sym.description,
                days_to_onset=days_to_onset,
                temporal_category="PRECEDING_SYMPTOM",
                temporal_score=0.0,
                dechallenge_positive=False,
                rechallenge_positive=False,
                dose_response_signal=False,
                summary=f"Symptom occurred {abs(days_to_onset)} days BEFORE medication start date.",
            )

        # Case 2: Acute onset (1 to 14 days) - highest plausibility
        if 0 <= days_to_onset <= 14:
            category = "ACUTE_ONSET"
            score = 0.95
        elif 15 <= days_to_onset <= 45:
            category = "SUBACUTE_ONSET"
            score = 0.75
        elif 46 <= days_to_onset <= 180:
            category = "CHRONIC_EXPOSURE"
            score = 0.45
        else:
            category = "STABLE_LONG_TERM"
            score = 0.20

        # Dechallenge evaluation
        dechallenge = None
        if med.end_date and sym.resolution_date:
            days_to_res = (sym.resolution_date - med.end_date).days
            if 0 <= days_to_res <= 14:
                dechallenge = True
                score = min(1.0, score + 0.15)
            elif days_to_res < 0:
                dechallenge = False

        summary = (
            f"Symptom appeared {days_to_onset} days after starting {med.drug_name} ({category}). "
            + (f"Resolved upon discontinuation (Dechallenge positive)." if dechallenge else "")
        )

        return TemporalAssociationResult(
            drug_name=med.drug_name,
            symptom_name=sym.description,
            days_to_onset=days_to_onset,
            temporal_category=category,
            temporal_score=round(score, 2),
            dechallenge_positive=dechallenge,
            rechallenge_positive=None,
            dose_response_signal=False,
            summary=summary.strip(),
        )

    @classmethod
    def find_overlap_windows(cls, profile: PatientProfile) -> List[MultiDrugOverlapWindow]:
        """Identify timeline intervals where multiple medications were concurrently active."""
        if not profile.medications:
            return []

        # Collect critical transition dates
        dates = set()
        for m in profile.medications:
            if m.start_date:
                dates.add(m.start_date)
            if m.end_date:
                dates.add(m.end_date)
        for s in profile.symptoms:
            if s.onset_date:
                dates.add(s.onset_date)

        sorted_dates = sorted(list(dates))
        if not sorted_dates:
            return []

        windows: List[MultiDrugOverlapWindow] = []
        for i in range(len(sorted_dates)):
            w_start = sorted_dates[i]
            w_end = sorted_dates[i + 1] if (i + 1 < len(sorted_dates)) else None

            active_meds = [m for m in profile.medications if m.is_active_on(w_start)]
            if len(active_meds) >= 2:
                # Determine trigger drug (most recently started)
                active_meds_with_start = [m for m in active_meds if m.start_date]
                trigger_drug = (
                    max(active_meds_with_start, key=lambda m: m.start_date).normalized_name
                    if active_meds_with_start
                    else None
                )

                # Symptoms occurring in this window
                concurrent_syms = [
                    s.description
                    for s in profile.symptoms
                    if s.onset_date and (w_start <= s.onset_date and (not w_end or s.onset_date <= w_end))
                ]

                windows.append(
                    MultiDrugOverlapWindow(
                        start_date=w_start,
                        end_date=w_end,
                        active_drugs=sorted([m.normalized_name for m in active_meds]),
                        trigger_drug=trigger_drug,
                        concurrent_symptoms=concurrent_syms,
                    )
                )

        return windows
