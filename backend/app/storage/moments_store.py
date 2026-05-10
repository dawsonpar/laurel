"""Persistence for shareable moments.

Two backends behind a Protocol:

- LocalMomentsStore: writes frames + metadata to a temp directory on disk.
  Default for local dev. Survives restarts; gitignored.
- CloudMomentsStore: writes frames to Cloud Storage and metadata to
  Cloud Firestore. Activated when GOOGLE_CLOUD_PROJECT is configured.

The moment ID is the public share-URL slug. Frontend renders /m/<id> using
the data from get().
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Protocol

from app.config import get_settings


@dataclass
class MomentRecord:
    id: str
    sport_slug: str | None
    sport_name: str | None
    moment_summary: str
    explanation: str
    follow_ups: list[dict] = field(default_factory=list)
    created_at: float = 0.0


class MomentsStore(Protocol):
    async def save(self, record: MomentRecord, frame_bytes: bytes, mime_type: str) -> str: ...

    async def get(self, moment_id: str) -> MomentRecord | None: ...

    async def get_frame_url(self, moment_id: str) -> str | None: ...

    async def get_frame_bytes(
        self, moment_id: str
    ) -> tuple[bytes, str] | None:
        """Return (frame_bytes, mime_type) for the moment, or None if missing."""
        ...


class LocalMomentsStore:
    """Filesystem-backed store. Frames as files, metadata as JSON next to them."""

    def __init__(self, root: Path) -> None:
        self._root = root
        self._root.mkdir(parents=True, exist_ok=True)

    async def save(self, record: MomentRecord, frame_bytes: bytes, mime_type: str) -> str:
        ext = _ext_for_mime(mime_type)
        frame_path = self._root / f"{record.id}{ext}"
        meta_path = self._root / f"{record.id}.json"
        frame_path.write_bytes(frame_bytes)
        meta_path.write_text(json.dumps({**asdict(record), "frame_ext": ext}, indent=2))
        # Local frame URL is served by FastAPI; see /api/moments/{id}/frame route.
        return f"/api/moments/{record.id}/frame"

    async def get(self, moment_id: str) -> MomentRecord | None:
        meta_path = self._root / f"{moment_id}.json"
        if not meta_path.exists():
            return None
        data = json.loads(meta_path.read_text())
        data.pop("frame_ext", None)
        return MomentRecord(**data)

    async def get_frame_url(self, moment_id: str) -> str | None:
        return f"/api/moments/{moment_id}/frame"

    def get_frame_path(self, moment_id: str) -> Path | None:
        for ext in (".jpg", ".jpeg", ".png", ".webp"):
            candidate = self._root / f"{moment_id}{ext}"
            if candidate.exists():
                return candidate
        return None

    async def get_frame_bytes(
        self, moment_id: str
    ) -> tuple[bytes, str] | None:
        path = self.get_frame_path(moment_id)
        if not path:
            return None
        ext_to_mime = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
        }
        return path.read_bytes(), ext_to_mime.get(path.suffix, "image/jpeg")


def _ext_for_mime(mime_type: str) -> str:
    return {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }.get(mime_type, ".jpg")


_store: MomentsStore | None = None
_local_store: LocalMomentsStore | None = None


def get_store() -> MomentsStore:
    """Factory. Cloud when MOMENTS_BUCKET + GCP project are set, else local."""
    global _store, _local_store
    if _store is not None:
        return _store

    settings = get_settings()

    if settings.google_cloud_project and settings.moments_bucket:
        from app.storage.cloud_moments_store import CloudMomentsStore

        _store = CloudMomentsStore(
            project=settings.google_cloud_project,
            bucket_name=settings.moments_bucket,
            collection=settings.firestore_collection,
        )
        return _store

    root = (
        Path("/tmp/laurel-moments") if settings.environment == "production" else Path("tmp/moments")
    )
    _local_store = LocalMomentsStore(root=root.resolve())
    _store = _local_store
    return _store


def get_local_store() -> LocalMomentsStore | None:
    """Used by the frame-serve route to read the underlying file path."""
    get_store()
    return _local_store
