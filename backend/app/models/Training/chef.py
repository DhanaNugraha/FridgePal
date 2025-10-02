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
            min_df=1,  # Ignore terms that appear in fewer than 2 documents
            max_df=0.8,  # Ignore terms that appear in more than 80% of documents
        )
        self.recipes: List[Recipe] = []
        self.tfidf_matrix = None

    def train(self, recipes: List[Recipe]):
        """Train the chef's TF-IDF model on the given recipes"""
        self.recipes = recipes

        def preprocess_ingredients(ing):
            if not ing or not isinstance(ing, str):
                return ""
            # If it's a JSON string, parse it first
            if (ing.startswith('[') and ing.endswith(']')) or (ing.startswith('{') and ing.endswith('}')):
                try:
                    import json
                    ings = json.loads(ing)
                    if isinstance(ings, dict):
                        ings = list(ings.values())
                    elif not isinstance(ings, list):
                        ings = [ings]
                    return ' '.join(str(i).strip() for i in ings if str(i).strip())
                except Exception as e:
                    print(f"Error parsing ingredients: {e}")
                    pass
            return ing

        # Preprocess ingredients before vectorization
        ingredients_list = []
        for recipe in recipes:
            if hasattr(recipe, 'ingredients'):
                processed = preprocess_ingredients(recipe.ingredients)
                ingredients_list.append(processed)
            else:
                ingredients_list.append("")  # Empty string if no NER ingredients

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
            if not ing_str or not isinstance(ing_str, str):
                return set()
                
            # Clean the string
            ing_str = ing_str.strip()
            
            # Handle empty string
            if not ing_str:
                return set()
                
            # Try to handle JSON format if it looks like JSON
            if (ing_str.startswith('[') and ing_str.endswith(']')) or \
               (ing_str.startswith('{') and ing_str.endswith('}')):
                try:
                    import json
                    import ast
                    # First try with json.loads
                    try:
                        ings = json.loads(ing_str)
                    except json.JSONDecodeError:
                        # If that fails, try with ast.literal_eval which is more lenient
                        ings = ast.literal_eval(ing_str)
                    
                    # Handle different JSON structures
                    if isinstance(ings, dict):
                        ings = list(ings.values())
                    elif not isinstance(ings, list):
                        ings = [ings]
                        
                    return {normalize_ingredient(str(ing)) for ing in ings if str(ing).strip()}
                except Exception as e:
                    print(f"Error parsing ingredients: {e}")
                    # If JSON parsing fails, fall through to string processing
                    pass
            
            # Handle string that might be a list representation
            if ing_str.startswith('[') and ing_str.endswith(']'):
                # Remove brackets and split by comma that's not inside quotes
                content = ing_str[1:-1]
                # Split by comma but ignore those inside quotes
                ings = []
                current = ""
                in_quotes = False
                for char in content:
                    if char == '"' or char == "'":
                        in_quotes = not in_quotes
                        current += char
                    elif char == ',' and not in_quotes:
                        ings.append(current.strip())
                        current = ""
                    else:
                        current += char
                if current:
                    ings.append(current.strip())
                return {normalize_ingredient(ing.strip(" \"'")) for ing in ings if ing.strip()}
            
            # Fall back to simple comma separation (handle cases with quotes)
            ings = []
            current = ""
            in_quotes = False
            for char in ing_str:
                if char == '"' or char == "'":
                    in_quotes = not in_quotes
                    current += char
                elif char == ',' and not in_quotes:
                    ings.append(current.strip())
                    current = ""
                else:
                    current += char
            if current:
                ings.append(current.strip())
                
            return {normalize_ingredient(ing.strip(" \"'")) for ing in ings if ing.strip()}
        
        # Get recipe ingredients as sets for overlap calculation
        recipe_ingredients_list = [parse_ingredients(recipe.NER_ingredients) for recipe in self.recipes]
        
        # Calculate overlap scores
        overlap_scores = np.array([
            len(query_ingredients & ing_set) / len(ing_set) if ing_set else 0
            for ing_set in recipe_ingredients_list
        ])
        
        # Debug: Print some overlap scores for inspection
        if len(overlap_scores) > 0:
            print(f"Overlap scores - Min: {overlap_scores.min():.2f}, Max: {overlap_scores.max():.2f}, Mean: {overlap_scores.mean():.2f}")

        # Preprocess query ingredients the same way as training data
        def preprocess_query_ingredients(ingredients):
            return ' '.join(str(ing).strip() for ing in ingredients if str(ing).strip())
        
        # Calculate TF-IDF cosine similarity
        query_text = preprocess_query_ingredients(query_ingredients)
        try:
            query_vector = self.vectorizer.transform([query_text])
            cosine_scores = cosine_similarity(query_vector, self.tfidf_matrix).flatten()
            
            # Don't normalize cosine scores as they're already in 0-1 range
            # This prevents all scores from being 100% when there's only one result
            # or when all results have the same score
            
        except Exception as e:
            print(f"Error in TF-IDF transformation: {e}")
            cosine_scores = np.zeros(len(self.recipes))
        
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
                    "NER_ingredients": recipe.NER_ingredients,
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

