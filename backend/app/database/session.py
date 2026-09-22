from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy import text

from app.database.config import DATABASE_DIR, DATABASE_URL
from app.models.user import User  # noqa: F401
from app.models.missing_person import MissingPerson  # noqa: F401
from app.models.public_report import PublicReport  # noqa: F401
from app.core.security import hash_password


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

        # Ensure demo admin account exists
        result = connection.execute(
            text(
                "SELECT id FROM user "
                "WHERE email = 'admin@example.com'"
            )
        )

        existing_admin = result.fetchone()

        if existing_admin is None:
            password_hash = hash_password("Admin@123")

            connection.execute(
                text(
                    "INSERT INTO user "
                    "(name, email, password_hash, role, created_at) "
                    "VALUES (:name, :email, :password_hash, :role, :created_at)"
                ),
                {
                    "name": "Admin",
                    "email": "admin@example.com",
                    "password_hash": password_hash,
                    "role": "admin",
                    "created_at": __import__("datetime").datetime.utcnow(),
                },
            )
            connection.commit()

        else:
            connection.execute(
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
