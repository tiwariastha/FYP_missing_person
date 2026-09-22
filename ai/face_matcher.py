from pathlib import Path

import cv2
import numpy as np
from insightface.app import FaceAnalysis


class FaceMatcher:
    """
    Face matching using InsightFace buffalo_l.

    The matcher:
    - Detects faces
    - Selects the largest/highest-quality face
    - Generates a normalized 512-dimensional embedding
    - Compares embeddings using cosine similarity
    - Uses configurable thresholds
    - Provides bounding-box information for detected faces
    """

    # Initial thresholds.
    # These are similarity thresholds, NOT probabilities.
    MATCH_THRESHOLD = 0.50
    STRONG_MATCH_THRESHOLD = 0.60

    def __init__(self):
        self.app = FaceAnalysis(
            name="buffalo_s",
            providers=["CPUExecutionProvider"],
            allowed_modules=["detection", "recognition"],
        )

        self.app.prepare(
            ctx_id=0,
            det_size=(320, 320),
        )

    # =========================================================
    # IMAGE LOADING
    # =========================================================

    def load_image(self, image_path: str):
        """
        Safely load an image using OpenCV.
        """

        image = cv2.imread(str(image_path))

        if image is None:
            raise ValueError(
                f"Could not read image: {image_path}"
            )

        return image

    # =========================================================
    # FACE DETECTION
    # =========================================================

    def detect_faces(self, image_path: str):
        """
        Detect all faces in an image.

        Returns:
            list of detected InsightFace face objects
        """

        image = self.load_image(image_path)

        faces = self.app.get(image)

        return faces

    # =========================================================
    # FACE DATA / BOUNDING BOX
    # =========================================================

    def get_face_data(self, face):
        """
        Extract useful information from a detected face.

        Returns:
            Dictionary containing:
            - bounding box
            - width
            - height
            - detection score
        """

        if face is None:
            return None

        bbox = getattr(face, "bbox", None)

        if bbox is None:
            return None

        bbox = np.asarray(
            bbox,
            dtype=np.float32,
        ).flatten()

        if len(bbox) < 4:
            return None

        x1, y1, x2, y2 = bbox[:4]

        x1 = int(round(float(x1)))
        y1 = int(round(float(y1)))
        x2 = int(round(float(x2)))
        y2 = int(round(float(y2)))

        width = max(0, x2 - x1)
        height = max(0, y2 - y1)

        detection_score = getattr(
            face,
            "det_score",
            None,
        )

        if detection_score is not None:
            detection_score = float(
                detection_score
            )

        return {
            "bbox": {
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2,
                "width": width,
                "height": height,
            },
            "detection_score": detection_score,
        }

    # =========================================================
    # FACE QUALITY
    # =========================================================

    @staticmethod
    def calculate_face_area(face):
        """
        Calculate the bounding-box area of a detected face.
        """

        x1, y1, x2, y2 = face.bbox

        width = max(0, x2 - x1)
        height = max(0, y2 - y1)

        return width * height

    @staticmethod
    def calculate_face_quality(face):
        """
        Calculate a simple face-quality score.

        Larger detected faces are generally more useful
        for recognition than very small faces.
        """

        area = FaceMatcher.calculate_face_area(face)

        # Prevent extremely large values from dominating.
        return float(np.sqrt(max(area, 0)))

    # =========================================================
    # SELECT BEST FACE
    # =========================================================

    def select_best_face(self, faces):
        """
        Select the most useful face from an image.

        If multiple faces exist, the largest face is selected.
        This prevents accidentally using a tiny background face.
        """

        if not faces:
            return None

        return max(
            faces,
            key=self.calculate_face_quality,
        )

    # =========================================================
    # EMBEDDING
    # =========================================================

    def get_embedding(self, image_path: str):
        """
        Detect the primary face and return a normalized
        512-dimensional face embedding.

        Returns:
            numpy array or None
        """

        faces = self.detect_faces(image_path)

        if not faces:
            return None

        face = self.select_best_face(faces)

        if face is None:
            return None

        embedding = face.embedding

        if embedding is None:
            return None

        embedding = np.asarray(
            embedding,
            dtype=np.float32,
        )

        norm = np.linalg.norm(embedding)

        if norm <= 1e-10:
            return None

        # L2 normalization.
        embedding = embedding / norm

        return embedding

    # =========================================================
    # COSINE SIMILARITY
    # =========================================================

    def compare_faces(
        self,
        embedding1,
        embedding2,
    ):
        """
        Calculate cosine similarity between two normalized
        face embeddings.

        Because embeddings are normalized, the dot product
        is equivalent to cosine similarity.

        Range is approximately:
            -1 = very different
             0 = weak/no similarity
             1 = extremely similar
        """

        if embedding1 is None or embedding2 is None:
            return 0.0

        embedding1 = np.asarray(
            embedding1,
            dtype=np.float32,
        )

        embedding2 = np.asarray(
            embedding2,
            dtype=np.float32,
        )

        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)

        if norm1 <= 1e-10 or norm2 <= 1e-10:
            return 0.0

        embedding1 = embedding1 / norm1
        embedding2 = embedding2 / norm2

        similarity = float(
            np.dot(
                embedding1,
                embedding2,
            )
        )

        # Numerical safety.
        similarity = max(
            -1.0,
            min(1.0, similarity),
        )

        return similarity

    # =========================================================
    # MATCH DECISION
    # =========================================================

    def is_match(self, score: float):
        """
        Determine whether the similarity score crosses the
        initial matching threshold.
        """

        return score >= self.MATCH_THRESHOLD

    def get_match_level(self, score: float):
        """
        Convert similarity into a simple confidence category.

        These are similarity categories, NOT probabilities.
        """

        if score >= self.STRONG_MATCH_THRESHOLD:
            return "strong"

        if score >= self.MATCH_THRESHOLD:
            return "potential"

        return "no_match"

    # =========================================================
    # FIND BEST MATCH
    # =========================================================

    def find_best_match(
        self,
        query_image_path: str,
        case_images: dict,
    ):
        """
        Compare one query image against all case images.

        Returns the highest similarity result.

        IMPORTANT:
        The highest score is only the best candidate.
        It is NOT automatically an identification.
        """

        query_embedding = self.get_embedding(
            query_image_path
        )

        if query_embedding is None:
            return None

        all_matches = []

        for case_id, image_path in case_images.items():
            try:
                case_embedding = self.get_embedding(
                    image_path
                )

                if case_embedding is None:
                    continue

                score = self.compare_faces(
                    query_embedding,
                    case_embedding,
                )

                all_matches.append(
                    {
                        "case_id": case_id,
                        "score": score,
                        "image_path": image_path,
                        "is_match": self.is_match(score),
                        "match_level": self.get_match_level(
                            score
                        ),
                    }
                )

            except Exception as exc:
                print(
                    f"Could not process case "
                    f"{case_id}: {exc}"
                )

                continue

        if not all_matches:
            return None

        # Highest similarity first.
        all_matches.sort(
            key=lambda item: item["score"],
            reverse=True,
        )

        best_match = all_matches[0]

        # Return both the best candidate and all rankings.
        return {
            "best_match": best_match,
            "matches": all_matches,
        }
