from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time

from app.core.config import settings
from app.core.logging import get_logger
from app.core.exceptions import QuizCraftException
# This line has been updated with the new routes
from app.api.v1.routes import (
    auth,
    users,
    lessons,
    generation,
    upload,
    quizzes,
    flashcards,
    folders,
    chat,
    tutor,
    health,
)

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    yield
    # Shutdown
    logger.info("Shutting down application")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Personalized AI-Powered Assignment & Quiz Generator",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    logger.info(f"Request: {request.method} {request.url.path}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(
        f"Response: {response.status_code} | "
        f"Time: {process_time:.2f}s | "
        f"Path: {request.url.path}"
    )
    
    return response


# Exception handler
@app.exception_handler(QuizCraftException)
async def quizcraft_exception_handler(request: Request, exc: QuizCraftException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    # --- THIS IS THE FIX ---
    # Use logger.exception() inside an exception handler.
    # It automatically logs the exception object and traceback safely
    # without causing a formatting KeyError.
    logger.exception("Unhandled exception occurred")
    # --- END FIX ---
    
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# Include routers
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_PREFIX}/auth",
    tags=["Authentication"]
)

app.include_router(
    users.router,
    prefix=f"{settings.API_V1_PREFIX}/users",
    tags=["Users"]
)

app.include_router(
    lessons.router,
    prefix=f"{settings.API_V1_PREFIX}/lessons",
    tags=["Lessons"]
)

app.include_router(
    generation.router,
    prefix=f"{settings.API_V1_PREFIX}/generate",
    tags=["Generation"]
)

app.include_router(
    upload.router,
    prefix=f"{settings.API_V1_PREFIX}/upload",
    tags=["Upload"]
)

# --- NEW ROUTERS ADDED BELOW ---
app.include_router(
    quizzes.router,
    prefix=f"{settings.API_V1_PREFIX}/quizzes",
    tags=["Quizzes"]
)

app.include_router(
    flashcards.router,
    prefix=f"{settings.API_V1_PREFIX}/flashcards",
    tags=["Flashcards"]
)

app.include_router(
    folders.router,
    prefix=f"{settings.API_V1_PREFIX}/folders",
    tags=["Folders"]
)

app.include_router(
    chat.router,
    prefix=f"{settings.API_V1_PREFIX}/chat",
    tags=["Chat"]
)

app.include_router(
    tutor.router,
    prefix=f"{settings.API_V1_PREFIX}/tutor",
    tags=["Tutor"]
)

app.include_router(
    health.router,
    prefix=f"{settings.API_V1_PREFIX}/health",
    tags=["Health"]
)


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
