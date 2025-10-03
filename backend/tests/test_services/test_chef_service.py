from unittest.mock import patch, MagicMock
from app.services.chef_service import ChefService
from app.models.chef import Chef
import pytest


@pytest.fixture
def mock_chef():
    """Fixture to create a mock chef with required attributes."""
    chef = MagicMock(spec=Chef)
    chef.name = "Test Chef"
    chef.get_recommendations.return_value = []
    return chef


@pytest.fixture(autouse=True)
def reset_singleton():
    """Reset the ChefService singleton before each test."""
    ChefService._instance = None
    yield
    ChefService._instance = None


def test_chef_service_initialization(mock_chef):
    """Test that the chef service initializes with the correct number of chefs."""
    with patch("app.services.chef_service.ChefService._load_chefs") as mock_load_chefs:
        service = ChefService()
        service._chefs = [mock_chef, mock_chef]
        assert len(service.get_chefs()) == 2
        mock_load_chefs.assert_called_once()


@patch("app.services.chef_service.joblib", autospec=True)
def test_get_recipe_recommendations(_):
    """Test getting recipe recommendations from multiple chefs."""
    # Setup mock chefs
    mock_chef1 = MagicMock(spec=Chef)
    mock_chef1.name = "Chef 1"
    mock_chef1.get_recommendations.return_value = [
        {"title": "Recipe 1", "score": 0.9, "chef": "Chef 1"}
    ]

    mock_chef2 = MagicMock(spec=Chef)
    mock_chef2.name = "Chef 2"
    mock_chef2.get_recommendations.return_value = [
        {"title": "Recipe 2", "score": 0.85, "chef": "Chef 2"}
    ]

    # Initialize service with our mock chefs
    service = ChefService()
    service._chefs = [mock_chef1, mock_chef2]

    # Call the method
    ingredients = ["chicken", "rice"]
    results = service.get_recommendations(ingredients, 2, 0.7)

    # Verify results
    assert len(results) == 2
    assert all(isinstance(r, dict) for r in results)
    assert results[0]["score"] >= results[1]["score"]  # Should be sorted by score


@patch("app.services.chef_service.joblib.load")
@patch("pathlib.Path.glob")
@patch("pathlib.Path.absolute")
def test_load_chefs_no_models_found(mock_absolute, mock_glob, mock_load, caplog):
    """Test _load_chefs when no model files are found."""
    # Setup mocks
    mock_glob.return_value = []
    mock_absolute.return_value = "/fake/path/models"

    service = ChefService()
    service._chefs = []
    service._load_chefs()

    assert "No model files found in /fake/path/models" in caplog.text
    assert len(service._chefs) == 0


@patch("app.services.chef_service.joblib.load")
@patch("pathlib.Path.glob")
@patch("pathlib.Path.absolute")
def test_load_chefs_with_models(mock_absolute, mock_glob, mock_load):
    """Test _load_chefs with valid model files."""
    # Setup mocks
    mock_file = MagicMock()
    mock_file.name = "test_chef.joblib"
    mock_glob.return_value = [mock_file]
    mock_absolute.return_value = "/fake/path/models"

    # Create a mock chef with name attribute
    mock_chef = MagicMock()
    mock_chef.name = "Test Chef"
    mock_load.return_value = mock_chef

    # Create service and patch _load_chefs to do nothing during init
    with patch.object(ChefService, "_load_chefs"):
        service = ChefService()
    service._chefs = []  # Clear any chefs loaded during init
    service._load_chefs()  # Now call load_chefs manually

    assert len(service._chefs) == 1
    assert service._chefs[0].name == "Test Chef"
    mock_load.assert_called_once_with(mock_file)


@patch("app.services.chef_service.joblib.load")
@patch("pathlib.Path.glob")
@patch("pathlib.Path.absolute")
def test_load_chefs_with_error(mock_absolute, mock_glob, mock_load, caplog):
    """Test _load_chefs when there's an error loading a model."""
    # Setup mocks to raise an error
    mock_file = MagicMock()
    mock_file.name = "broken_chef.joblib"
    mock_glob.return_value = [mock_file]
    mock_absolute.return_value = "/fake/path/models"
    mock_load.side_effect = Exception("Failed to load model")

    service = ChefService()
    service._chefs = []
    service._load_chefs()

    # Check that the error was logged
    assert any(
        "Error loading" in record.message and "Failed to load model" in record.message
        for record in caplog.records
    )
    assert len(service._chefs) == 0


def test_get_recommendations_with_chef_error(caplog):
    """Test get_recommendations when a chef raises an error."""
    # Setup a mock chef that raises an error
    error_chef = MagicMock(spec=Chef)
    error_chef.name = "Error Chef"
    error_chef.get_recommendations.side_effect = Exception("Chef error")

    # Setup a working chef
    working_chef = MagicMock(spec=Chef)
    working_chef.name = "Working Chef"
    working_chef.get_recommendations.return_value = [
        {"title": "Working Recipe", "score": 0.8, "chef": "Working Chef"}
    ]

    # Create service with our test chefs
    service = ChefService()
    service._chefs = [error_chef, working_chef]

    # Clear any existing log records
    caplog.clear()

    # Call the method
    results = service.get_recommendations(["ingredient"], 5)

    # Verify the working chef's results are still returned
    assert len(results) == 1
    assert results[0]["title"] == "Working Recipe"

    # Verify error was logged
    assert any(
        "Error from Error Chef" in record.message and "Chef error" in str(record)
        for record in caplog.records
    )
