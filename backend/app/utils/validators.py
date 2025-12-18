import re
from typing import Optional

def validate_email(email: str) -> bool:
    """Validate email format."""
    # The regex pattern was missing a closing quote
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    return re.match(pattern, email) is not None

def validate_password(password: str) -> tuple[bool, Optional[str]]:
    """Validate password strength."""
    # All the 'if' statements were incorrectly indented
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    return True, None

def validate_username(username: str) -> tuple[bool, Optional[str]]:
    """Validate username format."""
    # The last two 'if' statements were incorrectly indented
    if len(username) < 3:
        return False, "Username must be at least 3 characters long"
    if len(username) > 30:
        return False, "Username must be at most 30 characters long"
    # The arguments in re.match were swapped
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return False, "Username can only contain letters, numbers, and underscores"
    return True, None