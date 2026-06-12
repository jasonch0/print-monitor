# Backend

Scraper + read API for BC Print Monitor. Two decoupled processes that share a
single `data/data.json` snapshot: the scraper writes it, the API reads it.

## Requirements

- **Python 3.12** (pinned in `.python-version`)
- **[uv](https://docs.astral.sh/uv/)** for dependency + environment management
- **BC's network** to reach the printers — the targets are `*.bc.edu` hosts only
  resolvable/reachable through BC's internal DNS (campus wired/WiFi or BC VPN).
  The API and schema export run anywhere; only the scraper needs BC's network.

## Setup

```bash
# Install uv (macOS/Linux) — see https://docs.astral.sh/uv/ for other methods
curl -LsSf https://astral.sh/uv/install.sh | sh

uv sync          # builds .venv from pyproject.toml + uv.lock (exact, reproducible)
```

`.venv/` is gitignored; `uv.lock` is committed, so `uv sync` rebuilds the same
interpreter + package versions on any host.

## Running

The scraper loop and the API are independent processes — run them in separate
terminals. The API never triggers a scrape; they only share `data/data.json`.

```bash
# Scraper: scrape all targets, write data.json, sleep, repeat (60s interval)
uv run python -m printmonitor.scraper.runner

# Read API: GET /printer_data/  (docs at /docs)
uv run uvicorn printmonitor.api.app:app --port 8000
```

A failed crawl never clobbers the last good snapshot — `store.write()` writes a
temp file and `os.replace()`s it atomically.

## Configuration

- **`data/urls.txt`** — scrape targets, one URL per line. Blank lines and
  `#`-comments are skipped; the file is re-read each cycle. This whole `data/`
  dir is gitignored (`urls.txt` holds internal hostnames; `data.json` is runtime
  output) and is recreated at runtime.
- **`src/printmonitor/config.py`** — resolved paths (CWD-independent) and
  `SCRAPE_INTERVAL` (default 60s).

Dead entries (stale DNS, HTTP-only printers) are skipped per-printer, not fatal —
a typical run scrapes ~32 of 37 targets.

## Schema export (build-time only)

`schema.py` is the single pydantic data contract (`PrinterData` / `Supply` /
`Tray`). The frontend can't import it (Python → TypeScript), so it's exported to
JSON Schema and fed to the frontend's codegen (`schema.py` → JSON Schema →
TypeScript types).

The frontend build runs this export automatically before every build, so you don't
invoke it manually. Run it by hand only to inspect the emitted schema:

```bash
uv run python scripts/export_schema.py   # prints JSON Schema to stdout
```

The running backend never reads it. It's a build artifact for the frontend, not
a runtime dependency.

## Layout

```
src/printmonitor/
  config.py · schema.py · store.py     # config, data contract, atomic file store
  api/app.py                           # FastAPI read API (GET /printer_data/)
  scraper/scrape.py · runner.py        # requests+parsel scrape; runner loops it
scripts/export_schema.py               # schema.py -> JSON Schema (frontend codegen)
data/urls.txt                          # targets (gitignored; data.json generated)
```
