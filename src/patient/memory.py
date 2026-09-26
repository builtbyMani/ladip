"""Persistent patient profile store with intelligent deduplication and allergy memory."""
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional
from datetime import date

from src.config import PATIENTS_DIR
from src.patient.models import PatientProfile, Medication, Symptom
from src.normalization.rxnorm import normalize_drug_name

logger = logging.getLogger(__name__)


class PatientStore:
    def __init__(self, storage_dir: Optional[Path] = None):
        self.storage_dir = storage_dir or PATIENTS_DIR
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def _get_path(self, patient_id: str) -> Path:
        clean_id = "".join([c if c.isalnum() else "_" for c in patient_id])
        return self.storage_dir / f"{clean_id}.json"

    def save(self, profile: PatientProfile) -> Path:
        path = self._get_path(profile.patient_id)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(profile.to_dict(), f, indent=2)
        return path

    def get(self, patient_id: str) -> Optional[PatientProfile]:
        path = self._get_path(patient_id)
        if not path.exists():
            # Check project root fallback directory
            fallback_path = Path(__file__).resolve().parent.parent.parent / "data" / "patients" / f"{path.name}"
            if fallback_path.exists():
                path = fallback_path
            else:
                return None
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return PatientProfile.from_dict(data)
        except Exception as e:
            logger.error(f"Error loading patient {patient_id}: {e}")
            return None

    def list_all(self) -> List[PatientProfile]:
        profiles = []
        files = list(self.storage_dir.glob("*.json"))
        if not files:
            fallback_dir = Path(__file__).resolve().parent.parent.parent / "data" / "patients"
            if fallback_dir.exists():
                files = list(fallback_dir.glob("*.json"))

        for file in files:
            try:
                with open(file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    profiles.append(PatientProfile.from_dict(data))
            except Exception as e:
                logger.warning(f"Error reading {file}: {e}")
        return profiles

    def merge_records(self, existing: PatientProfile, new_profile: PatientProfile) -> PatientProfile:
        """Intelligently merge two patient profiles, deduplicating medications and updating dates."""
        # 1. Update demographics if missing
        if not existing.age and new_profile.age:
            existing.age = new_profile.age
        if (not existing.sex or existing.sex == "U") and new_profile.sex:
            existing.sex = new_profile.sex
        if not existing.weight and new_profile.weight:
            existing.weight = new_profile.weight
        if not existing.name and new_profile.name:
            existing.name = new_profile.name

        # 2. Merge allergies and conditions
        existing.allergies = sorted(list(set(existing.allergies + new_profile.allergies)))
        existing.conditions = sorted(list(set(existing.conditions + new_profile.conditions)))

        # 3. Deduplicate medications by normalized ingredient
        med_dict: Dict[str, Medication] = {m.normalized_name: m for m in existing.medications if m.normalized_name}

        for new_m in new_profile.medications:
            norm_key = new_m.normalized_name or normalize_drug_name(new_m.drug_name)["normalized"]
            if norm_key in med_dict:
                # Update existing medication details
                curr_m = med_dict[norm_key]
                # If new med has a more recent start or end date, extend
                if new_m.start_date and (not curr_m.start_date or new_m.start_date < curr_m.start_date):
                    curr_m.start_date = new_m.start_date
                if new_m.end_date:
                    curr_m.end_date = new_m.end_date
                # Update dose if specified
                if new_m.dose > 0:
                    curr_m.dose = new_m.dose
                    curr_m.dose_unit = new_m.dose_unit
                    curr_m.frequency = new_m.frequency
            else:
                med_dict[norm_key] = new_m
                existing.medications.append(new_m)

        # 4. Merge symptoms (deduplicate by meddra_term and onset_date)
        sym_keys = {(s.meddra_term, str(s.onset_date)) for s in existing.symptoms}
        for new_s in new_profile.symptoms:
            key = (new_s.meddra_term, str(new_s.onset_date))
            if key not in sym_keys:
                existing.symptoms.append(new_s)
                sym_keys.add(key)

        self.save(existing)
        return existing
