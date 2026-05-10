"""Conversational follow-ups + persisted moments.

POST /api/moments — save a captured frame + explanation as a shareable moment.
                    Returns the moment_id and frame URL.
GET  /api/moments/{id} — fetch the moment for the share page.
GET  /api/moments/{id}/frame — serve the underlying frame bytes.
POST /api/moments/{id}/follow-up — streaming SSE conversational follow-up.

Persistence is filesystem in dev (gitignored). Production swaps to
Cloud Storage + Firestore via the storage strategy.
"""

from __future__ import annotations

import json
import time
from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import APIRouter, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field

from app.ai.gemini_client import get_client
from app.ai.prompts import build_followup_prompt
from app.ai.streaming import pace_tokens
from app.kb import registry as kb_registry
from app.storage.moments_store import (
    MomentRecord,
    get_local_store,
    get_store,
)

router = APIRouter(tags=["moments"])


class SaveMomentForm(BaseModel):
    moment_id: str
    sport_slug: str | None = None
    sport_name: str | None = None
    moment_summary: str = ""
    explanation: str


class HistoryTurn(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str


class FollowUpRequest(BaseModel):
    question: str
    history: list[HistoryTurn] = Field(default_factory=list)
    sport_slug: str | None = None
    sport_name: str | None = None
    moment_summary: str = ""


@router.post("/moments")
async def save_moment(
    image: UploadFile,
    moment_id: Annotated[str, Form()],
    explanation: Annotated[str, Form()],
    sport_slug: Annotated[str | None, Form()] = None,
    sport_name: Annotated[str | None, Form()] = None,
    moment_summary: Annotated[str, Form()] = "",
):
    image_bytes = await image.read()
    mime_type = image.content_type or "image/jpeg"

    record = MomentRecord(
        id=moment_id,
        sport_slug=sport_slug,
        sport_name=sport_name,
        moment_summary=moment_summary,
        explanation=explanation,
        follow_ups=[],
        created_at=time.time(),
    )
    store = get_store()
    frame_url = await store.save(record, image_bytes, mime_type)
    return {
        "moment_id": moment_id,
        "frame_url": frame_url,
        "share_path": f"/m/{moment_id}",
    }


@router.get("/moments/{moment_id}")
async def get_moment(moment_id: str):
    store = get_store()
    record = await store.get(moment_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Moment not found: {moment_id}")
    frame_url = await store.get_frame_url(moment_id)
    return {
        "moment_id": record.id,
        "sport_slug": record.sport_slug,
        "sport_name": record.sport_name,
        "moment_summary": record.moment_summary,
        "explanation": record.explanation,
        "follow_ups": record.follow_ups,
        "frame_url": frame_url,
        "created_at": record.created_at,
    }


@router.get("/moments/{moment_id}/frame")
async def get_frame(moment_id: str):
    """Serve the frame bytes.

    In dev (LocalMomentsStore active) the file is served directly.
    In production (CloudMomentsStore active) this is unused: the signed URL
    on the moment record points at Cloud Storage directly.
    """
    # Touch get_store() so the local store fixture is initialized in tests.
    get_store()
    local = get_local_store()
    if local is None:
        raise HTTPException(status_code=404, detail="Frame not served from this backend.")
    path = local.get_frame_path(moment_id)
    if not path:
        raise HTTPException(status_code=404, detail=f"Frame not found: {moment_id}")
    return FileResponse(path)


@router.post("/moments/{moment_id}/follow-up")
async def follow_up(moment_id: str, payload: FollowUpRequest):
    async def event_stream() -> AsyncIterator[bytes]:
        try:
            retriever = kb_registry.get_registry().retriever
        except RuntimeError:
            retriever = None

        retrieved = []
        if retriever:
            retrieved = retriever.retrieve(
                payload.question,
                k=5,
                sport_filter=payload.sport_slug,
            )
            yield _sse_event(
                "retrieval",
                {
                    "moment_id": moment_id,
                    "chunks": [
                        {
                            "chunk_id": r.chunk.chunk_id,
                            "section": r.chunk.section,
                            "score": round(r.score, 4),
                        }
                        for r in retrieved
                    ],
                },
            )

        prompt = build_followup_prompt(
            sport_name=payload.sport_name,
            moment_summary=payload.moment_summary,
            history=[turn.model_dump() for turn in payload.history],
            new_question=payload.question,
            retrieved=retrieved,
        )

        client = get_client()
        async for token in pace_tokens(client.stream_explanation(prompt)):
            yield _sse_event("token", {"text": token})

        yield _sse_event("done", {"moment_id": moment_id})

    return StreamingResponse(event_stream(), media_type="text/event-stream")


def _sse_event(event: str, data: dict) -> bytes:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n".encode()
