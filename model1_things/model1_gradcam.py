import argparse
from pathlib import Path

import matplotlib.pyplot as plt

from model1_utils import (
    load_model,
    predict_image,
    generate_gradcam
)


BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = (
    BASE_DIR
    / "checkpoints"
    / "best_model1.pth"
)

parser = argparse.ArgumentParser(
    description="Generate Grad-CAM."
)

parser.add_argument(
    "image_path",
    type=str,
    help="Path to the input image."
)

args = parser.parse_args()

model = load_model(MODEL_PATH)

result = predict_image(
    model,
    args.image_path
)

overlay = generate_gradcam(
    model,
    args.image_path
)

plt.figure(figsize=(7, 7))
plt.imshow(overlay)
plt.title(
    f"{result['class']} ({result['confidence'] * 100:.2f}%)"
)
plt.axis("off")
plt.show()

print(f"\nPrediction : {result['class']}")
print(f"Confidence : {result['confidence'] * 100:.2f}%")