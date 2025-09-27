import os
import joblib
from pathlib import Path
from typing import List, Dict, Any
from .chef import Chef

# python -m app.models.Training.test_chefs

def load_chefs(models_dir: str = "models") -> List[Chef]:
    """
    Load all chef models from the specified directory.

    Args:
        models_dir: Directory containing the saved chef models

    Returns:
        List of loaded Chef objects
    """
    chefs = []
    model_files = list(Path(models_dir).glob("*.joblib"))

    if not model_files:
        raise FileNotFoundError(
            f"No model files found in {os.path.abspath(models_dir)}"
        )

    for model_file in model_files:
        print(f"Loading model: {model_file.name}")
        chef = joblib.load(model_file)
        chefs.append(chef)

    print(f"\nLoaded {len(chefs)} chef(s)")
    return chefs


def get_recommendations(
    chefs: List[Chef], ingredients: List[str], top_n: int = 5
) -> List[Dict[str, Any]]:
    """
    Get recipe recommendations from all chefs.

    Args:
        chefs: List of Chef objects
        ingredients: List of available ingredients
        top_n: Number of recommendations to return per chef

    Returns:
        List of recipe recommendations with chef info
    """
    all_recommendations = []

    for chef in chefs:
        print(f"\nGetting recommendations from {chef.name}...")
        recommendations = chef.get_recommendations(ingredients, top_n=top_n)
        all_recommendations.extend(recommendations)

    # Sort all recommendations by similarity score
    all_recommendations.sort(key=lambda x: x["similarity_score"], reverse=True)

    return all_recommendations


def print_recommendations(recommendations: List[Dict[str, Any]], max_results: int = 10):
    """Print recipe recommendations in a readable format."""
    print("\n" + "=" * 80)
    print(f"RECIPE RECOMMENDATIONS ({len(recommendations)} total)")
    print("=" * 80)

    for i, recipe in enumerate(recommendations[:max_results], 1):
        print(f"\n{i}. {recipe['title']}")
        print(f"   By: {recipe['chef']}")
        print(f"   Match Score: {recipe['similarity_score']:.2f}")
        print(f"   Cuisine: {recipe.get('cuisine', 'N/A')}")

        # Print a preview of the ingredients
        ingredients = (
            recipe["ingredients"][:100] + "..."
            if len(recipe["ingredients"]) > 100
            else recipe["ingredients"]
        )
        print(f"   Ingredients: {ingredients}")

    if len(recommendations) > max_results:
        print(f"\n... and {len(recommendations) - max_results} more recommendations")


def main():
    try:
        # Load the trained chefs
        chefs = load_chefs("app/models")

        # Example query
        test_ingredients = ["chicken", "rice", "tomato"]

        print(f"\nSearching for recipes with: {', '.join(test_ingredients)}")

        # Get recommendations
        recommendations = get_recommendations(chefs, test_ingredients, top_n=3)

        # Print results
        print_recommendations(recommendations, max_results=5)

    except Exception as e:
        print(f"\nAn error occurred: {str(e)}")
        raise


if __name__ == "__main__":
    main()
