"""OpenFDA API Client with local caching, rate limiting, and multi-drug query capabilities."""
import json
import logging
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
import requests

from src.config import DATA_DIR, OPENFDA_API_KEY, OPENFDA_EVENT_URL
from src.normalization.rxnorm import normalize_drug_name

logger = logging.getLogger(__name__)

CACHE_DIR = DATA_DIR / "openfda_cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


class OpenFDAClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or OPENFDA_API_KEY
        self.base_url = OPENFDA_EVENT_URL
        self.session = requests.Session()
        self.last_request_time = 0.0
        # openFDA rate limits: 40 requests/min without key, 240/min with key
        self.min_interval = 0.25 if self.api_key else 1.5

    def _throttle(self):
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_request_time = time.time()

    def _get_cache_path(self, cache_key: str) -> Path:
        safe_key = "".join([c if c.isalnum() else "_" for c in cache_key])[:100]
        return CACHE_DIR / f"{safe_key}.json"

    def query(self, search_query: str, count_field: Optional[str] = None, limit: int = 100, skip: int = 0) -> Dict[str, Any]:
        """Query openFDA event API with local cache support."""
        cache_key = f"q_{search_query}_cnt_{count_field}_lim_{limit}_sk_{skip}"
        cache_file = self._get_cache_path(cache_key)

        if cache_file.exists():
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass

        params = {"search": search_query, "limit": min(limit, 1000), "skip": skip}
        if self.api_key:
            params["api_key"] = self.api_key
        if count_field:
            params["count"] = count_field

        self._throttle()
        try:
            resp = self.session.get(self.base_url, params=params, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                with open(cache_file, "w", encoding="utf-8") as f:
                    json.dump(data, f)
                return data
            elif resp.status_code == 404:
                # No records found in openFDA
                return {"results": [], "meta": {"results": {"total": 0}}}
            else:
                logger.warning(f"openFDA returned status {resp.status_code}: {resp.text}")
                return {"error": resp.status_code, "message": resp.text, "results": []}
        except Exception as e:
            logger.error(f"Failed to query openFDA: {e}")
            return {"error": "network_exception", "message": str(e), "results": []}

    def get_combo_reactions(self, drugs: List[str], limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch adverse reactions reported for a combination of drugs."""
        norm_drugs = [normalize_drug_name(d)["normalized"].upper() for d in drugs]
        if not norm_drugs:
            return []

        # Build AND query across medicinal products
        drug_clauses = [f'patient.drug.medicinalproduct:"{d}"' for d in norm_drugs]
        search_query = " AND ".join(drug_clauses)

        data = self.query(search_query=search_query, count_field="patient.reaction.reactionmeddrapt.exact", limit=limit)
        results = data.get("results", [])
        return [{"reaction": item.get("term", "").lower(), "count": item.get("count", 0)} for item in results]

    def get_drug_event_count(self, drug_name: str) -> int:
        norm = normalize_drug_name(drug_name)["normalized"].upper()
        data = self.query(search_query=f'patient.drug.medicinalproduct:"{norm}"', limit=1)
        return data.get("meta", {}).get("results", {}).get("total", 0)
