from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy import text

from app.database.config import DATABASE_DIR, DATABASE_URL
from app.models.user import User  # noqa: F401
from app.models.missing_person import MissingPerson  # noqa: F401
from app.models.public_report import PublicReport  # noqa: F401


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)


def init_db() -> None:
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)

    SQLModel.metadata.create_all(engine)

    # Add new columns to existing database tables if needed
    with engine.connect() as connection:

        # Check whether official_case_id already exists
        result = connection.execute(
            text("PRAGMA table_info(publicreport)")
        )

        columns = [
            row[1]
            for row in result.fetchall()
        ]

        if "official_case_id" not in columns:
            connection.execute(
                text(
                    "ALTER TABLE publicreport "
                    "ADD COLUMN official_case_id INTEGER"
                )
            )
            connection.commit()

        # Temporary: promote the initial demo account to admin
        result = connection.execute(
            text(
                "UPDATE user "
                "SET role = 'admin' "
                "WHERE email = 'admin@example.com'"
            )
        )
        connection.commit()


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session