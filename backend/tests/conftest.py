"""Pytest fixtures.

Tests must always run against the stub Gemini client and hashed-bow embedder
so they are hermetic. The `.env` file in development sets GOOGLE_CLOUD_PROJECT
to a real project, which would otherwise route tests to live Vertex AI calls.
"""

import os

# Force stub mode BEFORE any app modules import. Pydantic-settings reads
# environment variables ahead of the .env file, so this wins.
os.environ["GOOGLE_CLOUD_PROJECT"] = ""
os.environ["MOMENTS_BUCKET"] = ""

import pytest  # noqa: E402

from app.config import get_settings  # noqa: E402
from app.kb import registry as kb_registry  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_app_state():
    """Each test starts with cleared settings cache and KB registry."""
    get_settings.cache_clear()
    kb_registry.reset_for_tests()
    yield
    kb_registry.reset_for_tests()
