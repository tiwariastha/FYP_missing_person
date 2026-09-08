from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.core.auth import require_role
from app.database.session import get_session
from app.models.user import User, UserRole
from app.models.missing_person import MissingPerson, CaseStatus
from app.models.public_report import PublicReport, ReportStatus


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


# =========================================================
# PUBLIC DASHBOARD
# =========================================================

@router.get("/public")
def public_dashboard(
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

    total_reports = len(reports)

    pending_reports = sum(
        1
        for report in reports
        if report.status == ReportStatus.pending
    )

    approved_reports = sum(
        1
        for report in reports
        if report.status == ReportStatus.approved
    )

    rejected_reports = sum(
        1
        for report in reports
        if report.status == ReportStatus.rejected
    )

    recent_reports = sorted(
        reports,
        key=lambda report: report.created_at,
        reverse=True,
    )[:5]

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
        },
        "statistics": {
            "total_reports": total_reports,
            "pending_reports": pending_reports,
            "approved_reports": approved_reports,
            "rejected_reports": rejected_reports,
        },
        "recent_reports": recent_reports,
    }


# =========================================================
# INVESTIGATOR DASHBOARD
# =========================================================

@router.get("/investigator")
def investigator_dashboard(
    current_user: User = Depends(
        require_role(UserRole.investigator)
    ),
    session: Session = Depends(get_session),
):
    cases = session.exec(
        select(MissingPerson)
    ).all()

    reports = session.exec(
        select(PublicReport)
    ).all()

    total_cases = len(cases)

    active_cases = sum(
        1
        for case in cases
        if case.status == CaseStatus.active
    )

    found_cases = sum(
        1
        for case in cases
        if case.status == CaseStatus.found
    )

    closed_cases = sum(
        1
        for case in cases
        if case.status == CaseStatus.closed
    )

    total_reports = len(reports)

    pending_reports = sum(
        1
        for report in reports
        if report.status == ReportStatus.pending
    )

    approved_reports = sum(
        1
        for report in reports
        if report.status == ReportStatus.approved
    )

    rejected_reports = sum(
        1
        for report in reports
        if report.status == ReportStatus.rejected
    )

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
        },
        "case_statistics": {
            "total_cases": total_cases,
            "active_cases": active_cases,
            "found_cases": found_cases,
            "closed_cases": closed_cases,
        },
        "report_statistics": {
            "total_reports": total_reports,
            "pending_reports": pending_reports,
            "approved_reports": approved_reports,
            "rejected_reports": rejected_reports,
        },
    }


# =========================================================
# ADMIN DASHBOARD
# =========================================================

@router.get("/admin")
def admin_dashboard(
    current_user: User = Depends(
        require_role(UserRole.admin)
    ),
    session: Session = Depends(get_session),
):
    cases = session.exec(
        select(MissingPerson)
    ).all()

    reports = session.exec(
        select(PublicReport)
    ).all()

    users = session.exec(
        select(User)
    ).all()

    # -----------------------------------------------------
    # CASE STATISTICS
    # -----------------------------------------------------

    total_cases = len(cases)

    active_cases = sum(
        1
        for case in cases
        if case.status == CaseStatus.active
    )

    found_cases = sum(
        1
        for case in cases
        if case.status == CaseStatus.found
    )

    closed_cases = sum(
        1
        for case in cases
        if case.status == CaseStatus.closed
    )

    # -----------------------------------------------------
    # PUBLIC REPORT STATISTICS
    # -----------------------------------------------------

    total_reports = len(reports)

    pending_reports = sum(
        1
        for report in reports
        if report.status == ReportStatus.pending
    )

    approved_reports = sum(
        1
        for report in reports
        if report.status == ReportStatus.approved
    )

    rejected_reports = sum(
        1
        for report in reports
        if report.status == ReportStatus.rejected
    )

    # -----------------------------------------------------
    # USER STATISTICS
    # -----------------------------------------------------

    total_users = len(users)

    admin_users = sum(
        1
        for user in users
        if user.role == UserRole.admin
    )

    investigator_users = sum(
        1
        for user in users
        if user.role == UserRole.investigator
    )

    public_users = sum(
        1
        for user in users
        if user.role == UserRole.public
    )

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
        },
        "case_statistics": {
            "total_cases": total_cases,
            "active_cases": active_cases,
            "found_cases": found_cases,
            "closed_cases": closed_cases,
        },
        "report_statistics": {
            "total_reports": total_reports,
            "pending_reports": pending_reports,
            "approved_reports": approved_reports,
            "rejected_reports": rejected_reports,
        },
        "user_statistics": {
            "total_users": total_users,
            "admin_users": admin_users,
            "investigator_users": investigator_users,
            "public_users": public_users,
        },
    }