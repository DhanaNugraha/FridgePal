from .base import BaseModel

class Recipe(BaseModel):
    """Recipe model to store recipe information in memory"""
    
    def __init__(self, id: int, title: str, ingredients: str, instructions: str, cuisine: str = None):
        self.id = id
        self.title = title
        self.ingredients = ingredients  # Stored as a string (comma-separated or JSON)
        self.instructions = instructions  # Stored as a string
        self.cuisine = cuisine  # Optional: for chef specialization
        self._similarity_score = 0.0  # For similarity scoring
    
    @property
    def similarity_score(self) -> float:
        return self._similarity_score
    
    @similarity_score.setter
    def similarity_score(self, value: float):
        self._similarity_score = value
