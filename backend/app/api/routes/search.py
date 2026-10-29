import logging
import time
from concurrent.futures import Future, ThreadPoolExecutor
from concurrent.futures import TimeoutError as FutureTimeoutError

from fastapi import APIRouter, Depends, Query

from app.api.deps import require_auth
from app.models.record import MediaLink, MediaSearchResponse
from app.services.bandcamp_service import search_bandcamp
from app.services.soundcloud_service import search_soundcloud
from app.services.youtube_service import search_youtube

router = APIRouter(prefix="/search", tags=["search"], dependencies=[Depends(require_auth)])
logger = logging.getLogger(__name__)

# Overall budget for the whole request — all services run concurrently against it.
SERVICE_TIMEOUT_SECONDS = 20
# Bandcamp trims its optional price lookups to finish this far ahead of the deadline.
BANDCAMP_BUDGET_MARGIN_SECONDS = 2

# Shared across requests so a slow service never blocks the response: on timeout we
# return without waiting for the straggler thread, which finishes in the background.
_pool = ThreadPoolExecutor(max_workers=12, thread_name_prefix="media-search")


def _collect(name: str, future: Future, deadline: float, t0: float) -> list[MediaLink]:
    try:
        links = future.result(timeout=max(0.0, deadline - time.perf_counter()))
    except FutureTimeoutError:
        logger.error("[search/media] %s timed out after %ds", name, SERVICE_TIMEOUT_SECONDS)
        return []
    except Exception as exc:
        logger.error("[search/media] %s failed | %s", name, exc)
        return []
    logger.info(
        "[search/media] %s completed | count=%d elapsed=%.2fs",
        name,
        len(links),
        time.perf_counter() - t0,
    )
    return links


@router.get("/media", response_model=MediaSearchResponse)
def media_search(
    artist: str = Query(..., min_length=1, description="Artist name"),
    record: str = Query(..., min_length=1, description="Record name"),
    record_ref: str | None = Query(None, min_length=1, description="Record reference"),
    limit: int = Query(2, ge=1, le=20),
):
    """
    Search YouTube, SoundCloud and Bandcamp concurrently and return merged results.
    Each service failure or timeout is non-fatal — partial results are returned.
    """
    if artist.lower() == "various":
        artist = ""

    query = " ".join(part for part in [artist, record, record_ref] if part).strip()
    logger.info("[search/media] query=%r record_ref=%r limit=%d", query, record_ref, limit)

    t0 = time.perf_counter()
    deadline = t0 + SERVICE_TIMEOUT_SECONDS
    futures = {
        "YouTube": _pool.submit(search_youtube, query, limit),
        "SoundCloud": _pool.submit(search_soundcloud, query, limit),
        "Bandcamp": _pool.submit(
            search_bandcamp,
            record,
            artist,
            record_ref or "",
            limit,
            budget_seconds=SERVICE_TIMEOUT_SECONDS - BANDCAMP_BUDGET_MARGIN_SECONDS,
        ),
    }
    results = {name: _collect(name, fut, deadline, t0) for name, fut in futures.items()}

    links = results["YouTube"] + results["SoundCloud"] + results["Bandcamp"]
    logger.info(
        "[search/media] returning %d links (yt=%d sc=%d bc=%d)",
        len(links),
        len(results["YouTube"]),
        len(results["SoundCloud"]),
        len(results["Bandcamp"]),
    )
    return MediaSearchResponse(links=links)
