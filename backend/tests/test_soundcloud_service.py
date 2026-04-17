"""
Unit tests for soundcloud_service.
SoundCloud client is mocked — no network calls.
"""
from unittest.mock import MagicMock, patch

from app.services.soundcloud_service import search_soundcloud


def _make_track(
    title="Track",
    url="https://soundcloud.com/user/track",
    duration_ms=None,
    artwork=None,
    username="Artist",
):
    t = MagicMock()
    t.title = title
    t.permalink_url = url
    t.duration = duration_ms
    t.artwork_url = artwork
    user = MagicMock()
    user.username = username
    t.user = user
    return t


class TestSearchSoundcloud:
    def test_duration_ms_converted_to_mm_ss(self):
        track = _make_track(duration_ms=273000)  # 4 min 33 s

        with patch("app.services.soundcloud_service.SoundCloud") as MockSC:
            MockSC.return_value.search_tracks.return_value = [track]
            links = search_soundcloud("test", limit=5)

        assert links[0].duration == "4:33"

    def test_duration_seconds_zero_padded(self):
        track = _make_track(duration_ms=65000)  # 1 min 5 s

        with patch("app.services.soundcloud_service.SoundCloud") as MockSC:
            MockSC.return_value.search_tracks.return_value = [track]
            links = search_soundcloud("test", limit=5)

        assert links[0].duration == "1:05"

    def test_limit_respected(self):
        tracks = [_make_track(title=f"Track {i}") for i in range(10)]

        with patch("app.services.soundcloud_service.SoundCloud") as MockSC:
            MockSC.return_value.search_tracks.return_value = tracks
            links = search_soundcloud("test", limit=3)

        assert len(links) == 3

    def test_none_artwork_gives_none_thumbnail(self):
        track = _make_track(artwork=None)

        with patch("app.services.soundcloud_service.SoundCloud") as MockSC:
            MockSC.return_value.search_tracks.return_value = [track]
            links = search_soundcloud("test", limit=1)

        assert links[0].thumbnail is None

    def test_artwork_url_set_as_thumbnail(self):
        track = _make_track(artwork="https://i1.sndcdn.com/artworks-abc.jpg")

        with patch("app.services.soundcloud_service.SoundCloud") as MockSC:
            MockSC.return_value.search_tracks.return_value = [track]
            links = search_soundcloud("test", limit=1)

        assert links[0].thumbnail == "https://i1.sndcdn.com/artworks-abc.jpg"

    def test_platform_is_soundcloud(self):
        with patch("app.services.soundcloud_service.SoundCloud") as MockSC:
            MockSC.return_value.search_tracks.return_value = [_make_track()]
            links = search_soundcloud("test", limit=1)

        assert links[0].platform == "soundcloud"

    def test_none_duration_stays_none(self):
        track = _make_track(duration_ms=None)

        with patch("app.services.soundcloud_service.SoundCloud") as MockSC:
            MockSC.return_value.search_tracks.return_value = [track]
            links = search_soundcloud("test", limit=1)

        assert links[0].duration is None

    def test_channel_from_user_username(self):
        track = _make_track(username="DJ Nova")

        with patch("app.services.soundcloud_service.SoundCloud") as MockSC:
            MockSC.return_value.search_tracks.return_value = [track]
            links = search_soundcloud("test", limit=1)

        assert links[0].channel == "DJ Nova"

    def test_url_and_title_set_correctly(self):
        track = _make_track(
            title="Heaven or Hell",
            url="https://soundcloud.com/quantic/heaven-or-hell",
        )

        with patch("app.services.soundcloud_service.SoundCloud") as MockSC:
            MockSC.return_value.search_tracks.return_value = [track]
            links = search_soundcloud("test", limit=1)

        assert links[0].title == "Heaven or Hell"
        assert links[0].url == "https://soundcloud.com/quantic/heaven-or-hell"

    def test_empty_results_returns_empty_list(self):
        with patch("app.services.soundcloud_service.SoundCloud") as MockSC:
            MockSC.return_value.search_tracks.return_value = []
            links = search_soundcloud("test")

        assert links == []
