import pytest
from fastapi import status
from unittest.mock import patch, MagicMock

# pytest tests/test_api/test_recipes.py -v

# Test the /api/recipes endpoint
def test_get_recipes_success(test_client, sample_ingredients):
    """Test successful recipe search with valid ingredients."""
    # Mock the chef service to return sample recipes
    with patch('app.api.api_v1.recipes.chef_service') as mock_service:
        # Setup mock response
        mock_service.get_recipe_recommendations.return_value = [
            {
                "title": "Test Recipe",
                "ingredients": "chicken, tomato, onion",
                "instructions": "Cook everything together",
                "score": 0.95,
                "chef": "Test Chef"
            }
        ]
        
        # Make request to the endpoint
        response = test_client.post(
            "/api/recipes",
            json={"ingredients": sample_ingredients, "top_n": 1}
        )
        
        # Assertions
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "recipes" in data
        assert len(data["recipes"]) == 1
        assert data["recipes"][0]["title"] == "Test Recipe"
        assert mock_service.get_recipe_recommendations.called
        
        # Verify the service was called with the correct arguments
        args, kwargs = mock_service.get_recipe_recommendations.call_args
        assert set(args[0]) == set(sample_ingredients)
        assert kwargs["top_n"] == 1

def test_get_recipes_empty_ingredients(test_client):
    """Test that empty ingredients list returns 422 Unprocessable Entity."""
    response = test_client.post(
        "/api/recipes",
        json={"ingredients": []}
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_get_recipes_invalid_input(test_client):
    """Test that invalid input returns 422 Unprocessable Entity."""
    response = test_client.post(
        "/api/recipes",
        json={"ingredients": 123}  # Invalid type
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
