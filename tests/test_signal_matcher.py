"""Unit tests for signal matching, clinical alert generation, and alert fatigue suppression."""
from datetime import date, timedelta
import pytest

from src.analysis.signal_matcher import SignalMatcher
from src.faers.bulk_loader import FAERSDatabase
from src.patient.memory import PatientStore
from src.patient.models import Medication, PatientProfile, Symptom


def test_signal_matcher_positive_control():
    store = PatientStore()
    db = FAERSDatabase()
    matcher = SignalMatcher(db=db)

    patient = store.get("PT_BLEED_001")
    assert patient is not None

    alerts = matcher.match_patient(patient)
    assert len(alerts) > 0

    # Top alert should be the Warfarin + Aspirin + Ibuprofen combination with GI Hemorrhage
    top_alert = alerts[0]
    assert "gastrointestinal hemorrhage" in top_alert.adverse_event.lower()
    assert top_alert.severity_tier == "CRITICAL"
    assert top_alert.patient_has_matching_symptom is True
    assert top_alert.is_suppressed is False
    assert top_alert.alert_priority_score >= 80.0


def test_alert_fatigue_suppression_on_stable_patient():
    store = PatientStore()
    db = FAERSDatabase()
    matcher = SignalMatcher(db=db)

    # Stable patient with Metformin, Lisinopril, Atorvastatin for 2 years without symptoms
    patient = store.get("PT_STABLE_004")
    assert patient is not None

    alerts = matcher.match_patient(patient)

    # If any signals are queried for this patient, non-critical/moderate signals must be suppressed
    for a in alerts:
        if not a.patient_has_matching_symptom and a.severity_tier != "CRITICAL":
            assert a.is_suppressed is True
            assert "Alert Fatigue Suppression" in a.suppression_reason or "Evans" in a.suppression_reason
