# Local Development

**Last updated:** 2026-04-28

## Prerequisites

- Node.js 22+ and pnpm 10+
- Python 3.12+ and uv 0.11+
- gcloud CLI (only needed when working against real GCP services)

## First-time setup

```bash
# Clone
git clone https://github.com/dawsonpar/laurel.git
cd laurel

# Frontend
cd frontend
pnpm install

# Backend
cd ../backend
uv sync
cp .env.example .env
# Edit .env with your GCP project ID and any other settings
```

## Run the dev servers

Two terminals:

```bash
# Terminal 1: backend
cd backend
uv run uvicorn app.main:app --reload --port 8080

# Terminal 2: frontend
cd frontend
pnpm dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Health check: http://localhost:8080/healthz

## Run the tests

```bash
# Backend
cd backend
uv run pytest

# Frontend (no tests yet, build verification only)
cd frontend
pnpm build
```

## Lint

```bash
cd backend
uv run ruff check .
uv run ruff format --check .

cd frontend
pnpm lint
```

## Common gotchas

- **CORS errors in the browser:** the backend default `CORS_ALLOWED_ORIGINS` is `http://localhost:3000`. If you change the frontend port, update the env var.
- **Gemini API calls fail with auth errors:** make sure `gcloud auth application-default login` has been run, and the project ID in `.env` matches a project with Vertex AI enabled.
