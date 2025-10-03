from app.models.base import BaseModel

class TestModel(BaseModel):
    """Test model for BaseModel testing"""
    def __init__(self):
        self.public_attr = "visible"
        self._private_attr = "hidden"
        self.public_num = 42

def test_base_model_to_dict():
    """Test that to_dict() only includes non-private attributes"""
    # Create an instance of the test model
    model = TestModel()
    
    # Convert to dictionary
    result = model.to_dict()
    
    # Verify only non-private attributes are included
    assert "public_attr" in result
    assert "public_num" in result
    assert "_private_attr" not in result
    
    # Verify values are correct
    assert result["public_attr"] == "visible"
    assert result["public_num"] == 42
    
    # Verify the dictionary has the correct number of keys
    assert len(result) == 2
