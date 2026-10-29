"""
Unit tests for ocr_service.extract_text.
pytesseract is mocked so no external OCR binary invocation is required.
"""
import io
from unittest.mock import patch

import pytest
from PIL import Image


def _jpeg_bytes() -> bytes:
    """8×8 white JPEG for feeding into Pillow without triggering the real OCR path."""
    buf = io.BytesIO()
    Image.new("RGB", (8, 8), (255, 255, 255)).save(buf, format="JPEG")
    return buf.getvalue()


def _run(ocr_output: str):
    from app.services.ocr_service import extract_text

    with patch(
        "app.services.ocr_service.pytesseract.image_to_string", return_value=ocr_output
    ) as mocked:
        blocks = extract_text(_jpeg_bytes())
    return blocks, mocked


class TestExtractText:
    def test_single_line_returned_as_one_block(self):
        blocks, _ = _run("NORD-008\n")
        assert len(blocks) == 1
        assert blocks[0].text == "NORD-008"

    def test_tesseract_called_once(self):
        """OCR is deterministic for a given image — one pass is enough."""
        _, mocked = _run("CAT42")
        assert mocked.call_count == 1

    def test_internal_whitespace_collapsed(self):
        blocks, _ = _run("  NORD   008  ")
        assert blocks[0].text == "NORD 008"

    def test_form_feed_and_control_chars_stripped(self):
        blocks, _ = _run("CAT42\x0c")
        assert blocks[0].text == "CAT42"

    def test_empty_output_returns_empty_list(self):
        blocks, _ = _run("")
        assert blocks == []

    def test_whitespace_only_output_returns_empty_list(self):
        blocks, _ = _run(" \n\t\x0c")
        assert blocks == []

    def test_lowercase_letters_are_preserved(self):
        blocks, _ = _run("nord record")
        assert blocks[0].text == "nord record"

    def test_image_is_grayscaled_before_ocr(self):
        _, mocked = _run("X")
        assert mocked.call_args.args[0].mode == "L"

    def test_missing_tesseract_raises_runtime_error(self):
        import pytesseract

        from app.services.ocr_service import extract_text

        with patch(
            "app.services.ocr_service.pytesseract.image_to_string",
            side_effect=pytesseract.TesseractNotFoundError(),
        ):
            with pytest.raises(RuntimeError, match="Tesseract executable not found"):
                extract_text(_jpeg_bytes())
