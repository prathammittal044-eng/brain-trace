from pathlib import Path
import torch
import cv2
import matplotlib.pyplot as plt
import numpy as np

from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget

from model2_utils import ( load_model, preprocess_image)


BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "checkpoints" / "best_model2.pth"
IMAGE_PATH = BASE_DIR / "sample_images2" / "Screenshot 2026-03-05 185524.png"
OUTPUT_PATH = BASE_DIR / "outputs" / "gradcam_result.jpg"


model = load_model(MODEL_PATH)

image_tensor = preprocess_image(IMAGE_PATH)

original_image = cv2.imread(str(IMAGE_PATH))
original_image = cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB)
original_image = cv2.resize(original_image, (224, 224))

rgb_image = original_image.astype(np.float32) / 255.0


with torch.no_grad():

    outputs = model(image_tensor)

predicted_class = outputs.argmax(dim=1).item()


target_layers = [
    model.layer4[-1]
]

cam = GradCAM(
    model=model,
    target_layers=target_layers
)

grayscale_cam = cam(
    input_tensor=image_tensor,
    targets=[ClassifierOutputTarget(predicted_class)]
)[0]

visualization = show_cam_on_image(
    rgb_image,
    grayscale_cam,
    use_rgb=True
)

cv2.imwrite(
    str(OUTPUT_PATH),
    cv2.cvtColor(visualization, cv2.COLOR_RGB2BGR)
)

plt.imshow(visualization)
plt.axis("off")
plt.show()

print(f"Grad-CAM saved to: {OUTPUT_PATH}")