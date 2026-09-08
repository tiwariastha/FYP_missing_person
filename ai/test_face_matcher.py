from pathlib import Path

from face_matcher import FaceMatcher


print("Loading FaceMatcher...")
matcher = FaceMatcher()

cases_dir = Path("../uploads/cases")

case_images = {}

for image_path in cases_dir.iterdir():
    if image_path.suffix.lower() in {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    }:
        case_images[image_path.stem] = str(image_path)


query_image = cases_dir / "Panali.jpg"

print("\nTesting face matching...")
print(f"Query image: {query_image.name}")

best_match = matcher.find_best_match(
    str(query_image),
    case_images,
)

if best_match is None:
    print("NO FACE DETECTED OR NO MATCH FOUND")
else:
    print("\nRESULT")
    print("-" * 40)
    print(f"Best match: {best_match['case_id']}")
    print(f"Similarity score: {best_match['score']:.4f}")
    print(f"Threshold: {matcher.MATCH_THRESHOLD:.2f}")

    if best_match["is_match"]:
        print("Decision: MATCH FOUND")
    else:
        print("Decision: NO MATCH")
