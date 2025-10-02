from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
import logging

# Import standard error responses
from .responses import get_error_responses

from app.services.chef_service import chef_service

router = APIRouter()
logger = logging.getLogger(__name__)

class RecipeIngredient(BaseModel):
    """Represents an ingredient in a recipe with availability status."""
    name: str = Field(..., description="Name of the ingredient")
    is_available: bool = Field(False, description="Whether the ingredient is available")

class RecipeResponse(BaseModel):
    """Response model for recipe recommendations."""
    id: Optional[int] = Field(None, description="Unique identifier for the recipe")
    title: str = Field(..., description="Title of the recipe")
    similarity_score: float = Field(
        ..., 
        ge=0, 
        le=1,
        description="Combined similarity score (0-1) considering both ingredient overlap and semantic similarity"
    )
    ingredients: List[str] = Field(..., description="List of ingredients required for the recipe")
    instructions: List[str] = Field(..., description="Step-by-step cooking instructions")
    chef: str = Field(..., description="Name of the chef who recommended this recipe")
    cuisine: Optional[str] = Field(None, description="Type of cuisine the recipe belongs to")
    
    @field_validator('ingredients', mode='before')
    @classmethod
    def parse_ingredients(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(',') if i.strip()]
        return v
    
    @field_validator('instructions', mode='before')
    @classmethod
    def parse_instructions(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split('.') if i.strip()]
        return v

    class Config:
        validate_by_name = True

class RecipeRequest(BaseModel):
    """Request model for getting recipe recommendations."""
    model_config = {
        "json_schema_extra": {
            "example": {
                "ingredients": ["chicken breast", "garlic", "olive oil", "salt", "black pepper"],
                "max_results": 5,
                "variety": 0.7
            }
        }
    }
    ingredients: List[str] = Field(
        ...,
        min_items=1,
        description="List of available ingredients to search recipes with",
        example=["chicken breast", "garlic", "olive oil", "salt", "black pepper"]
    )
    max_results: int = Field(
        5, 
        ge=1, 
        le=20,
        description="Maximum number of recipe recommendations to return (1-20)"
    )
    variety: float = Field(
        0.7, 
        ge=0.0, 
        le=1.0,
        description="""
        Controls the balance between ingredient overlap and semantic similarity.
        - Closer to 0.0: More emphasis on exact ingredient matches
        - Closer to 1.0: More emphasis on semantic similarity of recipes
        """
    )

class HealthCheckResponse(BaseModel):
    """Health check response model."""
    status: str
    chefs_loaded: int
    chef_names: List[str]
    service: str


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Check service health",
    description="""
    Verify the service is running and all chef models are loaded.
    
    Returns a status report including the number of loaded chef models.
    """,
    responses={
        status.HTTP_200_OK: {
            "description": "Service is healthy and ready to handle requests.",
            "model": HealthCheckResponse,
        },
        **get_error_responses(
            status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    }
)
async def health_check() -> HealthCheckResponse:
    """
    Check the health status of the FridgePal service.
    
    Returns:
        HealthCheckResponse: Service status and loaded chef information.
    """
    try:
        chefs = chef_service.get_chefs()
        return HealthCheckResponse(
            status="healthy",
            chefs_loaded=len(chefs),
            chef_names=[chef.name for chef in chefs],
            service="FridgePal Recipes"
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Service unavailable"
        )

class RecipeListResponse(BaseModel):
    """Response model for recipe recommendations."""
    recipes: List[RecipeResponse]


@router.post(
    "",
    response_model=RecipeListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get recipe recommendations",
    description="""
    Get personalized recipe recommendations based on available ingredients.
    
    This endpoint uses a multi-chef ensemble approach where each chef specializes
    in different cuisines. The hybrid scoring system balances ingredient overlap
    with semantic similarity to provide diverse and relevant suggestions.
    
    - **variety=0.0**: Strict ingredient matching
    - **variety=1.0**: Broader, more creative suggestions
    """,
    responses={
        status.HTTP_200_OK: {
            "description": "Successfully returned recipe recommendations.",
            "model": RecipeListResponse,
        },
        **get_error_responses(
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    }
)
async def get_recipes(
    request: RecipeRequest
) -> RecipeListResponse:
    """
    Retrieve recipe recommendations based on available ingredients.
    
    Args:
        request: The recipe search request containing ingredients and preferences.
        
    Returns:
        RecipeListResponse: List of recommended recipes with scores and details.
        
    Raises:
        HTTPException: If the request is invalid or an error occurs.
    """
    try:
        if not request.ingredients:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one ingredient is required"
            )
        
        logger.info(
            "Getting recipes for %d ingredients (max_results=%d, variety=%.2f)",
            len(request.ingredients),
            request.max_results,
            request.variety
        )
        
        # Get recommendations from all chefs
        recommendations = chef_service.get_recommendations(
            ingredients=request.ingredients,
            top_n=request.max_results,
            cosine_weight=request.variety
        )
        
        # Convert to response model
        response_recipes = []
        for recipe in recommendations:
            try:
                response_recipe = RecipeResponse(
                    id=recipe.get('id'),
                    title=recipe.get('title', 'Untitled Recipe'),
                    similarity_score=recipe.get('similarity_score', 0.0),
                    ingredients=recipe.get('ingredients', []),
                    instructions=recipe.get('instructions', []),
                    chef=recipe.get('chef', 'Unknown Chef'),
                    cuisine=recipe.get('cuisine')
                )
                response_recipes.append(response_recipe)
            except Exception as e:
                logger.error(
                    "Error formatting recipe %s: %s",
                    recipe.get('id', 'unknown'),
                    str(e)
                )
                continue
        
        return RecipeListResponse(recipes=response_recipes)
        
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error processing recipe request")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing your request"
        )
