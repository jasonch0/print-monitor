# Docker

Runs the whole BC Print Monitor stack — scraper, read API, and frontend — with one
command. Three containers from two images, sharing the scraper's `data.json` snapshot.

## Requirements

- **Docker** (Engine + Compose v2 — `docker compose`, not the legacy `docker-compose`).
- **BC's network** for the scraper to reach the printers (`*.bc.edu`, internal DNS
  only). The API and frontend run anywhere; only the scraper needs BC's network.

## Quick start

```bash
make up      # build images (backend first) + docker compose up --build
```

Then open **http://localhost:3000** (frontend) — it polls the API at
**http://localhost:8000** (`/printer_data/`, docs at `/docs`).

```bash
make logs    # follow logs from all services
make down    # stop and remove the containers
```

## Why `make up` and not just `docker compose up`

The frontend image's first build stage is `FROM printmonitor-backend` — it runs the
backend's schema export to generate `printer.schema.json`, then hands it to the Node
build. That's a **build-time** dependency on the backend image that Compose can't see
(Compose doesn't parse Dockerfile `FROM`s, and the build phase is unordered). `make up`
builds and tags `printmonitor-backend` **first**, so the frontend build can base off it.

## Services

| Service    | Image                  | Port   | Notes |
|------------|------------------------|--------|-------|
| `scraper`  | `printmonitor-backend` | —      | Scrape loop; writes `data.json`. No published port. |
| `api`      | `printmonitor-backend` | `8000` | Same image, `command:` overridden to uvicorn (`--host 0.0.0.0`). |
| `frontend` | (built from `frontend/`) | `3000` | Next.js; multi-stage build (schema → build → runner). |

- **One image, two backend containers.** `scraper` and `api` run the *same*
  `printmonitor-backend` image as two processes. Docker is the supervisor
  (`restart: unless-stopped`), which keeps the scraper and API decoupled — they only
  share `data.json`, exactly as when run by hand.
- **Shared snapshot via bind mount.** Both backend containers mount
  `./backend/data:/app/data`, so the scraper's writes are what the API serves. The
  directory persists on the host between runs. 
- **`depends_on` orders startup, not builds.** It sequences container *start*; image
  *build* order is handled by `make up` (above).

## Configuration

- **`NEXT_PUBLIC_API_URL`** — baked into the frontend bundle at **build time** (a build
  `ARG`, default `http://localhost:8000`). 

- **`backend/data/urls.txt`** — scrape targets (gitignored). The bind-mounted `data/`
  dir must contain it on the host; the scraper re-reads it each cycle. Ask Mike and Pon
  for the list of printers 

## Why Docker here

The pinned `python:3.12-slim-bookworm` base ships **OpenSSL 3.0.x**, which the
scraper's `LegacyTLSAdapter` needs (`SECLEVEL=0` + `OP_LEGACY_SERVER_CONNECT`) to reach
old-firmware printers that only negotiate weak ciphers. That system library is the one
thing `uv` can't pin — so the container, not the lockfile, is what makes that
reproducible across hosts.

## Layout

```
docker-compose.yml        # scraper + api + frontend services
Makefile                  # make up / down / logs
backend/Dockerfile        # one image, both backend processes (OpenSSL 3.0.x base)
backend/.dockerignore
frontend/Dockerfile       # multi-stage: schema (FROM backend) -> build -> runner
frontend/.dockerignore
```
