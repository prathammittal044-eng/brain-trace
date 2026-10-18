from pathlib import Path
import torch
from model2_utils import load_model, preprocess_image

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "checkpoints" / "best_model2.pth"
TEST_DIR = BASE_DIR / "model2_data" / "test"

model = load_model(MODEL_PATH)
model.eval()

classes = [
    "Mild Demented",
    "Non Demented",
    "Very Mild Demented"
]

correct = 0
total = 0
wrong = []

for class_name in classes:

    class_folder = TEST_DIR / class_name

    for img_path in class_folder.iterdir():

        if img_path.suffix.lower() not in [".jpg", ".jpeg", ".png"]:
            continue

        image_tensor = preprocess_image(img_path)

        with torch.no_grad():
            outputs = model(image_tensor)
            probs = torch.softmax(outputs, dim=1)[0]

        pred_idx = probs.argmax().item()
        pred_class = classes[pred_idx]

        total += 1

        if pred_class == class_name:
            correct += 1
        else:
            wrong.append({
                "Image": img_path.name,
                "Actual": class_name,
                "Predicted": pred_class,
                "Confidence": probs[pred_idx].item() * 100
            })

print("=" * 60)
print(f"Accuracy : {correct}/{total} = {100*correct/total:.2f}%")
print("=" * 60)

if wrong:
    print("\nMisclassified Images:\n")
    for w in wrong:
        print(
            f"{w['Image']} | "
            f"Actual: {w['Actual']} | "
            f"Predicted: {w['Predicted']} | "
            f"{w['Confidence']:.2f}%"
        )
else:
    print("No misclassifications 🎉")