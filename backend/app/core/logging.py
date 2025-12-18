import logging
import sys
from pathlib import Path
from loguru import logger
from app.core.config import settings

# Remove default handler
logger.remove()

# Add console handler
logger.add(
    sys.stdout,
    colorize=True,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    level="DEBUG" if settings.DEBUG else "INFO"
)

# Add file handler
log_path = Path("logs")
log_path.mkdir(exist_ok=True)

logger.add(
    log_path / "app.log",
    rotation="500 MB",
    retention="10 days",
    compression="zip",
    level="INFO"
)

logger.add(
    log_path / "errors.log",
    rotation="500 MB",
    retention="30 days",
    compression="zip",
    level="ERROR"
)


def get_logger(name: str):
    """Get a logger instance."""
    return logger.bind(name=name)