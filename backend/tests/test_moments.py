import io
import shutil
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.storage import moments_store

client = TestClient(app)


@pytest.fixture(autouse=True)
def isolate_storage(monkeypatch):
    """Each test gets a fresh tmp directory so saved moments do not leak."""
    tmp = Path(tempfile.mkdtemp(prefix="laurel-test-"))
    moments_store._store = None  # type: ignore[attr-defined]
    moments_store._local_store = None  # type: ignore[attr-defined]
    local = moments_store.LocalMomentsStore(root=tmp)
    moments_store._store = local  # type: ignore[attr-defined]
    moments_store._local_store = local  # type: ignore[attr-defined]
    yield
    shutil.rmtree(tmp, ignore_errors=True)
    moments_store._store = None  # type: ignore[attr-defined]
    moments_store._local_store = None  # type: ignore[attr-defined]


def test_save_then_get_moment_round_trip():
    fake_image = io.BytesIO(b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 200)
    save_response = client.post(
        "/api/moments",
        files={"image": ("frame.jpg", fake_image, "image/jpeg")},
        data={
            "moment_id": "abc123",
            "sport_slug": "curling",
            "sport_name": "Curling",
            "moment_summary": "Stones in the house.",
            "explanation": "A guard play, by the free guard zone rule.",
        },
    )
    assert save_response.status_code == 200
    save_payload = save_response.json()
    assert save_payload["moment_id"] == "abc123"

    get_response = client.get("/api/moments/abc123")
    assert get_response.status_code == 200
    payload = get_response.json()
    assert payload["sport_slug"] == "curling"
    assert payload["explanation"].startswith("A guard play")
    assert payload["frame_url"].endswith("/abc123/frame")


def test_get_moment_404_for_unknown_id():
    response = client.get("/api/moments/does-not-exist")
    assert response.status_code == 404


def test_get_frame_serves_bytes():
    fake_image = io.BytesIO(b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 200)
    client.post(
        "/api/moments",
        files={"image": ("frame.jpg", fake_image, "image/jpeg")},
        data={
            "moment_id": "frame-test",
            "explanation": "Anything.",
        },
    )
    response = client.get("/api/moments/frame-test/frame")
    assert response.status_code == 200
    # FileResponse infers content-type from extension.
    assert response.headers["content-type"].startswith("image/")


def test_follow_up_streams_sse():
    response = client.post(
        "/api/moments/test123/follow-up",
        json={
            "question": "Was that a record?",
            "history": [
                {"role": "user", "content": "What just happened?"},
                {"role": "assistant", "content": "A jump in figure skating."},
            ],
            "sport_slug": "figure-skating",
            "sport_name": "Figure Skating",
            "moment_summary": "A skater landing a quad jump.",
        },
    )
    assert response.status_code == 200
    body = response.text
    assert "event: token" in body
    assert "event: done" in body


def test_follow_up_validates_history_role():
    response = client.post(
        "/api/moments/test123/follow-up",
        json={
            "question": "Why?",
            "history": [{"role": "system", "content": "bad role"}],
        },
    )
    assert response.status_code == 422
