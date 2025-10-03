"""Tests for the main FastAPI application."""
import pytest
from unittest.mock import patch, MagicMock
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.main import app as fastapi_app, custom_openapi, get_application
from app.core.config import settings
from fastapi.middleware.cors import CORSMiddleware

# Test data
TEST_ORIGIN = "http://localhost:3000"  # Match the actual allowed origin in settings
TEST_HEADERS = {
    "Origin": TEST_ORIGIN,
    "Access-Control-Request-Method": "GET",
    "Access-Control-Request-Headers": "X-Test-Header"
}

def test_custom_openapi_success():
    """Test successful OpenAPI schema generation."""
    # Setup
    test_app = FastAPI()
    
    # Test
    schema = custom_openapi(test_app)
    
    # Assert
    assert schema is not None
    assert "openapi" in schema
    assert "info" in schema
    assert "paths" in schema
    assert schema["info"]["title"] == settings.PROJECT_NAME

def test_custom_openapi_caching():
    """Test that the OpenAPI schema is cached."""
    # Setup
    test_app = FastAPI()
    
    # Test
    schema1 = custom_openapi(test_app)
    schema2 = custom_openapi(test_app)
    
    # Assert
    assert schema1 == schema2
    assert test_app.openapi_schema is not None

def test_custom_openapi_none_app():
    """Test error handling when app is None."""
    with pytest.raises(ValueError, match="FastAPI app cannot be None"):
        custom_openapi(None)

@patch('app.main.settings')
def test_custom_openapi_error(mock_settings, caplog):
    """Test error handling during OpenAPI schema generation."""
    # Setup
    test_app = FastAPI()
    mock_settings.PROJECT_NAME = "Test API"
    
    # Mock get_openapi to raise an exception
    with patch('app.main.get_openapi', side_effect=Exception("Test error")):
        with pytest.raises(Exception, match="Test error"):
            custom_openapi(test_app)
    
    # Verify error was logged
    assert "Error generating OpenAPI schema" in caplog.text

def test_cors_preflight():
    """Test CORS preflight request handling."""
    # Setup
    client = TestClient(fastapi_app)
    
    # Test
    response = client.options(
        "/api/v1/recipes",
        headers=TEST_HEADERS
    )
    
    # Assert
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == TEST_ORIGIN
    assert "access-control-allow-methods" in response.headers
    assert "access-control-allow-headers" in response.headers
    assert response.headers["access-control-allow-credentials"] == "true"

@patch('app.api.api_v1.recipes.chef_service')
def test_regular_request_has_cors_headers(mock_chef_service):
    """Test that regular requests include CORS headers."""
    # Setup mock chef service
    mock_chef = MagicMock()
    mock_chef.name = "Test Chef"
    mock_chef_service.get_chefs.return_value = [mock_chef]
    
    # Setup test client
    client = TestClient(fastapi_app)
    
    # Test with the health check endpoint that supports GET
    response = client.get("/api/v1/recipes/health", headers={"Origin": TEST_ORIGIN})
    
    # Assert CORS headers are present
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers
    assert "access-control-allow-credentials" in response.headers
    assert "access-control-expose-headers" in response.headers
    assert response.headers["access-control-allow-origin"] == TEST_ORIGIN

def test_get_application():
    """Test the get_application function."""
    # Test
    app = get_application()
    
    # Assert
    assert app is not None
    assert isinstance(app, FastAPI)
    assert app.title == settings.PROJECT_NAME

def test_application_initialization():
    """Test the FastAPI application initialization."""
    
    # Get the application
    app = get_application()
    
    # Verify it's a FastAPI app
    assert isinstance(app, FastAPI)
    
    # Get the CORS middleware configuration
    cors_middleware = None
    for middleware in app.user_middleware:
        if middleware.cls == CORSMiddleware:
            cors_middleware = middleware
            break
    
    # Verify CORS middleware was added
    assert cors_middleware is not None, "CORS middleware was not added"
    
    # Get the CORS options
    cors_options = cors_middleware.options
    
    # Verify CORS settings
    assert cors_options["allow_origins"] == ["http://localhost:3000"]
    assert cors_options["allow_credentials"] is True
    assert cors_options["allow_methods"] == ["*"]
    assert cors_options["allow_headers"] == ["*"]
    assert cors_options["expose_headers"] == ["*"]
    assert cors_options["max_age"] == 600
