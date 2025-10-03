import sys
import warnings
from pathlib import Path
from typing import Any, Dict, Generator, List

import pytest
from fastapi.testclient import TestClient

# Add the parent directory to the path so we can import app
sys.path.append(str(Path(__file__).parent.parent))

from app.main import app  # noqa: E402

@pytest.fixture(scope="module")
def test_client() -> Generator:
    with TestClient(app) as client:
        yield client

@pytest.fixture
def sample_ingredients() -> List[str]:
    return ["chicken", "tomato", "onion"]

@pytest.fixture
def mock_recipe_data() -> List[Dict[str, Any]]:
    return [
        {
            "title": "Chicken Curry",
            "ingredients": "chicken, tomato, onion, spices",
            "instructions": "Cook everything together"
        },
        {
            "title": "Vegetable Soup",
            "ingredients": "carrot, potato, onion, water",
            "instructions": "Boil all ingredients"
        }
    ]
