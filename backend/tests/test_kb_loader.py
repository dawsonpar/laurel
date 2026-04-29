"""Loader tests use a temp KB directory so they do not depend on real content."""

from pathlib import Path

import pytest

from app.kb.loader import load_documents, load_kb, parse_markdown


@pytest.fixture
def fake_kb(tmp_path: Path) -> Path:
    sport_a = tmp_path / "alpha-sport.md"
    sport_a.write_text(
        "# Alpha Sport\n\n"
        "## Type\nOlympic\n\n"
        "## Rules\nFirst rule. Second rule.\n\n"
        "## Glossary\nTerm: meaning.\n",
        encoding="utf-8",
    )
    sport_b = tmp_path / "beta-sport.md"
    sport_b.write_text(
        "# Beta Sport\n\n## Type\nParalympic\n\n## Rules\nB rules.\n",
        encoding="utf-8",
    )
    return tmp_path


def test_parse_markdown_extracts_title_and_sections(fake_kb: Path):
    document = parse_markdown(fake_kb / "alpha-sport.md")
    assert document.slug == "alpha-sport"
    assert document.title == "Alpha Sport"
    assert document.sections["Type"] == "Olympic"
    assert document.sections["Rules"] == "First rule. Second rule."
    assert document.sections["Glossary"] == "Term: meaning."


def test_load_documents_returns_all_files_sorted(fake_kb: Path):
    documents = load_documents(fake_kb)
    assert [d.slug for d in documents] == ["alpha-sport", "beta-sport"]


def test_load_kb_flattens_to_chunks_excluding_metadata(fake_kb: Path):
    chunks = load_kb(fake_kb)
    # Type sections are filtered. Alpha has Rules + Glossary; Beta has Rules.
    assert len(chunks) == 3

    chunk_ids = {c.chunk_id for c in chunks}
    assert "alpha-sport__rules" in chunk_ids
    assert "alpha-sport__glossary" in chunk_ids
    assert "beta-sport__rules" in chunk_ids
    assert "alpha-sport__type" not in chunk_ids
    assert "beta-sport__type" not in chunk_ids


def test_load_kb_empty_directory(tmp_path: Path):
    assert load_kb(tmp_path) == []
