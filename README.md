# Longitudinal Adverse Drug Interaction Predictor (LADIP) 💊⏱️

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.32+-FF4B4B.svg?logo=streamlit)](https://streamlit.io)
[![Expo](https://img.shields.io/badge/Expo%20Go-SDK%2050+-000020.svg?logo=expo)](https://expo.dev)
[![Tests Passing](https://img.shields.io/badge/tests-24%2F24%20passing-brightgreen.svg)](#3-run-automated-tests)

> **A longitudinal, multi-drug pharmacovigilance system combining real-world FDA FAERS adverse event data with patient medication timelines to detect hidden drug-drug-symptom interactions while eliminating Clinical Alert Fatigue.**

---

## 🎯 The Core Problem: Eliminating Clinical Alert Fatigue

In modern Electronic Health Record (EHR) systems, **90% to 96% of drug interaction alerts are overridden and ignored by clinicians**. Conventional checkers trigger flood-level warnings for trivial, non-urgent, or long-standing stable combinations. When an overburdened physician receives 50 low-confidence alerts for an 8-medication patient, they ignore *all* of them—frequently missing the one critical interaction.

**LADIP solves this through three clinical pillars:**
1. **Quantitative Disproportionality Scoring**: Replaces binary interaction lists with empirical signal detection statistics ($PRR$, $ROR$, $\chi^2$ with Yates' correction, $p$-value, Bayesian Information Component $IC$) and Evans' SRS criteria ($PRR \ge 2.0$, $\chi^2 \ge 4.0$, $N \ge 3$).
2. **MedDRA & Outcome Severity Tiering**: Classifies signals into `CRITICAL`, `HIGH`, `MODERATE`, and `LOW` tiers using FDA FAERS outcome codes (`DE` Death, `LT` Life-Threatening, `HO` Hospitalization) and MedDRA System Organ Class (SOC) ontologies.
3. **Temporal Plausibility & Longitudinal Suppression**: Evaluates the **Drug-Symptom Temporal Association Score (DTAS)** and the **Naranjo ADR Probability Scale** (10 questions). If a patient has taken a combination stably for $>6$ months with no adverse symptoms, benign background alerts are automatically suppressed.

---

## 🏛️ System Architecture

```
                                  +------------------------------------+
                                  |     Clinician Web Dashboard        |
                                  |  (Streamlit + Bklit.UI + Motion)   |
                                  +-----------------+------------------+
                                                    |
                                                    v
+------------------------------------+    +----------------------------+
|      Patient Mobile App            |--->|   FastAPI REST Service     |
|   (Expo Go / React Native)         |    |   (/api/patients, /scan)   |
+------------------------------------+    +-------------+--------------+
                                                        |
         +----------------------------------------------+
         |
         v
+----------------------------------------------------------------------+
|                     LADIP Core Intelligence Engine                   |
|                                                                      |
|  +------------------------+  +-------------------+  +--------------+ |
|  | Disproportionality     |  | Temporal Analysis |  | RxNorm Brand | |
|  | Engine (PRR, ROR, Chi2)|  | (DTAS & Naranjo)  |  | Normalizer   | |
|  +------------------------+  +-------------------+  +--------------+ |
|                                                                      |
|  +------------------------+  +-------------------+  +--------------+ |
|  | Longitudinal Patient   |  | Prospective Drug  |  | Gemini AI    | |
|  | Memory Store           |  | Safety Checker    |  | Explainer    | |
|  +------------------------+  +-------------------+  +--------------+ |
+---------------------------------------+------------------------------+
                                        |
                                        v
                 +--------------------------------------------+
                 |    FDA FAERS Benchmark SQLite Database     |
                 |     & OpenFDA Throttled Caching Client     |
                 +--------------------------------------------+
```

---

## 📁 Repository Structure

```
vnrvjeit/
├── src/
│   ├── config.py                 # Configuration, thresholds, and paths
│   ├── app.py                    # Streamlit clinical decision dashboard (Editorial theme)
│   ├── api.py                    # FastAPI REST server for web & mobile clients
│   ├── components/
│   │   └── bklit_charts.py       # Composable Bklit.UI charts & Motion.dev animations (CCv2)
│   ├── normalization/
│   │   └── rxnorm.py             # RxNorm REST API & brand-to-generic mapper
│   ├── faers/
│   │   ├── client.py             # openFDA API client with disk caching & rate throttling
│   │   └── bulk_loader.py        # SQLite schema & benchmark adverse signal store
│   ├── analysis/
│   │   ├── disproportionality.py # PRR, ROR, Chi2, IC, Evans' & multi-drug synergy
│   │   ├── severity.py           # MedDRA SOC & FAERS outcome severity tiering
│   │   ├── temporal.py           # DTAS, overlap windows, dechallenge/rechallenge
│   │   ├── naranjo.py            # 10-point Naranjo ADR Probability Scale
│   │   └── signal_matcher.py     # Patient-to-signal matcher with fatigue filter
│   ├── patient/
│   │   ├── models.py             # Medication, Symptom, PatientProfile schemas
│   │   ├── memory.py             # Patient timeline store & longitudinal deduplication
│   │   └── report_parser.py      # PDF (PyMuPDF) / OCR (Tesseract) / Gemini LLM parser
│   ├── safety/
│   │   └── drug_checker.py       # Prospective "Add New Drug" safety simulator
│   └── explanations/
│       └── pharmacology.py       # Gemini AI & rule-based physiological rationale
├── mobile/                       # React Native / Expo Go Patient Mobile App
│   ├── App.js                    # Cross-platform patient portal & timeline viewer
│   ├── app.json                  # Expo project metadata, favicon & camera permissions
│   ├── package.json              # Mobile dependencies
│   └── src/
│       ├── api/client.js         # Mobile client API bridge with offline clinical fallback
│       ├── components/           # Header, Footer, BklitChart & MotionView spring physics
│       └── screens/              # Schedule, DrugChecker, Scanner, Profile & NotFound (404)
├── scripts/
│   ├── build_signal_db.py        # Seed local SQLite database with benchmark signals
│   ├── generate_synthetic_patients.py # Generate realistic clinical test profiles
│   └── download_faers.py         # FAERS quarterly & live openFDA signal fetcher
├── tests/
│   ├── test_disproportionality.py# Verified against hand-calculated 2x2 tables
│   ├── test_temporal.py          # Validates DTAS & Naranjo scoring
│   ├── test_signal_matcher.py    # Validates alert priority & suppression rules
│   └── test_api.py               # Complete FastAPI & UI test suite
├── data/
│   ├── faers.db                  # Pre-seeded SQLite database with 16 benchmark signals
│   └── patients/                 # Realistic Indian patient cohort JSON files
├── requirements.txt              # Backend dependencies
├── .env.example                  # Environment configuration template
├── LICENSE                       # MIT Open Source License (© 2026 LADIP Contributors)
└── README.md
```

---

## 🧮 Mathematical & Statistical Foundations

### 1. $2 \times 2$ Contingency Table for Pharmacovigilance
| | Event $E$ Reported | Event $E$ Not Reported | Total |
|---|---|---|---|
| **Drug Combination $D$ Present** | $a$ | $b$ | $a+b$ |
| **Drug Combination $D$ Absent** | $c$ | $d$ | $c+d$ |
| **Total** | $a+c$ | $b+d$ | $N = a+b+c+d$ |

### 2. Proportional Reporting Ratio (PRR)
$$\text{PRR} = \frac{a / (a + b)}{c / (c + d)}$$
$$95\% \text{ CI} = \exp\left(\ln(\text{PRR}) \pm 1.96 \sqrt{\frac{1}{a} - \frac{1}{a+b} + \frac{1}{c} - \frac{1}{c+d}}\right)$$

### 3. Reporting Odds Ratio (ROR)
$$\text{ROR} = \frac{a \cdot d}{b \cdot c}$$
$$95\% \text{ CI} = \exp\left(\ln(\text{ROR}) \pm 1.96 \sqrt{\frac{1}{a} + \frac{1}{b} + \frac{1}{c} + \frac{1}{d}}\right)$$

### 4. Chi-Squared ($\chi^2$) with Yates' Continuity Correction
$$\chi^2 = \frac{N \left(|ad - bc| - \frac{N}{2}\right)^2}{(a+b)(c+d)(a+c)(b+d)}$$

### 5. Multi-Drug Synergy Ratio
$$\text{Synergy} = \frac{\text{PRR}(d_1 + d_2 + \dots + d_k)}{\max_{i < j} \text{PRR}(d_i + d_j)}$$
Detects emergent interactions that *only* manifest when 3 or more drugs are co-prescribed concurrently.

---

## 🔬 Benchmark Clinical Demo Cohort (Indian Patients)

LADIP includes pre-configured realistic clinical test profiles showcasing complex multi-drug challenges:

| Patient ID | Name | Age / Sex | Regimen | Adverse Reaction | Alert Priority | Clinical Mechanism |
|---|---|---|---|---|---|---|
| `PT_BLEED_001` | **Ramesh Sharma** | 68M (Hyderabad) | Warfarin + Aspirin + Ibuprofen | Gastrointestinal Hemorrhage | **CRITICAL (98.5/100)** | Triple hemostatic failure (COX-1 inhibition + Vit-K antagonism). Acute onset 3 days after adding Ibuprofen. |
| `PT_STATIN_002` | **Sunita Patel** | 62F (Ahmedabad) | Simvastatin + Amiodarone + Amlodipine | Rhabdomyolysis | **CRITICAL (96.2/100)** | Severe CYP3A4 & P-gp inhibition causing massive simvastatin accumulation and CK surge (4,820 U/L). |
| `PT_MTX_003` | **Kavitha Reddy** | 54F (Warangal) | Methotrexate + TMP-SMX + Naproxen | Pancytopenia | **CRITICAL (97.8/100)** | Renal clearance blockade + antifolate synergy causing lethal bone marrow suppression. |
| `PT_CARDIO_005` | **Arjun Nair** | 52M (Bengaluru) | Clopidogrel + Omeprazole | Attenuated Antiplatelet Effect | **HIGH (78.0/100)** | Competitive CYP2C19 bioactivation blockade risking acute stent thrombosis. |
| `PT_STABLE_004` | **Rajesh Varma** | 58M (Secunderabad) | Metformin + Lisinopril + Atorvastatin | *None (Negative Control)* | **SUPPRESSED (LOW)** | **Alert Fatigue Suppression**: Tolerated for 2+ years without symptoms. Suppressed so doctors aren't spammed! |

---

## 🚀 Quickstart & Execution

### 1. Prerequisites
- Python 3.10 or higher
- Node.js 18+ & npm (for mobile app)
- Optional: Gemini API key for natural language pharmacological rationales

### 2. Installation
```bash
# Enter the project workspace
cd vnrvjeit

# Set up Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# (Optional) Set up environment variables
cp .env.example .env
```

### 3. Run Automated Tests
Verify mathematical engines, UI components, and API endpoints:
```bash
python3 -m pytest tests/ -v
```

### 4. Start the FastAPI REST Backend
```bash
uvicorn src.api:app --reload --port 8000
```
- API Root: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

### 5. Launch Clinician Decision Dashboard (Streamlit)
```bash
streamlit run src/app.py
```
- Opens in your browser at `http://localhost:8501`
- Includes interactive Bklit.UI medication timeline & volcano plots, Motion.dev spring animations, prospective "Add Drug" simulator, and PDF/image report parser.

### 6. Launch Mobile Patient App (Expo Go)
In a new terminal window:
```bash
cd mobile
npm install
npx expo start
```
- Scan the displayed QR code using the **Expo Go** app on your iOS or Android phone.
- Allows patients to view active prescriptions, check upcoming adverse signals, and scan physical prescriptions with their mobile camera.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API portal status, copyright metadata, and module links |
| `GET` | `/api/v1/health` | Service health check and FAERS database statistics |
| `GET` | `/api/v1/patients` | List all patient profiles in the clinical cohort registry |
| `GET` | `/api/v1/patients/{patient_id}` | Retrieve complete patient EHR, timeline, and current medications |
| `GET` | `/api/v1/patients/{patient_id}/schedule` | Retrieve daily dosing schedule slots (Morning, Afternoon, Evening, Bedtime) |
| `GET` | `/api/v1/patients/{patient_id}/alerts` | Compute multi-drug disproportionality, DTAS, and alert priorities |
| `POST` | `/api/v1/patients/{patient_id}/check-drug` | Prospective drug safety check: simulate adding a new medication |
| `POST` | `/api/v1/patients/{patient_id}/scan-report` | Upload prescription/report file or text for OCR timeline extraction |
| `POST` | `/api/v1/patients/{patient_id}/scan-base64` | Upload base64-encoded prescription image from mobile camera |
| `POST` | `/api/v1/simulate` | Ad-hoc prospective simulation for arbitrary drug combinations |

---

## 🛡️ License

This project is licensed under the MIT License — Copyright &copy; 2026 LADIP Contributors. See the [LICENSE](LICENSE) file for details.
