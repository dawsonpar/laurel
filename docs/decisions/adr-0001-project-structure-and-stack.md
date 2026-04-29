# ADR-0001: Project structure and stack

**Status:** Accepted
**Date:** 2026-04-28
**Deciders:** Dawson Par + agent

## Context

Building Laurel for the GCP x Team USA Hackathon. Two-week build window. Required to use Gemini API and deploy on Google Cloud. Submission must be a hosted URL judges can hit.

## Decision

**Monorepo layout:**

```
laurel/
  frontend/    # Next.js 16, TypeScript, Tailwind 4, Geist font
  backend/     # FastAPI on Python 3.12, uv-managed
  docs/        # This wiki
  .github/workflows/  # CI (added when needed)
```

**Frontend:** Next.js 16.2.4 with App Router, React 19.2, Tailwind 4, TypeScript. Hosted on Vercel.

**Backend:** Python 3.12 + FastAPI + uvicorn. Dockerized for Cloud Run. Dependency management via `uv`.

**AI:** Gemini 2.5 Flash via `google-genai` SDK. Vertex AI text-embedding-005 for KB retrieval.

**Storage:** Cloud Storage for captured frames (30-day TTL), Cloud Firestore for moment metadata.

## Rationale

- Monorepo over polyrepo: one PRD, two services, faster context switching during a sprint.
- FastAPI on Cloud Run because Cloud Run is the GCP-blessed container runtime, scales to zero, and meets the hackathon "deployed on Google Cloud" requirement cleanly.
- `uv` over `pip`/`poetry` because it is faster, simpler, and what the project's CLAUDE.md specifies.
- Next.js 16 over remix/astro/sveltekit because of mature Vercel integration, App Router for SSR + streaming, and team familiarity.
- Tailwind 4 because it ships with the Next.js 16 starter and is faster than v3.

## Rejected alternatives

- **Single-service Next.js with API routes for Gemini calls.** Cleaner stack but loses the "deployed on Google Cloud" demonstration that the hackathon judges weight. Cloud Run + Vertex AI explicitly is a better story.
- **Cloud Functions for the backend.** Cold starts on functions are worse than min-instances=0 Cloud Run. Container model is also more portable.
- **pgvector on Cloud SQL for KB.** Overkill for ~180 vectors. Numpy in-memory is faster to build and deploy. Documented in ADR-0004 (forthcoming) when retrieval is implemented.

## Consequences

- Two deploy targets to maintain (Vercel + Cloud Run). CORS config required on the backend.
- Local dev requires both services running. Documented in `runbooks/local-development.md`.
