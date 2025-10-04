import os
import pandas as pd
from typing import List
import joblib
from datetime import datetime
from app.models.chef import Chef
from app.models.recipe import Recipe

# python -m app.models.Training.train_chefs

def load_and_preprocess_data(filepath: str, sample_size: int = 1000) -> pd.DataFrame:
    """
    Load and preprocess the recipe data from CSV, efficiently handling large files.

    Args:
        filepath: Path to the CSV file
        sample_size: Maximum number of rows to load and process

    Returns:
        DataFrame with preprocessed recipe data
    """
    print(f"Loading up to {sample_size} rows from {filepath}...")

    # Try to read the first few lines to understand the structure
    with open(filepath, "r", encoding="latin1") as f:
        # Read first 5 lines to analyze the structure
        lines = [next(f) for _ in range(5)]

    # Try to detect the delimiter
    possible_delimiters = [",", ";", "\t"]
    delimiter = ","  # default
    for d in possible_delimiters:
        if all(d in line for line in lines):
            delimiter = d
            break

    # Try to read with different encodings if needed
    encodings = ["utf-8", "latin1", "iso-8859-1", "cp1252"]

    for encoding in encodings:
        try:
            # First, try to read just the first row to get headers
            with open(filepath, "r", encoding=encoding) as f:
                first_line = f.readline().strip()
                if not first_line:
                    continue

                # Try to parse the header
                header = [h.strip("\"' ") for h in first_line.split(delimiter)]

                # Check if we have the required columns
                required_columns = ["title", "ingredients", "directions", "NER"]
                header_lower = [h.lower() for h in header]
                missing_columns = [
                    col for col in required_columns if col.lower() not in header_lower
                ]

                if missing_columns:
                    print(f"Missing columns in {encoding}: {missing_columns}")
                    continue

                # If we get here, we have a valid header
                print(f"Using encoding: {encoding}, delimiter: '{delimiter}'")

                # Now read the actual data in chunks
                chunks = []
                chunk_size = min(1000, sample_size)

                for chunk in pd.read_csv(
                    filepath,
                    chunksize=chunk_size,
                    delimiter=delimiter,
                    quotechar='"',
                    encoding=encoding,
                    dtype=str,
                    skipinitialspace=True,
                    on_bad_lines="skip",  # This is the new way to handle bad lines
                ):
                    # Clean up column names
                    chunk.columns = [str(col).strip("\"' ") for col in chunk.columns]

                    # Ensure we have the required columns (case-insensitive)
                    chunk_columns_lower = [str(col).lower() for col in chunk.columns]
                    col_mapping = {}

                    for req_col in required_columns:
                        if req_col.lower() in chunk_columns_lower:
                            idx = chunk_columns_lower.index(req_col.lower())
                            col_mapping[req_col] = chunk.columns[idx]

                    # Only keep the required columns
                    if len(col_mapping) == len(required_columns):
                        chunk = chunk[list(col_mapping.values())].copy()
                        chunk.columns = list(col_mapping.keys())

                        # Clean the data
                        for col in required_columns:
                            chunk[col] = chunk[col].astype(str).str.strip()

                        # Remove any rows with empty values
                        chunk = chunk.replace("", pd.NA).dropna()

                        if not chunk.empty:
                            chunks.append(chunk)

                            # Check if we have enough samples
                            total_rows = sum(len(c) for c in chunks)
                            if total_rows >= sample_size:
                                # Truncate the last chunk if needed
                                if total_rows > sample_size:
                                    remaining = sample_size - (
                                        total_rows - len(chunks[-1])
                                    )
                                    chunks[-1] = chunks[-1].iloc[:remaining]
                                break

                # Combine all valid chunks
                if chunks:
                    df = pd.concat(chunks, ignore_index=True)
                    print(f"Successfully loaded {len(df)} recipes")

                    # Final cleanup
                    df["ingredients"] = df["ingredients"].str.lower()
                    return df

        except Exception as e:
            print(f"Error with {encoding}: {str(e)}")
            continue

    # If we get here, all attempts failed
    raise ValueError("Could not read the CSV file with any of the supported encodings")

def create_chefs(df: pd.DataFrame, num_chefs: int = 5, recipes_per_chef: int = 1) -> List[Chef]:
    """
    Create and train multiple chef models on different subsets of the data.
    
    Args:
        df: DataFrame containing recipe data
        num_chefs: Number of chefs to create
        recipes_per_chef: Number of recipes per chef
        
    Returns:
        List of trained Chef objects
    """
    chefs = []
    
    # List of chef names
    chef_names = ["Marco", "Sofia", "Raj", "Elena", "Hiroshi"]
    
    print(f"Creating {num_chefs} chefs with up to {recipes_per_chef} recipes each...")
    
    for i in range(num_chefs):
        # Get a subset of the data for this chef
        start_idx = i * recipes_per_chef
        end_idx = start_idx + recipes_per_chef
        chef_df = df.iloc[start_idx:end_idx]
        
        # Create a chef with a name
        chef_name = f"Chef {i+1} ({chef_names[i % len(chef_names)]})"
        chef = Chef(name=chef_name)
        
        # Create Recipe objects
        recipes = []
        for _, row in chef_df.iterrows():
            recipe = Recipe(
                id=row.name,  # Using the DataFrame index as ID
                title=row['title'],
                ingredients=row['ingredients'],
                instructions=row['directions'],
                NER_ingredients=row['NER']
            )
            recipes.append(recipe)
        
        # Train the chef on their recipes
        print(f"Training {chef_name} on {len(recipes)} recipes...")
        chef.train(recipes)
        chefs.append(chef)
        
        print(f"  - {chef_name} trained on {len(chef.recipes)} recipes")
    
    return chefs

def save_chefs(chefs: List[Chef], output_dir: str = "trained_models", recipes_per_chef: int = 1):
    """
    Save trained chef models to disk.
    
    Args:
        chefs: List of trained Chef objects
        output_dir: Directory name to save the models (relative to app/models/)
    """
    # Create output directory if it doesn't exist
    models_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_path = os.path.join(models_dir, output_dir)
    os.makedirs(output_path, exist_ok=True)
    
    # Save each chef's model
    for i, chef in enumerate(chefs):
        # Create a unique filename with timestamp
        timestamp = datetime.now().strftime("%d%m%Y")
        filename = os.path.join(output_path, f"{chef.name.lower().replace(' ', '_')}_{recipes_per_chef}_recipes_{timestamp}.joblib")
        
        # Save the chef object
        joblib.dump(chef, filename)
        print(f"Saved {chef.name} to {filename}")
    
    print(f"\nAll chefs saved to {os.path.abspath(output_dir)}")

def main():
    # Configuration
    DATA_FILE = "data/recipes_data.csv"
    OUTPUT_DIR = "trained_models"  # This will be relative to app/models/
    NUM_CHEFS = 5
    RECIPES_PER_CHEF = 50000  # Number of recipes per chef
    sample_size = RECIPES_PER_CHEF * NUM_CHEFS
    
    try:
        # Load and preprocess data
        df = load_and_preprocess_data(DATA_FILE, sample_size=sample_size)
        
        # Create and train chefs
        chefs = create_chefs(df, num_chefs=NUM_CHEFS, recipes_per_chef=RECIPES_PER_CHEF)
        
        # Save the trained models
        save_chefs(chefs, output_dir=OUTPUT_DIR, recipes_per_chef=RECIPES_PER_CHEF)
        
        print("\nTraining completed successfully!")
        
    except Exception as e:
        print(f"\nAn error occurred: {str(e)}")
        raise

if __name__ == "__main__":
    main()
