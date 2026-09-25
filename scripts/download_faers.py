"""Helper script to download FAERS quarterly ASCII/XML archives or fetch targeted openFDA signals."""
import argparse
import logging
import sys
from pathlib import Path
import requests

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.config import FAERS_RAW_DIR
from src.faers.client import OpenFDAClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def download_quarterly_archive(year: int, quarter: int, output_dir: Path):
    """Download quarterly FAERS zip from FDA website."""
    # Standard URL pattern for FDA quarterly data
    # e.g., https://fis.fda.gov/content/Exports/faers_ascii_2023q4.zip
    url = f"https://fis.fda.gov/content/Exports/faers_ascii_{year}q{quarter}.zip"
    target_file = output_dir / f"faers_ascii_{year}q{quarter}.zip"

    logger.info(f"Downloading FAERS archive from: {url}")
    try:
        resp = requests.get(url, stream=True, timeout=30)
        if resp.status_code == 200:
            with open(target_file, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    f.write(chunk)
            logger.info(f"Downloaded FAERS archive to: {target_file}")
            return target_file
        else:
            logger.warning(f"FDA returned HTTP {resp.status_code} for {url}. Note: FDA URLs may require browser session or update.")
    except Exception as e:
        logger.error(f"Failed to download archive: {e}")
    return None


def fetch_targeted_signals(drugs: list[str]):
    """Fetch live signals from openFDA API for a specific combination."""
    client = OpenFDAClient()
    logger.info(f"Fetching openFDA adverse reactions for combination: {drugs}")
    results = client.get_combo_reactions(drugs, limit=25)
    for r in results:
        print(f"  - {r['reaction']}: {r['count']} reports")


def main():
    parser = argparse.ArgumentParser(description="FAERS Data Downloader")
    parser.add_argument("--year", type=int, default=2023, help="Year of quarterly file")
    parser.add_argument("--quarter", type=int, default=4, help="Quarter (1-4)")
    parser.add_argument("--drugs", nargs="+", help="Query live openFDA reactions for drug combo")
    args = parser.parse_args()

    if args.drugs:
        fetch_targeted_signals(args.drugs)
    else:
        download_quarterly_archive(args.year, args.quarter, FAERS_RAW_DIR)


if __name__ == "__main__":
    main()
