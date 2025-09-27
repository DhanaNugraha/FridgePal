import logging
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.api_v1 import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Get the root logger and set level to INFO
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)

# Ensure all loggers use our configuration
for logger_name in logging.root.manager.loggerDict:
    if not logger_name.startswith('uvicorn'):  # Don't override uvicorn's logging
        logging.getLogger(logger_name).handlers = []
        logging.getLogger(logger_name).propagate = True

# Get logger for this module
logger = logging.getLogger(__name__)
logger.info("Application logger configured")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for FridgePal - Your smart recipe recommendation system",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS with preflight support
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.CORS_ALLOW_METHODS,
        allow_headers=settings.CORS_ALLOW_HEADERS,
        expose_headers=["*"],
        max_age=settings.CORS_MAX_AGE,
    )

    # Add preflight handler for all endpoints
    @app.middleware("http")
    async def add_cors_preflight_headers(request, call_next):
        if request.method == "OPTIONS":
            from fastapi.responses import Response
            response = Response(status_code=204)
        else:
            response = await call_next(request)
        
        # Add CORS headers to all responses
        if "origin" in request.headers:
            response.headers["Access-Control-Allow-Origin"] = ", ".join(settings.BACKEND_CORS_ORIGINS)
            response.headers["Access-Control-Allow-Methods"] = ", ".join(settings.CORS_ALLOW_METHODS)
            response.headers["Access-Control-Allow-Headers"] = ", ".join(settings.CORS_ALLOW_HEADERS)
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Max-Age"] = str(settings.CORS_MAX_AGE)
        
        return response

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
