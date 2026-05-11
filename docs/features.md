# Feature Catalog

Comprehensive list of what Laurel ships in the MVP, organized by surface area. Each entry: what it does, where it lives, why it exists.

Last reviewed: 2026-05-11.

---

## 1. Capture

How the user gets a moment into the system.

### 1.1 Screen share capture (laptop)

- **What:** Click "Start sharing", pick a window or display, Laurel captures three frames at 0/1/2 seconds plus a 3-second WebM clip.
- **Where:** `frontend/src/components/CaptureSurface.tsx` (uses `navigator.mediaDevices.getDisplayMedia`).
- **Why:** Most US viewers watch Olympics on a laptop or stream box. Screen share is friction-free for that path.

### 1.2 Camera capture (phone)

- **What:** Tap "Start camera", point at the TV, Laurel captures the same 3-frame + clip pair.
- **Where:** `CaptureSurface.tsx`, rear-facing camera via `getUserMedia({ video: { facingMode: "environment" } })`.
- **Why:** The dominant Scenario A path: friends in a room, one person reaches for their phone.

### 1.3 Upload screenshot

- **What:** Always-on fallback. File picker accepts any image; treated as a single-frame moment.
- **Where:** `CaptureSurface.tsx`, `<input type="file" accept="image/*" />`.
- **Why:** iOS Safari does not implement `getDisplayMedia`. Without an upload path, those users would dead-end.

### 1.4 Auto mode detection

- **What:** Mobile user agents default to camera mode; desktop defaults to screen-share.
- **Where:** `CaptureSurface.tsx::detectDefaultMode`.
- **Why:** First-tap experience matches the device the user is on.

### 1.5 Browser support probing + graceful degradation

- **What:** On mount, probe `getDisplayMedia` and `getUserMedia`. Hide modes that the browser does not support; surface "Upload a screenshot" as the path of last resort.
- **Where:** `CaptureSurface.tsx::useEffect` after mount.
- **Why:** iOS Safari case. Hiding broken affordances beats showing a button that throws.

### 1.6 Recording feedback ring

- **What:** While the 3-second clip records, an inset breathing gold/laurel ring pulses around the moment surface, with a top scan-line and a "Recording" pill.
- **Where:** `CaptureSurface.tsx::RecordingOverlay`, `globals.css::laurel-pulse-ring`.
- **Why:** Capture takes ~3s; without feedback users tap repeatedly. Inset (not outset) shadow because the parent has `overflow:hidden`.

---

## 2. Vision and Identification

How Laurel decides what sport it is looking at.

### 2.1 Multi-frame Gemini Vision

- **What:** Send all captured frames in chronological order to Gemini 2.5 Flash with a structured-JSON system prompt. Returns sport_slug, sport_name, moment_summary, confidence.
- **Where:** `backend/app/ai/gemini_client.py::VertexAIGeminiClient.identify_sport`.
- **Why:** Motion across frames disambiguates sports that look similar at rest (e.g. figure skating vs ice dance).

### 2.2 Stub identification for offline dev

- **What:** Without `GOOGLE_CLOUD_PROJECT` set, the stub client returns curling. Demo frames are recognized by SHA-256 fingerprint and return the correct scenario-specific identification + summary.
- **Where:** `gemini_client.py::StubGeminiClient`, `_DEMO_FINGERPRINTS`.
- **Why:** Anyone can clone the repo and walk through the full UX without a GCP project.

### 2.3 Unsupported-sport surface

- **What:** When Gemini returns a sport not in the curated KB, the UI shows a personified card ("Hmm, that one is not in my playbook yet") plus a list of supported sports grouped by Olympic and Paralympic.
- **Where:** `frontend/src/components/MomentViewer.tsx::UnsupportedSportCard`.
- **Why:** The MVP only covers six sports. The failure mode needs to feel like a feature, not a bug.

---

## 3. Knowledge Base and Retrieval

Where the rules and context come from.

### 3.1 Curated 6-sport markdown KB

- **What:** Six markdown files at `backend/kb/sports/` (athletics, curling, figure-skating, para-alpine-skiing, para-athletics, wheelchair-curling). Each file has Type, Parity Pair, Rules, Scoring, Glossary, Notable Records & Historical Context, and What to Look For sections.
- **Where:** `backend/kb/sports/*.md`.
- **Why:** Hand-authored beats web search for accuracy and tone control. Markdown is editable by anyone.

### 3.2 Section-level chunking and embedding

- **What:** On boot, the backend splits each file into section chunks, embeds them with `text-embedding-005`, and holds the vectors in an in-memory index.
- **Where:** `backend/app/kb/loader.py`, `embedder.py`, `retrieval.py`.
- **Why:** ~30-50 chunks total. In-memory is faster than a vector DB at this size and avoids an extra cloud dependency.

### 3.3 Per-query retrieval

- **What:** For each `/explain` and `/follow-up` call, embed the query, return top-K chunks scoped to the identified sport.
- **Where:** `backend/app/ai/explain.py`, `follow_up.py`.
- **Why:** Cheap (~50ms) and grounds the synthesis in the curated KB.

### 3.4 Compliance-clean KB

- **What:** No athlete names. No NGB names. Records and dates kept as facts; holders referenced by role ("the men's marathon record holder").
- **Where:** All files in `backend/kb/sports/`.
- **Why:** Hackathon submission rules forbid athlete NIL and NGB names. Names add noise more than signal anyway.

---

## 4. Synthesis and Streaming

How the explanation gets to the user.

### 4.1 Streaming SSE responses

- **What:** Both `/explain` and `/follow-up` stream Gemini token-by-token over Server-Sent Events. UI renders tokens as they arrive.
- **Where:** `backend/app/routes/explain.py`, `frontend/src/lib/explainStream.ts`, `followUpStream.ts`.
- **Why:** First token in ~600ms beats waiting 5+ seconds for the full response. The user sees motion, not a spinner.

### 4.2 Compliance-locked system prompt

- **What:** The system prompt forbids naming any individual regardless of source, requires conditional phrasing ("could be considered", "is widely regarded"), grounds every claim in retrieved context, and treats Para sports as equal in significance.
- **Where:** `backend/app/ai/prompts.py::SYSTEM_PROMPT`.
- **Why:** Defense in depth on top of the clean KB. If a future contributor adds a name to the KB by mistake, the prompt still blocks it from showing in output.

### 4.3 Stub explanation routing

- **What:** Without GCP creds, the stub client parses the prompt to detect sport + question intent and returns scenario-specific canned responses for the two demo flows.
- **Where:** `gemini_client.py::_pick_stub_response`.
- **Why:** `/demo/a` and `/demo/b` need to feel real even on a fresh clone.

### 4.4 Identified sport metadata in the response

- **What:** Above the explanation, a one-line `IDENTIFIED <Sport>. <one-sentence visual summary>` is rendered in mono.
- **Where:** `MomentViewer.tsx`, populated from the `vision` SSE event.
- **Why:** Tells the user that vision worked, what it saw, and frames the answer that follows.

---

## 5. Conversation

The follow-up loop.

### 5.1 Suggested follow-up chips

- **What:** Three default chips ("What's the rule?", "Why does this matter?", "Is this rare?") appear above the input. Tapping a chip submits it as the next question.
- **Where:** `frontend/src/components/Conversation.tsx`.
- **Why:** Reduces blank-page paralysis. Demo routes override with scenario-specific chips.

### 5.2 Free-form follow-up input

- **What:** Pill-shaped input with mic + send arrow icons inside. Sends to `/follow-up` with the moment ID + history + new question.
- **Where:** `Conversation.tsx`.
- **Why:** Once the chips are exhausted, users want to ask their own question.

### 5.3 Voice input via Web Speech API

- **What:** Tap the mic, dictate, transcribed text fills the input. Listening state shows a gold pulsing chip.
- **Where:** `frontend/src/components/VoiceInput.tsx`.
- **Why:** Phone-first UX. Typing on mobile while watching TV is friction. See [ADR-0003](decisions/adr-0003-voice-input-web-speech.md).

### 5.4 16px input font (no iOS zoom)

- **What:** The follow-up input uses `text-base` (16px) so iOS Safari does not auto-zoom on focus.
- **Where:** `Conversation.tsx`.
- **Why:** iOS auto-zooms inputs below 16px. Zooming during a live demo is jarring and breaks the share gesture.

### 5.5 Streaming history

- **What:** All turns persist in the chat thread until the user navigates away. Latest assistant turn shows "Thinking..." while waiting for the first token.
- **Where:** `Conversation.tsx::turns` state.
- **Why:** Lets the user re-read prior answers and ask follow-ups grounded in them.

---

## 6. Sharing

How a moment leaves the app.

### 6.1 Generate share link

- **What:** "Share link" button uploads the moment frame + explanation + sport metadata to backend storage, returns a permalink at `/m/<id>`.
- **Where:** `frontend/src/components/ShareControls.tsx`, `backend/app/routes/moments.py`.
- **Why:** The Scenario B family-group-chat play. The viewer needs a single link to send.

### 6.2 Native share sheet

- **What:** "Share" button uses `navigator.share()` when available, falling back to clipboard copy.
- **Where:** `ShareControls.tsx::nativeShare`.
- **Why:** iOS share sheet hits Messages, Mail, and AirDrop in one tap.

### 6.3 OpenGraph rich previews

- **What:** Each `/m/<id>` page generates an OG image at `/m/<id>/opengraph-image` showing the captured frame, sport, and a short summary.
- **Where:** `frontend/src/app/m/[id]/opengraph-image.tsx`.
- **Why:** Pasted links in iMessage / Slack / Twitter unfurl with a real preview. Without this they show as raw URLs.

### 6.4 Cloud Storage for shared frames

- **What:** Shared moment frames live in the `laurel-495915-moments` Cloud Storage bucket. Metadata (sport, summary, explanation) lives in Firestore.
- **Where:** `backend/app/storage/cloud_store.py`, `local_store.py`.
- **Why:** Permalinks need persistence beyond the user's browser session.

### 6.5 Copy explanation

- **What:** Secondary action that copies the explanation text to clipboard, no link generation.
- **Where:** `MomentViewer.tsx::copyText`.
- **Why:** Some users want to paste the answer into their existing chat without surfacing a Laurel link.

---

## 7. Sport Browser

Standalone exploration of the curated KB.

### 7.1 Sports index

- **What:** `/sports` lists all six sports with type and parity pair. Tap a card to drill in.
- **Where:** `frontend/src/app/sports/page.tsx`, `components/SportCard.tsx`.
- **Why:** Lets users explore Laurel's coverage without capturing a moment.

### 7.2 Sport detail with section accordion

- **What:** `/sports/<slug>` renders the sport's KB sections in priority order (Rules, Scoring, Classifications, What to Look For, Glossary, Notable Records). First section is expanded by default.
- **Where:** `frontend/src/app/sports/[slug]/page.tsx`, `components/SectionAccordion.tsx`.
- **Why:** Hand-authored content deserves to be browseable, not buried behind a vision call.

### 7.3 Markdown rendering with brand styling

- **What:** Section content is rendered with `react-markdown` + `remark-gfm`. Bold terms in glossaries, bullet lists, headings — all styled to match the brand.
- **Where:** `SectionAccordion.tsx`.
- **Why:** KB is authored in Markdown. Rendering as plain text was leaking literal `**bold**` markers.

---

## 8. Demos

Pre-loaded scenarios for judges and first-time visitors.

### 8.1 Demo index

- **What:** `/demo` lists both scenarios with thumbnails, descriptions, and the suggested questions for each.
- **Where:** `frontend/src/app/demo/page.tsx`.
- **Why:** Front door for anyone without a live broadcast handy. Surfaces the demos in one click.

### 8.2 Demo A: curling double-touch

- **What:** `/demo/a` pre-loads the curling broadcast mockup frame, auto-runs `/explain`, and pre-stages "What is the double touch rule?" as the suggested chip.
- **Where:** `frontend/src/app/demo/[id]/page.tsx`.
- **Why:** Stand-in for a real Cortina 2026 double-touch moment that submission rules forbid showing.

### 8.3 Demo B: long jump T64 world record

- **What:** `/demo/b` pre-loads the long jump T64 mockup frame and pre-stages three chips: "What is the world record that was broken?", "How does it compare to the regular Olympics?", "Why does it matter?".
- **Where:** `frontend/src/app/demo/[id]/page.tsx`.
- **Why:** Demonstrates the Para coverage flow with the structural Olympic-vs-Paralympic comparison question that casual viewers actually ask.

### 8.4 Replay-this-scene CTA

- **What:** Bottom CTA bumps a `nonce` and re-mounts MomentViewer, re-running the stream against the same frame.
- **Where:** `frontend/src/app/demo/[id]/page.tsx`.
- **Why:** Lets demo presenters dry-run repeatedly without leaving the page.

### 8.5 Stub mock responses

- **What:** Without GCP creds, the stub backend fingerprints the demo frames and returns scenario-specific canned vision + explanation responses, routing follow-up questions by intent.
- **Where:** `backend/app/ai/gemini_client.py`.
- **Why:** Demos work end-to-end on a fresh clone with no credentials.

---

## 9. Visual Identity and Motion

Brand elements.

### 9.1 Laurel mark with progressive draw

- **What:** Two-branch laurel SVG with stroke-dashoffset animation for the branches and stagger pop for the leaves.
- **Where:** `frontend/src/components/LaurelMark.tsx`.
- **Why:** Brand wordmark. Reuses across landing intro, capture surface placeholder, end card.

### 9.2 Landing intro animation

- **What:** Plays once per hard reload: laurel branches draw, leaves pop, eyebrow + wordmark + caption fade up, CTA enters last and starts shimmering. Suppressed on client-side navigation within the SPA via a module-level flag.
- **Where:** `frontend/src/components/LandingHero.tsx`.
- **Why:** First impression. Quiet on every nav-back so it does not feel obnoxious.

### 9.3 Shimmer CTA

- **What:** Primary CTAs use a 5-stop palindrome gradient (laurel-deep → laurel → gold → laurel → laurel-deep) panned left-to-right via `laurel-shimmer` keyframes.
- **Where:** `LandingHero.tsx`, `MomentViewer.tsx`, `globals.css`.
- **Why:** Signals "this is the action" without being garish. Palindrome stops mean the loop has no visible seam.

### 9.4 Recording / processing pulse ring

- **What:** Inset 4px gold + laurel outline with breathing inner glow. Plays during capture and during Laurel synthesis.
- **Where:** `globals.css::laurel-pulse-ring`, `MomentViewer.tsx`, `CaptureSurface.tsx`.
- **Why:** Same visual language for both "we are capturing" and "we are thinking" states.

### 9.5 prefers-reduced-motion respect

- **What:** All intro and shimmer animations disable when the OS-level reduced-motion preference is set.
- **Where:** `globals.css`, `LandingHero.tsx::REDUCED_MOTION_QUERY`.
- **Why:** Accessibility baseline.

---

## 10. Compliance and Safety

Guardrails that keep the live app submission-rule compliant.

### 10.1 Athlete-name lockout in system prompt

- **What:** System prompt forbids naming any individual regardless of whether the name appears in retrieved context.
- **Where:** `backend/app/ai/prompts.py`.
- **Why:** Hard rule from Devpost: "strict prohibition on the use of any athlete's Name, Image, or Likeness."

### 10.2 NGB-name scrubbed KB

- **What:** "World Curling", "World Athletics", "FIS", "IPC" replaced with role descriptors throughout the KB.
- **Where:** All files in `backend/kb/sports/`.
- **Why:** Hard rule: "You must use the official sport terminology, not the name of the National Governing Body (NGB)."

### 10.3 Prescribed Games terminology

- **What:** Full references use "Olympic Winter Games Milano Cortina 2026" / "Olympic Games Tokyo 2020" format. Secondary references use "the Winter Olympics" / "the Games". Adjective uses ("Olympic curling") allowed.
- **Where:** KB files and frontend copy.
- **Why:** Hard rule: bare "Olympic Games" reference is forbidden.

### 10.4 No corporate brands except Google Cloud

- **What:** Only Google Cloud product names appear in UI, mockups, and docs. Vercel, Reddit, NBC, etc. were swept.
- **Where:** Frontend copy, Remotion compositions, demo assets.
- **Why:** Hard rule: "cannot include any corporate branding other than Google Cloud."

### 10.5 Conditional-phrasing requirement

- **What:** System prompt requires conditional phrasing ("could be considered", "is widely regarded", "might suggest") for any forward-looking or uncertain claim.
- **Where:** `prompts.py`.
- **Why:** Per the hackathon judging rubric, factual confidence without grounding is a flag.

---

## 11. Operational

Infrastructure and ops.

### 11.1 Stateless backend on Cloud Run

- **What:** FastAPI service with no in-process session state. KB is loaded on boot. All per-request state lives in the request itself.
- **Where:** `backend/app/main.py`, `backend/Dockerfile`.
- **Why:** Cloud Run autoscales horizontally. Stateless is the unlock.

### 11.2 Cloud Build pipeline

- **What:** `cloudbuild.yaml` builds the backend image, pushes to Artifact Registry, and deploys to Cloud Run with the right env vars and service account.
- **Where:** `backend/cloudbuild.yaml`.
- **Why:** One command (`gcloud builds submit`) handles a full deploy.

### 11.3 CORS allowlist

- **What:** `CORS_ALLOWED_ORIGINS` env var (comma-separated) drives the FastAPI CORS middleware. Currently allows `https://laurel.vercel.app`, `https://laurel-dawsonpars-projects.vercel.app`, and `http://localhost:3000`.
- **Where:** `backend/app/config.py`, `backend/app/main.py`.
- **Why:** The frontend lives on a different origin than the backend.

### 11.4 Health endpoint

- **What:** `GET /` returns service status. Used by the Cloud Run health check.
- **Where:** `backend/app/main.py`.
- **Why:** Standard ops surface.

### 11.5 Stub-vs-Vertex client switch

- **What:** `get_client()` returns the stub when `GOOGLE_CLOUD_PROJECT` is unset, and the Vertex AI client when set. Same applies to the moments store (local FS vs Cloud Storage + Firestore).
- **Where:** `backend/app/ai/gemini_client.py`, `backend/app/storage/`.
- **Why:** One codebase. Local dev and prod differ only in environment.

---

## 12. Documentation and Tooling

The repo itself.

### 12.1 ADR-driven decisions

- **What:** Four ADRs in `docs/decisions/` capture project structure, capture-feedback design, voice input, and storage strategy. Numbered, immutable, never deleted.
- **Where:** `docs/decisions/`.
- **Why:** Future contributors should see why something is the way it is, not have to guess.

### 12.2 Runbooks

- **What:** Step-by-step ops guides for local development and deployment.
- **Where:** `docs/runbooks/`.
- **Why:** Reduces tribal knowledge.

### 12.3 Knowledge base entries

- **What:** Domain references that inform decisions: hackathon rules, Paralympic classifications.
- **Where:** `docs/knowledge-base/`.
- **Why:** Pinned facts that the team and the codebase depend on.

### 12.4 Test suite

- **What:** Pytest suite covering KB loading, retrieval, route handlers.
- **Where:** `backend/tests/`.
- **Why:** Refactors land safely.

### 12.5 Apache 2.0 license

- **What:** Required for hackathon submission.
- **Where:** `LICENSE`.
- **Why:** Hard rule.
