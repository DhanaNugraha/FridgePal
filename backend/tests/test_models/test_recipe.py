import pytest
from app.models.recipe import Recipe

def test_recipe_initialization():
    """Test that a Recipe can be initialized with all required parameters."""
    # Create a recipe with all parameters
    recipe = Recipe(
        id=1,
        title="Test Recipe",
        ingredients="ingredient1, ingredient2",
        instructions="Test instructions",
        NER_ingredients="ingredient1, ingredient2",
        cuisine="Test Cuisine"
    )
    
    # Verify all attributes are set correctly
    assert recipe.id == 1
    assert recipe.title == "Test Recipe"
    assert recipe.ingredients == "ingredient1, ingredient2"
    assert recipe.instructions == "Test instructions"
    assert recipe.NER_ingredients == "ingredient1, ingredient2"
    assert recipe.cuisine == "Test Cuisine"
    assert recipe.similarity_score == 0.0  # Tests default value of _similarity_score

def test_recipe_initialization_without_optional():
    """Test that a Recipe can be initialized without optional parameters."""
    # Create a recipe without the optional cuisine parameter
    recipe = Recipe(
        id=2,
        title="Another Recipe",
        ingredients="ingredient3",
        instructions="More instructions",
        NER_ingredients="ingredient3"
    )
    
    assert recipe.id == 2
    assert recipe.cuisine is None
    assert recipe.similarity_score == 0.0

def test_similarity_score_property():
    """Test the similarity_score property getter and setter."""
    # Create a recipe
    recipe = Recipe(
        id=3,
        title="Test Score",
        ingredients="test",
        instructions="test",
        NER_ingredients="test"
    )
    
    # Test the default value
    assert recipe.similarity_score == 0.0
    
    # Test setting the value
    recipe.similarity_score = 0.75
    assert recipe.similarity_score == 0.75
    
    # Test setting to another value
    recipe.similarity_score = 0.5
    assert recipe.similarity_score == 0.5
