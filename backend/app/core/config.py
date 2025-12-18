from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional, List # Import List

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "QuizCraft AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str

    # --- Generic LLM Configuration ---
    # Default to OpenRouter; override in .env as needed.
    # Supported providers in this codebase: "google", "groq", "openrouter".
    LLM_PROVIDER: str = "openrouter"
    LLM_API_KEY: str
    # Use OpenRouter's auto-routing model by default (picks a suitable model, often free-tier).
    LLM_MODEL: str = "openrouter/auto"
    # --- End Generic LLM Configuration ---

    # Optional separate keys for Mem0 + Gemini tutor
    MEM0_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

    # General LLM Settings (can still be used)
    MAX_TOKENS: int = 2048
    TEMPERATURE: float = 0.7

    # Vector Store
    VECTOR_DB_PATH: str = "./data/chromadb"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx", ".txt", ".md"] # Use List type hint

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [ # Use List type hint
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    # Rate Limiting (Optional - Not currently implemented in routes)
    RATE_LIMIT_PER_MINUTE: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = True # Keep case sensitivity for API keys

@lru_cache()
def get_settings() -> Settings:
    # This function now reads the updated Settings class
    return Settings()

settings = get_settings()