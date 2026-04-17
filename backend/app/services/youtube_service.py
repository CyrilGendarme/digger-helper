"""
YouTube search.
Primary path  : YouTube Data API v3 (requires YOUTUBE_API_KEY in .env).
Fallback path : youtube-search-python (scrape, no key needed).
"""

import logging
from typing import List, Optional

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
        r.raise_for_status()
        items = r.json().get("items", [])

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
    search = VideosSearch(query, limit=limit)
    results = search.result().get("result", [])
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


def search_youtube(query: str, limit: int = 5) -> List[MediaLink]:
    logger.info("YouTube search | query=%r limit=%d", query, limit)
    if settings.youtube_api_key:
        try:
            links = _search_via_api(query, limit)
            logger.info("YouTube API | found %d results", len(links))
            return links
        except Exception as exc:
            logger.warning("YouTube API failed, falling back to scrape | %s", exc)
    try:
        links = _search_via_scrape(query, limit)
        logger.info("YouTube scrape | found %d results", len(links))
        return links
    except Exception as exc:
        logger.error("YouTube scrape failed | %s", exc)
        return []
