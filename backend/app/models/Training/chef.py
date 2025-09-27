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
        self, ingredients: List[str], top_n: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get recipe recommendations based on available ingredients.
        Returns a list of recipes with similarity scores.
        """
        if self.tfidf_matrix is None or len(self.recipes) == 0:
            return []

        # Convert ingredients list to a single string
        query = " ".join(ingredients).lower()

        # Transform the query using the same vectorizer
        query_vector = self.vectorizer.transform([query])

        # Calculate similarity scores
        similarity_scores = cosine_similarity(query_vector, self.tfidf_matrix).flatten()

        # Get top N recommendations
        top_indices = np.argsort(similarity_scores)[::-1][:top_n]

        # Prepare results
        results = []
        for idx in top_indices:
            if similarity_scores[idx] > 0:  # Only include recipes with some similarity
                recipe = self.recipes[idx]
                recipe.similarity_score = float(similarity_scores[idx])

                # Add recipe to results with chef info
                recipe_dict = {
                    "id": recipe.id,
                    "title": recipe.title,
                    "ingredients": recipe.ingredients,
                    "instructions": recipe.instructions,
                    "similarity_score": recipe.similarity_score,
                    "chef": self.name,
                }
                if self.cuisine:
                    recipe_dict["cuisine"] = self.cuisine

                results.append(recipe_dict)

        return results

