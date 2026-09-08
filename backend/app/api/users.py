from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr

from app.core.auth import require_role
from app.core.security import hash_password
from app.database.session import get_session
from app.models.user import User, UserRole


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


class AdminCreateUserRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole


class UpdateUserRoleRequest(BaseModel):
    role: UserRole


# ---------------------------------------------------------
# GET ALL USERS
# ADMIN ONLY
# ---------------------------------------------------------
@router.get("/")
def get_all_users(
    current_user: User = Depends(
        require_role(UserRole.admin)
    ),
    session: Session = Depends(get_session),
):
    users = session.exec(
        select(User)
    ).all()

    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at,
        }
        for user in users
    ]


# ---------------------------------------------------------
# CREATE USER
# ADMIN ONLY
# ---------------------------------------------------------
@router.post(
    "/create",
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    request: AdminCreateUserRequest,
    current_user: User = Depends(
        require_role(UserRole.admin)
    ),
    session: Session = Depends(get_session),
):
    existing_user = session.exec(
        select(User).where(
            User.email == request.email
        )
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        name=request.name,
        email=request.email,
        password_hash=hash_password(request.password),
        role=request.role,
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    return {
        "message": "User created successfully",
        "user_id": user.id,
        "role": user.role,
    }


# ---------------------------------------------------------
# UPDATE USER ROLE
# ADMIN ONLY
# ---------------------------------------------------------
@router.put("/{user_id}/role")
def update_user_role(
    user_id: int,
    request: UpdateUserRoleRequest,
    current_user: User = Depends(
        require_role(UserRole.admin)
    ),
    session: Session = Depends(get_session),
):
    user = session.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent an admin from accidentally removing
    # their own admin access.
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role",
        )

    user.role = request.role

    session.add(user)
    session.commit()
    session.refresh(user)

    return {
        "message": "User role updated successfully",
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }