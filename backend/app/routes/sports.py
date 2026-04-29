from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["sports"])


SPORTS_REGISTRY: list[dict[str, str | None]] = [
    {"slug": "figure-skating", "name": "Figure Skating", "type": "Olympic", "parity_pair": None},
    {"slug": "curling", "name": "Curling", "type": "Olympic", "parity_pair": "wheelchair-curling"},
    {"slug": "athletics", "name": "Athletics", "type": "Olympic", "parity_pair": "para-athletics"},
    {"slug": "wheelchair-curling", "name": "Wheelchair Curling", "type": "Paralympic", "parity_pair": "curling"},
    {"slug": "para-alpine-skiing", "name": "Para Alpine Skiing", "type": "Paralympic", "parity_pair": None},
    {"slug": "para-athletics", "name": "Para Athletics", "type": "Paralympic", "parity_pair": "athletics"},
]


@router.get("/sports")
async def list_sports() -> list[dict[str, str | None]]:
    return SPORTS_REGISTRY


@router.get("/sports/{slug}")
async def get_sport(slug: str) -> dict[str, str | None]:
    for sport in SPORTS_REGISTRY:
        if sport["slug"] == slug:
            return sport
    raise HTTPException(status_code=404, detail=f"Sport not found: {slug}")
