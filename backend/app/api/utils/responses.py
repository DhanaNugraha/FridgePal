from typing import TypeVar, Optional, Dict, Any, List
from pydantic import BaseModel, Field

T = TypeVar('T')

class ErrorDetail(BaseModel):
    """Base model for error details."""
    pass

class ValidationErrorDetail(ErrorDetail):
    """Validation error details."""
    loc: List[str] = Field(..., description="Location of the error in the request")
    msg: str = Field(..., description="Error message")
    type: str = Field(..., description="Error type")

class ErrorResponse(BaseModel):
    """Standard error response model for API errors."""
    error: str = Field(..., description="Error message")
    code: int = Field(..., description="HTTP status code")
    details: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional error details or validation errors"
    )

class ValidationErrorResponse(ErrorResponse):
    """Response model for validation errors."""
    details: Dict[str, Any] = Field(
        ...,
        description="Validation error details"
    )


# Common error responses that can be reused across endpoints
error_response_example = {
    "error": "Resource not found",
    "code": 404,
    "details": {
        "resource": "recipe",
        "id": "123"
    }
}

def get_error_responses(*status_codes: int) -> Dict[int, Dict[str, Any]]:
    """Get a dictionary of error responses for the given status codes.
    
    Args:
        *status_codes: Variable number of HTTP status codes
        
    Returns:
        Dictionary mapping status codes to their response models
    """
    responses = {}
    for code in status_codes:
        if code == 400:
            responses[code] = {"model": ErrorResponse, "description": "Bad Request"}
        elif code == 401:
            responses[code] = {"model": ErrorResponse, "description": "Unauthorized"}
        elif code == 403:
            responses[code] = {"model": ErrorResponse, "description": "Forbidden"}
        elif code == 404:
            responses[code] = {"model": ErrorResponse, "description": "Not Found"}
        elif code == 409:
            responses[code] = {"model": ErrorResponse, "description": "Conflict"}
        elif code == 422:
            responses[code] = {"model": ValidationErrorResponse, "description": "Validation Error"}
        elif code == 500:
            responses[code] = {"model": ErrorResponse, "description": "Internal Server Error"}
    return responses
