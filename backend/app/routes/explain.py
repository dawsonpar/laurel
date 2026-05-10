"""Capture + explain pipeline.

POST /api/explain accepts one or more multipart frames (chronological order)
and streams an explanation back via Server-Sent Events. Multiple frames let
Gemini Vision read motion across the sampled instant. The pipeline is:

1. Read all frames in order.
2. Gemini Vision: identify sport + visual summary across the sequence.
3. KB retrieval: pull top-k chunks for the identified sport.
4. Gemini synthesis: stream the explanation grounded in KB context.

The sport_hint form field lets the client override identification when the
user manually disambiguates.
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import APIRouter, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from nanoid import generate as nanoid  # type: ignore[import-untyped]

from app.ai.gemini_client import VisionFrame, get_client
from app.ai.prompts import build_explain_prompt
from app.ai.streaming import pace_tokens
from app.kb import registry as kb_registry

router = APIRouter(tags=["explain"])

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FRAMES = 5


@router.post("/explain")
async def explain_moment(
    images: list[UploadFile],
    sport_hint: Annotated[str | None, Form()] = None,
):
    if not images:
        raise HTTPException(status_code=400, detail="At least one frame is required.")
    if len(images) > MAX_FRAMES:
        raise HTTPException(status_code=400, detail=f"At most {MAX_FRAMES} frames allowed.")

    frames: list[VisionFrame] = []
    for image in images:
        data = await image.read()
        mime = image.content_type or "image/jpeg"
        if mime not in ALLOWED_MIME_TYPES:
            mime = "image/jpeg"
        frames.append(VisionFrame(data=data, mime_type=mime))

    moment_id = _new_moment_id()

    async def event_stream() -> AsyncIterator[bytes]:
        client = get_client()

        # Step 1: vision identification across the frame sequence.
        vision = await client.identify_sport(frames)
        sport_slug = sport_hint or vision.sport_slug
        sport_name = vision.sport_name
        yield _sse_event(
            "vision",
            {
                "moment_id": moment_id,
                "sport_slug": sport_slug,
                "sport_name": sport_name,
                "moment_summary": vision.moment_summary,
                "confidence": vision.confidence,
            },
        )

        # Step 2: KB retrieval.
        try:
            retriever = kb_registry.get_registry().retriever
        except RuntimeError:
            retriever = None

        retrieved = []
        if retriever and sport_slug:
            query = f"{sport_name or sport_slug}: {vision.moment_summary}"
            retrieved = retriever.retrieve(query, k=5, sport_filter=sport_slug)
            yield _sse_event(
                "retrieval",
                {
                    "chunks": [
                        {
                            "chunk_id": r.chunk.chunk_id,
                            "section": r.chunk.section,
                            "score": round(r.score, 4),
                        }
                        for r in retrieved
                    ]
                },
            )

        # Step 3: stream synthesis.
        prompt = build_explain_prompt(
            moment_summary=vision.moment_summary,
            sport_name=sport_name,
            retrieved=retrieved,
        )
        async for token in pace_tokens(client.stream_explanation(prompt)):
            yield _sse_event("token", {"text": token})

        yield _sse_event("done", {"moment_id": moment_id})

    return StreamingResponse(event_stream(), media_type="text/event-stream")


def _sse_event(event: str, data: dict) -> bytes:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n".encode()


def _new_moment_id() -> str:
    return nanoid(size=10)
