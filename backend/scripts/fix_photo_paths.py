from pathlib import Path
import sys

from sqlmodel import Session, select


PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


from app.database.session import engine
from app.models.missing_person import MissingPerson


# Project root:
# C:\Projects\FYP_missing_person
PROJECT_ROOT = Path(__file__).resolve().parents[2]

CASES_DIR = PROJECT_ROOT / "uploads" / "cases"


# ---------------------------------------------------------
# SAFE PHOTO MAPPINGS
# ---------------------------------------------------------
# These mappings are based on the existing case names
# and the actual photos present in uploads/cases/.
#
# IMPORTANT:
# We only update cases where the mapping is known.
# Nothing is deleted.
# ---------------------------------------------------------

PHOTO_MAPPINGS = {
    "Rahul Sharma": "Rahul_Sharma.jpg",
    "Laara Malhotra": "Laara_test.jpg",
    "Sonu Bhide": "Sonu_test.jpg",
    "Pranali Rathod": "Panali.jpg",
    "Suresh Mehta": "Suresh.jpg",
}


def main():
    print("=" * 60)
    print("FIXING MISSING PERSON PHOTO PATHS")
    print("=" * 60)

    print(f"\nProject root: {PROJECT_ROOT}")
    print(f"Cases directory: {CASES_DIR}")

    if not CASES_DIR.exists():
        print("\nERROR: uploads/cases directory does not exist.")
        return

    print("\nAvailable photos:")
    for photo in sorted(CASES_DIR.iterdir()):
        if photo.is_file():
            print(f"  - {photo.name}")

    print("\n" + "=" * 60)
    print("UPDATING DATABASE")
    print("=" * 60)

    with Session(engine) as session:
        cases = session.exec(
            select(MissingPerson)
        ).all()

        if not cases:
            print("\nNo missing-person cases found.")
            return

        updated_count = 0
        skipped_count = 0

        for case in cases:
            filename = PHOTO_MAPPINGS.get(case.name)

            if filename is None:
                print(
                    f"\nSKIPPED Case #{case.id} - "
                    f"{case.name}"
                )
                print(
                    "  Reason: No safe photo mapping defined."
                )
                skipped_count += 1
                continue

            photo_file = CASES_DIR / filename

            if not photo_file.exists():
                print(
                    f"\nSKIPPED Case #{case.id} - "
                    f"{case.name}"
                )
                print(
                    f"  Reason: Photo not found: {filename}"
                )
                skipped_count += 1
                continue

            new_path = (
                Path("uploads")
                / "cases"
                / filename
            ).as_posix()

            old_path = case.photo_path

            case.photo_path = new_path

            session.add(case)

            print(
                f"\nUPDATED Case #{case.id} - "
                f"{case.name}"
            )
            print(f"  Old path: {old_path}")
            print(f"  New path: {new_path}")

            updated_count += 1

        session.commit()

        print("\n" + "=" * 60)
        print("VERIFICATION")
        print("=" * 60)

        refreshed_cases = session.exec(
            select(MissingPerson)
        ).all()

        for case in refreshed_cases:
            if case.photo_path:
                photo_path = (
                    PROJECT_ROOT / case.photo_path
                )

                exists = photo_path.exists()

                print(
                    f"\nCase #{case.id}: {case.name}"
                )
                print(
                    f"  Photo path: {case.photo_path}"
                )
                print(
                    f"  File exists: {'YES' if exists else 'NO'}"
                )
            else:
                print(
                    f"\nCase #{case.id}: {case.name}"
                )
                print("  Photo path: NONE")

        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print(f"Updated: {updated_count}")
        print(f"Skipped: {skipped_count}")
        print("\nDone.")


if __name__ == "__main__":
    main()