"""
Unit tests for discogs_service helper functions.
All HTTP calls are mocked — no real Discogs API requests are made.
"""
from unittest.mock import MagicMock, patch

import pytest

from app.services.discogs_service import (
    _safe,
    _auth_params,
    _fetch_price_stats,
    _parse_result,
    search_releases,
)


# ── _safe ─────────────────────────────────────────────────────────────────────

class TestSafe:
    def test_none_returns_none(self):
        assert _safe(None) is None

    def test_empty_string_returns_none(self):
        assert _safe("") is None

    def test_whitespace_only_returns_none(self):
        assert _safe("   ") is None

    def test_valid_string_trimmed(self):
        assert _safe("  hello  ") == "hello"

    def test_integer_converted_to_string(self):
        assert _safe(42) == "42"

    def test_zero_is_valid(self):
        assert _safe(0) == "0"

    def test_no_whitespace_left_in_result(self):
        assert _safe("  SHVL 804  ") == "SHVL 804"


# ── _auth_params ──────────────────────────────────────────────────────────────

class TestAuthParams:
    def test_token_takes_priority_over_key_secret(self):
        with patch("app.services.discogs_service.settings") as s:
            s.discogs_token = "mytoken"
            s.discogs_consumer_key = "key"
            s.discogs_consumer_secret = "secret"
            assert _auth_params() == {"token": "mytoken"}

    def test_key_and_secret_used_when_no_token(self):
        with patch("app.services.discogs_service.settings") as s:
            s.discogs_token = None
            s.discogs_consumer_key = "key"
            s.discogs_consumer_secret = "secret"
            assert _auth_params() == {"key": "key", "secret": "secret"}

    def test_empty_dict_when_no_credentials(self):
        with patch("app.services.discogs_service.settings") as s:
            s.discogs_token = None
            s.discogs_consumer_key = None
            s.discogs_consumer_secret = None
            assert _auth_params() == {}


# ── _fetch_price_stats ────────────────────────────────────────────────────────

def _http_ok(json_data: dict):
    m = MagicMock()
    m.json.return_value = json_data
    m.raise_for_status.return_value = None
    return m


class TestFetchPriceStats:
    def test_lowest_price_as_dict_with_currency(self):
        payload = {"num_for_sale": 5, "lowest_price": {"value": 12.50, "currency": "EUR"}}
        with patch("app.services.discogs_service.httpx.get", return_value=_http_ok(payload)):
            stats = _fetch_price_stats(123)

        assert stats is not None
        assert stats.num_for_sale == 5
        assert stats.lowest == pytest.approx(12.50)
        assert stats.currency == "EUR"

    def test_lowest_price_as_bare_float(self):
        payload = {"num_for_sale": 3, "lowest_price": 8.99}
        with patch("app.services.discogs_service.httpx.get", return_value=_http_ok(payload)):
            stats = _fetch_price_stats(456)

        assert stats is not None
        assert stats.lowest == pytest.approx(8.99)
        assert stats.currency is None

    def test_null_fields_return_none(self):
        payload = {"num_for_sale": None, "lowest_price": None}
        with patch("app.services.discogs_service.httpx.get", return_value=_http_ok(payload)):
            stats = _fetch_price_stats(789)

        assert stats is None

    def test_http_error_returns_none_non_fatal(self):
        with patch("app.services.discogs_service.httpx.get", side_effect=Exception("network error")):
            stats = _fetch_price_stats(999)

        assert stats is None

    def test_num_for_sale_only(self):
        payload = {"num_for_sale": 7, "lowest_price": None}
        with patch("app.services.discogs_service.httpx.get", return_value=_http_ok(payload)):
            stats = _fetch_price_stats(111)

        assert stats is not None
        assert stats.num_for_sale == 7
        assert stats.lowest is None


# ── _parse_result ─────────────────────────────────────────────────────────────

def _full_release_detail():
    return {
        "title": "OK Computer",
        "year": 1997,
        "artists": [{"name": "Radiohead"}],
        "labels": [{"name": "Parlophone", "catno": "NODATA01"}],
        "formats": [{"name": "LP"}],
        "tracklist": [
            {"position": "A1", "title": "Airbag", "duration": "4:44"},
            {"position": "A2", "title": "Paranoid Android", "duration": "6:23"},
        ],
    }


class TestParseResult:
    def test_full_parse(self):
        item = {"id": 1, "cover_image": "https://example.com/img.jpg"}
        with patch("app.services.discogs_service._fetch_release", return_value=_full_release_detail()), \
             patch("app.services.discogs_service._fetch_price_stats", return_value=None):
            result = _parse_result(item)

        assert result is not None
        assert result.title == "OK Computer"
        assert result.artist == "Radiohead"
        assert result.year == "1997"
        assert result.label == "Parlophone"
        assert result.catno == "NODATA01"
        assert result.format == "LP"
        assert len(result.tracklist) == 2
        assert result.tracklist[0].title == "Airbag"
        assert result.tracklist[0].position == "A1"

    def test_missing_id_returns_none(self):
        assert _parse_result({}) is None

    def test_falls_back_to_item_data_when_release_fetch_fails(self):
        item = {
            "id": 2,
            "title": "Fallback Title",
            "artist": "Fallback Artist",
            "year": "2000",
            "label": [],
            "formats": [],
        }
        with patch("app.services.discogs_service._fetch_release", side_effect=Exception("404")), \
             patch("app.services.discogs_service._fetch_price_stats", return_value=None):
            result = _parse_result(item)

        assert result is not None
        assert result.title == "Fallback Title"

    def test_multiple_artists_joined_with_ampersand(self):
        detail = {
            **_full_release_detail(),
            "artists": [{"name": "Artist A"}, {"name": "Artist B"}],
        }
        item = {"id": 3}
        with patch("app.services.discogs_service._fetch_release", return_value=detail), \
             patch("app.services.discogs_service._fetch_price_stats", return_value=None):
            result = _parse_result(item)

        assert result.artist == "Artist A & Artist B"

    def test_price_stats_attached(self):
        from app.models.record import PriceStats

        item = {"id": 4}
        price = PriceStats(currency="EUR", num_for_sale=2, lowest=9.99)
        with patch("app.services.discogs_service._fetch_release", return_value=_full_release_detail()), \
             patch("app.services.discogs_service._fetch_price_stats", return_value=price):
            result = _parse_result(item)

        assert result.price_stats is not None
        assert result.price_stats.lowest == pytest.approx(9.99)
        assert result.price_stats.currency == "EUR"


# ── search_releases ───────────────────────────────────────────────────────────

class TestSearchReleases:
    def test_returns_parsed_results(self):
        mock_result = MagicMock()
        with patch("app.services.discogs_service._search_raw", return_value=[{"id": 10}]), \
             patch("app.services.discogs_service._parse_result", return_value=mock_result):
            results = search_releases(artist="Radiohead", limit=5)

        assert len(results) == 1

    def test_fallback_q_search_when_field_search_empty(self):
        """If field search yields nothing, a free-text q= retry must be attempted."""
        mock_result = MagicMock()
        call_count = 0

        def mock_search_raw(params, limit):
            nonlocal call_count
            call_count += 1
            return [] if call_count == 1 else [{"id": 11}]

        with patch("app.services.discogs_service._search_raw", side_effect=mock_search_raw), \
             patch("app.services.discogs_service._parse_result", return_value=mock_result):
            results = search_releases(artist="Radiohead", album="OK Computer")

        assert call_count == 2
        assert len(results) == 1

    def test_none_parse_results_excluded(self):
        with patch("app.services.discogs_service._search_raw", return_value=[{"id": 1}]), \
             patch("app.services.discogs_service._parse_result", return_value=None):
            results = search_releases(catno="XYZ")

        assert results == []

    def test_limit_passed_to_search(self):
        with patch("app.services.discogs_service._search_raw", return_value=[]) as mock_sr, \
             patch("app.services.discogs_service._parse_result", return_value=None):
            search_releases(catno="ABC", limit=3)

        # First call must carry limit=3
        args, kwargs = mock_sr.call_args
        assert args[1] == 3 or kwargs.get("limit") == 3
