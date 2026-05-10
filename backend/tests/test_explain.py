"""End-to-end test for /api/explain using the stub Gemini client.

The stub returns a deterministic vision result (curling) and a fixed text
stream. We assert the SSE protocol shape, not the model output, since the
real model is not available in test.
"""

import io

from fastapi.testclient import TestClient

from app.kb import registry as kb_registry
from app.main import app

client = TestClient(app)


def setup_module(_module):
    # Force a clean KB load against the actual project KB directory.
    # The directory may be empty during test runs (KB authoring is in-flight),
    # which is fine: the route gracefully handles an empty retriever.
    kb_registry.reset_for_tests()


def test_explain_returns_sse_stream():
    fake_image = io.BytesIO(b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 100)
    response = client.post(
        "/api/explain",
        files=[("images", ("frame.jpg", fake_image, "image/jpeg"))],
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")

    body = response.text
    # Should contain at least the vision and done events.
    assert "event: vision" in body
    assert "event: token" in body
    assert "event: done" in body


def test_explain_with_sport_hint_overrides_identification():
    fake_image = io.BytesIO(b"\xff\xd8\xff\xe0" + b"\x00" * 100)
    response = client.post(
        "/api/explain",
        files=[("images", ("frame.jpg", fake_image, "image/jpeg"))],
        data={"sport_hint": "athletics"},
    )
    assert response.status_code == 200
    body = response.text
    # Sport hint should appear in the vision event payload.
    assert '"sport_slug": "athletics"' in body
