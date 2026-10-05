from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import Settings
from .db import Database
from .dispatcher import Dispatcher
from .errors import install_error_handlers
from .janitor import Janitor, purge_expired, recover_on_startup
from .routes import router


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings.from_env()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        logging.basicConfig(level=settings.log_level,
                            format="%(asctime)s %(levelname)s %(name)s: %(message)s")
        settings.cases_dir.mkdir(parents=True, exist_ok=True)

        db = Database(settings.data_dir / "neurovision.db")
        db.create_all()
        recover_on_startup(db, settings)
        purge_expired(db, settings)

        dispatcher = Dispatcher(db, settings)
        janitor = Janitor(db, settings)
        app.state.db, app.state.dispatcher = db, dispatcher
        dispatcher.start()
        janitor.start()
        try:
            yield
        finally:
            dispatcher.stop()
            janitor.stop()
            dispatcher.join(timeout=10)
            db.dispose()

    app = FastAPI(
        title="NeuroVisionAI API",
        version="0.1.0",
        description="AI-assisted MRI analysis (research use only; not a medical diagnosis).",
        lifespan=lifespan,
    )
    app.state.settings = settings
    app.add_middleware(
        CORSMiddleware, allow_origins=list(settings.cors_origins),
        allow_methods=["GET", "POST", "DELETE"], allow_headers=["*"],
    )
    install_error_handlers(app)
    app.include_router(router)
    return app


app = create_app()
