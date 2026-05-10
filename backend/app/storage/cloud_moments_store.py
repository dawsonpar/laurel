"""Cloud Storage + Firestore moments store.

Activated when MOMENTS_BUCKET is configured. Frame bytes go to Cloud Storage
with a 30-day lifecycle TTL configured at bucket level. Metadata goes to a
Firestore collection.

Frames are served via our Cloud Run /api/moments/{id}/frame endpoint
(streaming the bytes through the backend) instead of via Cloud Storage
signed URLs. The Workload Identity credentials Cloud Run uses lack a
private key for signing; routing through our backend avoids the
google.auth.compute_engine signing limitation entirely. The cost of an
extra hop is negligible for our volume.
"""

from __future__ import annotations

from dataclasses import asdict

from app.storage.moments_store import MomentRecord


class CloudMomentsStore:
    def __init__(self, project: str, bucket_name: str, collection: str) -> None:
        self._project = project
        self._bucket_name = bucket_name
        self._collection = collection
        self._storage_client = None
        self._firestore_client = None

    def _bucket(self):
        if self._storage_client is None:
            from google.cloud import storage

            self._storage_client = storage.Client(project=self._project)
        return self._storage_client.bucket(self._bucket_name)

    def _firestore(self):
        if self._firestore_client is None:
            from google.cloud import firestore

            self._firestore_client = firestore.Client(project=self._project)
        return self._firestore_client

    async def save(self, record: MomentRecord, frame_bytes: bytes, mime_type: str) -> str:
        bucket = self._bucket()
        ext = _ext_for_mime(mime_type)
        blob_name = f"frames/{record.id}{ext}"
        blob = bucket.blob(blob_name)
        blob.upload_from_string(frame_bytes, content_type=mime_type)

        doc = self._firestore().collection(self._collection).document(record.id)
        doc.set({**asdict(record), "frame_blob": blob_name, "mime_type": mime_type})

        return f"/api/moments/{record.id}/frame"

    async def get(self, moment_id: str) -> MomentRecord | None:
        snapshot = self._firestore().collection(self._collection).document(moment_id).get()
        if not snapshot.exists:
            return None
        data = snapshot.to_dict() or {}
        data.pop("frame_blob", None)
        data.pop("mime_type", None)
        return MomentRecord(**data)

    async def get_frame_url(self, moment_id: str) -> str | None:
        snapshot = self._firestore().collection(self._collection).document(moment_id).get()
        if not snapshot.exists:
            return None
        return f"/api/moments/{moment_id}/frame"

    async def get_frame_bytes(
        self, moment_id: str
    ) -> tuple[bytes, str] | None:
        snapshot = self._firestore().collection(self._collection).document(moment_id).get()
        if not snapshot.exists:
            return None
        data = snapshot.to_dict() or {}
        blob_name = data.get("frame_blob")
        mime_type = data.get("mime_type", "image/jpeg")
        if not blob_name:
            return None
        bucket = self._bucket()
        blob = bucket.blob(blob_name)
        return blob.download_as_bytes(), mime_type


def _ext_for_mime(mime_type: str) -> str:
    return {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }.get(mime_type, ".jpg")
