"""Data models for patient timelines, medications, symptoms, and clinical profiles."""
from dataclasses import dataclass, field, asdict
from datetime import date, datetime
import json
from typing import Any, Dict, List, Optional
from src.normalization.rxnorm import normalize_drug_name


@dataclass
class Medication:
    drug_name: str  # Raw name from report
    normalized_name: str = ""  # RxNorm-normalized ingredient
    rxcui: str = ""  # RxNorm Concept ID
    dose: float = 0.0
    dose_unit: str = "mg"
    frequency: str = "QD"  # "BID", "QD", "PRN", etc.
    route: str = "oral"  # "oral", "IV", etc.
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    prescriber: Optional[str] = None

    def __post_init__(self):
        if not self.normalized_name:
            norm_info = normalize_drug_name(self.drug_name)
            self.normalized_name = norm_info["normalized"]
            if not self.rxcui:
                self.rxcui = norm_info.get("rxcui", "")

    def is_active_on(self, target_date: date) -> bool:
        if self.start_date and self.start_date > target_date:
            return False
        if self.end_date and self.end_date < target_date:
            return False
        return True


@dataclass
class Symptom:
    description: str
    meddra_term: str = ""  # Mapped to MedDRA preferred term
    severity: int = 5  # 1-10 scale
    onset_date: Optional[date] = None
    resolution_date: Optional[date] = None
    daily_pattern: Optional[str] = None  # "morning", "evening", "after meals"

    def __post_init__(self):
        if not self.meddra_term:
            self.meddra_term = self.description.lower().strip()


@dataclass
class LabResult:
    test_name: str  # e.g., "eGFR", "ALT", "AST", "INR", "Serum Creatinine"
    value: float
    unit: str
    date: date
    reference_range: Optional[str] = None
    is_abnormal: bool = False


@dataclass
class PatientProfile:
    patient_id: str
    age: int
    sex: str
    weight: float  # in kg
    allergies: List[str] = field(default_factory=list)
    conditions: List[str] = field(default_factory=list)  # Active diagnoses
    medications: List[Medication] = field(default_factory=list)
    symptoms: List[Symptom] = field(default_factory=list)
    lab_results: List[Dict[str, Any]] = field(default_factory=list)
    name: Optional[str] = None

    def get_active_medications(self, on_date: Optional[date] = None) -> List[Medication]:
        ref_date = on_date or date.today()
        return [m for m in self.medications if m.is_active_on(ref_date)]

    def get_medication_overlap(self, start: date, end: date) -> List[Medication]:
        """Find medications active anytime between start and end date."""
        overlap = []
        for m in self.medications:
            m_start = m.start_date or date.min
            m_end = m.end_date or date.max
            if m_start <= end and m_end >= start:
                overlap.append(m)
        return overlap

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        # Convert dates to ISO strings
        for med in data["medications"]:
            if med["start_date"]:
                med["start_date"] = med["start_date"].isoformat() if isinstance(med["start_date"], (date, datetime)) else str(med["start_date"])
            if med["end_date"]:
                med["end_date"] = med["end_date"].isoformat() if isinstance(med["end_date"], (date, datetime)) else str(med["end_date"])
        for sym in data["symptoms"]:
            if sym["onset_date"]:
                sym["onset_date"] = sym["onset_date"].isoformat() if isinstance(sym["onset_date"], (date, datetime)) else str(sym["onset_date"])
            if sym["resolution_date"]:
                sym["resolution_date"] = sym["resolution_date"].isoformat() if isinstance(sym["resolution_date"], (date, datetime)) else str(sym["resolution_date"])
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "PatientProfile":
        meds = []
        for m in data.get("medications", []):
            s_date = date.fromisoformat(m["start_date"]) if m.get("start_date") else None
            e_date = date.fromisoformat(m["end_date"]) if m.get("end_date") else None
            meds.append(
                Medication(
                    drug_name=m["drug_name"],
                    normalized_name=m.get("normalized_name", ""),
                    rxcui=m.get("rxcui", ""),
                    dose=float(m.get("dose", 0.0)),
                    dose_unit=m.get("dose_unit", "mg"),
                    frequency=m.get("frequency", "QD"),
                    route=m.get("route", "oral"),
                    start_date=s_date,
                    end_date=e_date,
                    prescriber=m.get("prescriber"),
                )
            )

        syms = []
        for s in data.get("symptoms", []):
            o_date = date.fromisoformat(s["onset_date"]) if s.get("onset_date") else None
            r_date = date.fromisoformat(s["resolution_date"]) if s.get("resolution_date") else None
            syms.append(
                Symptom(
                    description=s["description"],
                    meddra_term=s.get("meddra_term", ""),
                    severity=int(s.get("severity", 5)),
                    onset_date=o_date,
                    resolution_date=r_date,
                    daily_pattern=s.get("daily_pattern"),
                )
            )

        return cls(
            patient_id=data["patient_id"],
            name=data.get("name"),
            age=int(data.get("age", 0)),
            sex=data.get("sex", "U"),
            weight=float(data.get("weight", 70.0)),
            allergies=data.get("allergies", []),
            conditions=data.get("conditions", []),
            medications=meds,
            symptoms=syms,
            lab_results=data.get("lab_results", []),
        )
