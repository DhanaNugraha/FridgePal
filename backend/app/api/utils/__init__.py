"""Utility modules for the API package.

This package contains utility modules that are used across the API, including
error handling and response formatting.
"""

from .responses import (
    ErrorDetail,
    ValidationErrorDetail,
    ErrorResponse,
    ValidationErrorResponse,
    get_error_responses
)

from .exception_handlers import (
    http_exception_handler,
    validation_exception_handler,
    python_exception_handler,
    register_exception_handlers
)

__all__ = [
    'ErrorDetail',
    'ValidationErrorDetail',
    'ErrorResponse',
    'ValidationErrorResponse',
    'get_error_responses',
    'http_exception_handler',
    'validation_exception_handler',
    'python_exception_handler',
    'register_exception_handlers'
]
