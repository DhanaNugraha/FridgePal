import logging
import sys
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from app.api.exception_handlers import register_exception_handlers

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

# Initialize FastAPI with OpenAPI configuration
def get_application() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url=f"{settings.API_V1_STR}/openapi.json"
    )
    
    # Add CORS middleware
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
    
    # Include API router
    app.include_router(api_router, prefix=settings.API_V1_STR)
    return app

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        description="""
        # FridgePal API
        
        The FridgePal API provides intelligent recipe recommendations based on available ingredients.
        It uses a multi-chef ensemble approach to deliver diverse and personalized recipe suggestions.
        
        ## Key Features
        - Ingredient-based recipe search
        - Multiple specialized chef models
        - Hybrid scoring (TF-IDF + ingredient overlap)
        - Detailed recipe information
        
        ## Authentication
        No authentication required for this version of the API.
        """,
        routes=app.routes,
    )
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

# Create the FastAPI application
app = get_application()

# Register exception handlers
app = register_exception_handlers(app)

# Set the custom OpenAPI schema
app.openapi = custom_openapi

# CORS preflight handler
@app.middleware("http")
async def add_cors_preflight_headers(request: Request, call_next):
    if request.method == "OPTIONS":
        response = Response()
        response.headers["Access-Control-Allow-Origin"] = ",".join(settings.BACKEND_CORS_ORIGINS) if settings.BACKEND_CORS_ORIGINS else "*"
        response.headers["Access-Control-Allow-Methods"] = ",".join(settings.CORS_ALLOW_METHODS)
        response.headers["Access-Control-Allow-Headers"] = ",".join(settings.CORS_ALLOW_HEADERS)
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.status_code = 200
        return response
    
    response = await call_next(request)
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
