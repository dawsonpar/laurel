"""Load and chunk sport knowledge-base markdown files.

Each file follows the schema in PRD section 4. Sections (## Rules, ## Scoring,
etc.) become chunks. Each chunk carries its sport slug + section so retrieval
can filter or weight by sport.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path


SECTION_PATTERN = re.compile(r"^## (?P<section>.+)$", re.MULTILINE)

# Sections that hold metadata, not retrievable content. Excluded from chunks.
METADATA_SECTIONS = frozenset({"Type", "Parity Pair"})


@dataclass(frozen=True)
class KbChunk:
    """A retrievable unit of knowledge-base content."""

    chunk_id: str
    sport_slug: str
    section: str
    text: str

    @property
    def display_label(self) -> str:
        return f"{self.sport_slug} / {self.section}"


@dataclass(frozen=True)
class SportDocument:
    """A parsed sport markdown file."""

    slug: str
    title: str
    sections: dict[str, str]

    @property
    def chunks(self) -> list[KbChunk]:
        return [
            KbChunk(
                chunk_id=f"{self.slug}__{_slug(section)}",
                sport_slug=self.slug,
                section=section,
                text=content.strip(),
            )
            for section, content in self.sections.items()
            if content.strip() and section not in METADATA_SECTIONS
        ]


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def parse_markdown(path: Path) -> SportDocument:
    """Parse a single sport markdown file into title + section map."""
    raw = path.read_text(encoding="utf-8")
    title = _extract_title(raw, fallback=path.stem)
    sections = _split_sections(raw)
    return SportDocument(slug=path.stem, title=title, sections=sections)


def _extract_title(raw: str, fallback: str) -> str:
    for line in raw.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            return stripped[2:].strip()
    return fallback


def _split_sections(raw: str) -> dict[str, str]:
    sections: dict[str, str] = {}
    matches = list(SECTION_PATTERN.finditer(raw))
    for index, match in enumerate(matches):
        section_name = match.group("section").strip()
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(raw)
        sections[section_name] = raw[start:end].strip()
    return sections


def load_kb(directory: Path) -> list[KbChunk]:
    """Load all sport markdown files in a directory and flatten to chunks."""
    chunks: list[KbChunk] = []
    for path in sorted(directory.glob("*.md")):
        document = parse_markdown(path)
        chunks.extend(document.chunks)
    return chunks


def load_documents(directory: Path) -> list[SportDocument]:
    """Load all sport markdown files as full documents (preserving section order)."""
    return [parse_markdown(path) for path in sorted(directory.glob("*.md"))]
