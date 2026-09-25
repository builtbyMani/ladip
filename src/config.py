"""Configuration settings and environment variables for LADIP."""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / os.getenv("DATA_DIR", "data")
FAERS_RAW_DIR = DATA_DIR / "faers_raw"
PATIENTS_DIR = DATA_DIR / "patients"
DB_PATH = DATA_DIR / "faers.db"

# Create directories if they don't exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
FAERS_RAW_DIR.mkdir(parents=True, exist_ok=True)
PATIENTS_DIR.mkdir(parents=True, exist_ok=True)

# API Keys
OPENFDA_API_KEY = os.getenv("OPENFDA_API_KEY", "").strip()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# Disproportionality / Evans' Criteria Thresholds
MIN_PRR_THRESHOLD = float(os.getenv("MIN_PRR_THRESHOLD", 2.0))
MIN_CHI2_THRESHOLD = float(os.getenv("MIN_CHI2_THRESHOLD", 4.0))
MIN_CASE_COUNT = int(os.getenv("MIN_CASE_COUNT", 3))

# Alert Fatigue Temporal Suppression Threshold (months)
MAX_STABILITY_MONTHS_SUPPRESSION = float(os.getenv("MAX_STABILITY_MONTHS_SUPPRESSION", 6.0))

# Temporal Correlation Constants
ACUTE_ONSET_WINDOW_DAYS = 14  # Symptom onset within 14 days of drug start
DECHALLENGE_WINDOW_DAYS = 7   # Resolution within 7 days of drug cessation
RECHALLENGE_WEIGHT = 2        # Recurrence weight in causality

# Naranjo Probability Bins
NARANJO_DEFINITE_MIN = 9
NARANJO_PROBABLE_MIN = 5
NARANJO_POSSIBLE_MIN = 1

# OpenFDA base URL
OPENFDA_EVENT_URL = "https://api.fda.gov/drug/event.json"
RXNORM_BASE_URL = "https://rxnav.nlm.nih.gov/REST"
