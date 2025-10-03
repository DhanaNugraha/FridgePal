import pytest
from fastapi import status
from unittest.mock import patch, MagicMock
from app.services.chef_service import ChefService
from fastapi.testclient import TestClient
from app.main import app
import logging
from app.api.api_v1.recipes import router
from app.api.api_v1.recipes import RecipeResponse
from fastapi import HTTPException
from fastapi import FastAPI
from app.api.api_v1.recipes import get_recipes
from app.api.api_v1.recipes import RecipeRequest
            

# Configure test client
client = TestClient(app)

# Configure test logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# pytest tests/test_api/test_recipes.py -v

@pytest.fixture(autouse=True)
def reset_singleton():
    """Reset the ChefService singleton before each test."""
    ChefService._instance = None
    yield
    ChefService._instance = None

# Test the /api/recipes endpoint
def test_get_recipes_success(test_client, sample_ingredients):
    """Test successful recipe search with valid ingredients."""
    # Create a mock chef service
    mock_chef_service = MagicMock()
    mock_chef_service.get_recommendations.return_value = [
        {
            "id": 1,
            "title": "Test Recipe",
            "ingredients": ["chicken", "tomato", "onion"],
            "instructions": ["Cook everything together"],
            "similarity_score": 0.95,
            "chef": "Test Chef",
        }
    ]
    
    # Patch the chef service at the module level where it's imported
    with patch('app.api.api_v1.recipes.chef_service', mock_chef_service):
        # Make request to the endpoint with max_results=1 to match the expected behavior
        response = test_client.post(
            "/api/v1/recipes",
            json={"ingredients": sample_ingredients, "max_results": 1}
        )      
    # Assertions
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "recipes" in data
    assert len(data["recipes"]) == 1
    recipe = data["recipes"][0]
    assert recipe["title"] == "Test Recipe"
    assert "similarity_score" in recipe
    assert 0 <= recipe["similarity_score"] <= 1.0
    
    # Verify the service was called with the correct arguments
    mock_chef_service.get_recommendations.assert_called_once()
    call_args = mock_chef_service.get_recommendations.call_args
    # The method is called with keyword arguments, not positional ones
    assert 'ingredients' in call_args.kwargs
    assert set(call_args.kwargs['ingredients']) == set(sample_ingredients)
    assert call_args.kwargs.get('top_n') == 1  # top_n is set to max_results value

def test_get_recipes_empty_ingredients(test_client):
    """Test that empty ingredients list returns 422 Unprocessable Entity."""
    response = test_client.post(
        "/api/v1/recipes",
        json={"ingredients": []}
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_get_recipes_invalid_input(test_client):
    """Test that invalid input returns 422 Unprocessable Entity."""
    response = test_client.post(
        "/api/v1/recipes",
        json={"ingredients": 123}  # Invalid type
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_health_check_success():
    """Test health check endpoint with successful response."""
    # Mock the chef service
    mock_chef_service = MagicMock()
    mock_chef = MagicMock()
    mock_chef.name = "Test Chef"
    mock_chef_service.get_chefs.return_value = [mock_chef]
    
    with patch('app.api.api_v1.recipes.chef_service', mock_chef_service):
        response = client.get("/api/v1/recipes/health")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "healthy"
    assert isinstance(data["chefs_loaded"], int)
    assert "Test Chef" in data["chef_names"]
    assert data["service"] == "FridgePal Recipes"


def test_health_check_error():
    """Test health check endpoint when there's an error."""
    # Mock the chef service to raise an exception
    mock_chef_service = MagicMock()
    mock_chef_service.get_chefs.side_effect = Exception("Test error")
    
    with patch('app.api.api_v1.recipes.chef_service', mock_chef_service):
        response = client.get("/api/v1/recipes/health")
    
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    response_data = response.json()
    assert "error" in response_data
    assert "code" in response_data
    assert response_data["code"] == 500


def test_get_recipes_empty_ingredients_error(test_client):
    """Test that empty ingredients list in request raises validation error."""
    with patch('app.api.api_v1.recipes.chef_service') as mock_chef_service:
        response = test_client.post(
            "/api/v1/recipes",
            json={"ingredients": []}
        )
    
    # FastAPI's Pydantic validation will return 422 for empty list
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    response_data = response.json()
    assert "error" in response_data
    assert "code" in response_data
    assert response_data["code"] == 422
    assert "details" in response_data
    mock_chef_service.get_recommendations.assert_not_called()


def test_get_recipes_recipe_formatting_error(test_client, sample_ingredients, caplog):
    """Test that recipe formatting errors are caught and logged."""
    # Create a mock chef service that returns a malformed recipe
    mock_chef_service = MagicMock()
    mock_chef_service.get_recommendations.return_value = [
        {"id": 1, "title": None}  # Missing required fields
    ]
    
    with patch('app.api.api_v1.recipes.chef_service', mock_chef_service):
        with caplog.at_level(logging.ERROR):
            response = test_client.post(
                "/api/v1/recipes",
                json={"ingredients": sample_ingredients}
            )
    
    # Should still return 200 but log the error
    assert response.status_code == status.HTTP_200_OK
    assert "Error formatting recipe" in caplog.text
    assert len(response.json()["recipes"]) == 0


def test_get_recipes_unexpected_error(test_client, sample_ingredients):
    """Test that unexpected errors are properly handled."""
    # Mock the chef service to raise an unexpected exception
    mock_chef_service = MagicMock()
    mock_chef_service.get_recommendations.side_effect = Exception("Unexpected error")
    
    with patch('app.api.api_v1.recipes.chef_service', mock_chef_service):
        response = test_client.post(
            "/api/v1/recipes",
            json={"ingredients": sample_ingredients}
        )
    
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    response_data = response.json()
    assert "error" in response_data
    assert "code" in response_data
    assert response_data["code"] == 500
    assert "unexpected error" in response_data["error"].lower()


def test_recipe_response_parsing():
    """Test that recipe response parsing works with different input formats."""

    
    # Test with string ingredients and instructions
    recipe = RecipeResponse(
        id=1,
        title="Test Recipe",
        similarity_score=0.9,
        ingredients="chicken, rice, salt",  # String input
        instructions="Cook the chicken. Add rice and salt.",  # String input
        chef="Test Chef",
        cuisine="Test Cuisine"
    )
    
    assert isinstance(recipe.ingredients, list)
    assert len(recipe.ingredients) == 3
    assert isinstance(recipe.instructions, list)
    assert len(recipe.instructions) == 2


def test_get_recipes_http_exception_handling(test_client, sample_ingredients):
    """Test that HTTP exceptions are properly propagated."""
    # Create a mock that raises an HTTPException
    mock_chef_service = MagicMock()

    mock_chef_service.get_recommendations.side_effect = HTTPException(
        status_code=400, 
        detail="Test HTTP error"
    )
    
    with patch('app.api.api_v1.recipes.chef_service', mock_chef_service):
        response = test_client.post(
            "/api/v1/recipes",
            json={"ingredients": sample_ingredients}
        )
    
    # Should propagate the HTTPException
    assert response.status_code == 400
    response_data = response.json()
    assert "error" in response_data  # Check for error field instead of detail
    assert response_data["error"] == "Test HTTP error"


def test_get_recipes_empty_ingredients_validation(test_client):
    """Test that empty ingredients list validation works."""
    with patch('app.api.api_v1.recipes.chef_service') as mock_chef_service:
        # Mock the response to simulate successful processing
        mock_chef_service.get_recommendations.return_value = []
        response = test_client.post(
            "/api/v1/recipes",
            json={"ingredients": [""]}  # Empty string in list
        )
    
    # The API currently accepts empty strings in the ingredients list
    # So we should get a 200 with empty results
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()["recipes"]) == 0


def test_get_recipes_empty_ingredients_list(test_client):
    """Test that an empty ingredients list is properly validated."""
    with patch('app.api.api_v1.recipes.chef_service') as mock_chef_service:
        # Mock the response (though it shouldn't be reached)
        mock_chef_service.get_recommendations.return_value = []
        
        # Create a request with an empty ingredients list
        response = test_client.post(
            "/api/v1/recipes",
            json={"ingredients": []}
        )
    
    # Verify the response
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    response_data = response.json()
    
    # Check the actual response structure
    assert response_data == {
        "code": 422,
        "details": {
            "errors": [
                {
                    "loc": "ingredients",
                    "msg": "List should have at least 1 item after validation, not 0",
                    "type": "too_short"
                }
            ]
        },
        "error": "Validation error"
    }


def test_get_recipes_none_ingredients(test_client):
    """Test that None ingredients list is properly handled."""
    # This will be caught by Pydantic validation
    response = test_client.post(
        "/api/v1/recipes",
        json={"ingredients": None}
    )
    
    # Pydantic will return 422 for None value
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    response_data = response.json()
    
    # Check the validation error structure
    assert "detail" in response_data or "errors" in response_data.get("details", {})
    
    # For the line coverage, we need to test the case where request.ingredients is None
    # We'll need to mock the request object to test this case
    
    # Create a test client that will call our endpoint directly
    test_client = TestClient(router)
    
    # Create a request with None ingredients (bypassing Pydantic validation)
    with patch('app.api.api_v1.recipes.chef_service') as mock_chef_service:
        mock_chef_service.get_recommendations.return_value = []
        
        # This will call our endpoint with a request that has None ingredients
        response = test_client.post(
            "/",
            json={"ingredients": ["test"]},  # This will be overridden by our mock
            headers={"Content-Type": "application/json"}
        )
        
        # Now let's test the case where request.ingredients is None
        # We need to patch the Request object to return None for ingredients
        
        app = FastAPI()
        
        @app.post("/test-none")
        async def test_none():
            # This will simulate the case where request.ingredients is None
            request = MagicMock()
            request.json.return_value = {"ingredients": None}

            # Create a RecipeRequest with ingredients=None
            recipe_request = RecipeRequest.model_validate({"ingredients": ["test"]})
            # Force ingredients to be None for testing
            recipe_request.ingredients = None
            
            # This should raise the HTTPException we want to test
            response = await get_recipes(recipe_request)
            return response
        
        # Test the endpoint
        test_app = TestClient(app)
        response = test_app.post("/test-none")
        
        # This should now hit our custom validation
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        response_data = response.json()
        assert response_data == {
            "detail": "At least one ingredient is required"
        }
