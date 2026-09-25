"""Generates synthetic longitudinal patient profiles covering positive and negative clinical controls with Indian demographic representation for hackathon demonstrations."""
import sys
from datetime import date, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.patient.models import Medication, PatientProfile, Symptom
from src.patient.memory import PatientStore


def generate_profiles():
    store = PatientStore()
    today = date.today()

    # 1. POSITIVE CONTROL 1: Warfarin + Aspirin + Ibuprofen (Severe GI Bleeding)
    # Patient on Warfarin and Aspirin for 6 months; added Ibuprofen 5 days ago; GI bleeding started 2 days ago.
    p1 = PatientProfile(
        patient_id="PT_BLEED_001",
        name="Ramesh Sharma (Atrial Fibrillation / Osteoarthritis)",
        age=68,
        sex="M",
        weight=72.5,
        allergies=["Penicillin"],
        conditions=["Atrial Fibrillation", "Hypertension", "Bilateral Knee Osteoarthritis"],
        medications=[
            Medication(
                drug_name="Warfarin",
                normalized_name="warfarin",
                rxcui="11289",
                dose=5.0,
                dose_unit="mg",
                frequency="QD",
                route="oral",
                start_date=today - timedelta(days=180),
            ),
            Medication(
                drug_name="Aspirin",
                normalized_name="aspirin",
                rxcui="1191",
                dose=81.0,
                dose_unit="mg",
                frequency="QD",
                route="oral",
                start_date=today - timedelta(days=180),
            ),
            Medication(
                drug_name="Ibuprofen",
                normalized_name="ibuprofen",
                rxcui="5640",
                dose=600.0,
                dose_unit="mg",
                frequency="TID",
                route="oral",
                start_date=today - timedelta(days=5),
            ),
        ],
        symptoms=[
            Symptom(
                description="Gastrointestinal Hemorrhage",
                meddra_term="gastrointestinal hemorrhage",
                severity=9,
                onset_date=today - timedelta(days=2),
                daily_pattern="constant",
            )
        ],
        lab_results=[
            {"test": "Hemoglobin", "value": 8.1, "unit": "g/dL", "is_abnormal": True},
            {"test": "INR", "value": 3.8, "unit": "", "is_abnormal": True},
            {"test": "Platelet Count", "value": 210, "unit": "10^3/uL", "is_abnormal": False},
        ],
    )
    store.save(p1)

    # 2. POSITIVE CONTROL 2: Simvastatin + Amlodipine + Amiodarone (Rhabdomyolysis)
    # Patient on Simvastatin and Amlodipine for 1 year; added Amiodarone 8 days ago; severe myopathy started 3 days ago.
    p2 = PatientProfile(
        patient_id="PT_STATIN_002",
        name="Sunita Patel (Dyslipidemia / Ventricular Arrhythmia)",
        age=62,
        sex="F",
        weight=66.0,
        allergies=[],
        conditions=["Hyperlipidemia", "Essential Hypertension", "Ventricular Premature Beats"],
        medications=[
            Medication(
                drug_name="Simvastatin",
                normalized_name="simvastatin",
                rxcui="36567",
                dose=40.0,
                dose_unit="mg",
                frequency="QD",
                route="oral",
                start_date=today - timedelta(days=365),
            ),
            Medication(
                drug_name="Amlodipine",
                normalized_name="amlodipine",
                rxcui="17767",
                dose=10.0,
                dose_unit="mg",
                frequency="QD",
                route="oral",
                start_date=today - timedelta(days=365),
            ),
            Medication(
                drug_name="Amiodarone",
                normalized_name="amiodarone",
                rxcui="703",
                dose=200.0,
                dose_unit="mg",
                frequency="QD",
                route="oral",
                start_date=today - timedelta(days=8),
            ),
        ],
        symptoms=[
            Symptom(
                description="Severe Myopathy & Dark Urine",
                meddra_term="rhabdomyolysis",
                severity=9,
                onset_date=today - timedelta(days=3),
            )
        ],
        lab_results=[
            {"test": "Creatine Kinase (CK)", "value": 4820.0, "unit": "U/L", "is_abnormal": True},
            {"test": "Serum Creatinine", "value": 2.1, "unit": "mg/dL", "is_abnormal": True},
            {"test": "ALT", "value": 115.0, "unit": "U/L", "is_abnormal": True},
        ],
    )
    store.save(p2)

    # 3. POSITIVE CONTROL 3: Methotrexate + Naproxen + Bactrim (Pancytopenia)
    # Patient on Methotrexate and Naproxen for RA; prescribed Bactrim for UTI 7 days ago; pancytopenia onset 2 days ago.
    p3 = PatientProfile(
        patient_id="PT_MTX_003",
        name="Kavitha Reddy (Rheumatoid Arthritis / UTI)",
        age=54,
        sex="F",
        weight=58.0,
        allergies=["Sulfa"],
        conditions=["Seropositive Rheumatoid Arthritis", "Recurrent Urinary Tract Infection"],
        medications=[
            Medication(
                drug_name="Methotrexate",
                normalized_name="methotrexate",
                rxcui="6851",
                dose=15.0,
                dose_unit="mg",
                frequency="weekly",
                route="oral",
                start_date=today - timedelta(days=240),
            ),
            Medication(
                drug_name="Naproxen",
                normalized_name="naproxen",
                rxcui="7258",
                dose=500.0,
                dose_unit="mg",
                frequency="BID",
                route="oral",
                start_date=today - timedelta(days=240),
            ),
            Medication(
                drug_name="Trimethoprim-Sulfamethoxazole",
                normalized_name="trimethoprim-sulfamethoxazole",
                rxcui="10528",
                dose=800.0,
                dose_unit="mg",
                frequency="BID",
                route="oral",
                start_date=today - timedelta(days=7),
            ),
        ],
        symptoms=[
            Symptom(
                description="Profound Fatigue and Petechiae (Pancytopenia)",
                meddra_term="pancytopenia",
                severity=10,
                onset_date=today - timedelta(days=2),
            )
        ],
        lab_results=[
            {"test": "WBC", "value": 1.2, "unit": "10^3/uL", "is_abnormal": True},
            {"test": "Platelets", "value": 28, "unit": "10^3/uL", "is_abnormal": True},
            {"test": "RBC", "value": 2.4, "unit": "10^6/uL", "is_abnormal": True},
        ],
    )
    store.save(p3)

    # 4. NEGATIVE CONTROL: Stable Chronic Regimen (Alert Fatigue Suppression Demo)
    # Patient on Metformin, Lisinopril, and Atorvastatin for > 2 years with NO symptoms.
    p4 = PatientProfile(
        patient_id="PT_STABLE_004",
        name="Rajesh Varma (Stable T2D / HTN - 2yr Cohort)",
        age=58,
        sex="M",
        weight=81.0,
        allergies=[],
        conditions=["Type 2 Diabetes Mellitus", "Primary Hypertension", "Dyslipidemia"],
        medications=[
            Medication(
                drug_name="Metformin",
                normalized_name="metformin",
                rxcui="6809",
                dose=1000.0,
                dose_unit="mg",
                frequency="BID",
                route="oral",
                start_date=today - timedelta(days=730),
            ),
            Medication(
                drug_name="Lisinopril",
                normalized_name="lisinopril",
                rxcui="29046",
                dose=20.0,
                dose_unit="mg",
                frequency="QD",
                route="oral",
                start_date=today - timedelta(days=730),
            ),
            Medication(
                drug_name="Atorvastatin",
                normalized_name="atorvastatin",
                rxcui="83367",
                dose=40.0,
                dose_unit="mg",
                frequency="QD",
                route="oral",
                start_date=today - timedelta(days=730),
            ),
        ],
        symptoms=[],
        lab_results=[
            {"test": "HbA1c", "value": 6.7, "unit": "%", "is_abnormal": False},
            {"test": "eGFR", "value": 92.0, "unit": "mL/min/1.73m2", "is_abnormal": False},
            {"test": "Serum Creatinine", "value": 0.92, "unit": "mg/dL", "is_abnormal": False},
        ],
    )
    store.save(p4)

    # 5. CARDIOLOGY CONTROL: Clopidogrel + Omeprazole (Antiplatelet Attenuation via CYP2C19)
    p5 = PatientProfile(
        patient_id="PT_CARDIO_005",
        name="Arjun Nair (Post-PCI Stent / Acid Reflux)",
        age=52,
        sex="M",
        weight=76.0,
        allergies=[],
        conditions=["Coronary Artery Disease (s/p DES Stent)", "GERD"],
        medications=[
            Medication(
                drug_name="Clopidogrel",
                normalized_name="clopidogrel",
                rxcui="32968",
                dose=75.0,
                dose_unit="mg",
                frequency="QD",
                route="oral",
                start_date=today - timedelta(days=45),
            ),
            Medication(
                drug_name="Omeprazole",
                normalized_name="omeprazole",
                rxcui="7646",
                dose=20.0,
                dose_unit="mg",
                frequency="QD",
                route="oral",
                start_date=today - timedelta(days=30),
            ),
            Medication(
                drug_name="Aspirin",
                normalized_name="aspirin",
                rxcui="1191",
                dose=81.0,
                dose_unit="mg",
                frequency="QD",
                route="oral",
                start_date=today - timedelta(days=45),
            ),
        ],
        symptoms=[
            Symptom(
                description="Exertional Chest Tightness",
                meddra_term="myocardial infarction",
                severity=7,
                onset_date=today - timedelta(days=4),
            )
        ],
        lab_results=[
            {"test": "Troponin-I", "value": 0.08, "unit": "ng/mL", "is_abnormal": True},
            {"test": "Platelet Reactivity Units (PRU)", "value": 260, "unit": "", "is_abnormal": True},
        ],
    )
    store.save(p5)

    print(f"Successfully generated 5 Indian clinical demo patient profiles in {store.storage_dir}")


if __name__ == "__main__":
    generate_profiles()
