import pytest
import numpy as np
from app.models.Training.chef import Chef
from sklearn.feature_extraction.text import TfidfVectorizer

# pytest tests/test_models/test_chef.py -v

def test_chef_initialization():
    """Test that a chef can be initialized with a name and optional parameters."""
    chef = Chef(name="Test Chef", cuisine_type="Italian")
    assert chef.name == "Test Chef"
    assert chef.cuisine_type == "Italian"
    assert isinstance(chef.vectorizer, TfidfVectorizer)
    assert chef.recipes == []

def test_chef_add_recipe():
    """Test adding recipes to a chef's collection."""
    chef = Chef(name="Test Chef")
    recipe = {"title": "Pasta", "ingredients": "pasta, tomato, cheese"}
    chef.add_recipe(recipe)
    
    assert len(chef.recipes) == 1
    assert chef.recipes[0] == recipe

def test_chef_train():
    """Test that a chef can be trained on recipes."""
    chef = Chef(name="Test Chef")
    recipes = [
        {"title": "Pasta", "ingredients": "pasta, tomato, cheese"},
        {"title": "Salad", "ingredients": "lettuce, tomato, cucumber"}
    ]
    
    for recipe in recipes:
        chef.add_recipe(recipe)
    
    # Train the chef
    chef.train()
    
    # Check that the TF-IDF matrix was created
    assert hasattr(chef, 'tfidf_matrix')
    assert chef.tfidf_matrix.shape[0] == len(recipes)

def test_chef_find_similar_recipes():
    """Test finding similar recipes based on ingredients."""
    chef = Chef(name="Test Chef")
    recipes = [
        {"title": "Pasta", "ingredients": "pasta, tomato, cheese"},
        {"title": "Salad", "ingredients": "lettuce, tomato, cucumber"}
    ]
    
    for recipe in recipes:
        chef.add_recipe(recipe)
    
    chef.train()
    
    # Test with similar ingredients
    results = chef.find_similar_recipes(["tomato", "cheese"], top_n=1)
    
    assert len(results) == 1
    assert results[0]["title"] == "Pasta"
    assert 0 <= results[0]["score"] <= 1.0
