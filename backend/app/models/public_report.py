from datetime import datetime

from sqlmodel import Field, SQLModel


class ReportStatus:
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class PublicReport(SQLModel, table=True):
    id: int | None = Field(
        default=None,
        primary_key=True
    )

    reporter_name: str
    reporter_email: str

    missing_person_name: str
    age: int
    gender: str

    description: str | None = None

    last_seen_location: str
    last_seen_date: datetime

    photo_path: str | None = None

    status: str = Field(
        default=ReportStatus.pending
    )

    # Official missing-person case created after approval
    official_case_id: int | None = Field(
        default=None
    )

    created_at: datetime = Field(
        default_factory=datetime.utcnow
    )