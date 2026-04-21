from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Server
    app_title: str = "Digger Helper API"
    debug: bool = False

    # CORS — comma-separated origins, e.g. "http://localhost:8081,exp://..."
    allowed_origins: str = "*"

    # Authentication
    app_passcode: str = "A1B2C3D4E5"  # override in .env: APP_PASSCODE=...
    secret_key: str = "change-me-in-production"  # override in .env: SECRET_KEY=...
    token_expire_days: int = 30

    # Discogs — use a personal access token (simpler than OAuth)
    # Get one at: https://www.discogs.com/settings/developers
    discogs_token: str = ""
    # Legacy consumer key/secret (kept for optional OAuth; token takes priority)
    discogs_consumer_key: str = ""
    discogs_consumer_secret: str = ""

    # Google / YouTube Data API v3 (filled in later)
    youtube_api_key: str = ""

    # OCR runtime override, e.g. /usr/bin/tesseract
    tesseract_cmd: str = "tesseract"
    ocr_show_steps: bool = False
    ocr_debug_dir: str = "/home/user/rdpuser/Pictures/debug_pic/"


settings = Settings()
