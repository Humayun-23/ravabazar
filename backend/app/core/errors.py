from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


ERROR_CODES = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    428: "PRECONDITION_REQUIRED",
}


def error_response(
    *,
    status_code: int,
    message: str,
    details: dict | list | None = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": ERROR_CODES.get(status_code, "INTERNAL_SERVER_ERROR"),
                "message": message,
                "details": details or {},
            }
        },
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail
    message = detail if isinstance(detail, str) else "Request failed."
    details = {} if isinstance(detail, str) else detail
    return error_response(
        status_code=exc.status_code,
        message=message,
        details=details,
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    return error_response(
        status_code=422,
        message="Validation error.",
        details=exc.errors(),
    )
