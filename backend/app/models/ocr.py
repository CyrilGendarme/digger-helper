from typing import List

from pydantic import BaseModel


class TextBlock(BaseModel):
    text: str
    confidence: float


class OCRResponse(BaseModel):
    blocks: List[TextBlock]
    raw_text: str  # all blocks joined, for convenience
