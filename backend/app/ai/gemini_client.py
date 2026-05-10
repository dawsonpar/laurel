"""Gemini client wrapper.

Uses the google-genai SDK in Vertex AI mode when GOOGLE_CLOUD_PROJECT is
configured. Falls back to a deterministic stub client for local dev so the
full request flow runs end-to-end without API credentials.

The stub client is what makes the "no-keys" dev experience pleasant: every
endpoint that calls Gemini still returns a coherent (if generic) response
with the same shape and streaming behavior as production.
"""

from __future__ import annotations

import asyncio
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
    """Deterministic stub for local dev. No API calls, predictable output."""

    async def identify_sport(self, frames: list[VisionFrame]) -> VisionResult:
        await asyncio.sleep(0.1)
        return VisionResult(
            sport_slug="curling",
            sport_name="Curling",
            moment_summary=(
                f"Stub identification across {len(frames)} frame(s): curling stones in the house."
            ),
            confidence=0.5,
        )

    async def stream_explanation(self, prompt: str) -> AsyncIterator[str]:
        message = (
            "This is a stub response while the backend runs without GCP "
            "credentials. Connect a Google Cloud project to enable real "
            "Gemini synthesis. The captured frames and knowledge-base "
            "context would be summarized here."
        )
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
