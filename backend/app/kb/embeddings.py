"""Embedding strategies for KB chunks.

Two implementations:

- VertexAIEmbedder: production. Uses Google Vertex AI text-embedding-005 via
  the google-genai SDK.
- HashedBowEmbedder: development and tests. Pure-Python hashed bag-of-words
  with no API calls. Reasonable enough for ranking when the KB is small.

Selection happens via `get_embedder()` based on whether GOOGLE_CLOUD_PROJECT
is configured.
"""

from __future__ import annotations

import hashlib
import re
from abc import ABC, abstractmethod

import numpy as np

from app.config import get_settings


class Embedder(ABC):
    """Interface for embedding text into fixed-dim float vectors."""

    @property
    @abstractmethod
    def dim(self) -> int: ...

    @abstractmethod
    def embed(self, texts: list[str]) -> np.ndarray:
        """Embed a list of texts. Returns array of shape (len(texts), dim)."""


class HashedBowEmbedder(Embedder):
    """Hashed bag-of-words embedder. Deterministic, no API calls.

    Tokenizes on word characters, hashes each token to a bucket, accumulates
    counts, then L2-normalizes. Good enough for cosine ranking on a tiny KB.
    Use for local dev and tests.
    """

    def __init__(self, dim: int = 768) -> None:
        self._dim = dim

    @property
    def dim(self) -> int:
        return self._dim

    def embed(self, texts: list[str]) -> np.ndarray:
        out = np.zeros((len(texts), self._dim), dtype=np.float32)
        for i, text in enumerate(texts):
            for token in self._tokenize(text):
                bucket = self._hash_bucket(token)
                out[i, bucket] += 1.0
        return _l2_normalize(out)

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        return [t for t in re.findall(r"[a-z0-9]+", text.lower()) if len(t) > 1]

    def _hash_bucket(self, token: str) -> int:
        digest = hashlib.md5(token.encode("utf-8")).digest()
        return int.from_bytes(digest[:4], "big") % self._dim


class VertexAIEmbedder(Embedder):
    """Vertex AI text-embedding-005 embedder.

    Model output dim is 768. Calls are batched at the SDK level.
    Lazy-imports google-genai so dev environments without the SDK still work.
    """

    _OUTPUT_DIM = 768

    def __init__(self, project: str, location: str, model: str) -> None:
        self._project = project
        self._location = location
        self._model = model
        self._client = None  # lazy init

    @property
    def dim(self) -> int:
        return self._OUTPUT_DIM

    def _ensure_client(self):
        if self._client is None:
            from google import genai

            self._client = genai.Client(
                vertexai=True,
                project=self._project,
                location=self._location,
            )
        return self._client

    def embed(self, texts: list[str]) -> np.ndarray:
        client = self._ensure_client()
        response = client.models.embed_content(model=self._model, contents=texts)
        vectors = np.array(
            [embedding.values for embedding in response.embeddings],
            dtype=np.float32,
        )
        return _l2_normalize(vectors)


def _l2_normalize(matrix: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return matrix / norms


def get_embedder() -> Embedder:
    """Factory: VertexAI if GCP project configured, else HashedBow fallback."""
    settings = get_settings()
    if settings.google_cloud_project:
        return VertexAIEmbedder(
            project=settings.google_cloud_project,
            location=settings.google_cloud_location,
            model=settings.embedding_model,
        )
    return HashedBowEmbedder()
