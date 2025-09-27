# Initialize API v1 routes
from fastapi import APIRouter

api_router = APIRouter()

# Import and include route modules here
from . import recipes  # noqa: E402

api_router.include_router(recipes.router, prefix="/v1/recipes", tags=["recipes"])
