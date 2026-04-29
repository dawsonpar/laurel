from fastapi import APIRouter, HTTPException

from app.kb import registry as kb_registry

router = APIRouter(tags=["sports"])


# Static metadata layered on top of KB content. The KB markdown owns the
# detailed sections; this registry owns presentation order and parity-pair
# linkage that the frontend grid uses.
SPORT_METADATA: dict[str, dict[str, str | None]] = {
    "figure-skating": {"name": "Figure Skating", "type": "Olympic", "parity_pair": None},
    "curling": {"name": "Curling", "type": "Olympic", "parity_pair": "wheelchair-curling"},
    "athletics": {"name": "Athletics", "type": "Olympic", "parity_pair": "para-athletics"},
    "wheelchair-curling": {
        "name": "Wheelchair Curling",
        "type": "Paralympic",
        "parity_pair": "curling",
    },
    "para-alpine-skiing": {
        "name": "Para Alpine Skiing",
        "type": "Paralympic",
        "parity_pair": None,
    },
    "para-athletics": {
        "name": "Para Athletics",
        "type": "Paralympic",
        "parity_pair": "athletics",
    },
}


def _summary(slug: str) -> dict[str, str | None]:
    meta = SPORT_METADATA[slug]
    return {"slug": slug, **meta}


@router.get("/sports")
async def list_sports() -> list[dict[str, str | None]]:
    """Return the registry order. Sports without KB markdown still appear here
    so the frontend grid is stable across deploys.
    """
    return [_summary(slug) for slug in SPORT_METADATA]


@router.get("/sports/{slug}")
async def get_sport(slug: str) -> dict[str, object]:
    if slug not in SPORT_METADATA:
        raise HTTPException(status_code=404, detail=f"Sport not found: {slug}")

    summary = _summary(slug)
    document = _find_document(slug)
    sections: dict[str, str] = document.sections if document else {}

    return {
        **summary,
        "title": document.title if document else summary["name"],
        "sections": sections,
        "has_content": bool(sections),
    }


def _find_document(slug: str):
    try:
        registry = kb_registry.get_registry()
    except RuntimeError:
        return None
    for doc in registry.documents:
        if doc.slug == slug:
            return doc
    return None
