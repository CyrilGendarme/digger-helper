import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.record import DiscogsSearchResponse
from app.services.discogs_service import search_releases

router = APIRouter(prefix="/discogs", tags=["discogs"])
logger = logging.getLogger(__name__)


@router.get("/search", response_model=DiscogsSearchResponse)
def discogs_search(
    artist: Optional[str] = Query(None),
    track: Optional[str] = Query(None),
    album: Optional[str] = Query(None),
    catno: Optional[str] = Query(None),
    limit: int = Query(5, ge=1, le=20),
):
    if not any([artist, track, album, catno]):
        raise HTTPException(
            status_code=422,
            detail="Provide at least one of: artist, track, album, catno.",
        )
    logger.info(
        "[discogs/search] artist=%r track=%r album=%r catno=%r limit=%d",
        artist,
        track,
        album,
        catno,
        limit,
    )
    try:
        results = search_releases(
            artist=artist, track=track, album=album, catno=catno, limit=limit
        )
    except Exception as exc:
        logger.error("[discogs/search] failed | %s", exc)
        raise HTTPException(status_code=500, detail=f"Discogs error: {exc}") from exc

    logger.info("[discogs/search] returning %d results", len(results))
    return DiscogsSearchResponse(results=results, total=len(results))
