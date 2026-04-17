import io
from typing import List

import easyocr
from PIL import Image

from app.models.ocr import TextBlock

# Initialise once at import time (downloads models on first run)
_reader: easyocr.Reader | None = None


def _get_reader() -> easyocr.Reader:
    global _reader
    if _reader is None:
        _reader = easyocr.Reader(["en"], gpu=False)
    return _reader


def extract_text(image_bytes: bytes) -> List[TextBlock]:
    """Run EasyOCR on raw image bytes and return a list of TextBlocks."""
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # EasyOCR expects a numpy array or file path
    import numpy as np

    image_np = np.array(image)
    results = _get_reader().readtext(image_np, detail=1)

    # Concatenate all recognised characters into a single string
    # (no separator — produces a compact ref string like "NORD008" or "CAT-42").
    all_chars = "".join(text.strip() for _bbox, text, _conf in results if text.strip())
    avg_conf = (
        round(sum(c for _, _, c in results) / len(results), 4) if results else 0.0
    )

    blocks: List[TextBlock] = []
    if all_chars:
        blocks.append(TextBlock(text=all_chars, confidence=avg_conf))

    return blocks
