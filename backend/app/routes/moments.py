from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["moments"])


@router.get("/moments/{moment_id}")
async def get_moment(moment_id: str) -> dict[str, str]:
    """Stub. Day 9 wires this to Cloud Storage + Firestore."""
    raise HTTPException(status_code=404, detail=f"Moment not found: {moment_id}")


@router.post("/moments/{moment_id}/follow-up")
async def follow_up(moment_id: str, payload: dict) -> dict[str, str]:
    """Stub. Day 8 implements conversational follow-ups against existing moments."""
    return {
        "status": "stub",
        "moment_id": moment_id,
        "answer": "Follow-up flow is scaffolded. Real synthesis arrives Day 8.",
    }
