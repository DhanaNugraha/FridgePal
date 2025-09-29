from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from .recipe import Recipe


class Chef:
    """
    A Chef represents a specialized model trained on a subset of recipes.
    Each Chef can have a cuisine specialization and provides recipe recommendations.
    """

    def __init__(self, name: str, cuisine: Optional[str] = None):
        self.name = name
        self.cuisine = cuisine
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),  # Consider both single words and bigrams
            min_df=2,  # Ignore terms that appear in fewer than 2 documents
            max_df=0.8,  # Ignore terms that appear in more than 80% of documents
        )
        self.recipes: List[Recipe] = []
        self.tfidf_matrix = None

    def train(self, recipes: List[Recipe]):
        """Train the chef's TF-IDF model on the given recipes"""
        self.recipes = recipes

        # Extract ingredients as a list of strings
        ingredients_list = [recipe.ingredients for recipe in recipes]

        # Fit and transform the ingredients
        self.tfidf_matrix = self.vectorizer.fit_transform(ingredients_list)

    def get_recommendations(
        self, ingredients: List[str], top_n: int = 5, cosine_weight: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Get recipe recommendations based on available ingredients using hybrid scoring.
        
        Args:
            ingredients: List of available ingredients
            top_n: Number of top recommendations to return
            cosine_weight: Weight for TF-IDF cosine similarity (1.0 = pure TF-IDF, 0.0 = pure overlap)
            
        Returns:
            List of recipe dictionaries with hybrid similarity scores
        """
        if self.tfidf_matrix is None or len(self.recipes) == 0:
            return []

        # Convert query ingredients to a set of normalized strings
        def normalize_ingredient(ing: str) -> str:
            # Basic normalization: lowercase and remove extra whitespace
            return ' '.join(ing.lower().strip().split())
        
        query_ingredients = {normalize_ingredient(ing) for ing in ingredients if ing.strip()}
        
        # Pre-process recipe ingredients
        def parse_ingredients(ing_str: str) -> set:
            # First try to handle JSON-like format
            if ing_str.startswith('[') and ing_str.endswith(']'):
                try:
                    import json
                    ings = json.loads(ing_str.replace("'", '"'))  # Handle single quotes in JSON
                    return {normalize_ingredient(str(ing)) for ing in ings}
                except Exception as e:
                    print(f"Error parsing ingredients: {e}")
                    pass
            
            # Fall back to comma separation
            return {normalize_ingredient(ing) for ing in ing_str.split(',') if ing.strip()}
        
        # Get recipe ingredients as sets for overlap calculation
        recipe_ingredients_list = [parse_ingredients(recipe.ingredients) for recipe in self.recipes]
        
        # Calculate overlap scores
        overlap_scores = np.array([
            len(query_ingredients & ing_set) / len(ing_set) if ing_set else 0
            for ing_set in recipe_ingredients_list
        ])
        
        # Debug: Print some overlap scores for inspection
        if len(overlap_scores) > 0:
            print(f"Overlap scores - Min: {overlap_scores.min():.2f}, Max: {overlap_scores.max():.2f}, Mean: {overlap_scores.mean():.2f}")

        # Calculate TF-IDF cosine similarity
        query_text = " ".join(query_ingredients)
        query_vector = self.vectorizer.transform([query_text])
        cosine_scores = cosine_similarity(query_vector, self.tfidf_matrix).flatten()
        
        # Normalize cosine scores to 0-1 range for fair combination with overlap
        if len(cosine_scores) > 1:  # Avoid division by zero
            cosine_scores = (cosine_scores - cosine_scores.min()) / (cosine_scores.max() - cosine_scores.min() + 1e-9)
        
        # Calculate hybrid scores
        hybrid_scores = (cosine_weight * cosine_scores) + ((1 - cosine_weight) * overlap_scores)
        
        # Get top N recommendations based on hybrid scores
        top_indices = np.argsort(hybrid_scores)[::-1][:top_n]
        
        # Prepare results
        results = []
        for idx in top_indices:
            if hybrid_scores[idx] > 0:  # Only include recipes with some similarity
                recipe = self.recipes[idx]
                
                # Add recipe to results with detailed scoring information
                recipe_dict = {
                    "id": recipe.id,
                    "title": recipe.title,
                    "ingredients": recipe.ingredients,
                    "instructions": recipe.instructions,
                    "similarity_score": float(hybrid_scores[idx]),
                    "score_components": {
                        "cosine_score": float(cosine_scores[idx]),
                        "overlap_score": float(overlap_scores[idx]),
                        "cosine_weight": cosine_weight,
                        "overlap_weight": 1 - cosine_weight
                    },
                    "chef": self.name,
                }
                if self.cuisine:
                    recipe_dict["cuisine"] = self.cuisine
                    
                results.append(recipe_dict)

        return results

