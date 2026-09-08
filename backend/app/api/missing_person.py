from datetime import datetime
from pathlib import Path
import shutil

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.auth import require_role
from app.database.session import get_session
from app.models.missing_person import MissingPerson, CaseStatus
from app.models.user import User, UserRole


# =========================================================
# PROJECT PATHS
# =========================================================

# File location:
# project/backend/app/api/missing_person.py
#
# parents[3] = project root
PROJECT_ROOT = Path(__file__).resolve().parents[3]

# All missing-person photos are stored here.
UPLOAD_DIR = PROJECT_ROOT / "uploads" / "cases"

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# =========================================================
# ALLOWED IMAGE TYPES
# =========================================================

ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/missing-persons",
    tags=["Missing Persons"],
)


# =========================================================
# STATUS UPDATE SCHEMA
# =========================================================

class CaseStatusUpdate(BaseModel):
    status: CaseStatus


# =========================================================
# CREATE MISSING PERSON CASE
# ADMIN + INVESTIGATOR
# =========================================================

@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
)
def create_missing_person(
    name: str = Form(...),
    age: int = Form(...),
    gender: str = Form(...),
    description: str | None = Form(None),
    last_seen_location: str = Form(...),
    last_seen_date: datetime = Form(...),
    photo: UploadFile = File(...),
    current_user: User = Depends(
        require_role(
            UserRole.admin,
            UserRole.investigator,
        )
    ),
    session: Session = Depends(get_session),
):
    # =====================================================
    # VALIDATE IMAGE EXTENSION
    # =====================================================

    extension = Path(
        photo.filename or ""
    ).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Only JPG, JPEG, PNG, and WEBP "
                "images are allowed"
            ),
        )

    # =====================================================
    # CREATE DATABASE CASE FIRST
    # =====================================================

    missing_person = MissingPerson(
        name=name,
        age=age,
        gender=gender,
        description=description,
        last_seen_location=last_seen_location,
        last_seen_date=last_seen_date,
        status=CaseStatus.active,
    )

    session.add(missing_person)
    session.commit()
    session.refresh(missing_person)

    # =====================================================
    # SAVE PHOTO TO SINGLE CENTRAL LOCATION
    # =====================================================

    filename = (
        f"case_{missing_person.id}{extension}"
    )

    file_path = UPLOAD_DIR / filename

    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(
                photo.file,
                buffer,
            )

    except Exception as exc:
        # If image saving fails, remove the database case
        # so we don't keep a case without its photograph.
        session.delete(missing_person)
        session.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save case photograph: {exc}",
        )

    # =====================================================
    # STORE PROJECT-RELATIVE PATH IN DATABASE
    # =====================================================

    missing_person.photo_path = str(
        file_path.relative_to(PROJECT_ROOT)
    ).replace("\\", "/")

    session.add(missing_person)
    session.commit()
    session.refresh(missing_person)

    return {
        "message": "Missing person case created successfully",
        "case_id": missing_person.id,
        "photo_path": missing_person.photo_path,
    }


# =========================================================
# GET ALL MISSING PERSONS
# ADMIN + INVESTIGATOR
# =========================================================

@router.get("/")
def get_missing_persons(
    current_user: User = Depends(
        require_role(
            UserRole.admin,
            UserRole.investigator,
        )
    ),
    session: Session = Depends(get_session),
):
    cases = session.exec(
        select(MissingPerson)
    ).all()

    return cases


# =========================================================
# UPDATE CASE STATUS
# ADMIN + INVESTIGATOR
# =========================================================

@router.put("/{case_id}/status")
def update_missing_person_status(
    case_id: int,
    status_update: CaseStatusUpdate,
    current_user: User = Depends(
        require_role(
            UserRole.admin,
            UserRole.investigator,
        )
    ),
    session: Session = Depends(get_session),
):
    case = session.get(
        MissingPerson,
        case_id,
    )

    if case is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Missing person case not found",
        )

    case.status = status_update.status

    session.add(case)
    session.commit()
    session.refresh(case)

    return {
        "message": "Case status updated successfully",
        "case_id": case.id,
        "status": case.status,
    }
