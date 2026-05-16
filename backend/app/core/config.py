from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "LOG2ACTION API"
    VERSION: str = "0.1.0"
    
    # Database
    POSTGRES_USER: str = "log2action_user"
    POSTGRES_PASSWORD: str = "secretpassword"
    POSTGRES_DB: str = "log2action_db"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # AI Provider Setup
    AI_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    OLLAMA_BASE_URL: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
