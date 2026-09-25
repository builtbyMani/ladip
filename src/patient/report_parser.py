"""Medical report parser using PyMuPDF, Tesseract OCR, and Gemini LLM with deterministic fallback."""
import io
import json
import logging
import re
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import pymupdf as fitz
from PIL import Image
try:
    import pytesseract
except ImportError:
    pytesseract = None

from src.config import GEMINI_API_KEY
from src.normalization.rxnorm import normalize_drug_name
from src.patient.models import Medication, PatientProfile, Symptom

logger = logging.getLogger(__name__)


class MedicalReportParser:
    def __init__(self, gemini_api_key: Optional[str] = None):
        self.gemini_api_key = gemini_api_key or GEMINI_API_KEY
        self.gemini_model = None
        if self.gemini_api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.gemini_api_key)
                self.gemini_model = genai.GenerativeModel("gemini-1.5-flash")
            except Exception as e:
                logger.warning(f"Could not initialize Gemini model: {e}")

    def extract_text_from_pdf(self, pdf_bytes_or_path: Union[bytes, Path, str]) -> str:
        """Extract text from PDF pages using PyMuPDF."""
        text = ""
        if isinstance(pdf_bytes_or_path, (str, Path)):
            doc = fitz.open(str(pdf_bytes_or_path))
        else:
            doc = fitz.open(stream=pdf_bytes_or_path, filetype="pdf")

        for page in doc:
            text += page.get_text() + "\n"
        doc.close()
        return text

    def extract_text_from_image(self, image_bytes_or_path: Union[bytes, Path, str]) -> str:
        """Extract text from image using Tesseract OCR if available."""
        if isinstance(image_bytes_or_path, (str, Path)):
            img = Image.open(str(image_bytes_or_path))
        else:
            img = Image.open(io.BytesIO(image_bytes_or_path))

        if pytesseract:
            try:
                return pytesseract.image_to_string(img)
            except Exception as e:
                logger.warning(f"Tesseract OCR failed: {e}")
        return ""

    def parse_report(
        self,
        content: Union[str, bytes, Path],
        file_type: str = "text",
        default_patient_id: Optional[str] = None,
    ) -> PatientProfile:
        """Main entry point: parse text, pdf, or image into a structured PatientProfile."""
        text = ""
        if file_type == "pdf":
            text = self.extract_text_from_pdf(content)
        elif file_type in ("image", "png", "jpg", "jpeg"):
            text = self.extract_text_from_image(content)
        elif isinstance(content, str):
            text = content
        elif isinstance(content, bytes):
            text = content.decode("utf-8", errors="ignore")

        if not text.strip():
            logger.warning("Empty text extracted from report.")
            pid = default_patient_id or f"PT_{int(datetime.now().timestamp())}"
            return PatientProfile(patient_id=pid, age=0, sex="U", weight=70.0)

        # Attempt Gemini LLM extraction if key available
        if self.gemini_model:
            try:
                profile = self._extract_with_gemini(text, default_patient_id)
                if profile and profile.medications:
                    return profile
            except Exception as e:
                logger.error(f"Gemini report extraction failed, falling back to regex: {e}")

        # Fallback to deterministic regex extractor
        return self._extract_with_regex(text, default_patient_id)

    def _extract_with_gemini(self, text: str, default_patient_id: Optional[str] = None) -> Optional[PatientProfile]:
        prompt = f"""You are a clinical pharmacovigilance data extraction specialist.
Extract patient timeline details from the medical report below into a single valid JSON object.

Strict JSON Schema:
{{
  "patient_id": "string",
  "name": "string or null",
  "age": 0,
  "sex": "M" or "F" or "U",
  "weight": 70.0,
  "allergies": ["list", "of", "allergies"],
  "conditions": ["list", "of", "diagnoses"],
  "medications": [
    {{
      "drug_name": "string",
      "dose": 0.0,
      "dose_unit": "mg",
      "frequency": "QD / BID / PRN",
      "route": "oral",
      "start_date": "YYYY-MM-DD or null",
      "end_date": "YYYY-MM-DD or null"
    }}
  ],
  "symptoms": [
    {{
      "description": "string",
      "meddra_term": "string",
      "severity": 1-10,
      "onset_date": "YYYY-MM-DD or null",
      "resolution_date": "YYYY-MM-DD or null"
    }}
  ]
}}

Medical Report:
\"\"\"{text[:4000]}\"\"\"
Return only valid JSON. Do not wrap in markdown quotes if possible.
"""
        response = self.gemini_model.generate_content(prompt)
        raw_out = response.text.strip()
        if "```json" in raw_out:
            raw_out = raw_out.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_out:
            raw_out = raw_out.split("```")[1].split("```")[0].strip()

        data = json.loads(raw_out)
        if default_patient_id and not data.get("patient_id"):
            data["patient_id"] = default_patient_id
        return PatientProfile.from_dict(data)

    def _extract_with_regex(self, text: str, default_patient_id: Optional[str] = None) -> PatientProfile:
        """Deterministic regex-based extraction for clinical discharge summaries, charts, and prescriptions."""
        # 1. Patient Demographics
        pid_match = re.search(r"(?:patient\s*(?:id|#|\b)|mrn[:\s#]*)\s*([a-zA-Z0-9_-]+)", text, re.IGNORECASE)
        pid = pid_match.group(1) if pid_match else (default_patient_id or f"PT_{int(datetime.now().timestamp())}")

        name_match = re.search(r"(?:patient\s*name|name):\s*([a-zA-Z\s,]+)(?:\n|$)", text, re.IGNORECASE)
        name = name_match.group(1).strip() if name_match else None

        age_match = re.search(r"\b(\d{1,3})\s*(?:yo|y\.o\.|years?\s*old|y/o)\b", text, re.IGNORECASE)
        age = int(age_match.group(1)) if age_match else 65

        sex = "U"
        if re.search(r"\b(female|woman|lady|\bf\b)\b", text, re.IGNORECASE):
            sex = "F"
        elif re.search(r"\b(male|man|gentleman|\bm\b)\b", text, re.IGNORECASE):
            sex = "M"

        weight_match = re.search(r"(?:weight|wt)[:\s]*(\d{2,3}(?:\.\d+)?)\s*(kg|lbs)?", text, re.IGNORECASE)
        weight = 70.0
        if weight_match:
            val = float(weight_match.group(1))
            unit = (weight_match.group(2) or "kg").lower()
            weight = round(val * 0.453592, 1) if "lb" in unit else val

        # 2. Allergies
        allergies: List[str] = []
        allergy_section = re.search(r"(?:allergies|nkda)[:\s]*([^\n\.]+)", text, re.IGNORECASE)
        if allergy_section:
            raw_all = allergy_section.group(1).strip()
            if "nkda" not in raw_all.lower() and "none" not in raw_all.lower():
                allergies = [a.strip() for a in re.split(r"[,;/]", raw_all) if a.strip()]

        # 3. Diagnoses / Conditions
        conditions: List[str] = []
        cond_patterns = [
            r"hypertension", r"atrial fibrillation", r"type 2 diabetes", r"hyperlipidemia",
            r"coronary artery disease", r"heart failure", r"rheumatoid arthritis",
            r"chronic kidney disease", r"deep vein thrombosis", r"osteoarthritis",
        ]
        for cp in cond_patterns:
            if re.search(r"\b" + cp + r"\b", text, re.IGNORECASE):
                conditions.append(cp.title())

        # 4. Medications
        # Look for patterns: <Drug Name> <Dose> <Unit> <Route> <Frequency> [Started: YYYY-MM-DD]
        medications: List[Medication] = []
        med_regex = re.compile(
            r"(?P<drug>[A-Za-z\-]{3,25})\s+"
            r"(?P<dose>\d+(?:\.\d+)?)\s*"
            r"(?P<unit>mg|mcg|g|ml|units)?\s*"
            r"(?P<freq>once daily|daily|bid|tid|qid|qd|prn|q12h|q24h|q8h)?",
            re.IGNORECASE,
        )

        date_regex = re.compile(r"\b(20\d{2}[-/]\d{1,2}[-/]\d{1,2})\b")
        found_dates = [datetime.strptime(d.replace("/", "-"), "%Y-%m-%d").date() for d in date_regex.findall(text)]
        base_date = found_dates[0] if found_dates else date.today()

        lines = text.split("\n")
        for line in lines:
            m = med_regex.search(line)
            if m:
                drug_candidate = m.group("drug").strip()
                # Ignore non-drug common English words
                if drug_candidate.lower() in {
                    "patient", "history", "hospital", "reported", "admitted",
                    "started", "stopped", "tablet", "capsule", "severe", "moderate",
                }:
                    continue

                norm_info = normalize_drug_name(drug_candidate)
                # If mapped or known
                dose_val = float(m.group("dose")) if m.group("dose") else 10.0
                unit_val = m.group("unit") or "mg"
                freq_val = (m.group("freq") or "daily").upper()

                # Search for specific start date in line
                line_date_match = date_regex.search(line)
                start_d = (
                    datetime.strptime(line_date_match.group(1).replace("/", "-"), "%Y-%m-%d").date()
                    if line_date_match
                    else base_date
                )

                medications.append(
                    Medication(
                        drug_name=drug_candidate,
                        normalized_name=norm_info["normalized"],
                        rxcui=norm_info["rxcui"],
                        dose=dose_val,
                        dose_unit=unit_val,
                        frequency=freq_val,
                        route="oral",
                        start_date=start_d,
                    )
                )

        # 5. Symptoms
        symptoms: List[Symptom] = []
        symptom_triggers = [
            ("gastrointestinal hemorrhage", "gastrointestinal hemorrhage", 9),
            ("rectal bleeding", "gastrointestinal hemorrhage", 8),
            ("melena", "gastrointestinal hemorrhage", 8),
            ("blood in stool", "gastrointestinal hemorrhage", 8),
            ("muscle pain", "myopathy", 6),
            ("severe myopathy", "myopathy", 7),
            ("dark urine", "rhabdomyolysis", 9),
            ("rhabdomyolysis", "rhabdomyolysis", 10),
            ("bleeding gums", "gingival bleeding", 5),
            ("bruising", "contusion", 4),
            ("pancytopenia", "pancytopenia", 9),
            ("fever and chills", "pyrexia", 6),
            ("shortness of breath", "dyspnoea", 6),
            ("acute kidney injury", "acute kidney injury", 9),
            ("dizziness", "dizziness", 4),
            ("nausea", "nausea", 3),
        ]

        for trigger, meddra, sev in symptom_triggers:
            if re.search(r"\b" + trigger + r"\b", text, re.IGNORECASE):
                # Search if there is an associated onset date near trigger
                symptoms.append(
                    Symptom(
                        description=trigger.title(),
                        meddra_term=meddra,
                        severity=sev,
                        onset_date=found_dates[-1] if len(found_dates) > 1 else base_date,
                    )
                )

        return PatientProfile(
            patient_id=pid,
            name=name or f"Patient {pid}",
            age=age,
            sex=sex,
            weight=weight,
            allergies=allergies,
            conditions=conditions,
            medications=medications,
            symptoms=symptoms,
        )
