"""Process-wide singleton holding the loaded KB and retriever.

Initialized once on FastAPI startup via the lifespan handler in app.main.
Retrieved by route handlers that need to query.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from app.kb.embeddings import Embedder, get_embedder
from app.kb.loader import KbChunk, SportDocument, load_documents
from app.kb.retrieval import Retriever


@dataclass
class KbRegistry:
    documents: list[SportDocument]
    chunks: list[KbChunk]
    retriever: Retriever


_registry: KbRegistry | None = None


def initialize(directory: Path, embedder: Embedder | None = None) -> KbRegistry:
    """Load all KB markdown files and build the retriever. Idempotent."""
    global _registry
    documents = load_documents(directory)
    chunks = [chunk for doc in documents for chunk in doc.chunks]
    embedder = embedder or get_embedder()
    retriever = Retriever(chunks, embedder)
    _registry = KbRegistry(documents=documents, chunks=chunks, retriever=retriever)
    return _registry


def get_registry() -> KbRegistry:
    if _registry is None:
        raise RuntimeError(
            "KB registry not initialized. Call initialize() in the FastAPI lifespan handler."
        )
    return _registry


def reset_for_tests() -> None:
    global _registry
    _registry = None
