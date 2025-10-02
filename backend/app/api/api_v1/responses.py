from typing import TypeVar, Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import status

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
    """Response model for validation errors (422)."""
    details: List[ValidationErrorDetail] = Field(
        ...,
        description="List of validation errors"
    )


# Common error responses that can be reused across endpoints
error_response_example = {
    "error": "Resource not found",
    "code": 404,
    "details": {"resource": "recipe", "id": 123}
}

validation_error_example = {
    "error": "Validation error",
    "code": 422,
    "details": [
        {
            "loc": ["body", "ingredients", 0],
            "msg": "field required",
            "type": "value_error.missing"
        }
    ]
}

ERROR_400_RESPONSE = {
    status.HTTP_400_BAD_REQUEST: {
        "description": "Invalid request parameters",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "error": "Invalid request parameters",
                    "code": 400,
                    "details": {"field": "ingredients", "issue": "missing required field"}
                }
            }
        }
    }
}

ERROR_401_RESPONSE = {
    status.HTTP_401_UNAUTHORIZED: {
        "description": "Unauthorized",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "error": "Authentication required",
                    "code": 401,
                    "details": {"authenticated": False}
                }
            }
        }
    }
}

ERROR_403_RESPONSE = {
    status.HTTP_403_FORBIDDEN: {
        "description": "Forbidden",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "error": "Insufficient permissions",
                    "code": 403,
                    "details": {"required": "admin", "actual": "user"}
                }
            }
        }
    }
}

ERROR_404_RESPONSE = {
    status.HTTP_404_NOT_FOUND: {
        "description": "Resource not found",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "error": "Recipe not found",
                    "code": 404,
                    "details": {"resource": "recipe", "id": 123}
                }
            }
        }
    }
}

ERROR_409_RESPONSE = {
    status.HTTP_409_CONFLICT: {
        "description": "Conflict with existing resource",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "error": "Resource already exists",
                    "code": 409,
                    "details": {"resource": "recipe", "field": "title", "value": "Pasta Carbonara"}
                }
            }
        }
    }
}

ERROR_422_RESPONSE = {
    status.HTTP_422_UNPROCESSABLE_ENTITY: {
        "description": "Validation error",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": validation_error_example
            }
        }
    }
}

ERROR_500_RESPONSE = {
    status.HTTP_500_INTERNAL_SERVER_ERROR: {
        "description": "Internal server error",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "error": "An unexpected error occurred",
                    "code": 500,
                    "details": {"type": "DatabaseError"}
                }
            }
        }
    }
}

def get_error_responses(*status_codes: int) -> dict:
    """Get a dictionary of error responses for the given status codes."""
    error_responses = {}
    status_map = {
        status.HTTP_400_BAD_REQUEST: ERROR_400_RESPONSE,
        status.HTTP_401_UNAUTHORIZED: ERROR_401_RESPONSE,
        status.HTTP_403_FORBIDDEN: ERROR_403_RESPONSE,
        status.HTTP_404_NOT_FOUND: ERROR_404_RESPONSE,
        status.HTTP_409_CONFLICT: ERROR_409_RESPONSE,
        status.HTTP_422_UNPROCESSABLE_ENTITY: ERROR_422_RESPONSE,
        status.HTTP_500_INTERNAL_SERVER_ERROR: ERROR_500_RESPONSE,
    }
    
    for code in status_codes:
        if code in status_map:
            error_responses.update(status_map[code])
    
    return error_responses
