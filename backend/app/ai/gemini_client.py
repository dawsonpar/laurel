"""Gemini client wrapper.

Uses the google-genai SDK in Vertex AI mode when GOOGLE_CLOUD_PROJECT is
configured. Falls back to a deterministic stub client for local dev so the
full request flow runs end-to-end without API credentials.

The stub client is what makes the "no-keys" dev experience pleasant: every
endpoint that calls Gemini still returns a coherent (if generic) response
with the same shape and streaming behavior as production.

The stub also recognizes the two demo scene frames at
`frontend/public/demo/scene-a.jpg` and `scene-b.jpg` by SHA-256 fingerprint
and returns scenario-specific mock vision + explanation responses, so the
`/demo/a` and `/demo/b` routes feel real without needing GCP creds.
"""

from __future__ import annotations

import asyncio
import hashlib
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Protocol

from app.config import get_settings


@dataclass(frozen=True)
class VisionFrame:
    """One sampled frame from the captured clip."""

    data: bytes
    mime_type: str


@dataclass(frozen=True)
class VisionResult:
    """Structured output from the sport-identification step."""

    sport_slug: str | None
    sport_name: str | None
    moment_summary: str
    confidence: float


class GeminiClient(Protocol):
    async def identify_sport(self, frames: list[VisionFrame]) -> VisionResult: ...

    def stream_explanation(self, prompt: str) -> AsyncIterator[str]: ...


class StubGeminiClient:
    """Deterministic stub for local dev. No API calls, predictable output.

    Set STUB_VISION_FORCE=unsupported to exercise the failure-mode UX
    without needing to upload a non-Olympic image.

    For the two demo scenes (frontend/public/demo/scene-a.jpg and scene-b.jpg)
    the stub fingerprints the incoming frame and returns scenario-specific
    vision + explanation responses so the demo pages feel real.
    """

    async def identify_sport(self, frames: list[VisionFrame]) -> VisionResult:
        import os

        await asyncio.sleep(0.1)
        force = os.getenv("STUB_VISION_FORCE", "").lower()
        if force == "unsupported":
            return VisionResult(
                sport_slug=None,
                sport_name=None,
                moment_summary=f"Stub identification across {len(frames)} frame(s): unrecognized.",
                confidence=0.1,
            )
        if force == "error":
            raise RuntimeError("Stub-induced vision error.")

        # Recognize the demo scene frames by content hash so /demo/a and
        # /demo/b show the right sport identification even without GCP creds.
        demo = _detect_demo_scene(frames)
        if demo is not None:
            return VisionResult(
                sport_slug=demo["sport_slug"],
                sport_name=demo["sport_name"],
                moment_summary=demo["moment_summary"],
                confidence=0.92,
            )

        return VisionResult(
            sport_slug="curling",
            sport_name="Curling",
            moment_summary=(
                f"Stub identification across {len(frames)} frame(s): curling stones in the house."
            ),
            confidence=0.5,
        )

    async def stream_explanation(self, prompt: str) -> AsyncIterator[str]:
        message = _pick_stub_response(prompt)
        # Stream word-by-word at ~50 wpm so the typewriter cadence still
        # reads as Gemini-like.
        for word in message.split():
            await asyncio.sleep(0.02)
            yield word + " "


class VertexAIGeminiClient:
    """Production client backed by Vertex AI Gemini 2.5 Flash."""

    def __init__(self, project: str, location: str, model: str) -> None:
        self._project = project
        self._location = location
        self._model = model
        self._client = None  # lazy

    def _ensure_client(self):
        if self._client is None:
            from google import genai

            self._client = genai.Client(
                vertexai=True,
                project=self._project,
                location=self._location,
            )
        return self._client

    async def identify_sport(self, frames: list[VisionFrame]) -> VisionResult:
        from google.genai import types

        client = self._ensure_client()

        n = len(frames)
        sequence_note = (
            f"You are looking at {n} frames sampled at 1 Hz from a 3-second clip, "
            "in chronological order. Use the motion across frames to inform your read."
            if n > 1
            else "You are looking at a single captured frame."
        )

        prompt = (
            "You are an Olympic and Paralympic sports identifier. "
            f"{sequence_note} "
            "Return a JSON object with these fields: "
            "sport_slug (one of: figure-skating, curling, athletics, "
            "wheelchair-curling, para-alpine-skiing, para-athletics, or null "
            "if it does not match any of these), "
            "sport_name (the human-readable name or null), "
            "moment_summary (a one-sentence factual description of what happens "
            "across the sequence), confidence (0 to 1). "
            "Respond with ONLY the JSON object."
        )

        contents: list = [
            types.Part.from_bytes(data=f.data, mime_type=f.mime_type) for f in frames
        ]
        contents.append(prompt)

        response = await asyncio.to_thread(
            client.models.generate_content,
            model=self._model,
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1,
            ),
        )

        return _parse_vision_response(response.text or "")

    async def stream_explanation(self, prompt: str) -> AsyncIterator[str]:
        client = self._ensure_client()
        loop = asyncio.get_running_loop()

        def _start_stream():
            return client.models.generate_content_stream(
                model=self._model,
                contents=prompt,
            )

        stream = await loop.run_in_executor(None, _start_stream)

        # Pump the synchronous generator into an async iterator without
        # blocking the event loop.
        def _next(it):
            try:
                return next(it)
            except StopIteration:
                return None

        iterator = iter(stream)
        while True:
            chunk = await loop.run_in_executor(None, _next, iterator)
            if chunk is None:
                break
            text = getattr(chunk, "text", None)
            if text:
                yield text


def _parse_vision_response(raw: str) -> VisionResult:
    import json

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return VisionResult(
            sport_slug=None,
            sport_name=None,
            moment_summary="Could not parse vision output.",
            confidence=0.0,
        )

    sport_slug = data.get("sport_slug")
    if isinstance(sport_slug, str) and sport_slug.lower() == "null":
        sport_slug = None

    return VisionResult(
        sport_slug=sport_slug,
        sport_name=data.get("sport_name"),
        moment_summary=data.get("moment_summary", "(no summary)"),
        confidence=float(data.get("confidence", 0.0) or 0.0),
    )


def get_client() -> GeminiClient:
    settings = get_settings()
    if settings.google_cloud_project:
        return VertexAIGeminiClient(
            project=settings.google_cloud_project,
            location=settings.google_cloud_location,
            model=settings.gemini_model,
        )
    return StubGeminiClient()


# ---------- demo-scene mocks (stub mode only) ----------

# Fingerprint = sha256 of the JPEG bytes, first 12 chars. Regenerate when
# the demo frames in frontend/public/demo/ are re-extracted.
_DEMO_FINGERPRINTS: dict[str, dict] = {
    "a9e12f40ade3": {
        "sport_slug": "curling",
        "sport_name": "Curling",
        "moment_summary": (
            "Late-end view of a curling sheet at the Olympic Winter Games "
            "Milano Cortina 2026. The broadcast graphic flags 'DOUBLE TOUCH "
            "- stone re-contact, under review.' Score: Red 5, Yellow 4, "
            "end 9 of 10, red has the hammer."
        ),
    },
    "0e4dc7907e1e": {
        "sport_slug": "para-athletics",
        "sport_name": "Para Athletics",
        "moment_summary": (
            "Long jump T64 final, attempt 4 of 6. The distance ticker reads "
            "8.74m and the broadcaster is showing a WORLD RECORD badge for "
            "'8.74m, class T64.' The previous best marker is at 8.72m."
        ),
    },
}


# Scenario + intent → canned response. Keyed by sport name so the question
# matcher can route within a sport. The 'default' key is what plays when
# no specific question keyword is matched (which is the case on the
# initial /explain stream after vision identification).
_DEMO_RESPONSES: dict[tuple[str, str], str] = {
    ("Curling", "default"): (
        "This is a 'double-touch' violation. The thrower has re-contacted "
        "the running stone after release, which is not allowed under the "
        "delivery rule (often cited as R.5(d) in the international "
        "rulebook). When the call is upheld, the non-offending team "
        "chooses one of three remedies: leave the stones, replace them as "
        "they were before the throw, or remove the offending stone. In a "
        "tight final end with the hammer in play, that single decision "
        "can swing the score. Calls like this surfaced repeatedly at "
        "Milano Cortina 2026 and prompted a mid-tournament clarification "
        "from the international governing body."
    ),
    ("Curling", "double touch"): (
        "The double-touch rule says the stone must be delivered using the "
        "handle, and contacting the granite during forward motion is not "
        "allowed. The official term is a 'touched moving stone.' If the "
        "thrower's hand or slider re-contacts the stone after release, "
        "the non-offending team picks the remedy: leave the stones in "
        "place, replace them, or remove the offender. The intent is to "
        "keep delivery clean so the thrower cannot steer the stone after "
        "release. At Milano Cortina 2026 the international governing "
        "body publicly clarified that pre-hogline double-handle contact "
        "is permitted, but post-hogline re-contact is not."
    ),
    ("Para Athletics", "default"): (
        "Long jump in class T64, the men's blade-runner classification "
        "(athletes with a single below-knee amputation competing with a "
        "running prosthesis). The mark on the board reads 8.74m. If "
        "verified, this would be a new T64 world record, two centimetres "
        "ahead of the previous 8.72m best. The bottom-third confirms it "
        "is the final, attempt 4 of 6, and the broadcast WR badge is up."
    ),
    ("Para Athletics", "world record"): (
        "The previous men's long jump T64 world record stood at 8.72m, "
        "set in 2023. The mark in this attempt is 8.74m, two centimetres "
        "further. Class T64 covers athletes with a single lower-limb "
        "amputation below the knee competing with a prosthesis (commonly "
        "called a running blade). Marks in this class have crept upward "
        "steadily as blade design and run-up technique have evolved."
    ),
    ("Para Athletics", "compare"): (
        "The all-time men's long jump record, outside the Para "
        "classification, is 8.95m, set at the World Championships in "
        "1991. So 8.74m sits about 21 centimetres short of the all-time "
        "mark. For context, the gold-medal jump at the most recent "
        "non-Para Olympic finals has typically landed in the 8.30 to "
        "8.50m range, which would mean 8.74m would have won several of "
        "those finals outright. The gap closes a little every Games."
    ),
    ("Para Athletics", "matter"): (
        "Records in T64 long jump matter because the class is one of the "
        "clearest cases where Para and non-Para marks sit side by side. "
        "Each centimetre of improvement makes the historical comparison "
        "tighter and feeds the public conversation about how to frame "
        "Para records relative to non-Para ones. It also matters inside "
        "the class itself: athletes are competing within a tight band, "
        "and a two-centimetre improvement is a meaningful jump at the "
        "elite level, similar to a marathon record falling by half a "
        "minute."
    ),
}

# Keyword groups for follow-up question routing inside a sport. First match
# wins, so order from most specific to least. Phrases are intentionally
# narrow so the LLM-default explain prompt ("explain what just happened...
# say why it could matter") does NOT accidentally match a follow-up intent.
_INTENT_KEYWORDS: dict[str, tuple[str, ...]] = {
    "double touch": ("double touch", "double-touch", "r.5(d)", "r5d"),
    "world record": (
        "world record that was broken",
        "what is the world record",
        "what record",
        "which record",
    ),
    "compare": (
        "compare",
        "comparison",
        "regular olympic",
        "non-para",
        "able-bodied",
    ),
    "matter": (
        "why does it matter",
        "why does this matter",
        "why does that matter",
        "what's the significance",
        "what is the significance",
    ),
}

_GENERIC_STUB = (
    "This is a stub response while the backend runs without GCP "
    "credentials. Connect a Google Cloud project to enable real "
    "Gemini synthesis. The captured frames and knowledge-base "
    "context would be summarized here."
)


def _fingerprint(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()[:12]


def _detect_demo_scene(frames: list[VisionFrame]) -> dict | None:
    if not frames:
        return None
    return _DEMO_FINGERPRINTS.get(_fingerprint(frames[0].data))


def _parse_prompt(prompt: str) -> tuple[str | None, str | None]:
    """Extract sport_hint and the user question from an assembled prompt.

    The prompt structure is fixed by app.ai.prompts. Best-effort string
    parsing is fine here; this only runs in stub mode.
    """
    sport: str | None = None
    for line in prompt.splitlines():
        s = line.strip()
        # Initial /explain prompt uses "Sport (vision-identified): X"
        if s.startswith("Sport (vision-identified):"):
            sport = s.split(":", 1)[1].strip()
            break
        # Follow-up prompt uses "Sport: X"
        if s.startswith("Sport:") and not s.startswith("Sport (vision"):
            sport = s.split(":", 1)[1].strip()
            break

    question: str | None = None
    for marker in ("## Viewer question", "## New question"):
        if marker in prompt:
            after = prompt.split(marker, 1)[1]
            end = after.find("##")
            question = (after if end < 0 else after[:end]).strip()
            break

    return sport, question


def _pick_stub_response(prompt: str) -> str:
    sport, question = _parse_prompt(prompt)

    if sport is None:
        return _GENERIC_STUB

    # Default for the sport (used for the initial /explain when no question
    # has been asked yet).
    default = _DEMO_RESPONSES.get((sport, "default"))

    # Detect intent from question text.
    if question:
        q = question.lower()
        for intent, keywords in _INTENT_KEYWORDS.items():
            if any(k in q for k in keywords):
                resp = _DEMO_RESPONSES.get((sport, intent))
                if resp is not None:
                    return resp

    return default or _GENERIC_STUB
