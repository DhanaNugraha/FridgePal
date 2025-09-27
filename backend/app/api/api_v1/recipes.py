from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator
import logging

from app.services.chef_service import chef_service

router = APIRouter()
logger = logging.getLogger(__name__)

class RecipeIngredient(BaseModel):
    name: str
    is_available: bool = False

class RecipeResponse(BaseModel):
    id: Optional[int]
    title: str
    similarity_score: float = Field(..., ge=0, le=1)
    ingredients: List[str]
    instructions: List[str]
    chef: str
    cuisine: Optional[str] = None
    
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
    ingredients: List[str]
    max_results: int = Field(5, ge=1, le=20)

@router.get("/health")
async def health_check():
    """Health check endpoint for the recipes service."""
    try:
        chefs = chef_service.get_chefs()
        return {
            "status": "healthy",
            "chefs_loaded": len(chefs),
            "chef_names": [chef.name for chef in chefs],
            "service": "FridgePal Recipes"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Service unavailable")

@router.post("", response_model=Dict[str, Any])
async def get_recipes(request: RecipeRequest):
    """
    Get recipe recommendations based on available ingredients.
    
    Args:
        request: RecipeRequest containing list of ingredients and max_results
        
    Returns:
        dict: Dictionary containing recipe recommendations from all chefs
    """
    try:
        if not request.ingredients:
            raise HTTPException(status_code=400, detail="No ingredients provided")
        
        logger.info(f"Getting recipes for ingredients: {', '.join(request.ingredients)}")
        
        # Get recommendations from all chefs
        recommendations = chef_service.get_recommendations(
            ingredients=request.ingredients,
            top_n=request.max_results
        )
        
        # Convert to response model
        response_recipes = []
        for recipe in recommendations:
            try:
                # Create response model instance
                response_recipe = RecipeResponse(
                    id=recipe.get('id', None),
                    title=recipe.get('title', 'Untitled Recipe'),
                    similarity_score=recipe.get('similarity_score', 0.0),
                    ingredients=recipe.get('ingredients', []),
                    instructions=recipe.get('instructions', []),
                    chef=recipe.get('chef', 'Unknown Chef'),
                    cuisine=recipe.get('cuisine')
                )
                response_recipes.append(response_recipe.dict(by_alias=True))
                
            except Exception as e:
                logger.error(f"Error formatting recipe {recipe.get('id', 'unknown')}: {str(e)}")
                continue
        
        logger.info(f"Returning {len(response_recipes)} recipes")
        return {"recipes": response_recipes}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recipes: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail="An error occurred while processing your request"
        )
