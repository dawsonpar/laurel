from pathlib import Path

import pytest

from app.kb import registry as kb_registry


@pytest.fixture(autouse=True)
def reset():
    kb_registry.reset_for_tests()
    yield
    kb_registry.reset_for_tests()


@pytest.fixture
def fake_kb(tmp_path: Path) -> Path:
    (tmp_path / "curling.md").write_text(
        "# Curling\n\n## Rules\nStones slide on ice.\n",
        encoding="utf-8",
    )
    return tmp_path


def test_initialize_loads_documents(fake_kb: Path):
    registry = kb_registry.initialize(fake_kb)
    assert len(registry.documents) == 1
    assert registry.documents[0].slug == "curling"
    assert registry.retriever.size == 1


def test_get_registry_raises_before_initialize():
    with pytest.raises(RuntimeError):
        kb_registry.get_registry()


def test_initialize_with_missing_directory_returns_empty(tmp_path: Path):
    empty = tmp_path / "missing"
    empty.mkdir()
    registry = kb_registry.initialize(empty)
    assert registry.documents == []
    assert registry.retriever.size == 0
