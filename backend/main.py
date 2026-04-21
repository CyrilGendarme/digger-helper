import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import router

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("digger")
# Silence noisy third-party loggers
for _noisy in (
    "httpx",
    "httpcore",
    "urllib3",
    "discogs_client",
    "pytesseract",
    "selenium",
    "selenium.webdriver",
    "urllib3.connectionpool",
    "WDM",
    "webdriver_manager",
):
    logging.getLogger(_noisy).setLevel(logging.WARNING)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title=settings.app_title, debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.monotonic()
    response = await call_next(request)
    ms = (time.monotonic() - start) * 1000
    logger.info(
        "%s %s → %d  (%.0f ms)",
        request.method,
        request.url.path + (f"?{request.url.query}" if request.url.query else ""),
        response.status_code,
        ms,
    )
    return response


app.include_router(router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}
