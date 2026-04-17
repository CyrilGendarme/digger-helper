"""
Unit tests for ocr_service.extract_text.
EasyOCR reader is mocked so no model download is required.
"""
import io
from unittest.mock import MagicMock, patch

import pytest
from PIL import Image

from app.models.ocr import TextBlock


# ── helpers ───────────────────────────────────────────────────────────────────

def _jpeg_bytes() -> bytes:
    """1×1 white JPEG for feeding into Pillow without triggering the real OCR path."""
    buf = io.BytesIO()
    Image.new("RGB", (8, 8), (255, 255, 255)).save(buf, format="JPEG")
    return buf.getvalue()


def _mock_reader(readtext_return):
    """Return a fake EasyOCR Reader whose readtext() returns readtext_return."""
    m = MagicMock()
    m.readtext.return_value = readtext_return
    return m


# ── tests ─────────────────────────────────────────────────────────────────────

class TestExtractText:
    def test_multiple_blocks_concatenated_no_separator(self):
        """Multiple EasyOCR detections are joined into a single TextBlock with no gap."""
        from app.services.ocr_service import extract_text

        raw = [(None, "NORD", 0.95), (None, "-", 0.90), (None, "008", 0.98)]
        with patch("app.services.ocr_service._get_reader", return_value=_mock_reader(raw)):
            blocks = extract_text(_jpeg_bytes())

        assert len(blocks) == 1
        assert blocks[0].text == "NORD-008"

    def test_average_confidence_computed(self):
        from app.services.ocr_service import extract_text

        raw = [(None, "A", 0.80), (None, "B", 0.60)]
        with patch("app.services.ocr_service._get_reader", return_value=_mock_reader(raw)):
            blocks = extract_text(_jpeg_bytes())

        assert blocks[0].confidence == pytest.approx(round((0.80 + 0.60) / 2, 4))

    def test_empty_ocr_results_returns_empty_list(self):
        from app.services.ocr_service import extract_text

        with patch("app.services.ocr_service._get_reader", return_value=_mock_reader([])):
            blocks = extract_text(_jpeg_bytes())

        assert blocks == []

    def test_single_detection(self):
        from app.services.ocr_service import extract_text

        raw = [(None, "CAT42", 1.0)]
        with patch("app.services.ocr_service._get_reader", return_value=_mock_reader(raw)):
            blocks = extract_text(_jpeg_bytes())

        assert len(blocks) == 1
        assert blocks[0].text == "CAT42"
        assert blocks[0].confidence == 1.0

    def test_leading_trailing_whitespace_stripped_per_block(self):
        from app.services.ocr_service import extract_text

        raw = [(None, "  NORD  ", 0.9), (None, "  008  ", 0.8)]
        with patch("app.services.ocr_service._get_reader", return_value=_mock_reader(raw)):
            blocks = extract_text(_jpeg_bytes())

        assert blocks[0].text == "NORD008"

    def test_whitespace_only_blocks_ignored(self):
        """Blocks that consist purely of whitespace are not included in the output."""
        from app.services.ocr_service import extract_text

        raw = [(None, "NORD", 0.9), (None, "   ", 0.5), (None, "008", 0.8)]
        with patch("app.services.ocr_service._get_reader", return_value=_mock_reader(raw)):
            blocks = extract_text(_jpeg_bytes())

        assert blocks[0].text == "NORD008"

    def test_all_whitespace_blocks_returns_empty(self):
        from app.services.ocr_service import extract_text

        raw = [(None, "  ", 0.5), (None, "\t", 0.3)]
        with patch("app.services.ocr_service._get_reader", return_value=_mock_reader(raw)):
            blocks = extract_text(_jpeg_bytes())

        assert blocks == []
