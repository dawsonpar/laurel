# ADR-0004: Local-first storage strategy with cloud swap

**Status:** Accepted
**Date:** 2026-04-28
**Deciders:** Dawson Par + agent

## Context

Day 9 of the build plan calls for persisting captured moments (frame + metadata) so users can share `/m/{id}` links. PRD section 4 specifies Cloud Storage for frames and Cloud Firestore for metadata in production.

For the MVP we need the same flow to work locally without GCP credentials so the demo runs end-to-end and the developer experience is friction-free.

## Decision

Define a `MomentsStore` Protocol with two implementations behind a factory:

- **LocalMomentsStore (default in dev):** writes JPEG frames + JSON metadata to `backend/tmp/moments/`. Frame bytes are served by the FastAPI route `/api/moments/{id}/frame`.
- **CloudMomentsStore (production, future):** will write frames to Cloud Storage with signed URLs and metadata to Firestore. Stub interface lives in `app/storage/moments_store.py` ready to be filled in.

The frontend is unaware of which backend is active; it always calls `/api/moments` and `/api/moments/{id}` and follows whatever frame URL the backend returns.

## Rationale

- Local filesystem is the lowest-friction dev experience. No emulators, no auth, no quota.
- The Protocol abstraction means the production swap is purely a backend change. Frontend code, API contract, and tests all stay the same.
- Tests use a temp directory fixture; they never touch real disk paths.

## Rejected alternatives

- **Always require Cloud Storage even in dev.** Forces every contributor to provision GCP. Bad for sprint velocity.
- **In-memory dict only.** Survives the request but not server restarts; demo would break if the user navigates back to a `/m/{id}` link after a backend restart.
- **SQLite for metadata.** Adds a dep without buying anything we need at this stage; flat JSON next to the frame file is simpler.

## Consequences

- The local store path is gitignored (`backend/tmp/`).
- Production deploy must implement `CloudMomentsStore` before share links work in prod. Tracked as Day 10+ work.
- 30-day TTL is enforced on the cloud side (Cloud Storage lifecycle rule). Local store has no TTL; left as a manual cleanup until cloud cutover.
