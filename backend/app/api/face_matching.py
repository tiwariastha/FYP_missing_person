import sys
from pathlib import Path
import shutil

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlmodel import Session, select


# =========================================================
# PROJECT PATH
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parents[3]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


# =========================================================
# IMPORTS
# =========================================================

from ai.face_matcher import FaceMatcher
from app.database.session import get_session
from app.models.missing_person import MissingPerson


# =========================================================
# DIRECTORIES
# =========================================================

# New / correct upload location
UPLOAD_DIR = (
    PROJECT_ROOT
    / "uploads"
    / "cases"
)

# Old location used by some previously registered cases
OLD_UPLOAD_DIR = (
    PROJECT_ROOT
    / "backend"
    / "uploads"
    / "cases"
)

# Temporary location for AI query images
TEMP_DIR = (
    PROJECT_ROOT
    / "uploads"
    / "temporary"
)

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

TEMP_DIR.mkdir(
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
    prefix="/face-matching",
    tags=["Face Matching"],
)


# =========================================================
# FACE MATCHER
# =========================================================

face_matcher = FaceMatcher()


# =========================================================
# RESOLVE CASE PHOTO
# =========================================================

def resolve_case_photo(
    photo_path: str,
) -> Path | None:
    """
    Resolve a database photo path to an actual file.

    New cases use:
        project/uploads/cases/

    Older cases may still use:
        project/backend/uploads/cases/

    This fallback prevents old registered cases from
    disappearing from face matching.
    """

    if not photo_path:
        return None

    normalized_path = str(
        photo_path
    ).replace("\\", "/").lstrip("/")

    # -----------------------------------------------------
    # 1. Absolute path
    # -----------------------------------------------------

    direct_path = Path(normalized_path)

    if (
        direct_path.is_absolute()
        and direct_path.exists()
    ):
        return direct_path

    # -----------------------------------------------------
    # 2. Normal project-relative path
    # -----------------------------------------------------

    new_path = (
        PROJECT_ROOT
        / normalized_path
    )

    if new_path.exists():
        return new_path

    # -----------------------------------------------------
    # 3. Old backend-relative location
    # -----------------------------------------------------

    old_path = (
        PROJECT_ROOT
        / "backend"
        / normalized_path
    )

    if old_path.exists():
        return old_path

    # -----------------------------------------------------
    # 4. If only filename is stored,
    #    check both folders
    # -----------------------------------------------------

    filename = Path(
        normalized_path
    ).name

    new_filename_path = (
        UPLOAD_DIR
        / filename
    )

    if new_filename_path.exists():
        return new_filename_path

    old_filename_path = (
        OLD_UPLOAD_DIR
        / filename
    )

    if old_filename_path.exists():
        return old_filename_path

    return None


# =========================================================
# MATCH ENDPOINT
# =========================================================

@router.post("/match")
def match_face(
    photo: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    """
    Compare an uploaded photograph against all registered
    missing-person case photographs.

    The response contains:
    - detected face information
    - query face bounding box
    - all ranked candidates
    - similarity scores
    - best candidate
    - match decision
    """

    # =====================================================
    # VALIDATE FILE EXTENSION
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
    # TEMPORARY QUERY IMAGE
    # =====================================================

    temporary_file = (
        TEMP_DIR
        / f"face_match_query{extension}"
    )

    try:

        # =================================================
        # SAVE UPLOADED IMAGE
        # =================================================

        with temporary_file.open(
            "wb"
        ) as buffer:
            shutil.copyfileobj(
                photo.file,
                buffer,
            )

        # =================================================
        # GET REGISTERED CASES
        # =================================================

        cases = session.exec(
            select(MissingPerson)
        ).all()

        if not cases:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "No missing-person cases "
                    "are registered"
                ),
            )

        # =================================================
        # BUILD CASE IMAGE MAP
        # =================================================

        case_images = {}
        skipped_cases = []

        for case in cases:

            if not case.photo_path:
                skipped_cases.append(
                    {
                        "case_id": case.id,
                        "reason": (
                            "No photo path stored"
                        ),
                    }
                )

                continue

            image_path = resolve_case_photo(
                case.photo_path
            )

            if image_path is not None:

                case_images[case.id] = str(
                    image_path
                )

            else:

                skipped_cases.append(
                    {
                        "case_id": case.id,
                        "reason": (
                            "Photo file not found: "
                            f"{case.photo_path}"
                        ),
                    }
                )

        if not case_images:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "No registered case photographs "
                    "are available for matching"
                ),
            )

        # =================================================
        # DETECT QUERY FACE
        # =================================================

        query_faces = face_matcher.detect_faces(
            str(temporary_file)
        )

        if not query_faces:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "No clear face could be detected "
                    "in the uploaded image"
                ),
            )

        # =================================================
        # SELECT BEST QUERY FACE
        # =================================================

        query_face = (
            face_matcher.select_best_face(
                query_faces
            )
        )

        if query_face is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "No suitable face could be "
                    "selected from the uploaded image"
                ),
            )

        # =================================================
        # QUERY FACE INFORMATION
        # =================================================

        query_face_data = (
            face_matcher.get_face_data(
                query_face
            )
        )

        query_bbox = None
        query_detection_score = None

        if query_face_data:

            query_bbox = query_face_data.get(
                "bbox"
            )

            query_detection_score = (
                query_face_data.get(
                    "detection_score"
                )
            )

        # =================================================
        # GENERATE QUERY EMBEDDING
        # =================================================

        query_embedding = (
            face_matcher.get_embedding(
                str(temporary_file)
            )
        )

        if query_embedding is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Could not generate a face "
                    "embedding from the uploaded image"
                ),
            )

        # =================================================
        # COMPARE AGAINST EVERY CASE
        # =================================================

        matches = []

        for case_id, image_path in case_images.items():

            try:

                case_embedding = (
                    face_matcher.get_embedding(
                        image_path
                    )
                )

                if case_embedding is None:
                    continue

                score = (
                    face_matcher.compare_faces(
                        query_embedding,
                        case_embedding,
                    )
                )

                matched_case = session.get(
                    MissingPerson,
                    case_id,
                )

                if matched_case is None:
                    continue

                match_level = (
                    face_matcher.get_match_level(
                        score
                    )
                )

                matches.append(
                    {
                        "case_id": matched_case.id,
                        "name": matched_case.name,
                        "age": matched_case.age,
                        "gender": matched_case.gender,
                        "description": (
                            matched_case.description
                        ),
                        "last_seen_location": (
                            matched_case.last_seen_location
                        ),
                        "last_seen_date": (
                            matched_case.last_seen_date
                        ),
                        "status": matched_case.status,
                        "photo_path": (
                            matched_case.photo_path
                        ),
                        "similarity_score": round(
                            float(score),
                            4,
                        ),
                        "match_found": (
                            score
                            >= face_matcher.MATCH_THRESHOLD
                        ),
                        "match_level": match_level,
                    }
                )

            except Exception as exc:

                print(
                    "Face matching failed "
                    f"for case {case_id}: {exc}"
                )

                continue

        # =================================================
        # NO COMPARABLE FACES
        # =================================================

        if not matches:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "No faces could be compared "
                    "with the registered cases"
                ),
            )

        # =================================================
        # SORT BY SIMILARITY
        # =================================================

        matches.sort(
            key=lambda item: item[
                "similarity_score"
            ],
            reverse=True,
        )

        # =================================================
        # BEST CANDIDATE
        # =================================================

        best_match = matches[0]

        best_score = float(
            best_match[
                "similarity_score"
            ]
        )

        # =================================================
        # MATCH DECISION
        # =================================================

        overall_match_found = (
            best_score
            >= face_matcher.MATCH_THRESHOLD
        )

        # =================================================
        # RETURN RESPONSE
        # =================================================

        response = {

            # ---------------------------------------------
            # QUERY FACE INFORMATION
            # ---------------------------------------------

            "query_face_detected": True,

            "query_face_count": len(
                query_faces
            ),

            "query_face_bbox": query_bbox,

            "query_face_detection_score": (
                query_detection_score
            ),

            # ---------------------------------------------
            # THRESHOLDS
            # ---------------------------------------------

            "threshold": (
                face_matcher.MATCH_THRESHOLD
            ),

            "strong_match_threshold": (
                face_matcher.STRONG_MATCH_THRESHOLD
            ),

            # ---------------------------------------------
            # CASE COUNTS
            # ---------------------------------------------

            "total_cases_available": len(
                case_images
            ),

            "total_cases_compared": len(
                matches
            ),

            # ---------------------------------------------
            # OVERALL RESULT
            # ---------------------------------------------

            "match_found": (
                overall_match_found
            ),

            # ---------------------------------------------
            # BEST MATCH
            # ---------------------------------------------

            "best_match": best_match,

            # ---------------------------------------------
            # ALL MATCHES
            # ---------------------------------------------

            "matches": matches,
        }

        # =================================================
        # SKIPPED CASES
        # =================================================

        if skipped_cases:
            response["skipped_cases"] = (
                skipped_cases
            )

        return response

    finally:

        # =================================================
        # DELETE TEMPORARY FILE
        # =================================================

        if temporary_file.exists():

            try:

                temporary_file.unlink()

            except Exception as exc:

                print(
                    "Could not delete temporary "
                    f"matching image: {exc}"
                )
