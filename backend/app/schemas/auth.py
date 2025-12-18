from pydantic import BaseModel, EmailStr, Field, field_validator # Import field_validator
from typing import Optional, List # Import List for clarity
from enum import Enum


class UserRole(str, Enum):
    LEARNER = "learner"
    EDUCATOR = "educator"


class LearnerType(str, Enum):
    HIGH_SCHOOL = "high_school_student"
    UNIVERSITY = "university_student"
    PROFESSIONAL = "professional_dev"
    LANGUAGE = "language_learner"


class EducatorType(str, Enum):
    HIGH_SCHOOL_TEACHER = "high_school_teacher"
    UNIVERSITY_PROFESSOR = "university_professor"
    PARENT = "parent"
    CORPORATE_TRAINER = "corporate_trainer"
    TUTOR = "tutor_instructor"


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=3, max_length=30)
    
    # --- THIS IS THE CORRECTED VALIDATOR ---
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        # You could also add a special character check if you want:
        # if not any(c in '!@#$%^&*()' for c in v):
        #     raise ValueError('Password must contain at least one special character')
        return v
    # ----------------------------------------


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class OnboardingRequest(BaseModel):
    user_role: UserRole
    role_type: str  # LearnerType or EducatorType value
    interests: Optional[List[str]] = [] # Use List from typing
    grade_level: Optional[str] = None
    subjects: Optional[List[str]] = [] # Use List from typing


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    username: str
    user_role: Optional[UserRole] = None
    role_type: Optional[str] = None
    is_onboarded: bool = False
    created_at: str # Note: This will be a string. Use datetime for automatic parsing.
    
    class Config:
        from_attributes = True # This is the Pydantic v1 name
        # In Pydantic v2, it's:
        # model_config = ConfigDict(from_attributes=True)
        # However, v2 is often backward-compatible with 'class Config' for this.
        # If you get errors, you may need to use ConfigDict