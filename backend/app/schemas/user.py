from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 10:
            raise ValueError("Password must be at least 10 characters long.")
        if not any(char.islower() for char in value):
            raise ValueError("Password must include a lowercase letter.")
        if not any(char.isupper() for char in value):
            raise ValueError("Password must include an uppercase letter.")
        if not any(char.isdigit() for char in value):
            raise ValueError("Password must include a number.")
        return value

class UserResponse(BaseModel):
    id: int
    email: str
    is_admin: bool
    is_approved: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
