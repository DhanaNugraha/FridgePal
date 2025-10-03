from typing import Dict, Any

class BaseModel:
    """Base model class for our in-memory models"""
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary"""
        return {k: v for k, v in self.__dict__.items() if not k.startswith('_')}
