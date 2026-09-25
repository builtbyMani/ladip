"""Automated test suite for LADIP FastAPI REST endpoints."""
import pytest
from fastapi.testclient import TestClient
from src.api import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "faers_database" in data


def test_list_patients():
    res = client.get("/api/v1/patients")
    assert res.status_code == 200
    data = res.json()
    assert "patients" in data
    assert len(data["patients"]) >= 5
    # Verify Indian patient names are present
    p_ids = [p["patient_id"] for p in data["patients"]]
    assert "PT_BLEED_001" in p_ids
    assert "PT_STATIN_002" in p_ids
    assert "PT_MTX_003" in p_ids
    assert "PT_STABLE_004" in p_ids
    assert "PT_CARDIO_005" in p_ids


def test_patient_schedule():
    res = client.get("/api/v1/patients/PT_BLEED_001/schedule")
    assert res.status_code == 200
    data = res.json()
    assert "slots" in data
    assert "morning" in data["slots"]
    assert "evening" in data["slots"]


def test_patient_alerts():
    res = client.get("/api/v1/patients/PT_BLEED_001/alerts")
    assert res.status_code == 200
    data = res.json()
    assert data["active_alerts_count"] > 0
    # Ramesh Sharma has critical Warfarin + Aspirin + Ibuprofen alert
    top_alert = data["alerts"][0]
    assert top_alert["severity_tier"] in ["CRITICAL", "HIGH"]
    assert "Hemorrhage" in top_alert["adverse_event"] or "hemorrhage" in top_alert["adverse_event"].lower()


def test_prospective_drug_check():
    # Ramesh Sharma on Warfarin: Adding Ibuprofen must flag as CRITICAL_CONTRAINDICATION
    res = client.post(
        "/api/v1/patients/PT_BLEED_001/check-drug",
        json={"drug_name": "Ibuprofen", "dose": 400.0, "dose_unit": "mg"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["safety_status"] == "CRITICAL_CONTRAINDICATION"
    assert len(data["flagged_interactions"]) > 0
