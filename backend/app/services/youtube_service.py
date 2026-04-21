"""
YouTube search.
Primary path  : YouTube Data API v3 (requires YOUTUBE_API_KEY in .env).
Fallback path : youtube-search-python (scrape, no key needed).
"""

import logging
import re
from typing import List

import httpx
from youtubesearchpython import VideosSearch

from app.config import settings
from app.models.record import MediaLink, Platform


def _iso_duration(iso: str) -> str:
    """Convert PT4M33S → '4:33'."""
    import re

    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso)
    if not m:
        return iso
    h, mn, s = m.group(1), m.group(2), m.group(3)
    parts = []
    if h:
        parts.append(h)
    parts.append(mn or "0")
    parts.append((s or "0").zfill(2))
    return ":".join(parts)


def _search_via_api(query: str, limit: int) -> List[MediaLink]:
    """Use official YouTube Data API v3."""
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": limit,
        "key": settings.youtube_api_key,
    }
    with httpx.Client(timeout=10) as client:
        r = client.get("https://www.googleapis.com/youtube/v3/search", params=params)
        logger.debug("YouTube API response | status=%d query=%r", r.status_code, query)
        r.raise_for_status()
        items = r.json().get("items", [])

    logger.info("YouTube API raw items | count=%d query=%r", len(items), query)

    links: List[MediaLink] = []
    for item in items:
        vid_id = item["id"]["videoId"]
        snip = item["snippet"]
        thumbs = snip.get("thumbnails", {})
        thumb = thumbs.get("medium", {}).get("url") or thumbs.get("default", {}).get(
            "url"
        )
        links.append(
            MediaLink(
                platform=Platform.youtube,
                title=snip.get("title", ""),
                url=f"https://www.youtube.com/watch?v={vid_id}",
                thumbnail=thumb,
                channel=snip.get("channelTitle"),
            )
        )
    return links


def _search_via_scrape(query: str, limit: int) -> List[MediaLink]:
    """Fallback: youtube-search-python (no API key)."""
    logger.debug("YouTube scrape start | query=%r limit=%d", query, limit)
    search = VideosSearch(query, limit=limit)
    payload = search.result()
    results = payload.get("result", [])
    logger.info(
        "YouTube scrape raw payload | keys=%s result_count=%d query=%r",
        sorted(payload.keys()),
        len(results),
        query,
    )
    links: List[MediaLink] = []
    for item in results:
        thumbs = item.get("thumbnails") or []
        thumb = thumbs[0].get("url") if thumbs else None
        duration = item.get("duration")
        links.append(
            MediaLink(
                platform=Platform.youtube,
                title=item.get("title", ""),
                url=item.get("link", ""),
                thumbnail=thumb,
                duration=duration,
                channel=item.get("channel", {}).get("name"),
            )
        )
    return links


logger = logging.getLogger(__name__)


def _normalize_query(query: str) -> str:
    return " ".join((query or "").split()).strip()


def _is_catalog_token(token: str) -> bool:
    # Typical catalog refs such as AUS167, ABC-123, K7-001 tend to hurt recall.
    return bool(re.match(r"^[A-Za-z]{2,}\-?\d+[A-Za-z0-9]*$", token))


def _query_candidates(query: str) -> List[str]:
    """Generate broader fallback queries while preserving intent."""
    cleaned = _normalize_query(query)
    if not cleaned:
        return []

    tokens = cleaned.split()
    without_catalog = " ".join(t for t in tokens if not _is_catalog_token(t)).strip()

    candidates: List[str] = [cleaned]
    if without_catalog and without_catalog not in candidates:
        candidates.append(without_catalog)

    # If still long, keep artist + title-ish prefix as a broad fallback.
    if len(tokens) >= 3:
        prefix = " ".join(tokens[:2]).strip()
        if prefix and prefix not in candidates:
            candidates.append(prefix)

    return candidates


def _dedupe_links(links: List[MediaLink]) -> List[MediaLink]:
    seen: set[str] = set()
    deduped: List[MediaLink] = []
    for item in links:
        key = (item.url or "").strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped


def search_youtube(query: str, limit: int = 3) -> List[MediaLink]:
    logger.info("YouTube search | query=%r limit=%d", query, limit)
    logger.info("YouTube strategy | using_api_key=%s", bool(settings.youtube_api_key))
    candidates = _query_candidates(query)
    logger.info("YouTube query candidates | count=%d candidates=%r", len(candidates), candidates)

    if settings.youtube_api_key:
        for candidate in candidates:
            try:
                links = _search_via_api(candidate, limit)
                logger.info(
                    "YouTube API attempt | query=%r found=%d",
                    candidate,
                    len(links),
                )
                if links:
                    return _dedupe_links(links)[:limit]
            except Exception as exc:
                logger.warning(
                    "YouTube API failed on candidate, falling back to scrape for this candidate | query=%r error=%s",
                    candidate,
                    exc,
                )

    collected: List[MediaLink] = []
    for candidate in candidates:
        try:
            links = _search_via_scrape(candidate, limit)
            logger.info(
                "YouTube scrape attempt | query=%r found=%d",
                candidate,
                len(links),
            )
            if links:
                collected.extend(links)
                break
        except Exception:
            logger.exception("YouTube scrape failed | query=%r limit=%d", candidate, limit)

    deduped = _dedupe_links(collected)[:limit]
    if not deduped:
        logger.warning(
            "YouTube returned zero results after all candidates | original_query=%r candidates=%r limit=%d",
            query,
            candidates,
            limit,
        )
    return deduped
