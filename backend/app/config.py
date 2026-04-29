from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables.

    All values are required to be present in the environment in production.
    Local development can use a `.env` file in the backend directory.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: str = "development"
    google_cloud_project: str | None = None
    google_cloud_location: str = "us-central1"
    gemini_model: str = "gemini-2.5-flash"
    embedding_model: str = "text-embedding-005"
    cors_allowed_origins: str = "http://localhost:3000"
    kb_directory: Path = Path(__file__).parent.parent / "kb" / "sports"
    moments_bucket: str | None = None
    firestore_collection: str = "laurel-moments"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",")]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
