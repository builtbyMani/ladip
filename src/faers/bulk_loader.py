"""SQLite Database Loader and manager for FAERS cases, drug therapy, reactions, and signals."""
import sqlite3
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path
import logging

from src.config import DB_PATH
from src.normalization.rxnorm import normalize_drug_name

logger = logging.getLogger(__name__)

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS cases (
    case_id TEXT PRIMARY KEY,
    age REAL,
    sex TEXT,
    weight REAL,
    report_date DATE,
    country TEXT
);

CREATE TABLE IF NOT EXISTS case_drugs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id TEXT,
    drug_name TEXT,
    drug_role TEXT, -- PS=Primary Suspect, SS=Secondary Suspect, C=Concomitant
    dose REAL,
    dose_unit TEXT,
    route TEXT,
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

CREATE TABLE IF NOT EXISTS case_reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id TEXT,
    reaction TEXT, -- MedDRA preferred term
    outcome TEXT,  -- DE=Death, LT=Life-Threatening, HO=Hospitalization, DS=Disability, CA=Congenital Anomaly, RI=Required Intervention, OT=Other
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

CREATE TABLE IF NOT EXISTS interaction_signals (
    drug_combo TEXT, -- sorted, pipe-delimited: "aspirin|clopidogrel|omeprazole"
    combo_size INTEGER,
    adverse_event TEXT,
    case_count INTEGER,
    prr REAL,
    prr_ci_lower REAL,
    prr_ci_upper REAL,
    ror REAL,
    chi_squared REAL,
    ic REAL, -- Information Component (Bayesian)
    severity_tier TEXT, -- CRITICAL / HIGH / MODERATE / LOW
    signal_strength TEXT, -- STRONG / MODERATE / WEAK
    PRIMARY KEY (drug_combo, adverse_event)
);

CREATE INDEX IF NOT EXISTS idx_case_drugs_name ON case_drugs(drug_name);
CREATE INDEX IF NOT EXISTS idx_case_drugs_case ON case_drugs(case_id);
CREATE INDEX IF NOT EXISTS idx_case_reactions_case ON case_reactions(case_id);
CREATE INDEX IF NOT EXISTS idx_case_reactions_reac ON case_reactions(reaction);
CREATE INDEX IF NOT EXISTS idx_signals_combo ON interaction_signals(drug_combo);
CREATE INDEX IF NOT EXISTS idx_signals_tier ON interaction_signals(severity_tier);
"""


class FAERSDatabase:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or DB_PATH
        self.init_db()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        with self.get_connection() as conn:
            conn.executescript(SCHEMA_SQL)
            conn.commit()

    def insert_case(
        self,
        case_id: str,
        age: Optional[float] = None,
        sex: Optional[str] = None,
        weight: Optional[float] = None,
        report_date: Optional[str] = None,
        country: Optional[str] = None,
    ):
        with self.get_connection() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO cases (case_id, age, sex, weight, report_date, country)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (case_id, age, sex, weight, report_date, country),
            )
            conn.commit()

    def insert_case_drug(
        self,
        case_id: str,
        drug_name: str,
        drug_role: str = "C",
        dose: Optional[float] = None,
        dose_unit: Optional[str] = None,
        route: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        normalize: bool = True,
    ):
        norm_name = normalize_drug_name(drug_name)["normalized"] if normalize else drug_name.lower().strip()
        with self.get_connection() as conn:
            conn.execute(
                """
                INSERT INTO case_drugs (case_id, drug_name, drug_role, dose, dose_unit, route, start_date, end_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (case_id, norm_name, drug_role, dose, dose_unit, route, start_date, end_date),
            )
            conn.commit()

    def insert_case_reaction(
        self,
        case_id: str,
        reaction: str,
        outcome: str = "OT",
    ):
        reac = reaction.lower().strip()
        with self.get_connection() as conn:
            conn.execute(
                """
                INSERT INTO case_reactions (case_id, reaction, outcome)
                VALUES (?, ?, ?)
                """,
                (case_id, reac, outcome),
            )
            conn.commit()

    def insert_signal(self, signal: Dict[str, Any]):
        combo = signal["drug_combo"]
        if isinstance(combo, (list, set, tuple)):
            norm_drugs = sorted([normalize_drug_name(d)["normalized"] for d in combo])
            combo_str = "|".join(norm_drugs)
            combo_size = len(norm_drugs)
        else:
            combo_str = str(combo).lower()
            combo_size = len(combo_str.split("|"))

        with self.get_connection() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO interaction_signals (
                    drug_combo, combo_size, adverse_event, case_count,
                    prr, prr_ci_lower, prr_ci_upper, ror, chi_squared,
                    ic, severity_tier, signal_strength
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    combo_str,
                    combo_size,
                    signal["adverse_event"].lower().strip(),
                    signal.get("case_count", 0),
                    signal.get("prr", 0.0),
                    signal.get("prr_ci_lower", 0.0),
                    signal.get("prr_ci_upper", 0.0),
                    signal.get("ror", 0.0),
                    signal.get("chi_squared", 0.0),
                    signal.get("ic", 0.0),
                    signal.get("severity_tier", "MODERATE"),
                    signal.get("signal_strength", "MODERATE"),
                ),
            )
            conn.commit()

    def query_signals(self, drug_combo: List[str]) -> List[Dict[str, Any]]:
        norm_drugs = sorted([normalize_drug_name(d)["normalized"] for d in drug_combo])
        combo_key = "|".join(norm_drugs)
        with self.get_connection() as conn:
            cur = conn.execute(
                """
                SELECT * FROM interaction_signals
                WHERE drug_combo = ?
                ORDER BY chi_squared DESC, prr DESC
                """,
                (combo_key,),
            )
            return [dict(row) for row in cur.fetchall()]

    def search_signals_by_any_drugs(self, drugs: List[str], min_tier: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search signals containing any of the specified drugs."""
        norm_drugs = [normalize_drug_name(d)["normalized"] for d in drugs]
        if not norm_drugs:
            return []

        conditions = ["drug_combo LIKE ?" for _ in norm_drugs]
        params = [f"%{d}%" for d in norm_drugs]

        query = f"""
            SELECT * FROM interaction_signals
            WHERE ({' OR '.join(conditions)})
        """
        if min_tier:
            query += " AND severity_tier = ?"
            params.append(min_tier)

        query += " ORDER BY chi_squared DESC, prr DESC LIMIT 200"

        with self.get_connection() as conn:
            cur = conn.execute(query, params)
            return [dict(row) for row in cur.fetchall()]

    def get_stats(self) -> Dict[str, int]:
        with self.get_connection() as conn:
            cases_count = conn.execute("SELECT COUNT(*) FROM cases").fetchone()[0]
            drugs_count = conn.execute("SELECT COUNT(*) FROM case_drugs").fetchone()[0]
            reac_count = conn.execute("SELECT COUNT(*) FROM case_reactions").fetchone()[0]
            sig_count = conn.execute("SELECT COUNT(*) FROM interaction_signals").fetchone()[0]
            return {
                "cases": cases_count,
                "drugs": drugs_count,
                "reactions": reac_count,
                "signals": sig_count,
            }
