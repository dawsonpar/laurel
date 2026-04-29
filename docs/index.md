# Laurel Wiki

Living documentation for the Laurel project. Treat this directory as a wiki: every meaningful decision, runbook, and piece of domain knowledge gets a page here.

## Layout

| Directory | Purpose |
|---|---|
| `decisions/` | Architecture Decision Records (ADRs). One file per decision. Immutable once accepted. |
| `runbooks/` | Step-by-step operational guides (deploys, local setup, debugging recipes). |
| `knowledge-base/` | Domain knowledge: hackathon rules, sport classification primers, Gemini API notes, vendor quirks. |

## Conventions

- One topic per file. Keep files under 300 lines; split when they grow.
- Filenames are kebab-case (`adr-0001-vector-store.md`, not `ADR0001.md`).
- Decisions are numbered sequentially and never renamed once committed.
- Runbooks are dated at the top so readers know if instructions have aged out.
- When a decision is superseded, add a `Status: Superseded by ADR-NNNN` line. Never delete the old file.

## Source-of-truth pointers

- **Product spec:** `/Users/dawsonpar/dp/docs/prd-laurel.md` (lives outside the repo because it predates it; future PRDs go in this `docs/` folder)
- **Project tracking:** `/Users/dawsonpar/dp/notes/mindboard/personal/gcp-x-team-usa-hackaton.md`
- **Hackathon brief:** [Devpost](https://vibecodeforgoldwithgoogle.devpost.com/)

## Index

### Decisions
- [ADR-0001: Project structure and stack](decisions/adr-0001-project-structure-and-stack.md)
- [ADR-0002: Visual feedback during capture](decisions/adr-0002-visual-feedback-during-capture.md)
- [ADR-0003: Voice input via Web Speech API](decisions/adr-0003-voice-input-web-speech.md)
- [ADR-0004: Local-first storage strategy](decisions/adr-0004-storage-strategy.md)

### Runbooks
- [Local development](runbooks/local-development.md)
- [Deployment](runbooks/deployment.md) (placeholder, filled in Day 1 deploy step)

### Knowledge base
- [Hackathon rules and judging](knowledge-base/hackathon-rules.md)
- [Sport classification primer](knowledge-base/paralympic-classifications.md) (placeholder)

## Activity log

Newest first. Each entry is one line.

- **2026-04-28:** Days 2-9 shipped end-to-end. KB authored for all 6 sports (~9.4K words). Backend pipelines wired: KB ingestion + numpy retrieval, Gemini Vision/text via google-genai SDK with stub fallback for keyless dev, SSE streaming explain + follow-up endpoints, local moments persistence. Frontend pipelines: capture page with camera + file upload, MomentViewer with animated outline + streamed conversation, share link generation, /m/[id] public pages with @vercel/og dynamic OG images. ADR-0004 added. 23 backend tests pass. (agent)
- **2026-04-28:** Day 1 scaffolding complete. Frontend builds (Next.js 16.2.4 + Tailwind 4 + Geist), backend tests pass (FastAPI + uv). ADRs 0001-0003 written. (agent)
