from typing import Any, Dict, List
import json
from datetime import datetime


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal."""
    import re
    # Remove any path components
    filename = filename.split('/')[-1].split('\\')[-1]
    # Remove potentially dangerous characters
    filename = re.sub(r'[^\w\-.]', '_', filename)
    return filename


def format_timestamp(dt: datetime) -> str:
    """Format datetime for API response."""
    return dt.isoformat()


def calculate_percentage(correct: int, total: int) -> float:
    """Calculate percentage score."""
    if total == 0:
        return 0.0
    return round((correct / total) * 100, 2)


def truncate_text(text: str, max_length: int = 100) -> str:
    """Truncate text to max length."""
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."


def parse_json_safe(text: str) -> Any:
    """Safely parse JSON with error handling."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None