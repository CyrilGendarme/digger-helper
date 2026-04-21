import io
import logging
import os
import shutil
import subprocess
import time
from typing import List

import pytesseract
from PIL import Image
from PIL import ImageFilter, ImageOps

from app.config import settings
from app.models.ocr import TextBlock

logger = logging.getLogger(__name__)

TARGET_MIN_CHAR = 5
TARGET_MAX_CHAR = 10
_TESSERACT_BASE_CONFIG = "--psm 7 --oem 3 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_/ "


def _clean_ocr_text(raw_text: str) -> str:
    # Tesseract often returns form-feed (\x0c) even when no text is detected.
    printable = "".join(ch for ch in (raw_text or "") if ch.isprintable())
    return " ".join(printable.split()).strip()



def _save_step_image(image: Image.Image, title: str, _request_tag: str, _step_index: int) -> None:
    """Show OCR step images in a modal desktop window when debugging is enabled."""
    if not settings.ocr_show_steps:
        return

    if os.environ.get("DISPLAY") is None and os.name != "nt":
        logger.warning("[ocr] debug-step skipped | no DISPLAY available | title=%s", title)
        return

    try:
        import tkinter as tk
        from PIL import ImageTk

        preview = image
        max_w, max_h = 1400, 900
        if preview.width > max_w or preview.height > max_h:
            preview = preview.copy()
            preview.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)

        root = tk.Tk()
        root.withdraw()
        window = tk.Toplevel(root)
        window.title(title)
        window.attributes("-topmost", True)

        tk_image = ImageTk.PhotoImage(preview)
        panel = tk.Label(window, image=tk_image)
        panel.image = tk_image
        panel.pack(padx=10, pady=10)

        ok_btn = tk.Button(window, text="OK", command=window.destroy)
        ok_btn.pack(pady=10)

        window.grab_set()
        window.wait_window()
        root.destroy()
        logger.info("[ocr] debug-step shown | title=%s", title)
    except Exception as exc:
        logger.warning("[ocr] debug-step failed | title=%s error=%s", title, exc)


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


def _tesseract_runtime_info() -> dict:
    configured_cmd = pytesseract.pytesseract.tesseract_cmd
    binary_path = (
        configured_cmd
        if os.path.exists(configured_cmd)
        else shutil.which(configured_cmd)
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
            version = "unknown"

    return {
        "configured_cmd": configured_cmd,
        "resolved_binary": binary_path or "not-found",
        "version": version,
        "path": os.environ.get("PATH", ""),
    }


def _preprocess_for_ocr(image: Image.Image, request_tag: str, step_offset: int = 0) -> Image.Image:
    """Prepare image for OCR while keeping processing lightweight."""
    gray = ImageOps.grayscale(image)
    sharpened = gray.filter(ImageFilter.SHARPEN)

    return sharpened


def extract_text(image_bytes: bytes) -> List[TextBlock]:
    """Run Tesseract OCR on raw image bytes and return a list of TextBlocks."""
    total_started = time.perf_counter()
    request_tag = f"ocr_{int(time.time() * 1000)}"
    runtime_info = _tesseract_runtime_info()
    logger.info(
        "[ocr] start | bytes=%d configured_cmd=%s resolved_binary=%s version=%s path=%s",
        len(image_bytes),
        runtime_info["configured_cmd"],
        runtime_info["resolved_binary"],
        runtime_info["version"],
        runtime_info["path"],
    )

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    logger.info(
        "[ocr] decoded image | mode=%s size=%sx%s",
        image.mode,
        image.width,
        image.height,
    )

    # _save_step_image(image, "initial", request_tag, 1)

    preprocess_started = time.perf_counter()
    prepared = _preprocess_for_ocr(image, request_tag=request_tag)

    # _save_step_image(prepared, "prepared", request_tag, 2)

    logger.info(
        "[ocr] preprocessed image | mode=%s size=%sx%s elapsed_ms=%.1f",
        prepared.mode,
        prepared.width,
        prepared.height,
        (time.perf_counter() - preprocess_started) * 1000,
    )

    text_rgb = ""
    try:

        for attempt in range(1, 6):
            text_read = pytesseract.image_to_string(
                prepared,
                lang="eng",
                config=_TESSERACT_BASE_CONFIG,
            )
            text_cleaned = _clean_ocr_text(text_read)

            text_len = len(text_cleaned)
            logger.info(
                "----- [ocr] attempt=%d/5 text_len=%d text=%r text_after_clean=%r",
                attempt,
                text_len,
                text_read,
                text_cleaned,
            )

            if TARGET_MIN_CHAR <= text_len <= TARGET_MAX_CHAR:
                break

    except pytesseract.TesseractNotFoundError as exc:
        details = _tesseract_runtime_info()
        logger.error(
            "[ocr] tesseract missing | configured_cmd=%s resolved_binary=%s version=%s path=%s",
            details["configured_cmd"],
            details["resolved_binary"],
            details["version"],
            details["path"],
        )
        raise RuntimeError(
            "Tesseract executable not found. Install 'tesseract-ocr' on the host/container."
        ) from exc

    if not text_cleaned:
        return []

    return [TextBlock(text=text_cleaned, confidence=0)]
