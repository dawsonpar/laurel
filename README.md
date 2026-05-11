# Laurel

> Wait, what just happened? Point your phone at the TV and Laurel tells you.

Laurel is a second-screen companion for the Olympic and Paralympic Games. It captures a frame from the broadcast (camera, screen share, or upload), identifies the sport with Gemini Vision, retrieves the relevant rule context from a curated knowledge base, and streams a grounded explanation in seconds.

Built for the [Team USA × Google Cloud Hackathon](https://vibecodeforgoldwithgoogle.devpost.com/) under the Choose Your Own Challenge track.

![Laurel walkthrough](https://github.com/dawsonpar/laurel/raw/main/frontend/public/demo/laurel-walkthrough.gif)

<sub>Prefer the original recording? <a href="https://github.com/dawsonpar/laurel/raw/main/frontend/public/demo/laurel-walkthrough.mp4">Download the MP4</a>.</sub>

---

## Contents

- [Status](#status)
- [Try it without installing](#try-it-without-installing)
- [Two scenarios](#two-scenarios)
- [Stack](#stack)
- [Features at a glance](#features-at-a-glance)
- [Repo layout](#repo-layout)
- [Reproducible testing](#reproducible-testing)
  - [Google Cloud integration (proof)](#google-cloud-integration-proof)
- [Deploying](#deploying)
- [MVP sport coverage](#mvp-sport-coverage)
- [Documentation](#documentation)
- [Compliance notes (for hackathon judges)](#compliance-notes-for-hackathon-judges)
- [License](#license)

---

## Status

| | |
|---|---|
| **Stage** | Hackathon MVP, deployed |
| **Live frontend** | https://laurel-dawsonpars-projects.vercel.app |
| **Live backend** | https://laurel-backend-926378227102.us-central1.run.app |
| **License** | Apache 2.0 |
| **Sport coverage** | 6 sports (3 Olympic, 3 Paralympic) |
| **Last reviewed** | 2026-05-11 |

---

## Try it without installing

| Route | What you see |
|---|---|
| [`/`](https://laurel-dawsonpars-projects.vercel.app/) | Landing |
| [`/demo`](https://laurel-dawsonpars-projects.vercel.app/demo) | Both demo scenarios |
| [`/demo/a`](https://laurel-dawsonpars-projects.vercel.app/demo/a) | Curling double-touch call (auto-runs Gemini, suggests "What is the double touch rule?") |
| [`/demo/b`](https://laurel-dawsonpars-projects.vercel.app/demo/b) | Long jump T64 world record (auto-runs Gemini, suggests "What world record was broken?", "How does it compare to the regular Olympics?", "Why does it matter?") |
| [`/sports`](https://laurel-dawsonpars-projects.vercel.app/sports) | Browse the curated knowledge base |
| [`/capture`](https://laurel-dawsonpars-projects.vercel.app/capture) | Capture a moment yourself (camera, screen share, or upload) |

Works on phone and desktop. The demo routes pre-load broadcast mockups Laurel produced from scratch (no Games footage).

---

## Two scenarios

| Scenario | Trigger | What Laurel does |
|---|---|---|
| **A — Confused viewer** | A judge ruling negates a highlight in front of friends | Captures the frame, identifies the sport, cites the specific rule, explains the typical remedy. Under 5 seconds. |
| **B — "Was that a big deal?"** | A world record falls | Captures the frame, surfaces historical context and prior records, generates a sharable link with rich preview for the family group chat. |

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind 4 |
| Frontend hosting | Vercel |
| Backend | Python 3.12, FastAPI, uv |
| Backend hosting | Google Cloud Run |
| AI vision + synthesis | Gemini 2.5 Flash via Vertex AI |
| AI embeddings | text-embedding-005 |
| Persistence | Cloud Storage (frames) + Firestore (metadata) |
| Voice input | Browser-native Web Speech API |
| Streaming | Server-Sent Events |

Architecture diagram and the rationale behind each piece: [`docs/decisions/adr-0001-project-structure-and-stack.md`](docs/decisions/adr-0001-project-structure-and-stack.md).

---

## Features at a glance

Full feature catalog with file locations and rationale: [`docs/features.md`](docs/features.md).

| Surface | Highlights |
|---|---|
| **Capture** | Screen share (laptop), camera (phone), upload fallback, auto-mode detection, browser support probing, recording feedback ring |
| **Vision** | Multi-frame Gemini Vision identification, structured-JSON output, scenario-aware stub for offline dev |
| **Knowledge base** | Six hand-authored markdown files, section chunking, in-memory vector index over text-embedding-005 |
| **Synthesis** | SSE streaming, compliance-locked system prompt (no athlete names, conditional phrasing), scenario-routed stub |
| **Conversation** | Suggested chips, free-form input, voice input, 16px-no-iOS-zoom, persistent history |
| **Sharing** | Generate-link, native share sheet, OpenGraph rich previews, Cloud Storage persistence |
| **Sport browser** | Index page + per-sport accordion with full Markdown rendering |
| **Demos** | `/demo` index, `/demo/a` and `/demo/b` pre-loaded scenarios, replay-this-scene CTA |
| **Visual identity** | Animated laurel mark, intro animation, shimmer CTAs, processing pulse ring, prefers-reduced-motion respect |
| **Compliance** | Athlete-name lockout, NGB-name scrubbed KB, prescribed Games terminology, no non-Google corporate brands |
| **Operational** | Stateless backend, Cloud Build pipeline, CORS allowlist, stub-vs-Vertex client switch |

---

## Repo layout

```
laurel/
├─ frontend/                     # Next.js 16 app
│  ├─ src/app/                   # App Router pages: /, /capture, /sports, /demo, /m/[id], /about
│  ├─ src/components/            # CaptureSurface, MomentViewer, Conversation, ShareControls, etc.
│  ├─ src/lib/                   # api.ts, explainStream.ts, followUpStream.ts
│  └─ public/demo/               # Pre-loaded demo frames + walkthrough recording
├─ backend/                      # FastAPI service
│  ├─ app/ai/                    # gemini_client.py (stub + Vertex), prompts.py
│  ├─ app/kb/                    # loader.py, embedder.py, retrieval.py
│  ├─ app/routes/                # explain.py, follow_up.py, moments.py, sports.py
│  ├─ app/storage/               # local_store.py, cloud_store.py
│  ├─ kb/sports/                 # 6 curated markdown sport files
│  ├─ tests/                     # pytest suite
│  ├─ cloudbuild.yaml            # Cloud Run deploy pipeline
│  └─ Dockerfile
├─ docs/                         # Living wiki (ADRs, runbooks, KB, features)
└─ LICENSE                       # Apache 2.0
```

---

## Reproducible testing

Anyone can clone, run, and exercise both demo scenarios end-to-end without any GCP credentials. The backend ships with a deterministic stub client that fingerprints the demo frames by SHA-256 and returns scenario-specific responses, so `/demo/a` and `/demo/b` are fully interactive on a fresh clone.

**Prerequisites:** Node 20+, pnpm 9+, Python 3.12+, [uv](https://docs.astral.sh/uv/).

```bash
git clone https://github.com/dawsonpar/laurel.git
cd laurel
```

Backend (terminal 1):

```bash
cd backend
uv sync
uv run uvicorn app.main:app --port 8080 --reload
```

Frontend (terminal 2):

```bash
cd frontend
pnpm install
pnpm dev
```

Open http://localhost:3000. Try the pre-loaded scenarios at `/demo/a` and `/demo/b`, the live capture flow at `/capture`, and the knowledge base at `/sports`.

Run the backend test suite:

```bash
cd backend
uv run pytest
```

Full local-development runbook: [`docs/runbooks/local-development.md`](docs/runbooks/local-development.md).

### Google Cloud integration (proof)

Production swap is automatic: when `GOOGLE_CLOUD_PROJECT` is set at boot, the backend switches from the stub client to Vertex AI and from local file storage to Cloud Storage + Firestore. No code changes between dev and prod.

| File | Google Cloud service | What it does |
|---|---|---|
| [`backend/app/ai/gemini_client.py`](backend/app/ai/gemini_client.py) | **Vertex AI / Gemini 2.5 Flash** | Initializes `genai.Client(vertexai=True, project=…, location=…)` for both vision identification and streaming text synthesis. |
| [`backend/app/kb/embedder.py`](backend/app/kb/embedder.py) | **Vertex AI / text-embedding-005** | Embeds knowledge-base chunks at boot for in-memory retrieval. |
| [`backend/app/storage/cloud_moments_store.py`](backend/app/storage/cloud_moments_store.py) | **Cloud Storage + Firestore** | Persists captured frames as JPEGs in a Cloud Storage bucket and moment metadata in a Firestore collection for sharable `/m/<id>` permalinks. |
| [`backend/cloudbuild.yaml`](backend/cloudbuild.yaml) | **Cloud Build + Artifact Registry + Cloud Run** | CI pipeline that builds the container, pushes to Artifact Registry, and deploys to Cloud Run. |
| [`backend/Dockerfile`](backend/Dockerfile) | **Cloud Run** | Container definition the production service runs from. |

Live backend (Cloud Run, us-central1): https://laurel-backend-926378227102.us-central1.run.app

---

## Deploying

Production swap is automatic: the Gemini client and the moments store both detect `GOOGLE_CLOUD_PROJECT` at boot and switch from stub/local to Vertex AI + Cloud Storage + Firestore. No code changes between dev and prod.

```bash
cd backend
gcloud builds submit --config=cloudbuild.yaml .
```

Or, if Cloud Build's default service account lacks Cloud Run admin, push the image then deploy directly:

```bash
gcloud run deploy laurel-backend \
  --image=us-central1-docker.pkg.dev/$PROJECT_ID/laurel/laurel-backend:latest \
  --region=us-central1 --platform=managed --allow-unauthenticated \
  --service-account=laurel-backend@$PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars=ENVIRONMENT=production,GOOGLE_CLOUD_PROJECT=$PROJECT_ID,...
```

Full deployment runbook: [`docs/runbooks/deployment.md`](docs/runbooks/deployment.md).

---

## MVP sport coverage

Three Olympic, three Paralympic. Equal structural weight throughout the app.

| Sport | Games | Type | Parity pair |
|---|---|---|---|
| Figure Skating | Winter | Olympic | — |
| Curling | Winter | Olympic | Wheelchair Curling |
| Athletics | Summer | Olympic | Para Athletics |
| Wheelchair Curling | Winter | Paralympic | Curling |
| Para Alpine Skiing | Winter | Paralympic | — |
| Para Athletics | Summer | Paralympic | Athletics |

---

## Documentation

The [`docs/`](docs/) folder is a living wiki. Start at [`docs/index.md`](docs/index.md).

| Doc | What it covers |
|---|---|
| [`docs/features.md`](docs/features.md) | Comprehensive feature catalog (this is the long-form companion to the table above) |
| [`docs/devpost-submission.md`](docs/devpost-submission.md) | Per-field content for the Devpost form |
| [`docs/decisions/adr-0001-project-structure-and-stack.md`](docs/decisions/adr-0001-project-structure-and-stack.md) | Why Next.js + FastAPI + Vertex AI |
| [`docs/decisions/adr-0002-visual-feedback-during-capture.md`](docs/decisions/adr-0002-visual-feedback-during-capture.md) | Recording / processing pulse ring rationale |
| [`docs/decisions/adr-0003-voice-input-web-speech.md`](docs/decisions/adr-0003-voice-input-web-speech.md) | Web Speech API choice |
| [`docs/decisions/adr-0004-storage-strategy.md`](docs/decisions/adr-0004-storage-strategy.md) | Cloud Storage + Firestore split |
| [`docs/runbooks/local-development.md`](docs/runbooks/local-development.md) | Step-by-step local setup |
| [`docs/runbooks/deployment.md`](docs/runbooks/deployment.md) | Cloud Build + Cloud Run deploy |
| [`docs/knowledge-base/hackathon-rules.md`](docs/knowledge-base/hackathon-rules.md) | Devpost rules and judging criteria |
| [`docs/knowledge-base/paralympic-classifications.md`](docs/knowledge-base/paralympic-classifications.md) | T-class / F-class system primer |

---

## Compliance notes (for hackathon judges)

Laurel is built to comply with the Devpost rules end-to-end:

- **No athlete NIL.** The system prompt forbids naming any individual regardless of source. The KB has been swept of athlete names and stores marks/dates/locations as facts only.
- **No NGB names.** "World Curling", "World Athletics", "FIS", "IPC" all replaced with role descriptors throughout the KB and UI.
- **Prescribed Games terminology.** Full references use "Olympic Winter Games Milano Cortina 2026" / "Olympic Games Tokyo 2020". Adjective uses ("Olympic curling", "Paralympic content") allowed.
- **No non-Google corporate brands.** Only Google Cloud product names appear in UI, mockups, and demo materials.
- **No Games footage.** The two demo scenarios use self-produced broadcast mockups, not actual broadcaster clips.

---

## License

Apache License 2.0. See [`LICENSE`](LICENSE).
