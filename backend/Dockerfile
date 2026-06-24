# Pinned base: bookworm freezes OpenSSL 3.0.x, which the LegacyTLSAdapter
# (SECLEVEL=0 + OP_LEGACY_SERVER_CONNECT) depends on to reach old-firmware printers.
FROM python:3.12-slim-bookworm

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

COPY src ./src
RUN uv sync --frozen --no-dev

COPY scripts ./scripts

ENV PATH="/app/.venv/bin:$PATH"

CMD ["python", "-m", "printmonitor.scraper.runner"]
