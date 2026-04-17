from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Server
    app_title: str = "Digger Helper API"
    debug: bool = False

    # CORS — comma-separated origins, e.g. "http://localhost:8081,exp://..."
    allowed_origins: str = "*"

    # Discogs — use a personal access token (simpler than OAuth)
    # Get one at: https://www.discogs.com/settings/developers
    discogs_token: str = ""
    # Legacy consumer key/secret (kept for optional OAuth; token takes priority)
    discogs_consumer_key: str = ""
    discogs_consumer_secret: str = ""

    # Google / YouTube Data API v3 (filled in later)
    youtube_api_key: str = ""


settings = Settings()
