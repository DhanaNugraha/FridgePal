import os
import joblib
from pathlib import Path
from typing import List, Dict, Any
from app.models.chef import Chef

# python -m app.models.Training.test_chefs


def load_chefs(models_dir: str = "../trained_models") -> List[Chef]:
    """
    Load all chef models from the specified directory.

    Args:
        models_dir: Directory containing the saved chef models (relative to script location)

    Returns:
        List of loaded Chef objects
    """
    # Convert relative path to absolute path relative to the script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    models_path = os.path.normpath(os.path.join(script_dir, models_dir))
    
    chefs = []
    model_files = list(Path(models_path).glob("*.joblib"))

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
    chefs: List[Chef], ingredients: List[str], top_n: int = 5, cosine_weight: float = 0.5
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
        recommendations = chef.get_recommendations(ingredients, top_n=top_n, cosine_weight=cosine_weight)
        all_recommendations.extend(recommendations)

    # Sort all recommendations by similarity score
    all_recommendations.sort(key=lambda x: x["similarity_score"], reverse=True)

    return all_recommendations


def print_recommendations(recommendations: List[Dict[str, Any]], max_recipes: int = 10):
    """Print recipe recommendations in a readable format.
    
    Args:
        recommendations: List of recipe recommendations
        max_recipes: Maximum number of recipes to display (top N)
    """
    print("\n" + "=" * 100)
    print(f"TOP {min(max_recipes, len(recommendations))} RECIPE RECOMMENDATIONS (out of {len(recommendations)} total)")
    print("=" * 100)

    for i, recipe in enumerate(recommendations[:max_recipes], 1):
        print(f"\n{i}. {recipe['title']}")
        print(f"   By: {recipe['chef']}")
        print(f"   Cuisine: {recipe.get('cuisine', 'N/A')}")
        
        # Display score components if available
        if 'score_components' in recipe:
            scores = recipe['score_components']
            print("\n   SCORE BREAKDOWN:")
            print(f"   {'Final Score:':<20} {recipe['similarity_score'] * 100:.2f}%")
            print(f"   {'TF-IDF Score:':<20} {scores['cosine_score'] * 100:.2f}% (weight: {scores['cosine_weight'] * 100:.0f}%)")
            print(f"   {'Overlap Score:':<20} {scores['overlap_score'] * 100:.2f}% (weight: {scores['overlap_weight'] * 100:.0f}%)")
        else:
            print(f"   Match Score: {recipe['similarity_score'] * 100:.2f}%")

        # Format ingredients for better readability
        if isinstance(recipe["ingredients"], str):
            ingredients = recipe["ingredients"]
        elif isinstance(recipe["ingredients"], list):
            ingredients = ", ".join(str(ing).strip() for ing in recipe["ingredients"])
        else:
            ingredients = str(recipe["ingredients"])

        # Format NER ingredients for better readability
        ner_ingredients = recipe.get("NER_ingredients", "N/A")
        if isinstance(ner_ingredients, str):
            formatted_ner = ner_ingredients
        elif isinstance(ner_ingredients, list):
            formatted_ner = ", ".join(str(ing).strip() for ing in ner_ingredients)
        else:
            formatted_ner = str(ner_ingredients)

        # Limit the length of previews
        max_length = 200
        if len(ingredients) > max_length:
            ingredients = ingredients[:max_length] + "..."
        if len(formatted_ner) > max_length:
            formatted_ner = formatted_ner[:max_length] + "..."

        print(f"\n   INGREDIENTS: {ingredients}")
        print(f"   NER INGREDIENTS: {formatted_ner}")
        
        # Show instructions for top 3 recipes
        if i <= 3 and 'instructions' in recipe and recipe['instructions']:
            print("\n   INSTRUCTIONS:")
            instructions = recipe['instructions']
            
            # Clean and format instructions
            if isinstance(instructions, str):
                # Split into steps if they're in a single string
                steps = [s.strip() for s in instructions.split('\n') if s.strip()]
                if len(steps) == 1 and ('. ' in steps[0] or ';' in steps[0]):
                    # If it's one long string with periods or semicolons, split into sentences
                    import re
                    steps = [s.strip() for s in re.split(r'(?<=[.;])\s+', steps[0]) if s.strip()]
                
                # Print each step with numbering
                for j, step in enumerate(steps, 1):
                    print(f"   {j}. {step}")
            else:
                print(f"   {instructions}")

        print("-" * 100)


def main():
    try:
        # Load the trained chefs
        chefs = load_chefs("app/models/trained_models")

        # Example query
        test_ingredients = [
            "chicken",
            "rice",
            "tomato",
            "potato",
            "onion",
            "garlic",
            "ginger",
            "lemon",
            "salt",
            "pepper",
            "oil",
            "curry",
        ]

        print(f"\nSearching for recipes with: {', '.join(test_ingredients)}")

        # Get more recommendations (increased top_n to get more results)
        recommendations = get_recommendations(chefs, test_ingredients, top_n=10, cosine_weight=0.7)

        # Print all results with improved formatting
        print_recommendations(recommendations)

    except Exception as e:
        print(f"\nAn error occurred: {str(e)}")
        raise


if __name__ == "__main__":
    main()
