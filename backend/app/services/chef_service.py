import logging
import joblib
from pathlib import Path
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import partial
from app.models.chef import Chef
import time

# Get logger for this module
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)  # Ensure this logger's level is set

# Add a stream handler if no handlers are configured
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(handler)
    logger.propagate = False  # Prevent duplicate logs

class ChefService:
    _instance = None
    _chefs: List[Chef] = []
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ChefService, cls).__new__(cls)
            cls._instance._load_chefs()
        return cls._instance
    
    def _load_chefs(self):
        """Load all chef models from the models directory"""
        models_dir = Path(__file__).parent.parent / "models" / "trained_models"
        logger.info(f"Loading models from {models_dir.absolute()}")
        model_files = list(models_dir.glob("*.joblib"))
        logger.info(f"Found {len(model_files)} model files")
        
        if not model_files:
            logger.warning(f"No model files found in {models_dir.absolute()}")
            return
        
        for model_file in model_files:
            try:
                logger.info(f"Loading model: {model_file.name}")
                chef = joblib.load(model_file)
                self._chefs.append(chef)
                logger.info(f"Successfully loaded {chef.name}")
            except Exception as e:
                logger.error(f"Error loading {model_file}: {str(e)}")
    
    def get_chefs(self) -> List[Chef]:
        """Get all loaded chefs"""
        return self._chefs
    
    def _get_chef_recommendations(
        self,
        chef: Chef,
        ingredients: List[str],
        top_n: int,
        cosine_weight: float
    ) -> List[Dict[str, Any]]:
        """Helper method to get recommendations from a single chef."""
        start_time = time.time()
        try:
            logger.debug(f"Starting recommendations from {chef.name}...")
            result = chef.get_recommendations(ingredients, top_n=top_n, cosine_weight=cosine_weight)
            duration = time.time() - start_time
            logger.debug(f"Completed {chef.name} in {duration:.2f}s - {len(result)} recommendations")
            return result
        except Exception as e:
            logger.error(f"Error from {chef.name}: {str(e)}")
            return []

    def get_recommendations(
        self, 
        ingredients: List[str], 
        top_n: int = 5,
        cosine_weight: float = 0.7,
        max_workers: int = None
    ) -> List[Dict[str, Any]]:
        """
        Get recipe recommendations from all chefs in parallel.
        
        Args:
            ingredients: List of available ingredients
            top_n: Number of recommendations to return per chef
            cosine_weight: Weight for cosine similarity in scoring (0-1)
            max_workers: Maximum number of worker threads (default: min(32, os.cpu_count() + 4))
            
        Returns:
            List of recipe recommendations sorted by score (highest first)
        """
        all_recommendations = []
        
        # Create a partial function with the fixed parameters
        get_recs = partial(
            self._get_chef_recommendations,
            ingredients=ingredients,
            top_n=top_n,
            cosine_weight=cosine_weight
        )
        
        # Use ThreadPoolExecutor to process chefs in parallel
        start_time = time.time()
        logger.info(f"Starting parallel processing with {len(self._chefs)} chefs")
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all tasks with timing
            future_to_chef = {}
            for chef in self._chefs:
                future = executor.submit(get_recs, chef)
                future_to_chef[future] = chef.name
                logger.debug(f"Submitted task for {chef.name}")
            
            # Process results as they complete
            completed = 0
            for future in as_completed(future_to_chef):
                chef_name = future_to_chef[future]
                try:
                    recommendations = future.result()
                    all_recommendations.extend(recommendations)
                    completed += 1
                    logger.info(f"✅ Completed {chef_name} ({completed}/{len(future_to_chef)}) - {len(recommendations)} recipes")
                except Exception as e:
                    logger.error(f"❌ Error processing {chef_name}: {str(e)}")
        
        total_duration = time.time() - start_time
        logger.info(f"✨ Processed all chefs in {total_duration:.2f} seconds")
        
        # Sort all recommendations by similarity score (descending)
        all_recommendations.sort(key=lambda x: x.get("similarity_score", 0), reverse=True)
        return all_recommendations

# Create a singleton instance
chef_service = ChefService()
