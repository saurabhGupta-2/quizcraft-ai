from fastapi import HTTPException, status


class QuizCraftException(Exception):
    """Base exception for QuizCraft AI."""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class AuthenticationError(QuizCraftException):
    """Raised when authentication fails."""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)


class AuthorizationError(QuizCraftException):
    """Raised when user lacks permissions."""
    def __init__(self, message: str = "Not authorized"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)


class NotFoundError(QuizCraftException):
    """Raised when resource is not found."""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status.HTTP_404_NOT_FOUND)


class ValidationError(QuizCraftException):
    """Raised when validation fails."""
    def __init__(self, message: str = "Validation error"):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY)


class LLMServiceError(QuizCraftException):
    """Raised when LLM service fails."""
    def __init__(self, message: str = "LLM service error"):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR)