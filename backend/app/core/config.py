from typing import List, Union
from pydantic import field_validator, ConfigDict
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API settings
    API_V1_STR: str = "/api"
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
                return json.loads(v)
            return [i.strip() for i in v.split(",") if i.strip()]
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
