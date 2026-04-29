from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.kb import registry as kb_registry
from app.routes import explain, health, moments, sports


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: load knowledge base and build retriever."""
    settings = get_settings()
    kb_registry.initialize(directory=settings.kb_directory)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Laurel API",
        description="Olympic and Paralympic moment explainer powered by Gemini.",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(sports.router, prefix="/api")
    app.include_router(explain.router, prefix="/api")
    app.include_router(moments.router, prefix="/api")

    return app


app = create_app()
