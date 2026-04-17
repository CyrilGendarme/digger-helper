import logging

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException

from app.api.deps import require_auth
from app.models.ocr import OCRResponse
from app.services.ocr_service import extract_text

router = APIRouter(prefix="/ocr", tags=["ocr"], dependencies=[Depends(require_auth)])
logger = logging.getLogger(__name__)

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}
MAX_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB


@router.post("/extract", response_model=OCRResponse)
async def extract_text_from_image(file: UploadFile = File(...)):
    logger.info("[ocr/extract] received | content_type=%s", file.content_type)

    if file.content_type not in ALLOWED_MIME:
        logger.warning(
            "[ocr/extract] rejected | unsupported type=%s", file.content_type
        )
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {file.content_type}. Accepted: {ALLOWED_MIME}",
        )

    image_bytes = await file.read()
    size_kb = len(image_bytes) / 1024
    logger.info("[ocr/extract] image read | size=%.1f KB", size_kb)

    if len(image_bytes) > MAX_SIZE_BYTES:
        logger.warning("[ocr/extract] rejected | image too large (%.1f KB)", size_kb)
        raise HTTPException(status_code=413, detail="Image too large (max 15 MB).")

    try:
        blocks = extract_text(image_bytes)
    except Exception as exc:
        logger.error("[ocr/extract] OCR failed | %s", exc)
        raise HTTPException(status_code=500, detail=f"OCR failed: {exc}") from exc

    raw_text = " ".join(b.text for b in blocks)
    logger.info("[ocr/extract] done | blocks=%d raw_text=%r", len(blocks), raw_text)
    return OCRResponse(blocks=blocks, raw_text=raw_text)
