import pytest
from fastapi import status
from unittest.mock import patch, MagicMock
from app.services.chef_service import ChefService

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
