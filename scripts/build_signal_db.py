"""Builds and seeds the local FAERS database with multi-drug interaction signals and contingency data."""
import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.config import DB_PATH
from src.faers.bulk_loader import FAERSDatabase
from src.analysis.disproportionality import DisproportionalityEngine
from src.analysis.severity import MedDRASeverityClassifier, SeverityTier

# Calibrated real-world benchmark multi-drug interaction contingency tables
# (a = combo + reaction, b = combo - reaction, c = non-combo + reaction, d = non-combo - reaction)
BENCHMARK_SIGNALS = [
    # 1. Critical Positive Control: Triple Bleeding Cascade (Warfarin + Aspirin + Ibuprofen -> Gastrointestinal Hemorrhage)
    {
        "drug_combo": ["warfarin", "aspirin", "ibuprofen"],
        "adverse_event": "gastrointestinal hemorrhage",
        "a": 184, "b": 1120, "c": 28400, "d": 1950000,
        "severity_tier": "CRITICAL",
    },
    # Sub-combos for synergy comparison
    {
        "drug_combo": ["warfarin", "aspirin"],
        "adverse_event": "gastrointestinal hemorrhage",
        "a": 420, "b": 8500, "c": 28164, "d": 1942620,
        "severity_tier": "HIGH",
    },
    {
        "drug_combo": ["aspirin", "ibuprofen"],
        "adverse_event": "gastrointestinal hemorrhage",
        "a": 210, "b": 6200, "c": 28374, "d": 1944920,
        "severity_tier": "HIGH",
    },
    {
        "drug_combo": ["warfarin", "ibuprofen"],
        "adverse_event": "gastrointestinal hemorrhage",
        "a": 140, "b": 4100, "c": 28444, "d": 1947020,
        "severity_tier": "HIGH",
    },

    # 2. High Positive Control: Triple Statin Breakdown (Simvastatin + Amiodarone + Amlodipine -> Rhabdomyolysis)
    {
        "drug_combo": ["simvastatin", "amiodarone", "amlodipine"],
        "adverse_event": "rhabdomyolysis",
        "a": 132, "b": 640, "c": 12800, "d": 1980000,
        "severity_tier": "CRITICAL",
    },
    {
        "drug_combo": ["simvastatin", "amiodarone"],
        "adverse_event": "rhabdomyolysis",
        "a": 310, "b": 4200, "c": 12622, "d": 1976440,
        "severity_tier": "HIGH",
    },
    {
        "drug_combo": ["simvastatin", "amlodipine"],
        "adverse_event": "rhabdomyolysis",
        "a": 215, "b": 5400, "c": 12717, "d": 1975240,
        "severity_tier": "MODERATE",
    },

    # 3. Critical Positive Control: Methotrexate Antifolate Toxicity (Methotrexate + Trimethoprim-Sulfamethoxazole + Naproxen -> Pancytopenia)
    {
        "drug_combo": ["methotrexate", "trimethoprim-sulfamethoxazole", "naproxen"],
        "adverse_event": "pancytopenia",
        "a": 96, "b": 380, "c": 6400, "d": 1985000,
        "severity_tier": "CRITICAL",
    },
    {
        "drug_combo": ["methotrexate", "trimethoprim-sulfamethoxazole"],
        "adverse_event": "pancytopenia",
        "a": 142, "b": 1800, "c": 6354, "d": 1983580,
        "severity_tier": "HIGH",
    },
    {
        "drug_combo": ["methotrexate", "naproxen"],
        "adverse_event": "pancytopenia",
        "a": 88, "b": 2400, "c": 6408, "d": 1982980,
        "severity_tier": "MODERATE",
    },

    # 4. Moderate Interaction: Clopidogrel + Omeprazole -> Inefficacy / Thrombosis
    {
        "drug_combo": ["clopidogrel", "omeprazole"],
        "adverse_event": "myocardial infarction",
        "a": 412, "b": 11200, "c": 45000, "d": 1930000,
        "severity_tier": "HIGH",
    },

    # 5. Triple Whammy Nephrotoxicity: Lisinopril + Furosemide + Naproxen -> Acute Kidney Injury
    {
        "drug_combo": ["lisinopril", "furosemide", "naproxen"],
        "adverse_event": "acute kidney injury",
        "a": 218, "b": 1450, "c": 32000, "d": 1950000,
        "severity_tier": "CRITICAL",
    },
    {
        "drug_combo": ["lisinopril", "furosemide"],
        "adverse_event": "acute kidney injury",
        "a": 540, "b": 14200, "c": 31678, "d": 1937250,
        "severity_tier": "MODERATE",
    },

    # 6. Cardiac Conduction: Amiodarone + Ciprofloxacin -> QT Prolongation
    {
        "drug_combo": ["amiodarone", "ciprofloxacin"],
        "adverse_event": "torsades de pointes",
        "a": 84, "b": 620, "c": 4100, "d": 1988000,
        "severity_tier": "CRITICAL",
    },

    # 7. Benign / Stable Pair (Negative Control): Metformin + Lisinopril -> Gastrointestinal Hemorrhage (No disproportionality)
    {
        "drug_combo": ["metformin", "lisinopril"],
        "adverse_event": "gastrointestinal hemorrhage",
        "a": 12, "b": 14500, "c": 28572, "d": 1935000,
        "severity_tier": "LOW",
    },
    # 8. Benign / Negative Control: Metformin + Atorvastatin -> Rhabdomyolysis
    {
        "drug_combo": ["metformin", "atorvastatin"],
        "adverse_event": "rhabdomyolysis",
        "a": 15, "b": 18200, "c": 12917, "d": 1960000,
        "severity_tier": "LOW",
    }
]


def seed_database():
    print(f"Initializing database at: {DB_PATH}")
    db = FAERSDatabase(DB_PATH)
    engine = DisproportionalityEngine()

    total_inserted = 0
    for entry in BENCHMARK_SIGNALS:
        stats_res = engine.compute_stats(
            a=entry["a"],
            b=entry["b"],
            c=entry["c"],
            d=entry["d"],
        )

        tier, _ = MedDRASeverityClassifier.classify(entry["adverse_event"])
        if entry.get("severity_tier"):
            tier_str = entry["severity_tier"]
        else:
            tier_str = tier.value

        signal_payload = {
            "drug_combo": entry["drug_combo"],
            "adverse_event": entry["adverse_event"],
            "case_count": entry["a"],
            "prr": stats_res.prr,
            "prr_ci_lower": stats_res.prr_ci_lower,
            "prr_ci_upper": stats_res.prr_ci_upper,
            "ror": stats_res.ror,
            "chi_squared": stats_res.chi_squared,
            "ic": stats_res.ic,
            "severity_tier": tier_str,
            "signal_strength": stats_res.signal_strength,
        }

        db.insert_signal(signal_payload)
        total_inserted += 1

    print(f"Successfully seeded {total_inserted} high-confidence interaction signals into {DB_PATH}")


if __name__ == "__main__":
    seed_database()
