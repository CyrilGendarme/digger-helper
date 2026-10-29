"""
API route tests. External services are mocked; auth is bypassed except in
the dedicated auth tests.
"""
import io
import time
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.deps import require_auth
from app.config import settings
from main import app

# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def anon_client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest.fixture
async def client(anon_client: AsyncClient):
    """Client whose requests pass the auth dependency."""
    app.dependency_overrides[require_auth] = lambda: None
    try:
        yield anon_client
    finally:
        app.dependency_overrides.pop(require_auth, None)


# ── Auth ──────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_protected_route_rejects_missing_token(anon_client: AsyncClient):
    response = await anon_client.get("/api/v1/discogs/search", params={"artist": "x"})
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_login_then_access_protected_route(anon_client: AsyncClient):
    response = await anon_client.post(
        "/api/v1/auth/login", json={"passcode": settings.app_passcode}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]

    response = await anon_client.get(
        "/api/v1/discogs/search", headers={"Authorization": f"Bearer {token}"}
    )
    # Auth passed; the 422 comes from the missing query params.
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_wrong_passcode(anon_client: AsyncClient):
    response = await anon_client.post("/api/v1/auth/login", json={"passcode": "ZZZZZZZZZZ"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_malformed_passcode(anon_client: AsyncClient):
    response = await anon_client.post("/api/v1/auth/login", json={"passcode": "short"})
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_invalid_token_rejected(anon_client: AsyncClient):
    response = await anon_client.get(
        "/api/v1/discogs/search",
        params={"artist": "x"},
        headers={"Authorization": "Bearer not-a-jwt"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_expired_token_rejected(anon_client: AsyncClient):
    import jwt

    token = jwt.encode({"sub": "user", "exp": int(time.time()) - 10}, settings.secret_key)
    response = await anon_client.get(
        "/api/v1/discogs/search",
        params={"artist": "x"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 401


# ── Health ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# ── OCR route ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_ocr_extract_success(client: AsyncClient):
    """OCR service is mocked — no model download needed."""
    from app.models.ocr import TextBlock

    mock_blocks = [
        TextBlock(text="Pink Floyd", confidence=0.99),
        TextBlock(text="The Dark Side of the Moon", confidence=0.97),
    ]

    with patch("app.api.routes.ocr.extract_text", return_value=mock_blocks):
        # Create a minimal valid JPEG in memory (1×1 white pixel)
        img_bytes = _minimal_jpeg()
        response = await client.post(
            "/api/v1/ocr/extract",
            files={"file": ("sleeve.jpg", img_bytes, "image/jpeg")},
        )

    assert response.status_code == 200
    data = response.json()
    assert len(data["blocks"]) == 2
    assert data["blocks"][0]["text"] == "Pink Floyd"
    assert "raw_text" in data


@pytest.mark.asyncio
async def test_ocr_extract_unsupported_type(client: AsyncClient):
    response = await client.post(
        "/api/v1/ocr/extract",
        files={"file": ("doc.pdf", b"%PDF-1.4", "application/pdf")},
    )
    assert response.status_code == 415


@pytest.mark.asyncio
async def test_ocr_extract_empty_image(client: AsyncClient):
    """A 0-byte body with valid content-type should fail gracefully."""
    with patch("app.api.routes.ocr.extract_text", side_effect=Exception("bad image")):
        response = await client.post(
            "/api/v1/ocr/extract",
            files={"file": ("sleeve.jpg", b"", "image/jpeg")},
        )
    assert response.status_code == 500


# ── Discogs route ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_discogs_search_requires_query(client: AsyncClient):
    """At least one search param required."""
    response = await client.get("/api/v1/discogs/search")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_discogs_search_mocked(client: AsyncClient):
    from app.models.record import DiscogsResult

    mock_result = DiscogsResult(
        id=1,
        title="The Dark Side of the Moon",
        artist="Pink Floyd",
        year="1973",
        label="Harvest",
        catno="SHVL 804",
        format="LP",
        cover_image=None,
        resource_url="https://www.discogs.com/release/1",
        tracklist=[],
    )

    with patch(
        "app.api.routes.discogs.search_releases", return_value=[mock_result]
    ):
        response = await client.get(
            "/api/v1/discogs/search",
            params={"artist": "Pink Floyd", "album": "The Dark Side of the Moon"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["results"][0]["artist"] == "Pink Floyd"


# ── Media search route ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_media_search_mocked(client: AsyncClient):
    from app.models.record import MediaLink, Platform

    mock_links = [
        MediaLink(
            platform=Platform.youtube,
            title="Pink Floyd - Money",
            url="https://www.youtube.com/watch?v=cpbbuaIA3Ds",
            thumbnail=None,
        )
    ]

    with patch("app.api.routes.search.search_youtube", return_value=mock_links), \
         patch("app.api.routes.search.search_soundcloud", return_value=[]), \
         patch("app.api.routes.search.search_bandcamp", return_value=[]):
        response = await client.get(
            "/api/v1/search/media",
            params={"artist": "Pink Floyd", "record": "Money"},
        )

    assert response.status_code == 200
    data = response.json()
    assert len(data["links"]) == 1
    assert data["links"][0]["platform"] == "youtube"


@pytest.mark.asyncio
async def test_media_search_requires_query(client: AsyncClient):
    response = await client.get("/api/v1/search/media")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_media_search_service_failure_is_non_fatal(client: AsyncClient):
    """If YouTube raises, the other services still contribute their results."""
    from app.models.record import MediaLink, Platform

    sc_link = MediaLink(
        platform=Platform.soundcloud,
        title="Some Track",
        url="https://soundcloud.com/user/track",
    )

    with patch("app.api.routes.search.search_youtube", side_effect=Exception("YouTube down")), \
         patch("app.api.routes.search.search_soundcloud", return_value=[sc_link]), \
         patch("app.api.routes.search.search_bandcamp", return_value=[]):
        response = await client.get(
            "/api/v1/search/media",
            params={"artist": "test", "record": "track"},
        )

    assert response.status_code == 200
    data = response.json()
    assert len(data["links"]) == 1
    assert data["links"][0]["platform"] == "soundcloud"


@pytest.mark.asyncio
async def test_media_search_bandcamp_price_field_present(client: AsyncClient):
    """price is an optional field on MediaLink — it must survive serialisation."""
    from app.models.record import MediaLink, Platform

    bc_link = MediaLink(
        platform=Platform.bandcamp,
        title="Mango — Quantic",
        url="https://quantic.bandcamp.com/album/mango",
        price="\u20ac8.00",
    )

    with patch("app.api.routes.search.search_youtube", return_value=[]), \
         patch("app.api.routes.search.search_soundcloud", return_value=[]), \
         patch("app.api.routes.search.search_bandcamp", return_value=[bc_link]):
        response = await client.get(
            "/api/v1/search/media",
            params={"artist": "Quantic", "record": "Mango"},
        )

    assert response.status_code == 200
    links = response.json()["links"]
    assert links[0]["price"] == "\u20ac8.00"


@pytest.mark.asyncio
async def test_media_search_all_services_empty_still_200(client: AsyncClient):
    """Zero results is valid — the endpoint must return 200 with an empty list."""
    with patch("app.api.routes.search.search_youtube", return_value=[]), \
         patch("app.api.routes.search.search_soundcloud", return_value=[]), \
         patch("app.api.routes.search.search_bandcamp", return_value=[]):
        response = await client.get(
            "/api/v1/search/media",
            params={"artist": "xyz", "record": "nonexistent"},
        )

    assert response.status_code == 200
    assert response.json()["links"] == []


@pytest.mark.asyncio
async def test_media_search_slow_service_does_not_block_response(client: AsyncClient):
    """A service exceeding the budget is dropped; the others still return promptly."""
    from app.models.record import MediaLink, Platform

    sc_link = MediaLink(platform=Platform.soundcloud, title="t", url="https://soundcloud.com/a/b")

    def slow(*_args, **_kwargs):
        time.sleep(1.0)
        return []

    with patch("app.api.routes.search.SERVICE_TIMEOUT_SECONDS", 0.2), \
         patch("app.api.routes.search.search_youtube", side_effect=slow), \
         patch("app.api.routes.search.search_soundcloud", return_value=[sc_link]), \
         patch("app.api.routes.search.search_bandcamp", side_effect=slow):
        started = time.perf_counter()
        response = await client.get(
            "/api/v1/search/media", params={"artist": "a", "record": "b"}
        )
        elapsed = time.perf_counter() - started

    assert response.status_code == 200
    assert [link["platform"] for link in response.json()["links"]] == ["soundcloud"]
    assert elapsed < 0.9


@pytest.mark.asyncio
async def test_media_search_without_ref_passes_empty_ref_to_bandcamp(client: AsyncClient):
    with patch("app.api.routes.search.search_youtube", return_value=[]), \
         patch("app.api.routes.search.search_soundcloud", return_value=[]), \
         patch("app.api.routes.search.search_bandcamp", return_value=[]) as bc:
        await client.get("/api/v1/search/media", params={"artist": "a", "record": "b"})

    assert bc.call_args.args[2] == ""


# ── Helpers ───────────────────────────────────────────────────────────────────

def _minimal_jpeg() -> bytes:
    """Return bytes for a 1×1 white JPEG without requiring Pillow at import time."""
    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", (1, 1), color=(255, 255, 255)).save(buf, format="JPEG")
    return buf.getvalue()
