from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


# ── Discogs ────────────────────────────────────────────────────────────────
class DiscogsTrack(BaseModel):
    position: Optional[str] = None
    title: str
    duration: Optional[str] = None


class PriceStats(BaseModel):
    currency: Optional[str] = None
    num_for_sale: Optional[int] = None
    lowest: Optional[float] = None


class DiscogsResult(BaseModel):
    id: int
    title: str
    artist: Optional[str] = None
    year: Optional[str] = None
    label: Optional[str] = None
    catno: Optional[str] = None
    format: Optional[str] = None
    cover_image: Optional[str] = None
    resource_url: str
    tracklist: List[DiscogsTrack] = []
    price_stats: Optional[PriceStats] = None


class DiscogsSearchResponse(BaseModel):
    results: List[DiscogsResult]
    total: int


# ── Media search ──────────────────────────────────────────────────────────
class Platform(str, Enum):
    youtube = "youtube"
    soundcloud = "soundcloud"
    bandcamp = "bandcamp"


class MediaLink(BaseModel):
    platform: Platform
    title: str
    url: str
    thumbnail: Optional[str] = None
    duration: Optional[str] = None
    channel: Optional[str] = None
    price: Optional[str] = None


class MediaSearchResponse(BaseModel):
    links: List[MediaLink]
