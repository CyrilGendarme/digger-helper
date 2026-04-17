import logging

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


@router.get("/media", response_model=MediaSearchResponse)
def media_search(
    q: str = Query(..., min_length=1, description="Free-text search query"),
    limit: int = Query(5, ge=1, le=20),
):
    """
    Search YouTube and SoundCloud simultaneously and return merged results.
    Each service failure is non-fatal — partial results are returned.
    """
    logger.info("[search/media] q=%r limit=%d", q, limit)

    yt_links = []
    try:
        yt_links = search_youtube(q, limit=limit)
    except Exception as exc:
        logger.error("[search/media] YouTube failed | %s", exc)

    sc_links = []
    try:
        sc_links = search_soundcloud(q, limit=limit)
    except Exception as exc:
        logger.error("[search/media] SoundCloud failed | %s", exc)

    bc_links = []
    try:
        bc_links = search_bandcamp(q, limit=limit)
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
