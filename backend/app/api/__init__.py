from fastapi import APIRouter

from app.api.routes import auth, discogs, ocr, search

router = APIRouter()
router.include_router(auth.router)
router.include_router(ocr.router)
router.include_router(discogs.router)
router.include_router(search.router)
