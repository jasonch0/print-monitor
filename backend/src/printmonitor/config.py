"""Resolved filesystem paths for the backend, in one place."""

from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BACKEND_DIR / "data"
DATA_FILE = DATA_DIR / "data.json"
URLS_FILE = DATA_DIR / "urls.txt"

SCRAPE_INTERVAL = 60
