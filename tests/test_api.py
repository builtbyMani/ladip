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


def test_root_and_favicon_endpoints():
    res_json = client.get("/")
    assert res_json.status_code == 200
    assert res_json.json()["status"] == "healthy"
    assert "2026" in res_json.json()["copyright"]

    res_html = client.get("/", headers={"Accept": "text/html"})
    assert res_html.status_code == 200
    assert "<title>LADIP" in res_html.text
    assert 'meta name="description"' in res_html.text

    res_ico = client.get("/favicon.ico")
    assert res_ico.status_code == 200
    res_svg = client.get("/favicon.svg")
    assert res_svg.status_code == 200
    assert "<svg" in res_svg.text


def test_custom_404_html_and_json():
    res_html_404 = client.get("/unknown-clinical-route", headers={"Accept": "text/html"})
    assert res_html_404.status_code == 404
    assert "404 Page Not Found | LADIP" in res_html_404.text
    assert "Clinical Endpoint or Page Not Found" in res_html_404.text

    res_api_404 = client.get("/api/v1/patients/PT_NONEXISTENT_999")
    assert res_api_404.status_code == 404
    assert "not found" in res_api_404.json()["detail"].lower()


def test_alias_routes_and_validation_errors():
    res_alias = client.get("/api/patients")
    assert res_alias.status_code == 200
    assert len(res_alias.json()["patients"]) >= 5

    res_analysis = client.get("/api/patients/PT_BLEED_001/analysis")
    assert res_analysis.status_code == 200
    assert res_analysis.json()["active_alerts_count"] > 0

    res_sim = client.post("/api/v1/simulate", json={"drugs": ["Warfarin", "Aspirin", "Ibuprofen"]})
    assert res_sim.status_code == 200
    assert res_sim.json()["signals_count"] > 0

    # Edge case: < 2 drugs in simulate must return 400
    res_sim_err = client.post("/api/v1/simulate", json={"drugs": ["Warfarin"]})
    assert res_sim_err.status_code == 400

    # Edge case: empty or numeric-only drug name in check-drug must return 400
    res_chk_err = client.post(
        "/api/v1/patients/PT_BLEED_001/check-drug",
        json={"drug_name": "   ", "dose": 100.0, "dose_unit": "mg"},
    )
    assert res_chk_err.status_code == 400

    res_chk_num = client.post(
        "/api/v1/patients/PT_BLEED_001/check-drug",
        json={"drug_name": "12345", "dose": 100.0, "dose_unit": "mg"},
    )
    assert res_chk_num.status_code == 400

    # Edge case: negative dose in check-drug must return 400
    res_chk_neg = client.post(
        "/api/v1/patients/PT_BLEED_001/check-drug",
        json={"drug_name": "Ibuprofen", "dose": -50.0, "dose_unit": "mg"},
    )
    assert res_chk_neg.status_code == 400


def test_scan_report_and_base64_edge_cases():
    import base64
    from pathlib import Path

    pt_path = Path(__file__).resolve().parent.parent / "data" / "patients" / "PT_BLEED_001.json"
    orig_bytes = pt_path.read_bytes()
    try:
        # 1. Valid .txt upload to /scan-report must parse as text (200 OK)
        txt_payload = b"Rx: Ibuprofen 400 mg TID\nPantoprazole 40 mg QD\nDiagnosis: Osteoarthritis"
        res_txt = client.post(
            "/api/v1/patients/PT_BLEED_001/scan-report",
            files={"file": ("discharge_note.txt", txt_payload, "text/plain")},
        )
        assert res_txt.status_code == 200
        assert len(res_txt.json()["extracted_medications"]) >= 1

        # 2. Zero-byte upload to /scan-report must return 400
        res_empty = client.post(
            "/api/v1/patients/PT_BLEED_001/scan-report",
            files={"file": ("empty.png", b"", "image/png")},
        )
        assert res_empty.status_code == 400

        # 3. Corrupted image upload to /scan-report must return 400 (not 500)
        res_bad_img = client.post(
            "/api/v1/patients/PT_BLEED_001/scan-report",
            files={"file": ("corrupt.png", b"not-a-valid-png-header", "image/png")},
        )
        assert res_bad_img.status_code == 400

        # 4. Corrupted PDF upload to /scan-report must return 400 (not 500)
        res_bad_pdf = client.post(
            "/api/v1/patients/PT_BLEED_001/scan-report",
            files={"file": ("corrupt.pdf", b"not-a-valid-pdf", "application/pdf")},
        )
        assert res_bad_pdf.status_code == 400

        # 5. Corrupted base64 image payload to /scan-base64 must return 400 (not 500)
        bad_b64 = base64.b64encode(b"not-an-image").decode("ascii")
        res_bad_b64 = client.post(
            "/api/v1/patients/PT_BLEED_001/scan-base64",
            json={"image_base64": bad_b64, "file_type": "image"},
        )
        assert res_bad_b64.status_code == 400
    finally:
        pt_path.write_bytes(orig_bytes)


def test_image_compression_helper():
    from PIL import Image
    import io
    from src.patient.report_parser import MedicalReportParser

    # Create a large 2000x2000 uncompressed BMP/PNG image in memory
    img = Image.new("RGB", (2000, 2000), color=(245, 245, 240))
    raw_buf = io.BytesIO()
    img.save(raw_buf, format="BMP")
    raw_bytes = raw_buf.getvalue()

    compressed = MedicalReportParser.compress_image_bytes(raw_bytes, max_dimension=1024, quality=70)
    assert len(compressed) < len(raw_bytes) * 0.1
    with Image.open(io.BytesIO(compressed)) as out_img:
        assert max(out_img.size) <= 1024


def test_streamlit_app_headless_workflows():
    from pathlib import Path
    from streamlit.testing.v1 import AppTest

    app_path = Path(__file__).resolve().parent.parent / "src" / "app.py"
    at = AppTest.from_file(app_path, default_timeout=30)
    at.run()
    assert not at.exception

    # Switch workflow via sidebar radio to Prospective Drug Safety Check
    at.sidebar.radio[0].set_value("Prospective Drug Safety Check").run()
    assert not at.exception
    assert len(at.error) > 0  # Default Ibuprofen on Ramesh Sharma triggers CRITICAL contraindication error banner

    # Test empty drug input validation error on Prospective Drug Safety Check
    at.text_input(key="prospective_drug_input").set_value("   ").run()
    assert not at.exception
    assert any("Invalid candidate medication" in e.value for e in at.error)

    # Clicking preset button after invalid input must restore valid candidate and run check
    at.button(key="preset_btn_Ibuprofen").click().run()
    assert not at.exception
    assert at.session_state["prospective_drug_input"] == "Ibuprofen"

    # Switch workflow to Patient Profile & Report Parser
    at.sidebar.radio[0].set_value("Patient Profile & Report Parser").run()
    assert not at.exception

    # Switch workflow to FAERS Disproportionality Explorer
    at.sidebar.radio[0].set_value("FAERS Disproportionality Explorer").run()
    assert not at.exception
    assert len(at.success) > 0

    # Test invalid single-drug query on FAERS Explorer
    at.text_input[0].set_value("Warfarin").run()
    assert not at.exception
    assert any("Invalid combination query" in e.value for e in at.error)

    # Test Custom 404 route via query_params
    at.query_params["workflow"] = "invalid_nonexistent_route"
    at.run()
    assert not at.exception
    assert any("404" in m.value for m in at.markdown)


def test_streamlit_mobile_menu_and_404_recovery():
    from pathlib import Path
    from streamlit.testing.v1 import AppTest

    app_path = Path(__file__).resolve().parent.parent / "src" / "app.py"
    at = AppTest.from_file(app_path, default_timeout=30)
    at.query_params["patient"] = "PT_BLEED_001"
    at.run()
    assert not at.exception
    assert at.session_state["selected_pid"] == "PT_BLEED_001"

    # Switching patient in mobile menu with ?patient= query param must not loop and must sync query_params
    at.selectbox(key="mob_cohort_select").set_value("PT_STATIN_002").run()
    assert not at.exception
    assert at.session_state["selected_pid"] == "PT_STATIN_002"
    assert "PT_STATIN_002" in at.query_params["patient"]

    # Clicking mobile menu workflow buttons must navigate and sync all workflow controls
    at.button(key="mob_menu_FAERS Disproportionality Explorer").click().run()
    assert not at.exception
    assert at.session_state["active_workflow"] == "FAERS Disproportionality Explorer"
    assert "faers" in at.query_params["workflow"]

    # Combined invalid workflow and invalid patient query params must report both 404 reasons
    at.query_params["workflow"] = "bad_route"
    at.query_params["patient"] = "INVALID_MRN_999"
    at.run()
    assert not at.exception
    combined_md = "\n".join(m.value for m in at.markdown)
    assert "bad_route" in combined_md
    assert "INVALID_MRN_999" in combined_md

    # Selecting a workflow in sidebar radio while on 404 page must recover cleanly
    at.sidebar.radio[0].set_value("Prospective Drug Safety Check").run()
    assert not at.exception
    assert at.session_state["active_workflow"] == "Prospective Drug Safety Check"
    assert "safety" in at.query_params["workflow"]
    assert "patient" not in at.query_params


def test_palette_and_mobile_bundle_integrity():
    from pathlib import Path
    from src.safety.drug_checker import DrugSafetyChecker
    from src.analysis.severity import MedDRASeverityClassifier, SeverityTier
    from src.patient.memory import PatientStore

    store = PatientStore()
    p = store.get("PT_BLEED_001")
    checker = DrugSafetyChecker()
    sa = checker.assess_new_drug(p, "Ibuprofen", dose=400.0)
    assert sa.risk_color == "#DC2626"

    assert MedDRASeverityClassifier.get_color(SeverityTier.CRITICAL) == "#DC2626"
    assert MedDRASeverityClassifier.get_color(SeverityTier.HIGH) == "#E8C840"
    assert MedDRASeverityClassifier.get_color(SeverityTier.MODERATE) == "#D4A5E5"
    assert MedDRASeverityClassifier.get_color(SeverityTier.LOW) == "#1B7A3D"

    # Verify no banned #94A3B8 or #0284C7 colors exist in src/ or mobile/src/
    root = Path(__file__).resolve().parent.parent
    for folder in [root / "src", root / "mobile" / "src"]:
        for path in folder.rglob("*"):
            if path.suffix in {".py", ".js"}:
                content = path.read_text(encoding="utf-8")
                assert "#0284C7" not in content.upper(), f"Banned #0284C7 in {path}"
                assert "#94A3B8" not in content.upper(), f"Banned #94A3B8 in {path}"


def test_bklit_ui_svg_transform_and_touch_tooltip():
    from src.components.bklit_charts import _BKLIT_CSS, _BKLIT_JS

    # Ensure SVG elements use transform-box: fill-box so motion.dev springs scale in-place
    assert "transform-box: fill-box" in _BKLIT_CSS
    assert "transform-origin: left center" in _BKLIT_CSS
    assert "transform-origin: center center" in _BKLIT_CSS

    # Ensure touch and click events are bound alongside mouseenter for mobile viewports
    assert '"touchstart"' in _BKLIT_JS
    assert 'addEventListener("click"' in _BKLIT_JS

