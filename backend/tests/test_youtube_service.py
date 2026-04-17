"""
Unit tests for youtube_service.
No real HTTP calls are made.
"""
from unittest.mock import MagicMock, patch

import pytest

from app.services.youtube_service import _iso_duration, search_youtube


# ── _iso_duration ─────────────────────────────────────────────────────────────

class TestIsoDuration:
    def test_minutes_and_seconds(self):
        assert _iso_duration("PT4M33S") == "4:33"

    def test_hours_minutes_seconds(self):
        assert _iso_duration("PT1H2M3S") == "1:2:03"

    def test_seconds_only(self):
        assert _iso_duration("PT45S") == "0:45"

    def test_minutes_only(self):
        assert _iso_duration("PT3M") == "3:00"

    def test_single_digit_seconds_zero_padded(self):
        assert _iso_duration("PT1M5S") == "1:05"

    def test_malformed_string_returned_as_is(self):
        assert _iso_duration("unknown") == "unknown"

    def test_empty_pt_gives_zero(self):
        # PT with no parts → "0:00"
        assert _iso_duration("PT") == "0:00"


# ── search_youtube ────────────────────────────────────────────────────────────

def _api_response_payload(video_id="abc123", title="Test Video", channel="Test Channel"):
    return {
        "items": [
            {
                "id": {"videoId": video_id},
                "snippet": {
                    "title": title,
                    "channelTitle": channel,
                    "thumbnails": {"medium": {"url": "https://example.com/thumb.jpg"}},
                },
            }
        ]
    }


def _mock_httpx_client(response_payload):
    mock_resp = MagicMock()
    mock_resp.json.return_value = response_payload
    mock_resp.raise_for_status.return_value = None

    mock_client = MagicMock()
    mock_client.__enter__ = MagicMock(return_value=mock_client)
    mock_client.__exit__ = MagicMock(return_value=False)
    mock_client.get.return_value = mock_resp
    return mock_client


class TestSearchYoutube:
    def test_api_key_path_returns_media_links(self):
        mock_client = _mock_httpx_client(_api_response_payload())

        with patch("app.services.youtube_service.settings") as s, \
             patch("app.services.youtube_service.httpx.Client", return_value=mock_client):
            s.youtube_api_key = "FAKE_KEY"
            links = search_youtube("test query", limit=1)

        assert len(links) == 1
        assert links[0].url == "https://www.youtube.com/watch?v=abc123"
        assert links[0].platform == "youtube"
        assert links[0].channel == "Test Channel"
        assert links[0].thumbnail == "https://example.com/thumb.jpg"

    def test_scrape_fallback_when_no_api_key(self):
        mock_results = [
            {
                "title": "Scraped Video",
                "link": "https://www.youtube.com/watch?v=xyz",
                "thumbnails": [{"url": "https://example.com/t.jpg"}],
                "duration": "3:45",
                "channel": {"name": "Some Channel"},
            }
        ]
        mock_search = MagicMock()
        mock_search.result.return_value = {"result": mock_results}

        with patch("app.services.youtube_service.settings") as s, \
             patch("app.services.youtube_service.VideosSearch", return_value=mock_search):
            s.youtube_api_key = None
            links = search_youtube("test query", limit=1)

        assert len(links) == 1
        assert links[0].title == "Scraped Video"
        assert links[0].duration == "3:45"

    def test_api_failure_falls_back_to_scrape(self):
        failing_client = MagicMock()
        failing_client.__enter__ = MagicMock(return_value=failing_client)
        failing_client.__exit__ = MagicMock(return_value=False)
        failing_client.get.side_effect = Exception("quota exceeded")

        mock_results = [
            {
                "title": "Fallback Video",
                "link": "https://www.youtube.com/watch?v=fallback",
                "thumbnails": [],
                "duration": "2:00",
                "channel": {"name": "Channel"},
            }
        ]
        mock_search = MagicMock()
        mock_search.result.return_value = {"result": mock_results}

        with patch("app.services.youtube_service.settings") as s, \
             patch("app.services.youtube_service.httpx.Client", return_value=failing_client), \
             patch("app.services.youtube_service.VideosSearch", return_value=mock_search):
            s.youtube_api_key = "FAKE_KEY"
            links = search_youtube("test query", limit=1)

        assert len(links) == 1
        assert links[0].title == "Fallback Video"

    def test_both_paths_fail_returns_empty_list(self):
        failing_client = MagicMock()
        failing_client.__enter__ = MagicMock(return_value=failing_client)
        failing_client.__exit__ = MagicMock(return_value=False)
        failing_client.get.side_effect = Exception("network error")

        with patch("app.services.youtube_service.settings") as s, \
             patch("app.services.youtube_service.httpx.Client", return_value=failing_client), \
             patch("app.services.youtube_service.VideosSearch", side_effect=Exception("scrape down")):
            s.youtube_api_key = "FAKE_KEY"
            links = search_youtube("test query")

        assert links == []

    def test_no_api_key_and_scrape_fails_returns_empty_list(self):
        with patch("app.services.youtube_service.settings") as s, \
             patch("app.services.youtube_service.VideosSearch", side_effect=Exception("down")):
            s.youtube_api_key = None
            links = search_youtube("test query")

        assert links == []
