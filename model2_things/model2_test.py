from pathlib import Path

from model2_utils import (
    load_model,
    preprocess_image,
    predict_image,
)


BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "checkpoints" / "best_model2.pth"
IMAGE_PATH = BASE_DIR / "sample_images2" / "Screenshot 2026-07-23 031851.png"


model = load_model(MODEL_PATH)

image_tensor = preprocess_image(IMAGE_PATH)

prediction, confidence, probabilities = predict_image(
    model,
    image_tensor
)

print(f"Prediction : {prediction}")
print(f"Confidence : {confidence:.2%}")

print("\nClass Probabilities:")

for class_name, probability in zip(
    [
        "Mild Demented",
        "Non Demented",
        "Very Mild Demented",
    ],
    probabilities,
):
    print(f"{class_name:<22}: {probability:.2%}")