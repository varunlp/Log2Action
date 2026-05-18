from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "LOG2ACTION API"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    
    # Database
    POSTGRES_USER: str = "log2action_user"
    POSTGRES_PASSWORD: str = "secretpassword"
    POSTGRES_DB: str = "log2action_db"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    DATABASE_URL: str | None = None
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # AI Provider Setup
    AI_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    OLLAMA_BASE_URL: str | None = None

    # Security
    JWT_SECRET_KEY: str = "super_secret_log2action_jwt_key_change_in_prod"
    CORS_ORIGINS: str = "*"
    ALLOWED_HOSTS: str = "*"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    MAX_UPLOAD_BYTES: int = 10 * 1024 * 1024
    BOOTSTRAP_ADMIN_EMAIL: str | None = None
    BOOTSTRAP_ADMIN_PASSWORD: str | None = None
    FIRST_USER_AUTO_ADMIN: bool = True

    @field_validator("ENVIRONMENT")
    @classmethod
    def normalize_environment(cls, value: str) -> str:
        return value.lower().strip()

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT in {"production", "prod"}

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def allowed_host_list(self) -> list[str]:
        return [host.strip() for host in self.ALLOWED_HOSTS.split(",") if host.strip()]

    def validate_runtime_safety(self) -> None:
        if not self.is_production:
            return

        unsafe_secret = "super_secret_log2action_jwt_key_change_in_prod"
        if self.JWT_SECRET_KEY == unsafe_secret or len(self.JWT_SECRET_KEY) < 32:
            raise RuntimeError("Set JWT_SECRET_KEY to a strong 32+ character secret in production.")

        if "*" in self.cors_origin_list:
            raise RuntimeError("Set CORS_ORIGINS to explicit HTTPS origins in production.")

        if self.POSTGRES_PASSWORD == "secretpassword" and not self.DATABASE_URL:
            raise RuntimeError("Set a strong database password or DATABASE_URL in production.")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

@lru_cache
def get_settings() -> Settings:
    loaded_settings = Settings()
    loaded_settings.validate_runtime_safety()
    return loaded_settings

settings = get_settings()
