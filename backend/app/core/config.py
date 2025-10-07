import logging
from typing import List, Union
from pydantic import field_validator, ConfigDict
from pydantic_settings import BaseSettings

# Configure logger
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    # API settings
    PROJECT_NAME: str = "FridgePal"
    
    # CORS settings
    BACKEND_CORS_ORIGINS: List[str] = ["*"]  # List of allowed origins
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_MAX_AGE: int = 600  # 10 minutes
    
    # Convert string to list of origins
    @field_validator("BACKEND_CORS_ORIGINS", mode='before')
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("["):
                # Handle JSON array string
                import json
                v = json.loads(v)
            else:
                v = [i.strip() for i in v.split(",") if i.strip()]
        # Log the allowed origins for debugging
        logger.info(f"Allowed CORS origins: {v}")
        return v if isinstance(v, list) else [str(v)]
    
    # Application settings
    DEBUG: bool = True
    
    model_config = ConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding='utf-8',
        extra='ignore'  # Ignore extra fields in the config
    )

# Create settings instance
settings = Settings()

# Log initial CORS configuration
logger.info(f"Initialized {settings.PROJECT_NAME} with CORS settings:")
logger.info(f"- Allowed Origins: {settings.BACKEND_CORS_ORIGINS}")
logger.info(f"- Allow Methods: {settings.CORS_ALLOW_METHODS}")
logger.info(f"- Allow Headers: {settings.CORS_ALLOW_HEADERS}")
logger.info(f"- Allow Credentials: {settings.CORS_ALLOW_CREDENTIALS}")
logger.info(f"- Max Age: {settings.CORS_MAX_AGE} seconds")
