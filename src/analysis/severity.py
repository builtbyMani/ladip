"""MedDRA System Organ Class (SOC) severity classification and FAERS outcome tiering."""
from enum import Enum
from typing import Dict, Optional, Tuple, Set


class SeverityTier(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MODERATE = "MODERATE"
    LOW = "LOW"


# Known MedDRA Preferred Terms and their clinical severity mapping
CRITICAL_TERMS: Set[str] = {
    "death", "cardiac arrest", "torsades de pointes", "ventricular fibrillation",
    "ventricular tachycardia", "myocardial infarction", "acute hepatic failure",
    "hepatic necrosis", "hepatotoxicity", "acute kidney injury", "renal failure acute",
    "renal tubular necrosis", "rhabdomyolysis", "gastrointestinal haemorrhage",
    "gastrointestinal hemorrhage", "intracranial haemorrhage", "intracranial hemorrhage",
    "cerebral haemorrhage", "pancytopenia", "agranulocytosis", "aplastic anaemia",
    "aplastic anemia", "stevens-johnson syndrome", "toxic epidermal necrolysis",
    "anaphylactic shock", "respiratory arrest", "shock", "angioedema life threatening",
}

HIGH_TERMS: Set[str] = {
    "hospitalisation", "hospitalization", "deep vein thrombosis", "pulmonary embolism",
    "pancreatitis", "pancreatitis acute", "thrombocytopenia", "severe myopathy",
    "myopathy", "syncope", "loss of consciousness", "convulsion", "seizure",
    "hypoglycaemic coma", "hypoglycemia severe", "neutropenia", "atrial fibrillation",
    "qt prolongation", "electrocardiogram qt prolonged", "gastrointestinal ulcer haemorrhage",
    "peptic ulcer perforation", "leukopenia", "cardiac failure congestive",
}

MODERATE_TERMS: Set[str] = {
    "oedema", "edema", "edema peripheral", "alanine aminotransferase increased",
    "aspartate aminotransferase increased", "blood creatinine increased",
    "hypertension", "hypotension", "bradycardia", "tachycardia", "dizziness",
    "vomiting", "nausea severe", "rash generalised", "tremor", "confusional state",
    "hyperkalaemia", "hyperkalemia", "hypokalaemia", "hypokalemia", "dyspnoea",
    "gastritis", "vertigo", "haematuria", "hematuria",
}

LOW_TERMS: Set[str] = {
    "headache", "nausea", "fatigue", "asthenia", "somnolence", "insomnia",
    "dry mouth", "dyspepsia", "constipation", "diarrhoea", "diarrhea",
    "pruritus", "rash", "myalgia mild", "abdominal discomfort", "alopecia",
}

# FAERS outcome code priority
OUTCOME_SEVERITY_MAP: Dict[str, SeverityTier] = {
    "DE": SeverityTier.CRITICAL,  # Death
    "LT": SeverityTier.CRITICAL,  # Life-Threatening
    "HO": SeverityTier.HIGH,      # Hospitalization
    "DS": SeverityTier.HIGH,      # Disability
    "CA": SeverityTier.HIGH,      # Congenital Anomaly
    "RI": SeverityTier.MODERATE,  # Required Intervention
    "OT": SeverityTier.LOW,       # Other
}


class MedDRASeverityClassifier:
    """Classifies adverse reactions into clinically actionable severity tiers."""

    @classmethod
    def classify(cls, reaction_name: str, outcome_code: Optional[str] = None) -> Tuple[SeverityTier, str]:
        """Classify adverse reaction using MedDRA term matching and FAERS outcome codes."""
        r = reaction_name.lower().strip()

        # 1. Check direct outcome code if available
        if outcome_code and outcome_code.upper() in OUTCOME_SEVERITY_MAP:
            outcome_tier = OUTCOME_SEVERITY_MAP[outcome_code.upper()]
            if outcome_tier == SeverityTier.CRITICAL:
                return SeverityTier.CRITICAL, f"FAERS Outcome: {outcome_code.upper()} (Life-threatening/Death)"

        # 2. Check clinical MedDRA term dictionaries
        for crit in CRITICAL_TERMS:
            if crit in r or r in crit:
                return SeverityTier.CRITICAL, f"Critical MedDRA Term: {reaction_name}"

        for high in HIGH_TERMS:
            if high in r or r in high:
                return SeverityTier.HIGH, f"High-Severity MedDRA Term: {reaction_name}"

        for mod in MODERATE_TERMS:
            if mod in r or r in mod:
                return SeverityTier.MODERATE, f"Moderate MedDRA Term: {reaction_name}"

        for low in LOW_TERMS:
            if low in r or r in low:
                return SeverityTier.LOW, f"Low-Severity MedDRA Term: {reaction_name}"

        # 3. Fallback based on outcome code if present
        if outcome_code and outcome_code.upper() in OUTCOME_SEVERITY_MAP:
            return OUTCOME_SEVERITY_MAP[outcome_code.upper()], f"FAERS Outcome Code: {outcome_code.upper()}"

        # Default conservative tier
        return SeverityTier.MODERATE, f"Unclassified Reaction: {reaction_name}"

    @classmethod
    def get_color(cls, tier: SeverityTier) -> str:
        if tier == SeverityTier.CRITICAL:
            return "#DC2626"  # Editorial Coral
        elif tier == SeverityTier.HIGH:
            return "#E8C840"  # Editorial Gold
        elif tier == SeverityTier.MODERATE:
            return "#D4A5E5"  # Editorial Lavender
        return "#1B7A3D"      # Editorial Forest Green
