"""Prospective drug safety checker evaluating prospective additions against patient profile and FAERS signals."""
from dataclasses import dataclass, field
from datetime import date
from itertools import combinations
from typing import Any, Dict, List, Optional

from src.faers.bulk_loader import FAERSDatabase
from src.normalization.rxnorm import normalize_drug_name
from src.patient.models import Medication, PatientProfile
from src.analysis.severity import SeverityTier


@dataclass
class DrugSafetyAssessment:
    new_drug_raw: str
    new_drug_normalized: str
    rxcui: str
    overall_safety_status: str  # "CRITICAL_CONTRAINDICATION", "HIGH_RISK", "MODERATE_RISK", "LOW_RISK_COMPATIBLE"
    risk_color: str  # Hex color code for UI badges
    allergy_flags: List[str]
    vulnerability_flags: List[str]
    flagged_combinations: List[Dict[str, Any]]
    recommendation: str


# Common cross-reactivity and contraindication classes
CROSS_REACTIVITY_RULES = {
    "nsaid": ["aspirin", "ibuprofen", "naproxen", "ketorolac", "meloxicam", "celecoxib", "diclofenac"],
    "penicillin": ["amoxicillin", "ampicillin", "piperacillin", "penicillin v"],
    "sulfonamide": ["trimethoprim-sulfamethoxazole", "sulfasalazine", "sulfamethoxazole", "bactrim", "furosemide"],
    "statin": ["simvastatin", "atorvastatin", "rosuvastatin", "pravastatin"],
}


class DrugSafetyChecker:
    def __init__(self, db: Optional[FAERSDatabase] = None):
        self.db = db or FAERSDatabase()

    def assess_new_drug(
        self,
        profile: PatientProfile,
        new_drug_name: str,
        dose: float = 0.0,
        dose_unit: str = "mg",
    ) -> DrugSafetyAssessment:
        norm_info = normalize_drug_name(new_drug_name)
        norm_drug = norm_info["normalized"]
        rxcui = norm_info["rxcui"]
        drug_class = norm_info.get("drug_class", "unknown")

        allergy_flags: List[str] = []
        vulnerability_flags: List[str] = []
        flagged_combos: List[Dict[str, Any]] = []

        # 1. Allergy & Cross-reactivity Check
        for allergy in profile.allergies:
            norm_allergy = normalize_drug_name(allergy)["normalized"]
            # Direct match
            if norm_drug in norm_allergy or norm_allergy in norm_drug:
                allergy_flags.append(f"DIRECT ALLERGY: Patient is documented allergic to '{allergy}'.")

            # Cross reactivity
            for cls_name, drug_list in CROSS_REACTIVITY_RULES.items():
                if (norm_drug in drug_list) and (norm_allergy in drug_list or cls_name in norm_allergy):
                    allergy_flags.append(
                        f"CROSS-REACTIVITY WARNING: {new_drug_name} belongs to '{cls_name}' class, "
                        f"matching patient allergy '{allergy}'."
                    )

        # 2. Patient Vulnerability Assessment
        if profile.age >= 65:
            vulnerability_flags.append(f"Geriatric Patient (Age {profile.age}): Heightened pharmacodynamic sensitivity and renal clearance reduction.")

        for cond in profile.conditions:
            cond_lower = cond.lower()
            if "renal" in cond_lower or "kidney" in cond_lower:
                if norm_drug in ["ibuprofen", "naproxen", "methotrexate"]:
                    vulnerability_flags.append(f"Renal Impairment ({cond}): Nephrotoxic hazard with {norm_drug.title()}.")
            if "liver" in cond_lower or "hepat" in cond_lower:
                if norm_drug in ["acetaminophen", "amiodarone", "methotrexate"]:
                    vulnerability_flags.append(f"Hepatic Condition ({cond}): Elevated hepatotoxicity risk.")
            if "bleeding" in cond_lower or "ulcer" in cond_lower:
                if norm_drug in ["aspirin", "ibuprofen", "warfarin", "clopidogrel"]:
                    vulnerability_flags.append(f"GI Bleeding History: {norm_drug.title()} increases active hemorrhage risk.")

        # 3. New Combination Disproportionality Exploration
        active_meds = profile.get_active_medications()
        active_norms = [m.normalized_name or normalize_drug_name(m.drug_name)["normalized"] for m in active_meds]

        # Pairwise combinations with new drug
        for current_d in active_norms:
            pair = sorted([norm_drug, current_d])
            signals = self.db.query_signals(pair)
            for sig in signals:
                flagged_combos.append({
                    "combo": " + ".join(pair),
                    "combo_size": 2,
                    "reaction": sig["adverse_event"],
                    "prr": sig["prr"],
                    "chi2": sig["chi_squared"],
                    "tier": sig["severity_tier"],
                    "cases": sig["case_count"],
                    "source": "FAERS Pairwise Signal",
                })

        # 3-drug combinations: new drug + any pair of existing meds
        if len(active_norms) >= 2:
            for existing_pair in combinations(active_norms, 2):
                triple = sorted([norm_drug] + list(existing_pair))
                signals = self.db.query_signals(triple)
                for sig in signals:
                    flagged_combos.append({
                        "combo": " + ".join(triple),
                        "combo_size": 3,
                        "reaction": sig["adverse_event"],
                        "prr": sig["prr"],
                        "chi2": sig["chi_squared"],
                        "tier": sig["severity_tier"],
                        "cases": sig["case_count"],
                        "source": "FAERS Multi-Drug Synergistic Signal",
                    })

        # Determine Overall Safety Status & Recommendation
        has_critical_signal = any(c["tier"] == "CRITICAL" for c in flagged_combos)
        has_high_signal = any(c["tier"] == "HIGH" for c in flagged_combos)

        if allergy_flags or (has_critical_signal and any(c["prr"] >= 3.0 for c in flagged_combos)):
            status = "CRITICAL_CONTRAINDICATION"
            color = "#D32F2F"  # Red
            rec = f"CONTRAINDICATED: Do NOT initiate {new_drug_name}. Critical safety signals or documented allergies present."
        elif has_high_signal or len(flagged_combos) >= 3:
            status = "HIGH_RISK"
            color = "#E65100"  # Orange
            rec = f"HIGH RISK: Significant pharmacovigilance signals identified. Consider safer therapeutic alternative or intense clinical monitoring."
        elif flagged_combos:
            status = "MODERATE_RISK"
            color = "#F57C00"  # Amber
            rec = f"CAUTION: Potential interactions noted. Adjust dosing schedule or monitor clinical parameters (e.g. labs, symptoms)."
        else:
            status = "LOW_RISK_COMPATIBLE"
            color = "#388E3C"  # Green
            rec = f"COMPATIBLE: No known high-confidence FAERS disproportionality or allergic contraindications detected."

        return DrugSafetyAssessment(
            new_drug_raw=new_drug_name,
            new_drug_normalized=norm_drug,
            rxcui=rxcui,
            overall_safety_status=status,
            risk_color=color,
            allergy_flags=allergy_flags,
            vulnerability_flags=vulnerability_flags,
            flagged_combinations=flagged_combos,
            recommendation=rec,
        )
