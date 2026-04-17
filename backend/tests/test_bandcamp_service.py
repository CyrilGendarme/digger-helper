"""
Unit tests for bandcamp_service.
Selenium driver is mocked — no browser is launched.
"""
from unittest.mock import MagicMock, patch

import pytest

from app.services.bandcamp_service import clean_record_list_result, search_bandcamp


# ── clean_record_list_result ──────────────────────────────────────────────────

class TestCleanRecordListResult:
    def _items(self):
        return [
            {"title": "Mango", "artist": "Quantic", "href": "https://a.com", "price": ""},
            {"title": "Archipelago", "artist": "Quantic", "href": "https://b.com", "price": ""},
            {"title": "Mango", "artist": "Other Artist", "href": "https://c.com", "price": ""},
        ]

    def test_artist_exact_match_filters(self):
        results = clean_record_list_result(self._items(), artist="Quantic")
        assert len(results) == 2
        assert all(r["artist"] == "Quantic" for r in results)

    def test_artist_match_is_case_insensitive(self):
        results = clean_record_list_result(self._items(), artist="quantic")
        assert len(results) == 2

    def test_name_substring_match_filters(self):
        results = clean_record_list_result(self._items(), name="mango")
        assert len(results) == 2
        assert all("mango" in r["title"].lower() for r in results)

    def test_artist_and_name_combined_narrows_results(self):
        results = clean_record_list_result(self._items(), name="mango", artist="Quantic")
        assert len(results) == 1
        assert results[0]["artist"] == "Quantic"
        assert results[0]["title"] == "Mango"

    def test_unmatched_artist_falls_back_to_all_items(self):
        """No artist match → returns full input list unchanged."""
        results = clean_record_list_result(self._items(), artist="Unknown")
        assert len(results) == 3

    def test_unmatched_name_on_artist_filtered_set_falls_back_to_artist_set(self):
        """
        artist matches 2 items but name matches none of them →
        fall back to the artist-filtered set (not the full list).
        """
        results = clean_record_list_result(self._items(), name="nonexistent", artist="Quantic")
        assert len(results) == 2
        assert all(r["artist"] == "Quantic" for r in results)

    def test_no_filters_returns_all(self):
        results = clean_record_list_result(self._items())
        assert len(results) == 3

    def test_empty_input_returns_empty(self):
        assert clean_record_list_result([], name="anything", artist="anyone") == []


# ── search_bandcamp ───────────────────────────────────────────────────────────

def _raw_items(n=1):
    return [
        {
            "title": f"Album {i}",
            "artist": "Quantic",
            "href": f"https://quantic.bandcamp.com/album/{i}",
            "price": "€8.00",
        }
        for i in range(n)
    ]


class TestSearchBandcamp:
    def _patch_all(self, raw=None, price_fn=None):
        """Return a context-manager stack that mocks driver + info helpers."""
        raw = raw if raw is not None else _raw_items()
        if price_fn is None:
            price_fn = lambda d, items: items  # noqa: E731  (no-op, price already set)

        return (
            patch("app.services.bandcamp_service.get_or_attach_driver",
                  return_value=(MagicMock(), None)),
            patch("app.services.bandcamp_service.get_bandcamp_info", return_value=raw),
            patch("app.services.bandcamp_service.add_bandcamp_record_price",
                  side_effect=price_fn),
        )

    def test_returns_media_links_with_correct_fields(self):
        p1, p2, p3 = self._patch_all()
        with p1, p2, p3:
            links = search_bandcamp("Quantic - Mango", limit=5)

        assert len(links) == 1
        assert links[0].platform == "bandcamp"
        assert links[0].url == "https://quantic.bandcamp.com/album/0"
        assert links[0].channel == "Quantic"

    def test_price_field_from_raw_item(self):
        raw = [{"title": "Mango", "artist": "Quantic",
                "href": "https://q.bandcamp.com/mango", "price": "€8.00"}]
        p1, p2, p3 = self._patch_all(raw=raw)
        with p1, p2, p3:
            links = search_bandcamp("Quantic")

        assert links[0].price == "€8.00"

    def test_empty_price_becomes_none(self):
        raw = [{"title": "Mango", "artist": "Quantic",
                "href": "https://q.bandcamp.com/mango", "price": ""}]
        p1, p2, p3 = self._patch_all(raw=raw)
        with p1, p2, p3:
            links = search_bandcamp("Quantic")

        assert links[0].price is None

    def test_query_split_on_dash_sets_artist_and_name(self):
        """'Artist - Album' must be split: artist_q='Artist', name_q='Album'."""
        captured = {}

        def fake_info(driver, name="", artist="", record_ref=""):
            captured["name"] = name
            captured["artist"] = artist
            return []

        with patch("app.services.bandcamp_service.get_or_attach_driver",
                   return_value=(MagicMock(), None)), \
             patch("app.services.bandcamp_service.get_bandcamp_info",
                   side_effect=fake_info), \
             patch("app.services.bandcamp_service.add_bandcamp_record_price",
                   side_effect=lambda d, items: items):
            search_bandcamp("Quantic - Mango")

        assert captured["artist"] == "Quantic"
        assert captured["name"] == "Mango"

    def test_query_without_dash_goes_to_name_field(self):
        captured = {}

        def fake_info(driver, name="", artist="", record_ref=""):
            captured["name"] = name
            captured["artist"] = artist
            return []

        with patch("app.services.bandcamp_service.get_or_attach_driver",
                   return_value=(MagicMock(), None)), \
             patch("app.services.bandcamp_service.get_bandcamp_info",
                   side_effect=fake_info), \
             patch("app.services.bandcamp_service.add_bandcamp_record_price",
                   side_effect=lambda d, items: items):
            search_bandcamp("NORD008")

        assert captured["artist"] == ""
        assert captured["name"] == "NORD008"

    def test_by_prefix_stripped_from_artist(self):
        """Bandcamp subhead starts with 'by' — it must be stripped before building links."""
        raw = [{"title": "Mango", "artist": "by Quantic",
                "href": "https://q.bandcamp.com/mango", "price": ""}]
        p1, p2, p3 = self._patch_all(raw=raw)
        with p1, p2, p3:
            links = search_bandcamp("Quantic Mango")

        assert links[0].channel == "Quantic"
        assert "by" not in links[0].title

    def test_limit_respected(self):
        p1, p2, p3 = self._patch_all(raw=_raw_items(10))
        with p1, p2, p3:
            links = search_bandcamp("Quantic", limit=3)

        assert len(links) == 3

    def test_driver_quit_on_success(self):
        mock_driver = MagicMock()
        with patch("app.services.bandcamp_service.get_or_attach_driver",
                   return_value=(mock_driver, None)), \
             patch("app.services.bandcamp_service.get_bandcamp_info", return_value=[]), \
             patch("app.services.bandcamp_service.add_bandcamp_record_price",
                   side_effect=lambda d, items: items):
            search_bandcamp("test")

        mock_driver.quit.assert_called_once()

    def test_driver_quit_on_exception(self):
        """quit() must be called in the finally block even when scraping fails."""
        mock_driver = MagicMock()
        with patch("app.services.bandcamp_service.get_or_attach_driver",
                   return_value=(mock_driver, None)), \
             patch("app.services.bandcamp_service.get_bandcamp_info",
                   side_effect=Exception("scrape failed")):
            links = search_bandcamp("test")

        assert links == []
        mock_driver.quit.assert_called_once()

    def test_exception_during_driver_creation_returns_empty(self):
        with patch("app.services.bandcamp_service.get_or_attach_driver",
                   side_effect=Exception("Chrome not found")):
            links = search_bandcamp("test")

        assert links == []
