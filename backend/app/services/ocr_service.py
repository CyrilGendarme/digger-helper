import io
import logging
import os
import shutil
import subprocess
import time
from functools import lru_cache
from typing import List

import pytesseract
from PIL import Image, ImageFilter, ImageOps

from app.config import settings
from app.models.ocr import TextBlock

logger = logging.getLogger(__name__)

# Single-line mode restricted to catalog-number characters.
_TESSERACT_CONFIG = (
    "--psm 7 --oem 3 -c tessedit_char_whitelist="
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_/ "
)


def _clean_ocr_text(raw_text: str) -> str:
    # Tesseract often returns form-feed (\x0c) even when no text is detected.
    printable = "".join(ch for ch in (raw_text or "") if ch.isprintable())
    return " ".join(printable.split()).strip()


def _resolve_tesseract_binary() -> str:
    configured = settings.tesseract_cmd.strip()
    if configured and configured != "tesseract":
        return configured

    discovered = shutil.which("tesseract")
    if discovered:
        return discovered

    for candidate in ("/usr/bin/tesseract", "/usr/local/bin/tesseract"):
        if os.path.exists(candidate):
            return candidate

    return "tesseract"


pytesseract.pytesseract.tesseract_cmd = _resolve_tesseract_binary()


@lru_cache(maxsize=1)
def _tesseract_runtime_info() -> dict:
    """Resolve the binary and its version once — spawning `tesseract --version` is slow."""
    configured_cmd = pytesseract.pytesseract.tesseract_cmd
    binary_path = (
        configured_cmd if os.path.exists(configured_cmd) else shutil.which(configured_cmd)
    )

    version = "unknown"
    if binary_path:
        try:
            proc = subprocess.run(
                [binary_path, "--version"],
                check=False,
                capture_output=True,
                text=True,
                timeout=2,
            )
            first_line = (proc.stdout or "").splitlines()
            if first_line:
                version = first_line[0].strip()
        except Exception:
            pass

    return {
        "configured_cmd": configured_cmd,
        "resolved_binary": binary_path or "not-found",
        "version": version,
    }


def _preprocess_for_ocr(image: Image.Image) -> Image.Image:
    """Prepare image for OCR while keeping processing lightweight."""
    return ImageOps.grayscale(image).filter(ImageFilter.SHARPEN)


def extract_text(image_bytes: bytes) -> List[TextBlock]:
    """Run Tesseract OCR on raw image bytes and return a list of TextBlocks."""
    started = time.perf_counter()
    runtime_info = _tesseract_runtime_info()
    logger.debug(
        "[ocr] start | bytes=%d resolved_binary=%s version=%s",
        len(image_bytes),
        runtime_info["resolved_binary"],
        runtime_info["version"],
    )

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    prepared = _preprocess_for_ocr(image)

    try:
        text_read = pytesseract.image_to_string(prepared, lang="eng", config=_TESSERACT_CONFIG)
    except pytesseract.TesseractNotFoundError as exc:
        logger.error(
            "[ocr] tesseract missing | configured_cmd=%s resolved_binary=%s path=%s",
            runtime_info["configured_cmd"],
            runtime_info["resolved_binary"],
            os.environ.get("PATH", ""),
        )
        raise RuntimeError(
            "Tesseract executable not found. Install 'tesseract-ocr' on the host/container."
        ) from exc

    text_cleaned = _clean_ocr_text(text_read)
    logger.info(
        "[ocr] done | size=%sx%s text=%r elapsed_ms=%.1f",
        image.width,
        image.height,
        text_cleaned,
        (time.perf_counter() - started) * 1000,
    )

    if not text_cleaned:
        return []

    return [TextBlock(text=text_cleaned, confidence=0)]
