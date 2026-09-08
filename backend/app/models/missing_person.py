from datetime import datetime
from enum import Enum

from sqlmodel import Field, SQLModel


class CaseStatus(str, Enum):
    active = "active"
    found = "found"
    closed = "closed"


class MissingPerson(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    name: str
    age: int
    gender: str
    description: str | None = None

    last_seen_location: str
    last_seen_date: datetime

    photo_path: str | None = None

    status: CaseStatus = Field(default=CaseStatus.active)

    created_at: datetime = Field(default_factory=datetime.utcnow)