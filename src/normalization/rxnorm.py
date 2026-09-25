"""Drug normalization module leveraging NLM RxNorm REST API with local cache and fallback."""
import logging
import re
from typing import Dict, Optional, Tuple
import requests

from src.config import RXNORM_BASE_URL

logger = logging.getLogger(__name__)

# Common brand-to-generic & ingredient mapping for instant zero-latency offline resolution
KNOWN_DRUG_MAP: Dict[str, Dict[str, str]] = {
    "coumadin": {"generic": "warfarin", "rxcui": "11289", "class": "anticoagulant"},
    "warfarin": {"generic": "warfarin", "rxcui": "11289", "class": "anticoagulant"},
    "aspirin": {"generic": "aspirin", "rxcui": "1191", "class": "nsaid_antiplatelet"},
    "bayer": {"generic": "aspirin", "rxcui": "1191", "class": "nsaid_antiplatelet"},
    "ecotrin": {"generic": "aspirin", "rxcui": "1191", "class": "nsaid_antiplatelet"},
    "plavix": {"generic": "clopidogrel", "rxcui": "32968", "class": "antiplatelet"},
    "clopidogrel": {"generic": "clopidogrel", "rxcui": "32968", "class": "antiplatelet"},
    "advil": {"generic": "ibuprofen", "rxcui": "5640", "class": "nsaid"},
    "motrin": {"generic": "ibuprofen", "rxcui": "5640", "class": "nsaid"},
    "ibuprofen": {"generic": "ibuprofen", "rxcui": "5640", "class": "nsaid"},
    "aleve": {"generic": "naproxen", "rxcui": "7258", "class": "nsaid"},
    "naprosyn": {"generic": "naproxen", "rxcui": "7258", "class": "nsaid"},
    "naproxen": {"generic": "naproxen", "rxcui": "7258", "class": "nsaid"},
    "zocor": {"generic": "simvastatin", "rxcui": "36567", "class": "statin"},
    "simvastatin": {"generic": "simvastatin", "rxcui": "36567", "class": "statin"},
    "lipitor": {"generic": "atorvastatin", "rxcui": "83367", "class": "statin"},
    "atorvastatin": {"generic": "atorvastatin", "rxcui": "83367", "class": "statin"},
    "cordarone": {"generic": "amiodarone", "rxcui": "703", "class": "antiarrhythmic"},
    "pacerone": {"generic": "amiodarone", "rxcui": "703", "class": "antiarrhythmic"},
    "amiodarone": {"generic": "amiodarone", "rxcui": "703", "class": "antiarrhythmic"},
    "norvasc": {"generic": "amlodipine", "rxcui": "17767", "class": "calcium_channel_blocker"},
    "amlodipine": {"generic": "amlodipine", "rxcui": "17767", "class": "calcium_channel_blocker"},
    "prilosec": {"generic": "omeprazole", "rxcui": "7646", "class": "ppi"},
    "omeprazole": {"generic": "omeprazole", "rxcui": "7646", "class": "ppi"},
    "nexium": {"generic": "esomeprazole", "rxcui": "283742", "class": "ppi"},
    "esomeprazole": {"generic": "esomeprazole", "rxcui": "283742", "class": "ppi"},
    "trexall": {"generic": "methotrexate", "rxcui": "6851", "class": "antimetabolite_dmard"},
    "rheumatrex": {"generic": "methotrexate", "rxcui": "6851", "class": "antimetabolite_dmard"},
    "methotrexate": {"generic": "methotrexate", "rxcui": "6851", "class": "antimetabolite_dmard"},
    "bactrim": {"generic": "trimethoprim-sulfamethoxazole", "rxcui": "10528", "class": "sulfonamide_antibiotic"},
    "septra": {"generic": "trimethoprim-sulfamethoxazole", "rxcui": "10528", "class": "sulfonamide_antibiotic"},
    "co-trimoxazole": {"generic": "trimethoprim-sulfamethoxazole", "rxcui": "10528", "class": "sulfonamide_antibiotic"},
    "trimethoprim-sulfamethoxazole": {"generic": "trimethoprim-sulfamethoxazole", "rxcui": "10528", "class": "sulfonamide_antibiotic"},
    "glucophage": {"generic": "metformin", "rxcui": "6809", "class": "biguanide"},
    "metformin": {"generic": "metformin", "rxcui": "6809", "class": "biguanide"},
    "prinivil": {"generic": "lisinopril", "rxcui": "29046", "class": "ace_inhibitor"},
    "zestril": {"generic": "lisinopril", "rxcui": "29046", "class": "ace_inhibitor"},
    "lisinopril": {"generic": "lisinopril", "rxcui": "29046", "class": "ace_inhibitor"},
    "tylenol": {"generic": "acetaminophen", "rxcui": "161", "class": "analgesic_antipyretic"},
    "paracetamol": {"generic": "acetaminophen", "rxcui": "161", "class": "analgesic_antipyretic"},
    "acetaminophen": {"generic": "acetaminophen", "rxcui": "161", "class": "analgesic_antipyretic"},
    "lasix": {"generic": "furosemide", "rxcui": "4603", "class": "loop_diuretic"},
    "furosemide": {"generic": "furosemide", "rxcui": "4603", "class": "loop_diuretic"},
    "lanoxin": {"generic": "digoxin", "rxcui": "3407", "class": "cardiac_glycoside"},
    "digoxin": {"generic": "digoxin", "rxcui": "3407", "class": "cardiac_glycoside"},
    "cipro": {"generic": "ciprofloxacin", "rxcui": "2551", "class": "fluoroquinolone"},
    "ciprofloxacin": {"generic": "ciprofloxacin", "rxcui": "2551", "class": "fluoroquinolone"},
    "fluoxetine": {"generic": "fluoxetine", "rxcui": "4493", "class": "ssri"},
    "prozac": {"generic": "fluoxetine", "rxcui": "4493", "class": "ssri"},
    "sertraline": {"generic": "sertraline", "rxcui": "36437", "class": "ssri"},
    "zoloft": {"generic": "sertraline", "rxcui": "36437", "class": "ssri"},
}


class RxNormNormalizer:
    def __init__(self, timeout: int = 4):
        self.cache: Dict[str, Dict[str, str]] = dict(KNOWN_DRUG_MAP)
        self.timeout = timeout

    def clean_name(self, raw_name: str) -> str:
        """Strip dosage amounts, routes, and special characters from raw drug string."""
        if not raw_name:
            return ""
        s = raw_name.lower().strip()
        # Remove strengths like 10mg, 500 mg, 0.5 mcg, 100ml
        s = re.sub(r"\b\d+(\.\d+)?\s*(mg|mcg|g|ml|tablets?|capsules?|caps?|tabs?)\b", "", s)
        # Remove dosage formats like oral, iv, bid, qd, prn
        s = re.sub(r"\b(oral|iv|po|bid|tid|qid|qd|prn|daily|extended release|er|xr|sr)\b", "", s)
        # Remove non-alphanumeric except hyphen
        s = re.sub(r"[^\w\s-]", " ", s)
        s = re.sub(r"\s+", " ", s).strip()
        return s

    def normalize(self, raw_name: str) -> Dict[str, str]:
        """Normalize drug name to standard generic name and RxCUI."""
        cleaned = self.clean_name(raw_name)
        if not cleaned:
            return {"raw": raw_name, "normalized": "unknown", "rxcui": "", "drug_class": "unknown"}

        if cleaned in self.cache:
            info = self.cache[cleaned]
            return {
                "raw": raw_name,
                "normalized": info["generic"],
                "rxcui": info.get("rxcui", ""),
                "drug_class": info.get("class", "unknown"),
            }

        # Check subwords in known mapping
        words = cleaned.split()
        for w in words:
            if w in self.cache:
                info = self.cache[w]
                return {
                    "raw": raw_name,
                    "normalized": info["generic"],
                    "rxcui": info.get("rxcui", ""),
                    "drug_class": info.get("class", "unknown"),
                }

        # Query RxNorm approximateTerm API
        try:
            url = f"{RXNORM_BASE_URL}/approximateTerm.json"
            params = {"term": cleaned, "maxEntries": 1}
            resp = requests.get(url, params=params, timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                candidate = (
                    data.get("approximateGroup", {})
                    .get("candidate", [{}])[0]
                )
                rxcui = candidate.get("rxcui", "")
                if rxcui:
                    # Look up ingredient (IN) for this RxCUI
                    ing_url = f"{RXNORM_BASE_URL}/rxcui/{rxcui}/related.json?tty=IN"
                    ing_resp = requests.get(ing_url, timeout=self.timeout)
                    normalized_name = cleaned
                    if ing_resp.status_code == 200:
                        ing_data = ing_resp.json()
                        concept_group = ing_data.get("relatedGroup", {}).get("conceptGroup", [])
                        for group in concept_group:
                            if group.get("tty") == "IN" and group.get("conceptProperties"):
                                normalized_name = group["conceptProperties"][0]["name"].lower()
                                break
                    result = {
                        "raw": raw_name,
                        "normalized": normalized_name,
                        "rxcui": rxcui,
                        "drug_class": "unknown",
                    }
                    self.cache[cleaned] = {"generic": normalized_name, "rxcui": rxcui, "class": "unknown"}
                    return result
        except Exception as e:
            logger.debug(f"RxNorm API lookup failed for {cleaned}: {e}")

        # Fallback to cleaned token
        return {
            "raw": raw_name,
            "normalized": cleaned,
            "rxcui": "",
            "drug_class": "unknown",
        }


_global_normalizer = RxNormNormalizer()


def normalize_drug_name(raw_name: str) -> Dict[str, str]:
    return _global_normalizer.normalize(raw_name)


def get_rxcui(raw_name: str) -> str:
    return _global_normalizer.normalize(raw_name).get("rxcui", "")
