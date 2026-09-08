from datetime import datetime
from pathlib import Path
import shutil

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    UploadFile,
    HTTPException,
    status,
)
from sqlmodel import Session, select

from app.core.auth import require_role
from app.database.session import get_session
from app.models.public_report import PublicReport, ReportStatus
from app.models.user import User, UserRole
from app.models.missing_person import MissingPerson, CaseStatus


router = APIRouter(
    prefix="/public-reports",
    tags=["Public Reports"],
)


# ---------------------------------------------------------
# UPLOAD DIRECTORIES
# ---------------------------------------------------------

TEMPORARY_DIR = Path("uploads/temporary")
CASES_DIR = Path("uploads/cases")

TEMPORARY_DIR.mkdir(parents=True, exist_ok=True)
CASES_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}


# ---------------------------------------------------------
# CREATE PUBLIC REPORT
# PUBLIC USER
# ---------------------------------------------------------

@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
)
def create_public_report(
    missing_person_name: str = Form(...),
    age: int = Form(...),
    gender: str = Form(...),
    description: str | None = Form(None),
    last_seen_location: str = Form(...),
    last_seen_date: datetime = Form(...),
    photo: UploadFile = File(...),
    current_user: User = Depends(
        require_role(UserRole.public)
    ),
    session: Session = Depends(get_session),
):
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

    # Create database record first
    # This gives us the report ID
    report = PublicReport(
        reporter_name=current_user.name,
        reporter_email=current_user.email,
        missing_person_name=missing_person_name,
        age=age,
        gender=gender,
        description=description,
        last_seen_location=last_seen_location,
        last_seen_date=last_seen_date,
        status=ReportStatus.pending,
    )

    session.add(report)
    session.commit()
    session.refresh(report)

    # Automatically save uploaded photo
    filename = f"report_{report.id}{extension}"
    file_path = TEMPORARY_DIR / filename

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(
            photo.file,
            buffer,
        )

    # Store relative path in database
    report.photo_path = str(file_path).replace("\\", "/")

    session.add(report)
    session.commit()
    session.refresh(report)

    return {
        "message": (
            "Missing person report submitted "
            "successfully"
        ),
        "report_id": report.id,
        "status": report.status,
        "photo_path": report.photo_path,
    }


# ---------------------------------------------------------
# GET ALL PUBLIC REPORTS
# ADMIN + INVESTIGATOR
# ---------------------------------------------------------

@router.get("/")
def get_public_reports(
    current_user: User = Depends(
        require_role(
            UserRole.admin,
            UserRole.investigator,
        )
    ),
    session: Session = Depends(get_session),
):
    reports = session.exec(
        select(PublicReport)
    ).all()

    return reports


# ---------------------------------------------------------
# GET MY REPORTS
# PUBLIC USER
# ---------------------------------------------------------

@router.get("/my-reports")
def get_my_reports(
    current_user: User = Depends(
        require_role(UserRole.public)
    ),
    session: Session = Depends(get_session),
):
    reports = session.exec(
        select(PublicReport)
        .where(
            PublicReport.reporter_email
            == current_user.email
        )
        .order_by(
            PublicReport.created_at.desc()
        )
    ).all()

    return reports


# ---------------------------------------------------------
# GET MY REPORT STATISTICS
# PUBLIC USER
# ---------------------------------------------------------

@router.get("/my-stats")
def get_my_report_stats(
    current_user: User = Depends(
        require_role(UserRole.public)
    ),
    session: Session = Depends(get_session),
):
    reports = session.exec(
        select(PublicReport)
        .where(
            PublicReport.reporter_email
            == current_user.email
        )
    ).all()

    total = len(reports)

    pending = sum(
        1
        for report in reports
        if report.status == ReportStatus.pending
    )

    approved = sum(
        1
        for report in reports
        if report.status == ReportStatus.approved
    )

    rejected = sum(
        1
        for report in reports
        if report.status == ReportStatus.rejected
    )

    return {
        "total_reports": total,
        "pending_reports": pending,
        "approved_reports": approved,
        "rejected_reports": rejected,
    }


# ---------------------------------------------------------
# APPROVE PUBLIC REPORT
# ADMIN + INVESTIGATOR
# ---------------------------------------------------------

@router.put("/{report_id}/approve")
def approve_public_report(
    report_id: int,
    current_user: User = Depends(
        require_role(
            UserRole.admin,
            UserRole.investigator,
        )
    ),
    session: Session = Depends(get_session),
):
    report = session.get(
        PublicReport,
        report_id,
    )

    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public report not found",
        )

    if report.status != ReportStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending reports can be approved",
        )

    # -----------------------------------------------------
    # Create official missing person case
    # -----------------------------------------------------

    missing_person = MissingPerson(
        name=report.missing_person_name,
        age=report.age,
        gender=report.gender,
        description=report.description,
        last_seen_location=report.last_seen_location,
        last_seen_date=report.last_seen_date,
        status=CaseStatus.active,
    )

    session.add(missing_person)
    session.commit()
    session.refresh(missing_person)

    # -----------------------------------------------------
    # Move photo from temporary -> cases
    # -----------------------------------------------------

    official_photo_path = None

    if report.photo_path:
        old_photo_path = Path(report.photo_path)

        if old_photo_path.exists():
            extension = old_photo_path.suffix.lower()

            new_filename = (
                f"case_{missing_person.id}{extension}"
            )

            new_photo_path = CASES_DIR / new_filename

            shutil.move(
                str(old_photo_path),
                str(new_photo_path),
            )

            official_photo_path = str(
                new_photo_path
            ).replace("\\", "/")

    # Store official case photo path
    missing_person.photo_path = official_photo_path

    session.add(missing_person)

    # -----------------------------------------------------
    # Mark report as approved
    # -----------------------------------------------------

    report.status = ReportStatus.approved
    report.official_case_id = missing_person.id

    session.add(report)
    session.commit()
    session.refresh(report)

    return {
        "message": (
            "Public report approved and "
            "official missing person case "
            "created successfully"
        ),
        "report_id": report.id,
        "case_id": missing_person.id,
        "status": report.status,
        "photo_path": missing_person.photo_path,
    }


# ---------------------------------------------------------
# REJECT PUBLIC REPORT
# ADMIN + INVESTIGATOR
# ---------------------------------------------------------

@router.put("/{report_id}/reject")
def reject_public_report(
    report_id: int,
    current_user: User = Depends(
        require_role(
            UserRole.admin,
            UserRole.investigator,
        )
    ),
    session: Session = Depends(get_session),
):
    report = session.get(
        PublicReport,
        report_id,
    )

    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public report not found",
        )

    if report.status != ReportStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending reports can be rejected",
        )

    report.status = ReportStatus.rejected

    session.add(report)
    session.commit()
    session.refresh(report)

    return {
        "message": "Public report rejected successfully",
        "report_id": report.id,
        "status": report.status,
    }