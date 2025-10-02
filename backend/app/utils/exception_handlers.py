from fastapi import Request, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from .responses import ErrorResponse

async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions and return a standardized error response."""
    error_response = ErrorResponse(
        error=exc.detail,
        code=exc.status_code,
        details=getattr(exc, "details", None)
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.model_dump(exclude_none=True)
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle validation errors and return a standardized error response."""
    errors = []
    for error in exc.errors():
        errors.append({
            "loc": ".".join(str(loc) for loc in error["loc"][1:]),
            "msg": error["msg"],
            "type": error["type"]
        })
    
    error_response = ErrorResponse(
        error="Validation error",
        code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        details={"errors": errors}
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response.model_dump(exclude_none=True)
    )

async def python_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected Python exceptions and return a standardized error response."""
    error_response = ErrorResponse(
        error="Internal server error",
        code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        details={
            "type": type(exc).__name__,
            "message": str(exc)
        } if str(exc) else None
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response.model_dump(exclude_none=True)
    )

def register_exception_handlers(app):
    """Register all exception handlers with the FastAPI app."""
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, python_exception_handler)
