from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    database_url: str
    redis_url: str
    log_level: str = "INFO"

    # Scraper settings
    max_retries: int = 3
    retry_delay: int = 2
    page_timeout: int = 60000

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
