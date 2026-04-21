import logging
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError

from fastapi import APIRouter, Depends, Query

from app.api.deps import require_auth
from app.models.record import MediaSearchResponse
from app.services.youtube_service import search_youtube
from app.services.soundcloud_service import search_soundcloud
from app.services.bandcamp_service import search_bandcamp

router = APIRouter(
    prefix="/search", tags=["search"], dependencies=[Depends(require_auth)]
)
logger = logging.getLogger(__name__)
SERVICE_TIMEOUT_SECONDS = 20


@router.get("/media", response_model=MediaSearchResponse)
def media_search(
    artist: str = Query(..., min_length=1, description="Artist name"),
    record: str = Query(..., min_length=1, description="Record name"),
    record_ref: str | None = Query(None, min_length=1, description="Record reference"),
    limit: int = Query(2, ge=1, le=20),
):
    """
    Search YouTube and SoundCloud simultaneously and return merged results.
    Each service failure is non-fatal — partial results are returned.
    """
    if artist.lower() == "various":
        artist = ""

    logger.info(
        "[search/media] artist=%r record=%r record_ref=%r limit=%d",
        artist,
        record,
        record_ref,
        limit,
    )

    query = " ".join(part for part in [artist, record, record_ref] if part).strip()
    logger.info("[search/media] composed query=%r", query)

    with ThreadPoolExecutor(max_workers=3) as pool:
        t0 = time.perf_counter()
        futures = {
            "yt": pool.submit(search_youtube, query, limit),
            "sc": pool.submit(search_soundcloud, query, limit),
            "bc": pool.submit(search_bandcamp, record, artist, record_ref, limit),
        }

        yt_links = []
        sc_links = []
        bc_links = []

        try:
            yt_links = futures["yt"].result(timeout=SERVICE_TIMEOUT_SECONDS)
            logger.info("[search/media] YouTube completed | elapsed=%.2fs", time.perf_counter() - t0)
        except TimeoutError:
            logger.error(
                "[search/media] YouTube timed out after %ds", SERVICE_TIMEOUT_SECONDS
            )
        except Exception as exc:
            logger.error("[search/media] YouTube failed | %s", exc)

        try:
            sc_links = futures["sc"].result(timeout=SERVICE_TIMEOUT_SECONDS)
            logger.info("[search/media] SoundCloud completed | elapsed=%.2fs", time.perf_counter() - t0)
        except TimeoutError:
            logger.error(
                "[search/media] SoundCloud timed out after %ds", SERVICE_TIMEOUT_SECONDS
            )
        except Exception as exc:
            logger.error("[search/media] SoundCloud failed | %s", exc)

        try:
            bc_links = futures["bc"].result(timeout=SERVICE_TIMEOUT_SECONDS)
            logger.info("[search/media] Bandcamp completed | elapsed=%.2fs", time.perf_counter() - t0)
        except TimeoutError:
            logger.error(
                "[search/media] Bandcamp timed out after %ds", SERVICE_TIMEOUT_SECONDS
            )
        except Exception as exc:
            logger.error("[search/media] Bandcamp failed | %s", exc)

    links = yt_links + sc_links + bc_links
    logger.info(
        "[search/media] returning %d links (yt=%d sc=%d bc=%d)",
        len(links),
        len(yt_links),
        len(sc_links),
        len(bc_links),
    )
    return MediaSearchResponse(links=links)
