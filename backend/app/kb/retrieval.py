"""In-memory cosine similarity retrieval over KB chunks."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from app.kb.embeddings import Embedder
from app.kb.loader import KbChunk


@dataclass(frozen=True)
class RetrievedChunk:
    chunk: KbChunk
    score: float


class Retriever:
    """Cosine-similarity retriever over a fixed corpus of chunks.

    Embeddings are computed once at construction. Queries are embedded on
    every call (cheap with HashedBow, ~50ms with Vertex AI).
    """

    def __init__(self, chunks: list[KbChunk], embedder: Embedder) -> None:
        self._chunks = chunks
        self._embedder = embedder
        if chunks:
            self._matrix = embedder.embed([c.text for c in chunks])
        else:
            self._matrix = np.zeros((0, embedder.dim), dtype=np.float32)

    @property
    def size(self) -> int:
        return len(self._chunks)

    def retrieve(
        self,
        query: str,
        k: int = 5,
        sport_filter: str | None = None,
    ) -> list[RetrievedChunk]:
        if not self._chunks:
            return []
        query_vec = self._embedder.embed([query])[0]
        scores = self._matrix @ query_vec  # cosine because both sides L2-normalized

        candidate_indices = list(range(len(self._chunks)))
        if sport_filter:
            candidate_indices = [
                i for i in candidate_indices if self._chunks[i].sport_slug == sport_filter
            ]
        if not candidate_indices:
            return []

        candidate_scores = [(i, float(scores[i])) for i in candidate_indices]
        candidate_scores.sort(key=lambda pair: pair[1], reverse=True)

        top = candidate_scores[:k]
        return [RetrievedChunk(chunk=self._chunks[i], score=score) for i, score in top]
