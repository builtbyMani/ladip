"""Unit tests for temporal correlation engine and Naranjo causality scoring."""
from datetime import date, timedelta
import pytest

from src.analysis.temporal import TemporalEngine
from src.analysis.naranjo import NaranjoAlgorithm
from src.patient.models import Medication, PatientProfile, Symptom


def test_dtas_acute_onset():
    today = date.today()
    med = Medication(
        drug_name="Ibuprofen",
        start_date=today - timedelta(days=6),
    )
    sym = Symptom(
        description="Gastrointestinal Bleeding",
        onset_date=today - timedelta(days=2),
    )

    result = TemporalEngine.evaluate_pair(med, sym)

    assert result.temporal_category == "ACUTE_ONSET"
    assert result.days_to_onset == 4
    assert result.temporal_score >= 0.9


def test_dtas_preceding_symptom():
    today = date.today()
    med = Medication(
        drug_name="Amiodarone",
        start_date=today - timedelta(days=5),
    )
    sym = Symptom(
        description="Muscle Pain",
        onset_date=today - timedelta(days=20),  # Symptom existed 15 days before drug!
    )

    result = TemporalEngine.evaluate_pair(med, sym)

    assert result.temporal_category == "PRECEDING_SYMPTOM"
    assert result.temporal_score == 0.0
    assert result.days_to_onset == -15


def test_dechallenge_positive():
    today = date.today()
    med = Medication(
        drug_name="Simvastatin",
        start_date=today - timedelta(days=60),
        end_date=today - timedelta(days=10),
    )
    sym = Symptom(
        description="Myopathy",
        onset_date=today - timedelta(days=40),
        resolution_date=today - timedelta(days=5),  # Resolved 5 days after stopping
    )

    result = TemporalEngine.evaluate_pair(med, sym)

    assert result.dechallenge_positive is True


def test_naranjo_scoring_definite_and_probable():
    today = date.today()
    med = Medication(
        drug_name="Warfarin",
        normalized_name="warfarin",
        start_date=today - timedelta(days=30),
        end_date=today - timedelta(days=10),
    )
    sym = Symptom(
        description="Hemorrhage",
        onset_date=today - timedelta(days=20),
        resolution_date=today - timedelta(days=8),
    )

    # With positive rechallenge and objective lab evidence
    definite_res = NaranjoAlgorithm.evaluate(
        medication=med,
        symptom=sym,
        has_literature_reports=True,
        objective_evidence=True,
        alternative_causes=False,
        user_overrides={4: "Yes"},  # Rechallenge positive (+2)
    )

    assert definite_res.total_score >= 8
    assert definite_res.probability_category in ["Definite", "Probable"]
