"""Drug normalization module leveraging NLM RxNorm REST API with local cache and fallback."""
import logging
import re
from typing import Dict, Optional, Tuple
import requests

from src.config import RXNORM_BASE_URL

logger = logging.getLogger(__name__)

# Common brand-to-generic & ingredient mapping for instant zero-latency offline resolution
# Includes Indian & global trade names, medicinal (generic) display names, default dosages (mg), and indications.
KNOWN_DRUG_MAP: Dict[str, Dict[str, str]] = {
    # Anticoagulants
    "coumadin": {
        "generic": "warfarin",
        "medicinal_name": "Warfarin Sodium",
        "default_dose": "5",
        "indication": "Blood Thinner / Anticoagulant (Clot & Stroke Prevention)",
        "rxcui": "11289",
        "class": "anticoagulant",
    },
    "warfarin": {
        "generic": "warfarin",
        "medicinal_name": "Warfarin Sodium",
        "default_dose": "5",
        "indication": "Blood Thinner / Anticoagulant (Clot & Stroke Prevention)",
        "rxcui": "11289",
        "class": "anticoagulant",
    },
    "warf": {
        "generic": "warfarin",
        "medicinal_name": "Warfarin Sodium",
        "default_dose": "5",
        "indication": "Blood Thinner / Anticoagulant (Clot & Stroke Prevention)",
        "rxcui": "11289",
        "class": "anticoagulant",
    },
    "acitrom": {
        "generic": "warfarin",
        "medicinal_name": "Acenocoumarol (Vitamin K Antagonist)",
        "default_dose": "2",
        "indication": "Oral Anticoagulant (Thromboembolism Prevention)",
        "rxcui": "11289",
        "class": "anticoagulant",
    },
    # Antiplatelets & Salicylates
    "aspirin": {
        "generic": "aspirin",
        "medicinal_name": "Aspirin (Acetylsalicylic Acid)",
        "default_dose": "75",
        "indication": "Antiplatelet Blood Thinner & Analgesic",
        "rxcui": "1191",
        "class": "nsaid_antiplatelet",
    },
    "ecosprin": {
        "generic": "aspirin",
        "medicinal_name": "Aspirin (Acetylsalicylic Acid)",
        "default_dose": "75",
        "indication": "Antiplatelet Blood Thinner (Cardiac Protection)",
        "rxcui": "1191",
        "class": "nsaid_antiplatelet",
    },
    "disprin": {
        "generic": "aspirin",
        "medicinal_name": "Aspirin (Acetylsalicylic Acid)",
        "default_dose": "325",
        "indication": "Analgesic & Antiplatelet (Headache / Pain Relief)",
        "rxcui": "1191",
        "class": "nsaid_antiplatelet",
    },
    "bayer": {
        "generic": "aspirin",
        "medicinal_name": "Aspirin (Acetylsalicylic Acid)",
        "default_dose": "81",
        "indication": "Antiplatelet & Analgesic",
        "rxcui": "1191",
        "class": "nsaid_antiplatelet",
    },
    "ecotrin": {
        "generic": "aspirin",
        "medicinal_name": "Aspirin (Acetylsalicylic Acid)",
        "default_dose": "81",
        "indication": "Enteric-Coated Antiplatelet & Analgesic",
        "rxcui": "1191",
        "class": "nsaid_antiplatelet",
    },
    "plavix": {
        "generic": "clopidogrel",
        "medicinal_name": "Clopidogrel Bisulfate",
        "default_dose": "75",
        "indication": "Antiplatelet (Post-Stent & Acute Coronary Syndrome)",
        "rxcui": "32968",
        "class": "antiplatelet",
    },
    "clopitab": {
        "generic": "clopidogrel",
        "medicinal_name": "Clopidogrel Bisulfate",
        "default_dose": "75",
        "indication": "Antiplatelet (Post-Stent & Coronary Protection)",
        "rxcui": "32968",
        "class": "antiplatelet",
    },
    "clopilet": {
        "generic": "clopidogrel",
        "medicinal_name": "Clopidogrel Bisulfate",
        "default_dose": "75",
        "indication": "Antiplatelet (Post-Stent & Coronary Protection)",
        "rxcui": "32968",
        "class": "antiplatelet",
    },
    "clopidogrel": {
        "generic": "clopidogrel",
        "medicinal_name": "Clopidogrel Bisulfate",
        "default_dose": "75",
        "indication": "Antiplatelet (Post-Stent & Coronary Protection)",
        "rxcui": "32968",
        "class": "antiplatelet",
    },
    # Paracetamol / Acetaminophen (Indian & Global Brands)
    "dolo": {
        "generic": "acetaminophen",
        "medicinal_name": "Paracetamol (Acetaminophen)",
        "default_dose": "650",
        "indication": "Antipyretic & Analgesic (Fever & Mild-to-Moderate Pain)",
        "rxcui": "161",
        "class": "analgesic_antipyretic",
    },
    "crocin": {
        "generic": "acetaminophen",
        "medicinal_name": "Paracetamol (Acetaminophen)",
        "default_dose": "650",
        "indication": "Antipyretic & Analgesic (Fever & Headache Relief)",
        "rxcui": "161",
        "class": "analgesic_antipyretic",
    },
    "calpol": {
        "generic": "acetaminophen",
        "medicinal_name": "Paracetamol (Acetaminophen)",
        "default_dose": "650",
        "indication": "Antipyretic & Analgesic (Fever & Body Pain)",
        "rxcui": "161",
        "class": "analgesic_antipyretic",
    },
    "sumo": {
        "generic": "acetaminophen",
        "medicinal_name": "Paracetamol + Nimesulide",
        "default_dose": "650",
        "indication": "Antipyretic & Analgesic (Fever & Pain)",
        "rxcui": "161",
        "class": "analgesic_antipyretic",
    },
    "tylenol": {
        "generic": "acetaminophen",
        "medicinal_name": "Paracetamol (Acetaminophen)",
        "default_dose": "500",
        "indication": "Antipyretic & Analgesic (Fever & Pain Relief)",
        "rxcui": "161",
        "class": "analgesic_antipyretic",
    },
    "paracetamol": {
        "generic": "acetaminophen",
        "medicinal_name": "Paracetamol (Acetaminophen)",
        "default_dose": "650",
        "indication": "Antipyretic & Analgesic (Fever & Pain Relief)",
        "rxcui": "161",
        "class": "analgesic_antipyretic",
    },
    "acetaminophen": {
        "generic": "acetaminophen",
        "medicinal_name": "Paracetamol (Acetaminophen)",
        "default_dose": "650",
        "indication": "Antipyretic & Analgesic (Fever & Pain Relief)",
        "rxcui": "161",
        "class": "analgesic_antipyretic",
    },
    # NSAIDs (Painkillers)
    "brufen": {
        "generic": "ibuprofen",
        "medicinal_name": "Ibuprofen",
        "default_dose": "400",
        "indication": "NSAID Anti-Inflammatory & Painkiller",
        "rxcui": "5640",
        "class": "nsaid",
    },
    "combiflam": {
        "generic": "ibuprofen",
        "medicinal_name": "Ibuprofen (400 mg) + Paracetamol (325 mg)",
        "default_dose": "400",
        "indication": "Combined NSAID + Analgesic (Inflammatory Pain & Fever)",
        "rxcui": "5640",
        "class": "nsaid",
    },
    "imol": {
        "generic": "ibuprofen",
        "medicinal_name": "Ibuprofen + Paracetamol",
        "default_dose": "400",
        "indication": "Combined NSAID + Analgesic",
        "rxcui": "5640",
        "class": "nsaid",
    },
    "advil": {
        "generic": "ibuprofen",
        "medicinal_name": "Ibuprofen",
        "default_dose": "400",
        "indication": "NSAID Anti-Inflammatory & Painkiller",
        "rxcui": "5640",
        "class": "nsaid",
    },
    "motrin": {
        "generic": "ibuprofen",
        "medicinal_name": "Ibuprofen",
        "default_dose": "400",
        "indication": "NSAID Anti-Inflammatory & Painkiller",
        "rxcui": "5640",
        "class": "nsaid",
    },
    "ibuprofen": {
        "generic": "ibuprofen",
        "medicinal_name": "Ibuprofen",
        "default_dose": "400",
        "indication": "NSAID Anti-Inflammatory & Painkiller",
        "rxcui": "5640",
        "class": "nsaid",
    },
    "voveran": {
        "generic": "ibuprofen",
        "medicinal_name": "Diclofenac Sodium (NSAID)",
        "default_dose": "50",
        "indication": "NSAID Anti-Inflammatory (Joint & Muscular Pain)",
        "rxcui": "3355",
        "class": "nsaid",
    },
    "zerodol": {
        "generic": "ibuprofen",
        "medicinal_name": "Aceclofenac (NSAID)",
        "default_dose": "100",
        "indication": "NSAID Anti-Inflammatory (Arthritis & Joint Pain)",
        "rxcui": "5640",
        "class": "nsaid",
    },
    "meftal": {
        "generic": "ibuprofen",
        "medicinal_name": "Mefenamic Acid (NSAID)",
        "default_dose": "500",
        "indication": "NSAID Antispasmodic & Painkiller",
        "rxcui": "5640",
        "class": "nsaid",
    },
    "aleve": {
        "generic": "naproxen",
        "medicinal_name": "Naproxen Sodium",
        "default_dose": "500",
        "indication": "NSAID Anti-Inflammatory (Joint & Migraine Pain)",
        "rxcui": "7258",
        "class": "nsaid",
    },
    "naprosyn": {
        "generic": "naproxen",
        "medicinal_name": "Naproxen",
        "default_dose": "500",
        "indication": "NSAID Anti-Inflammatory (Arthritis & Joint Pain)",
        "rxcui": "7258",
        "class": "nsaid",
    },
    "naproxen": {
        "generic": "naproxen",
        "medicinal_name": "Naproxen",
        "default_dose": "500",
        "indication": "NSAID Anti-Inflammatory (Arthritis & Joint Pain)",
        "rxcui": "7258",
        "class": "nsaid",
    },
    # Statins
    "zocor": {
        "generic": "simvastatin",
        "medicinal_name": "Simvastatin",
        "default_dose": "40",
        "indication": "HMG-CoA Reductase Inhibitor (Cholesterol Lowering)",
        "rxcui": "36567",
        "class": "statin",
    },
    "simvotin": {
        "generic": "simvastatin",
        "medicinal_name": "Simvastatin",
        "default_dose": "40",
        "indication": "HMG-CoA Reductase Inhibitor (Cholesterol Lowering)",
        "rxcui": "36567",
        "class": "statin",
    },
    "simvastatin": {
        "generic": "simvastatin",
        "medicinal_name": "Simvastatin",
        "default_dose": "40",
        "indication": "HMG-CoA Reductase Inhibitor (Cholesterol Lowering)",
        "rxcui": "36567",
        "class": "statin",
    },
    "lipitor": {
        "generic": "atorvastatin",
        "medicinal_name": "Atorvastatin Calcium",
        "default_dose": "20",
        "indication": "Statin Lipid-Lowering Agent",
        "rxcui": "83367",
        "class": "statin",
    },
    "atorva": {
        "generic": "atorvastatin",
        "medicinal_name": "Atorvastatin Calcium",
        "default_dose": "20",
        "indication": "Statin Lipid-Lowering Agent",
        "rxcui": "83367",
        "class": "statin",
    },
    "tonact": {
        "generic": "atorvastatin",
        "medicinal_name": "Atorvastatin Calcium",
        "default_dose": "20",
        "indication": "Statin Lipid-Lowering Agent",
        "rxcui": "83367",
        "class": "statin",
    },
    "atorvastatin": {
        "generic": "atorvastatin",
        "medicinal_name": "Atorvastatin Calcium",
        "default_dose": "20",
        "indication": "Statin Lipid-Lowering Agent",
        "rxcui": "83367",
        "class": "statin",
    },
    # Antiarrhythmics & Cardiac
    "cordarone": {
        "generic": "amiodarone",
        "medicinal_name": "Amiodarone Hydrochloride",
        "default_dose": "200",
        "indication": "Class III Antiarrhythmic (Cardiac Rhythm Control)",
        "rxcui": "703",
        "class": "antiarrhythmic",
    },
    "pacerone": {
        "generic": "amiodarone",
        "medicinal_name": "Amiodarone Hydrochloride",
        "default_dose": "200",
        "indication": "Class III Antiarrhythmic (Cardiac Rhythm Control)",
        "rxcui": "703",
        "class": "antiarrhythmic",
    },
    "amiodarone": {
        "generic": "amiodarone",
        "medicinal_name": "Amiodarone Hydrochloride",
        "default_dose": "200",
        "indication": "Class III Antiarrhythmic (Cardiac Rhythm Control)",
        "rxcui": "703",
        "class": "antiarrhythmic",
    },
    "norvasc": {
        "generic": "amlodipine",
        "medicinal_name": "Amlodipine Besylate",
        "default_dose": "5",
        "indication": "Calcium Channel Blocker (Hypertension & Angina)",
        "rxcui": "17767",
        "class": "calcium_channel_blocker",
    },
    "stamlo": {
        "generic": "amlodipine",
        "medicinal_name": "Amlodipine Besylate",
        "default_dose": "5",
        "indication": "Calcium Channel Blocker (Blood Pressure Control)",
        "rxcui": "17767",
        "class": "calcium_channel_blocker",
    },
    "amlong": {
        "generic": "amlodipine",
        "medicinal_name": "Amlodipine Besylate",
        "default_dose": "5",
        "indication": "Calcium Channel Blocker (Blood Pressure Control)",
        "rxcui": "17767",
        "class": "calcium_channel_blocker",
    },
    "amlodipine": {
        "generic": "amlodipine",
        "medicinal_name": "Amlodipine Besylate",
        "default_dose": "5",
        "indication": "Calcium Channel Blocker (Hypertension & Angina)",
        "rxcui": "17767",
        "class": "calcium_channel_blocker",
    },
    # Proton Pump Inhibitors (Gastric / Acidity)
    "prilosec": {
        "generic": "omeprazole",
        "medicinal_name": "Omeprazole",
        "default_dose": "20",
        "indication": "Proton Pump Inhibitor (Acidity, GERD & Ulcer Protection)",
        "rxcui": "7646",
        "class": "ppi",
    },
    "omez": {
        "generic": "omeprazole",
        "medicinal_name": "Omeprazole",
        "default_dose": "20",
        "indication": "Proton Pump Inhibitor (Acidity & Gastric Reflux)",
        "rxcui": "7646",
        "class": "ppi",
    },
    "omeprazole": {
        "generic": "omeprazole",
        "medicinal_name": "Omeprazole",
        "default_dose": "20",
        "indication": "Proton Pump Inhibitor (Acidity & Gastric Reflux)",
        "rxcui": "7646",
        "class": "ppi",
    },
    "pan": {
        "generic": "pantoprazole",
        "medicinal_name": "Pantoprazole Sodium",
        "default_dose": "40",
        "indication": "Proton Pump Inhibitor (Gastric Acid Suppression)",
        "rxcui": "40790",
        "class": "ppi",
    },
    "pantocid": {
        "generic": "pantoprazole",
        "medicinal_name": "Pantoprazole Sodium",
        "default_dose": "40",
        "indication": "Proton Pump Inhibitor (Gastric Acid Suppression)",
        "rxcui": "40790",
        "class": "ppi",
    },
    "pantoprazole": {
        "generic": "pantoprazole",
        "medicinal_name": "Pantoprazole Sodium",
        "default_dose": "40",
        "indication": "Proton Pump Inhibitor (Gastric Acid Suppression)",
        "rxcui": "40790",
        "class": "ppi",
    },
    "nexium": {
        "generic": "esomeprazole",
        "medicinal_name": "Esomeprazole Magnesium",
        "default_dose": "40",
        "indication": "Proton Pump Inhibitor (GERD & Erosive Esophagitis)",
        "rxcui": "283742",
        "class": "ppi",
    },
    "esomeprazole": {
        "generic": "esomeprazole",
        "medicinal_name": "Esomeprazole Magnesium",
        "default_dose": "40",
        "indication": "Proton Pump Inhibitor (GERD & Erosive Esophagitis)",
        "rxcui": "283742",
        "class": "ppi",
    },
    # DMARDs & Immunosuppressants
    "trexall": {
        "generic": "methotrexate",
        "medicinal_name": "Methotrexate Sodium",
        "default_dose": "15",
        "indication": "Antimetabolite DMARD (Rheumatoid Arthritis & Autoimmune)",
        "rxcui": "6851",
        "class": "antimetabolite_dmard",
    },
    "folitrax": {
        "generic": "methotrexate",
        "medicinal_name": "Methotrexate Sodium",
        "default_dose": "15",
        "indication": "Antimetabolite DMARD (Rheumatoid Arthritis & Psoriasis)",
        "rxcui": "6851",
        "class": "antimetabolite_dmard",
    },
    "rheumatrex": {
        "generic": "methotrexate",
        "medicinal_name": "Methotrexate Sodium",
        "default_dose": "15",
        "indication": "Antimetabolite DMARD (Rheumatoid Arthritis)",
        "rxcui": "6851",
        "class": "antimetabolite_dmard",
    },
    "methotrexate": {
        "generic": "methotrexate",
        "medicinal_name": "Methotrexate Sodium",
        "default_dose": "15",
        "indication": "Antimetabolite DMARD (Rheumatoid Arthritis)",
        "rxcui": "6851",
        "class": "antimetabolite_dmard",
    },
    # Antibiotics
    "bactrim": {
        "generic": "trimethoprim-sulfamethoxazole",
        "medicinal_name": "Trimethoprim + Sulfamethoxazole (Co-trimoxazole)",
        "default_dose": "800",
        "indication": "Sulfonamide Antibiotic (UTI & Bacterial Infections)",
        "rxcui": "10528",
        "class": "sulfonamide_antibiotic",
    },
    "septran": {
        "generic": "trimethoprim-sulfamethoxazole",
        "medicinal_name": "Trimethoprim + Sulfamethoxazole (Co-trimoxazole)",
        "default_dose": "800",
        "indication": "Sulfonamide Antibiotic (UTI & Bacterial Infections)",
        "rxcui": "10528",
        "class": "sulfonamide_antibiotic",
    },
    "septra": {
        "generic": "trimethoprim-sulfamethoxazole",
        "medicinal_name": "Trimethoprim + Sulfamethoxazole (Co-trimoxazole)",
        "default_dose": "800",
        "indication": "Sulfonamide Antibiotic (UTI & Bacterial Infections)",
        "rxcui": "10528",
        "class": "sulfonamide_antibiotic",
    },
    "co-trimoxazole": {
        "generic": "trimethoprim-sulfamethoxazole",
        "medicinal_name": "Trimethoprim + Sulfamethoxazole (Co-trimoxazole)",
        "default_dose": "800",
        "indication": "Sulfonamide Antibiotic (UTI & Bacterial Infections)",
        "rxcui": "10528",
        "class": "sulfonamide_antibiotic",
    },
    "trimethoprim-sulfamethoxazole": {
        "generic": "trimethoprim-sulfamethoxazole",
        "medicinal_name": "Trimethoprim + Sulfamethoxazole (Co-trimoxazole)",
        "default_dose": "800",
        "indication": "Sulfonamide Antibiotic (UTI & Bacterial Infections)",
        "rxcui": "10528",
        "class": "sulfonamide_antibiotic",
    },
    "augmentin": {
        "generic": "amoxicillin",
        "medicinal_name": "Amoxicillin + Clavulanic Acid",
        "default_dose": "625",
        "indication": "Beta-Lactam Penicillin Antibiotic",
        "rxcui": "723",
        "class": "penicillin",
    },
    "moxikind": {
        "generic": "amoxicillin",
        "medicinal_name": "Amoxicillin + Clavulanic Acid",
        "default_dose": "625",
        "indication": "Beta-Lactam Penicillin Antibiotic",
        "rxcui": "723",
        "class": "penicillin",
    },
    "amoxicillin": {
        "generic": "amoxicillin",
        "medicinal_name": "Amoxicillin Trihydrate",
        "default_dose": "500",
        "indication": "Penicillin Antibiotic",
        "rxcui": "723",
        "class": "penicillin",
    },
    "azithral": {
        "generic": "azithromycin",
        "medicinal_name": "Azithromycin Dihydrate",
        "default_dose": "500",
        "indication": "Macrolide Antibiotic (Respiratory & ENT Infections)",
        "rxcui": "18631",
        "class": "macrolide",
    },
    "azithromycin": {
        "generic": "azithromycin",
        "medicinal_name": "Azithromycin Dihydrate",
        "default_dose": "500",
        "indication": "Macrolide Antibiotic (Respiratory & ENT Infections)",
        "rxcui": "18631",
        "class": "macrolide",
    },
    "cipro": {
        "generic": "ciprofloxacin",
        "medicinal_name": "Ciprofloxacin Hydrochloride",
        "default_dose": "500",
        "indication": "Fluoroquinolone Antibiotic",
        "rxcui": "2551",
        "class": "fluoroquinolone",
    },
    "ciplox": {
        "generic": "ciprofloxacin",
        "medicinal_name": "Ciprofloxacin Hydrochloride",
        "default_dose": "500",
        "indication": "Fluoroquinolone Antibiotic",
        "rxcui": "2551",
        "class": "fluoroquinolone",
    },
    "ciprofloxacin": {
        "generic": "ciprofloxacin",
        "medicinal_name": "Ciprofloxacin Hydrochloride",
        "default_dose": "500",
        "indication": "Fluoroquinolone Antibiotic",
        "rxcui": "2551",
        "class": "fluoroquinolone",
    },
    # Antidiabetics & Antihypertensives
    "glucophage": {
        "generic": "metformin",
        "medicinal_name": "Metformin Hydrochloride",
        "default_dose": "500",
        "indication": "Biguanide Oral Antidiabetic (Type 2 Diabetes)",
        "rxcui": "6809",
        "class": "biguanide",
    },
    "glycomet": {
        "generic": "metformin",
        "medicinal_name": "Metformin Hydrochloride",
        "default_dose": "500",
        "indication": "Biguanide Oral Antidiabetic (Type 2 Diabetes)",
        "rxcui": "6809",
        "class": "biguanide",
    },
    "metformin": {
        "generic": "metformin",
        "medicinal_name": "Metformin Hydrochloride",
        "default_dose": "500",
        "indication": "Biguanide Oral Antidiabetic (Type 2 Diabetes)",
        "rxcui": "6809",
        "class": "biguanide",
    },
    "prinivil": {
        "generic": "lisinopril",
        "medicinal_name": "Lisinopril",
        "default_dose": "10",
        "indication": "ACE Inhibitor (Hypertension & Heart Failure)",
        "rxcui": "29046",
        "class": "ace_inhibitor",
    },
    "zestril": {
        "generic": "lisinopril",
        "medicinal_name": "Lisinopril",
        "default_dose": "10",
        "indication": "ACE Inhibitor (Hypertension & Heart Failure)",
        "rxcui": "29046",
        "class": "ace_inhibitor",
    },
    "lisinopril": {
        "generic": "lisinopril",
        "medicinal_name": "Lisinopril",
        "default_dose": "10",
        "indication": "ACE Inhibitor (Hypertension & Heart Failure)",
        "rxcui": "29046",
        "class": "ace_inhibitor",
    },
    "telma": {
        "generic": "telmisartan",
        "medicinal_name": "Telmisartan",
        "default_dose": "40",
        "indication": "Angiotensin Receptor Blocker (Hypertension)",
        "rxcui": "73494",
        "class": "arb",
    },
    "telmisartan": {
        "generic": "telmisartan",
        "medicinal_name": "Telmisartan",
        "default_dose": "40",
        "indication": "Angiotensin Receptor Blocker (Hypertension)",
        "rxcui": "73494",
        "class": "arb",
    },
    # Diuretics, Glycosides & SSRIs
    "lasix": {
        "generic": "furosemide",
        "medicinal_name": "Furosemide",
        "default_dose": "40",
        "indication": "Loop Diuretic (Edema & Fluid Overload)",
        "rxcui": "4603",
        "class": "loop_diuretic",
    },
    "furosemide": {
        "generic": "furosemide",
        "medicinal_name": "Furosemide",
        "default_dose": "40",
        "indication": "Loop Diuretic (Edema & Fluid Overload)",
        "rxcui": "4603",
        "class": "loop_diuretic",
    },
    "lanoxin": {
        "generic": "digoxin",
        "medicinal_name": "Digoxin",
        "default_dose": "0.25",
        "indication": "Cardiac Glycoside (Atrial Fibrillation & Heart Failure)",
        "rxcui": "3407",
        "class": "cardiac_glycoside",
    },
    "digoxin": {
        "generic": "digoxin",
        "medicinal_name": "Digoxin",
        "default_dose": "0.25",
        "indication": "Cardiac Glycoside (Atrial Fibrillation & Heart Failure)",
        "rxcui": "3407",
        "class": "cardiac_glycoside",
    },
    "fluoxetine": {
        "generic": "fluoxetine",
        "medicinal_name": "Fluoxetine Hydrochloride",
        "default_dose": "20",
        "indication": "SSRI Antidepressant",
        "rxcui": "4493",
        "class": "ssri",
    },
    "prozac": {
        "generic": "fluoxetine",
        "medicinal_name": "Fluoxetine Hydrochloride",
        "default_dose": "20",
        "indication": "SSRI Antidepressant",
        "rxcui": "4493",
        "class": "ssri",
    },
    "sertraline": {
        "generic": "sertraline",
        "medicinal_name": "Sertraline Hydrochloride",
        "default_dose": "50",
        "indication": "SSRI Antidepressant",
        "rxcui": "36437",
        "class": "ssri",
    },
    "zoloft": {
        "generic": "sertraline",
        "medicinal_name": "Sertraline Hydrochloride",
        "default_dose": "50",
        "indication": "SSRI Antidepressant",
        "rxcui": "36437",
        "class": "ssri",
    },
}


class RxNormNormalizer:
    def __init__(self, timeout: int = 4):
        self.cache: Dict[str, Dict[str, str]] = dict(KNOWN_DRUG_MAP)
        self.timeout = timeout

    def extract_embedded_dose(self, raw_name: str) -> Optional[float]:
        """Extract numeric dosage from strings like 'Dolo 650', 'Paracetamol 650mg', or 'Brufen 400'."""
        if not raw_name:
            return None
        match = re.search(r"\b(\d+(?:\.\d+)?)\s*(?:mg|mcg|g|ml)?\b", raw_name.lower())
        if match:
            try:
                val = float(match.group(1))
                if val > 0:
                    return val
            except ValueError:
                pass
        return None

    def clean_name(self, raw_name: str) -> str:
        """Strip dosage amounts, routes, and special characters from raw drug string."""
        if not raw_name:
            return ""
        s = raw_name.lower().strip()
        # Remove strengths with units like 10mg, 500 mg, 0.5 mcg, 100ml, 650g
        s = re.sub(r"\b\d+(\.\d+)?\s*(mg|mcg|g|ml|tablets?|capsules?|caps?|tabs?)\b", "", s)
        # Remove standalone trailing/embedded dosage numbers like 'dolo 650' -> 'dolo', 'pan 40' -> 'pan'
        s = re.sub(r"\b\d+(\.\d+)?\b", "", s)
        # Remove dosage formats like oral, iv, bid, qd, prn, ds
        s = re.sub(r"\b(oral|iv|po|bid|tid|qid|qd|prn|daily|extended release|er|xr|sr|ds|plus|cv)\b", "", s)
        # Remove non-alphanumeric except hyphen
        s = re.sub(r"[^\w\s-]", " ", s)
        s = re.sub(r"\s+", " ", s).strip()
        return s

    def normalize(self, raw_name: str) -> Dict[str, str]:
        """Normalize drug name to standard generic name, medicinal display name, default dose, and RxCUI."""
        cleaned = self.clean_name(raw_name)
        embedded_dose = self.extract_embedded_dose(raw_name)
        if not cleaned:
            return {
                "raw": raw_name,
                "normalized": "unknown",
                "medicinal_name": "Unknown Medication",
                "default_dose": str(int(embedded_dose)) if embedded_dose else "",
                "indication": "",
                "rxcui": "",
                "drug_class": "unknown",
            }

        if cleaned in self.cache:
            info = self.cache[cleaned]
            resolved_dose = (
                str(int(embedded_dose) if embedded_dose.is_integer() else embedded_dose)
                if embedded_dose
                else info.get("default_dose", "")
            )
            return {
                "raw": raw_name,
                "normalized": info["generic"],
                "medicinal_name": info.get("medicinal_name", info["generic"].title()),
                "default_dose": resolved_dose,
                "indication": info.get("indication", ""),
                "rxcui": info.get("rxcui", ""),
                "drug_class": info.get("class", "unknown"),
            }

        # Check subwords in known mapping
        words = cleaned.split()
        for w in words:
            if w in self.cache:
                info = self.cache[w]
                resolved_dose = (
                    str(int(embedded_dose) if embedded_dose.is_integer() else embedded_dose)
                    if embedded_dose
                    else info.get("default_dose", "")
                )
                return {
                    "raw": raw_name,
                    "normalized": info["generic"],
                    "medicinal_name": info.get("medicinal_name", info["generic"].title()),
                    "default_dose": resolved_dose,
                    "indication": info.get("indication", ""),
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
                    resolved_dose = (
                        str(int(embedded_dose) if embedded_dose.is_integer() else embedded_dose)
                        if embedded_dose
                        else ""
                    )
                    result = {
                        "raw": raw_name,
                        "normalized": normalized_name,
                        "medicinal_name": normalized_name.title(),
                        "default_dose": resolved_dose,
                        "indication": "Active Pharmaceutical Ingredient",
                        "rxcui": rxcui,
                        "drug_class": "unknown",
                    }
                    self.cache[cleaned] = {
                        "generic": normalized_name,
                        "medicinal_name": normalized_name.title(),
                        "default_dose": resolved_dose,
                        "indication": "Active Pharmaceutical Ingredient",
                        "rxcui": rxcui,
                        "class": "unknown",
                    }
                    return result
        except Exception as e:
            logger.debug(f"RxNorm API lookup failed for {cleaned}: {e}")

        # Fallback to cleaned token
        resolved_dose = (
            str(int(embedded_dose) if embedded_dose.is_integer() else embedded_dose)
            if embedded_dose
            else ""
        )
        return {
            "raw": raw_name,
            "normalized": cleaned,
            "medicinal_name": cleaned.title(),
            "default_dose": resolved_dose,
            "indication": "Active Pharmaceutical Ingredient",
            "rxcui": "",
            "drug_class": "unknown",
        }


_global_normalizer = RxNormNormalizer()


def normalize_drug_name(raw_name: str) -> Dict[str, str]:
    return _global_normalizer.normalize(raw_name)


def get_rxcui(raw_name: str) -> str:
    return _global_normalizer.normalize(raw_name).get("rxcui", "")

