from pydantic import BaseModel
from typing import List


class OCRRequest(BaseModel):
    """Not used for multipart uploads — kept for manual text submission."""

    raw_text: str


class TextBlock(BaseModel):
    text: str
    confidence: float


class OCRResponse(BaseModel):
    blocks: List[TextBlock]
    raw_text: str  # all blocks joined, for convenience
