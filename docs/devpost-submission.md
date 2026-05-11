# Devpost Submission Content

Per-field copy for the [Team USA × Google Cloud Hackathon Devpost form](https://vibecodeforgoldwithgoogle.devpost.com/). Last reviewed 2026-05-11.

Paste each section into the matching field on Devpost. Word counts and character limits noted where Devpost enforces them.

---

## Project name

**Laurel**

## Tagline (≤ 200 chars)

A second-screen companion for the Olympic and Paralympic Games. Point your phone at the TV, get a grounded explanation in seconds.

## Cover image

Use `frontend/public/og-default.png` (or the first-frame of the walkthrough GIF). 1200×630 if Devpost asks.

## Track / Challenge

**Choose Your Own Challenge.**

Theme: real-time fan understanding for the Olympic and Paralympic Games. The five named tracks are about athlete-side analysis (parity reports, hometown engines, Road to LA28 brackets, archetype agents). Laurel sits on the *fan* side: the moment-by-moment "what just happened?" gap that nothing in the named tracks addresses.

---

## Inspiration

> Devpost field: "What inspired you?"

Three months ago, at the Olympic Winter Games Milano Cortina 2026, a curling stone got pulled from play. Nobody at home understood why. Hundreds of people asked the same question online. A dozen news sites wrote whole articles trying to explain one rule.

That single moment is the entire premise of Laurel. The viewer sees the moment. The viewer does not understand the moment. By the time the explainer article is written, the broadcast has moved on.

This happens hundreds of times every Games, across every sport, on every broadcast. We wanted to close the gap to seconds.

---

## What it does

> Devpost field: "What does it do?"

Laurel is a second-screen companion you keep on your phone (or on the laptop you are watching with). When something happens you do not understand, you point Laurel at the TV (camera), share your screen (laptop), or upload a screenshot. Laurel:

1. Identifies the sport with Gemini Vision across the captured frames.
2. Retrieves the relevant rule and historical context from a curated, hand-authored knowledge base of six sports (three Olympic, three Paralympic).
3. Streams a grounded explanation in 3–5 seconds. Tells you the rule, what typically happens next, why it matters.
4. Lets you ask follow-ups by tapping a suggested chip, typing, or speaking.
5. Generates a sharable link with a rich preview so the family group chat does not have to stay confused either.

Two scenarios drove the design:

- **Scenario A — Confused viewer.** Friends watching together. A judge ruling negates the highlight. One person reaches for their phone, captures the frame, gets a clear rule-based explanation in under five seconds.
- **Scenario B — "Was that a big deal?"** A world record falls. The viewer captures it, asks for context, gets historical comparison and a sharable link.

Olympic and Paralympic content is treated as structurally equal: three sports each, same retrieval pipeline, same depth of explanation. Para sports are framed as athletic events with their own rules and records, not as inspirational footnotes.

You can try both scenarios pre-loaded at:
- https://laurel-dawsonpars-projects.vercel.app/demo/a (curling double-touch)
- https://laurel-dawsonpars-projects.vercel.app/demo/b (long jump T64 world record)

---

## How we built it

> Devpost field: "How did you build it?"

**Frontend.** Next.js 16 (App Router) with React 19 and Tailwind 4, deployed on Vercel. Three capture modes (camera, screen share, upload) feed a `MomentViewer` that consumes a Server-Sent Events stream from the backend. The follow-up loop uses a single pill-shaped input with mic and submit nested inside it (16px font so iOS Safari does not auto-zoom on focus). Voice input is the browser-native Web Speech API; no third-party SDK.

**Backend.** Python 3.12 + FastAPI + uv, containerized and deployed on Cloud Run. Two endpoints power the entire experience:

- `/api/explain` — accepts captured frames, runs Gemini Vision identification, retrieves KB context, streams the synthesis.
- `/api/follow-up` — accepts a moment ID + history + new question, retrieves additional context, streams the next turn.

Both endpoints return SSE so the user sees tokens within ~600ms of submitting.

**AI.** Gemini 2.5 Flash on Vertex AI for both vision and text. Multi-frame Vision returns structured JSON (sport_slug, sport_name, moment_summary, confidence). Synthesis uses a system prompt that locks Laurel to conditional phrasing, forbids naming individuals, requires grounding in retrieved context, and treats Para sports as equal in significance.

**Knowledge base.** Six hand-authored markdown files (`backend/kb/sports/`). On boot, the backend chunks each file by section, embeds each chunk with `text-embedding-005`, and holds the vectors in an in-memory index. Per-query retrieval scopes results to the identified sport. ~30 chunks total — small enough that an in-memory index outperforms a vector DB and avoids an extra cloud dependency.

**Sharing.** Captured frames live in Cloud Storage; moment metadata in Firestore. Each `/m/<id>` permalink generates an OpenGraph image dynamically so iMessage, Slack, and Twitter unfurls show a real preview.

**Stub-first developer experience.** The backend ships with a deterministic stub Gemini client that runs the full request flow without GCP credentials. Anyone can clone the repo, `pnpm dev` + `uv run uvicorn`, and walk through the entire UX before connecting a Google Cloud project. The stub even fingerprints the demo scene frames by SHA-256 and returns scenario-specific responses, so `/demo/a` and `/demo/b` feel real out of the box.

**Compliance baked in.** The system prompt forbids naming athletes regardless of whether the name appears in retrieved context. The KB stores records and dates as facts but never names the holder. NGB names ("World Curling", "World Athletics") were swept and replaced with role descriptors. Prescribed Games terminology ("Olympic Winter Games Milano Cortina 2026") used throughout.

Full architecture diagram and rationale: [ADR-0001](https://github.com/dawsonpar/laurel/blob/main/docs/decisions/adr-0001-project-structure-and-stack.md).

---

## Challenges we ran into

> Devpost field: "What challenges did you run into?"

**1. Compliance pivot mid-build.** The original demo plan used NBC's Cortina double-touch curling clip and a Paralympic Games long jump clip as inputs. Re-reading the rules late in the build surfaced that Games footage, athlete NIL, NGB names, and any non-Google corporate brand were all forbidden in submission materials. We pivoted: built two self-produced broadcast mockups in Three.js (real 3D curling sheet with stones and skip silhouette, runway and pit with stylized blade-runner athlete), swept the KB and prompts to remove every athlete name and NGB reference, replaced news-source branding with neutral archetype labels, and re-shot the demo against the post-pivot prod stack. The product itself did not change; the surface did.

**2. iOS Safari capture quirks.** `getDisplayMedia` is not implemented on iOS Safari, so the screen-share path dead-ends on the dominant phone-side scenario. We probe browser support after mount and hide the Share Screen chip on devices where it would throw, falling back to camera + upload. Plus the input-zoom thing: any input under 16px font-size triggers iOS auto-zoom on focus, which broke the share gesture during testing. Bumping to 16px and consolidating the pill stopped the zoom and tightened the design at the same time.

**3. Streaming latency budgeting.** Live demos are unforgiving. We needed first-token-on-screen in under a second, even at the start of a long synthesis. Switched the explain pipeline to true SSE (rather than fetch-then-render) and tightened the system prompt to minimize the LLM's lead-in tokens. End-to-end now lands at ~600ms first token, ~3-5s for the full explanation.

**4. Glow ring visibility in dark mode.** Built the recording feedback ring with outset box-shadow at first; nothing visible because the parent has `overflow: hidden` and clipped the shadow on every side except the top scan-line, which read as "the ring is broken." Switched to inset shadow with a stacked 4px gold + 5px laurel outline, plus a static fallback shadow that paints before the first animation frame. Now the ring is unmistakable on every render.

**5. Markdown leaking through the sport accordion.** Sport KB files are authored in Markdown but the accordion was rendering them with `whitespace-pre-wrap`, so glossary entries showed literal `**term**` markers. Adopted react-markdown + remark-gfm with brand-styled component overrides (laurel-tinted bullet markers, semibold strong, serif headings).

---

## Accomplishments that we're proud of

> Devpost field: "What accomplishments are you proud of?"

- **Two scenarios end-to-end, in seconds.** The Cortina double-touch question gets a grounded, conditionally-phrased answer in 3-5 seconds with a rule citation. The long jump T64 world record question gets the historical comparison without naming any athlete. Both work on phone and laptop.
- **Equal Olympic and Paralympic coverage as a structural choice, not a footnote.** Three sports each, same retrieval pipeline, same depth, same UI. The system prompt explicitly instructs Laurel not to frame Para sports as exceptional or inspirational — they get the same matter-of-fact tone as non-Para sports.
- **Stub-first dev experience.** Anyone can clone the repo and walk through the entire UX (including the two demo scenarios with scenario-specific responses) without a single GCP credential. Lowers the barrier for contributors and judges to evaluate the product without setup friction.
- **Compliance built in, not bolted on.** The system prompt forbids naming individuals regardless of source. The KB stores facts without names. We swept the live app for NGB references, prescribed Games terminology, and corporate brands, then verified end-to-end with an automated transcription audit of the demo video before submission.
- **Self-produced 3D broadcast mockups.** Built a Vite + React Three Fiber site with two cinematic 3D scenes (curling sheet with double-touch flag, long jump with T64 blade-runner athlete) so we could demonstrate the product without using any actual Games footage. The scenes are camera-tracked, broadcast-HUD-overlaid, and screen-recordable.

---

## What we learned

> Devpost field: "What did you learn?"

- **Read the rules first, twice.** The compliance pivot cost roughly half a build day. Re-reading the Devpost rules after the demo plan was locked surfaced four rule classes (NIL, NGB names, Games footage, non-Google brands) we had not fully internalized. Doing the second read up front would have saved a re-shoot and a re-render.
- **Stub-first pays for itself.** Building the backend with a stub-vs-real switch from day one meant the frontend team never blocked on backend deploys, and the demo routes work end-to-end on a fresh clone with no credentials. The same pattern (`get_client()` returns stub or Vertex based on env vars) extended cleanly to storage (`local_store` vs `cloud_store`) and meant zero code changes between dev and prod.
- **Streaming feels like magic. Spinners feel like waiting.** The single highest-impact UX decision was making the explanation stream token-by-token rather than waiting for the full response. Same total latency, completely different perception.
- **Compliance is a feature, not a constraint.** Forbidding athlete names, requiring conditional phrasing, treating Para sports as structurally equal — these all *improved* the product. The output reads like a calm, careful explainer instead of a sports commentator. Other AI explainers we benchmarked sounded breathless and authoritative; Laurel sounds informed and humble.
- **3D for visual fidelity, 2D for affordance.** We built both 2D Remotion mockups and 3D React Three Fiber scenes. The 3D scenes were the right call for the broadcast feel during the demo; the 2D Remotion compositions were the right call for the architecture diagrams and parity grids in the explainer cuts. Neither replaces the other.

---

## What's next for Laurel

> Devpost field: "What's next for [project name]?"

- **Broadcast graphic OCR.** Most rule calls are announced visually on the broadcast lower-third before the commentator says them. Reading the graphic first and grounding in the rulebook turns a Vision-only identification into a Vision + OCR signal fusion.
- **Live officiating feeds.** International governing bodies publish near-real-time call data during major events. Wiring those feeds in turns "I think this is a double-touch call" into "this is officially logged as a touched-moving-stone violation, here is what happens next."
- **Multi-language explanations.** Games audiences are global. The same KB, twelve languages, voice-grade output via Gemini's multilingual capability.
- **Coverage expansion.** Six sports in the MVP. The KB pattern (one markdown file per sport) scales linearly. Twenty sports is a plausible 2-month follow-up.
- **Native broadcaster integration.** The architecture is built so Laurel could ship as a tab inside the official Games companion experience: same backend, same KB, different shell.
- **On-device classification.** Vision identification is the largest single latency cost. Distilling the sport-identification step into a small on-device model would drop end-to-end to sub-second.

---

## Built with

> Devpost field: lists technologies. Add each as a tag.

`google-cloud` `vertex-ai` `gemini` `cloud-run` `cloud-storage` `firestore` `cloud-build` `text-embedding-005` `nextjs` `react` `typescript` `tailwindcss` `vercel` `python` `fastapi` `uv` `pytest` `web-speech-api` `server-sent-events` `react-three-fiber` `threejs` `remotion` `react-markdown`

---

## Try it out (links section)

> Devpost field: lists links to project surfaces.

- **Live app:** https://laurel-dawsonpars-projects.vercel.app
- **Demos:** https://laurel-dawsonpars-projects.vercel.app/demo
- **Source code:** https://github.com/dawsonpar/laurel
- **Demo video:** _[paste YouTube link once upload finishes]_

---

## Video pitch (script reference)

> Devpost requires a ≤ 3-minute demo video uploaded as Unlisted on YouTube. The cut-by-cut script lives at:
> `/Users/dawsonpar/dp/notes/mindboard/personal/laurel-demo-script.md`

Compliance check before upload:

- [ ] No athlete name anywhere in voiceover, on-screen text, or rendered Gemini output.
- [ ] No corporate logo other than Google Cloud (audit every cut).
- [ ] "Olympic Games" alone never spoken; full reference or adjective form only.
- [ ] No "former" or "past" Olympian/Paralympian.
- [ ] No NGB name (World Curling, etc.) spoken or shown.
- [ ] §3 visibly shows Google Cloud console / AI Studio / code (rule requirement).
