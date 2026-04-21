"""
SoundCloud track search via soundcloud-v2 (scraper, no OAuth for basic search).
"""

import logging
from typing import List

from soundcloud import SoundCloud

from app.models.record import MediaLink, Platform

logger = logging.getLogger(__name__)


def search_soundcloud(query: str, limit: int = 3) -> List[MediaLink]:
    logger.info("SoundCloud search | query=%r limit=%d", query, limit)
    client = SoundCloud()
    results = client.search_tracks(query)

    links: List[MediaLink] = []
    for i, track in enumerate(results):
        if i >= limit:
            break
        artwork = getattr(track, "artwork_url", None)
        # soundcloud returns duration in ms
        raw_ms = getattr(track, "duration", None)
        duration: str | None = None
        if raw_ms:
            total_s = int(raw_ms) // 1000
            m, s = divmod(total_s, 60)
            duration = f"{m}:{str(s).zfill(2)}"

        permalink = getattr(track, "permalink_url", None) or ""
        title = getattr(track, "title", "") or ""
        user = getattr(track, "user", None)
        channel = getattr(user, "username", None) if user is not None else None

        links.append(
            MediaLink(
                platform=Platform.soundcloud,
                title=title,
                url=permalink,
                thumbnail=artwork,
                duration=duration,
                channel=channel,
            )
        )

    logger.info("SoundCloud search | found %d tracks", len(links))
    return links
