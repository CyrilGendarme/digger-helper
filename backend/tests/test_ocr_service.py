"""
Unit tests for ocr_service.extract_text.
pytesseract is mocked so no external OCR binary invocation is required.
"""
import io
from unittest.mock import MagicMock, patch

import pytest
from PIL import Image

from app.models.ocr import TextBlock


# ── helpers ───────────────────────────────────────────────────────────────────

def _jpeg_bytes() -> bytes:
    """8×8 white JPEG for feeding into Pillow without triggering the real OCR path."""
    buf = io.BytesIO()
    Image.new("RGB", (8, 8), (255, 255, 255)).save(buf, format="JPEG")
    return buf.getvalue()


def _mock_tesseract_data(texts: list[str], confs: list[float | int | str]):
    return {"text": texts, "conf": confs}


# ── tests ─────────────────────────────────────────────────────────────────────

class TestExtractText:
    def test_multiple_blocks_joined_with_spaces(self):
        """Multiple OCR detections are joined into a single TextBlock with spaces."""
        from app.services.ocr_service import extract_text

        raw = _mock_tesseract_data(["NORD", "-", "008"], [95, 90, 98])
        with patch("app.services.ocr_service.pytesseract.image_to_data", return_value=raw):
            blocks = extract_text(_jpeg_bytes())

        assert len(blocks) == 1
        assert blocks[0].text == "NORD - 008"

    def test_average_confidence_computed(self):
        from app.services.ocr_service import extract_text

        raw = _mock_tesseract_data(["A", "B"], [80, 60])
        with patch("app.services.ocr_service.pytesseract.image_to_data", return_value=raw):
            blocks = extract_text(_jpeg_bytes())

        assert blocks[0].confidence == pytest.approx(round((0.80 + 0.60) / 2, 4))

    def test_empty_ocr_results_returns_empty_list(self):
        from app.services.ocr_service import extract_text

        raw = _mock_tesseract_data([], [])
        with patch("app.services.ocr_service.pytesseract.image_to_data", return_value=raw):
            blocks = extract_text(_jpeg_bytes())

        assert blocks == []

    def test_single_detection(self):
        from app.services.ocr_service import extract_text

        raw = _mock_tesseract_data(["CAT42"], [100])
        with patch("app.services.ocr_service.pytesseract.image_to_data", return_value=raw):
            blocks = extract_text(_jpeg_bytes())

        assert len(blocks) == 1
        assert blocks[0].text == "CAT42"
        assert blocks[0].confidence == 1.0

    def test_leading_trailing_whitespace_stripped_per_block(self):
        from app.services.ocr_service import extract_text

        raw = _mock_tesseract_data(["  NORD  ", "  008  "], [90, 80])
        with patch("app.services.ocr_service.pytesseract.image_to_data", return_value=raw):
            blocks = extract_text(_jpeg_bytes())

        assert blocks[0].text == "NORD 008"

    def test_whitespace_only_blocks_ignored(self):
        """Blocks that consist purely of whitespace are not included in the output."""
        from app.services.ocr_service import extract_text

        raw = _mock_tesseract_data(["NORD", "   ", "008"], [90, 50, 80])
        with patch("app.services.ocr_service.pytesseract.image_to_data", return_value=raw):
            blocks = extract_text(_jpeg_bytes())

        assert blocks[0].text == "NORD 008"

    def test_all_whitespace_blocks_returns_empty(self):
        from app.services.ocr_service import extract_text

        raw = _mock_tesseract_data(["  ", "\t"], [50, 30])
        with patch("app.services.ocr_service.pytesseract.image_to_data", return_value=raw):
            blocks = extract_text(_jpeg_bytes())

        assert blocks == []

    def test_fallback_psm_used_when_primary_is_weak(self):
        from app.services.ocr_service import extract_text

        primary = _mock_tesseract_data(["N0R0"], [25])
        fallback = _mock_tesseract_data(["NORD", "008"], [93, 93])
        with patch(
            "app.services.ocr_service.pytesseract.image_to_data",
            side_effect=[primary, fallback],
        ):
            blocks = extract_text(_jpeg_bytes())

        assert len(blocks) == 1
        assert blocks[0].text == "NORD 008"
        assert blocks[0].confidence == pytest.approx(0.93)

    def test_lowercase_letters_are_preserved(self):
        from app.services.ocr_service import extract_text

        raw = _mock_tesseract_data(["nord", "record"], [96, 92])
        with patch("app.services.ocr_service.pytesseract.image_to_data", return_value=raw):
            blocks = extract_text(_jpeg_bytes())

        assert len(blocks) == 1
        assert blocks[0].text == "nord record"
