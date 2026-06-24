# Frontend

Next.js dashboard for BC Print Monitor. A live-updating table that polls the
read API and renders each printer's status, supplies, and tray state — color-coded
by severity, sortable by column, filterable by building.

## Requirements

- **Node 24** (pinned in `.nvmrc`; `engines` + `.npmrc`'s `engine-strict` hard-fail
  an install on the wrong major). Use `nvm use` to match it.
- **A running API** — the page fetches `${NEXT_PUBLIC_API_URL}/printer_data/` from
  the browser. See [`../backend/README.md`](../backend/README.md) to start it.
- **[uv](https://docs.astral.sh/uv/) + the backend project** for local schema
  codegen only (`gen:schema` shells into `../backend`). Not needed at runtime, and
  not needed in Docker (the image generates the schema in a build stage).

## Setup

```bash
nvm use          # switch to the pinned Node (24.13.1)
npm ci           # install exact versions from package-lock.json
```

`node_modules/` is gitignored; `package-lock.json` is committed, so `npm ci`
rebuilds the same dependency tree on any host. Use `npm ci` (lockfile-authoritative)
on a fresh checkout; only use `npm install` when intentionally adding a dependency.

## Configuration

- **`.env.local`** — `NEXT_PUBLIC_API_URL=http://localhost:8000` (gitignored). The
  `NEXT_PUBLIC_` prefix inlines the value into the browser bundle **at build time**,
  so changing it needs a dev-server restart (or a rebuild in prod).

## Running

```bash
npm run gen:schema   # one-time / when schema.py changes — see codegen note below
npm run dev          # local dev on :3000
```

```bash
npm run build        # production build (runs codegen via prebuild)
npm run start        # serve the production build
npm run lint         # eslint
```

In production the served process is managed by a supervisor (pm2 / a container),
not a bare `npm run start`.

## Codegen (build-time only)

The TypeScript types are **generated** from the backend's pydantic schema, so the
two can't drift — rename a field in `schema.py` and the build breaks at every stale
usage. Two stages:

1. **`gen:schema`** — runs the backend's `export_schema.py` and writes
   `schema/printer.schema.json` (needs `uv` + the backend project).
2. **`gen:types`** — runs `json-schema-to-typescript` on that file and writes
   `lib/types.ts` (pure Node, no Python).

`prebuild` runs `gen:types` automatically before every `npm run build`, so a stale
`types.ts` can never ship. **`gen:schema` is *not* chained** (it needs `uv`, absent
in the Node/Docker build), so:

- **Local dev:** run `npm run gen:schema` by hand after changing `schema.py`
  (`npm run dev` does not fire `prebuild`).
- **Docker:** a backend-based build stage generates the schema and hands it to the
  Node build — see [`../DOCKER.md`](../DOCKER.md).

Both generated files (`schema/printer.schema.json`, `lib/types.ts`) are gitignored —
they're reproduced on every build.

## Architecture notes

- The browser fetches the API **directly** (`:3000` page → `:8000` API, cross-origin,
  allowed by the API's permissive CORS). Each viewer runs its own poll loop, but every
  poll is a cheap read of the pre-computed `data.json` — a poll never triggers a scrape.
- **TanStack Table v8** (headless) owns sorting/filtering; we keep our own `<table>` +
  Tailwind markup. Severity color-coding and sort order share one source of truth in
  `lib/severity.ts`, so cell color and sort rank can't diverge.
- **Location** (building filter) is editorial metadata keyed by hostname, mapped on the
  frontend in `lib/locations.ts` — deliberately not a backend schema field.

## Layout

```
app/{layout,page}.tsx          # server shell: title + <Table/>
components/
  Table.tsx                    # "use client": fetch + poll + table instance + filter
  PrinterTable.tsx             # presentational <table> (takes the table instance)
  columns.tsx                  # TanStack column defs
lib/
  api.ts                       # fetchPrinterData()
  severity.ts                  # color/sort helpers (single source of truth)
  locations.ts                 # hostname -> building mapping
  types.ts                     # generated from schema.py (gitignored)
schema/printer.schema.json     # generated JSON Schema (gitignored)
```
