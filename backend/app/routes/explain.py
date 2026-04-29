from fastapi import APIRouter, UploadFile

router = APIRouter(tags=["explain"])


@router.post("/explain")
async def explain_moment(image: UploadFile, sport_hint: str | None = None) -> dict[str, str]:
    """Stub for Day 1. Returns a placeholder response.

    Day 6-7 will replace this with the real Gemini Vision + KB retrieval
    pipeline that streams a synthesized explanation via SSE.
    """
    _ = await image.read()
    return {
        "status": "stub",
        "moment_id": "placeholder",
        "sport_detected": sport_hint or "unknown",
        "explanation": "Capture flow is scaffolded. Real explainer arrives Day 6-7.",
    }
