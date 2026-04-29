from app.kb.embeddings import HashedBowEmbedder
from app.kb.loader import KbChunk
from app.kb.retrieval import Retriever


def _chunk(chunk_id: str, sport: str, section: str, text: str) -> KbChunk:
    return KbChunk(chunk_id=chunk_id, sport_slug=sport, section=section, text=text)


def test_retriever_returns_most_similar_chunk_first():
    chunks = [
        _chunk("a", "curling", "Rules", "Curling stones slide on ice toward the house"),
        _chunk("b", "athletics", "Rules", "Sprinters run in lanes from blocks"),
        _chunk("c", "athletics", "Records", "Bolt set the 100m world record at 9.58"),
    ]
    retriever = Retriever(chunks, HashedBowEmbedder())

    results = retriever.retrieve("100 meter world record", k=2)
    assert results[0].chunk.chunk_id == "c"


def test_retriever_respects_sport_filter():
    chunks = [
        _chunk("a", "curling", "Rules", "stones house draw guard"),
        _chunk("b", "athletics", "Rules", "stones lane sprint"),  # decoy with shared word
    ]
    retriever = Retriever(chunks, HashedBowEmbedder())

    results = retriever.retrieve("stones", k=5, sport_filter="athletics")
    assert len(results) == 1
    assert results[0].chunk.sport_slug == "athletics"


def test_retriever_handles_empty_corpus():
    retriever = Retriever([], HashedBowEmbedder())
    assert retriever.retrieve("anything") == []
    assert retriever.size == 0


def test_retriever_handles_filter_with_no_matches():
    chunks = [_chunk("a", "curling", "Rules", "stones")]
    retriever = Retriever(chunks, HashedBowEmbedder())
    assert retriever.retrieve("stones", sport_filter="athletics") == []


def test_hashed_bow_embedder_is_l2_normalized():
    import numpy as np

    embedder = HashedBowEmbedder(dim=128)
    vectors = embedder.embed(["hello world", "different text entirely"])
    norms = np.linalg.norm(vectors, axis=1)
    assert np.allclose(norms, 1.0, atol=1e-6)
