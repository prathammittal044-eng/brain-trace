import torch
import torch.nn as nn

import numpy as np

from PIL import Image

from torchvision import models, transforms

from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget


IMAGE_SIZE = 224

CLASS_NAMES = [
    "MRI_DATA",
    "NON_MRI_DATA"
]

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)


transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


def create_model():

    model = models.resnet18(weights=None)

    model.fc = nn.Linear(
        model.fc.in_features,
        len(CLASS_NAMES)
    )

    return model


def load_model(model_path):

    model = create_model()

    checkpoint = torch.load(
        model_path,
        map_location=DEVICE
    )

    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        model.load_state_dict(
            checkpoint["model_state_dict"]
        )
    else:
        model.load_state_dict(checkpoint)

    model.to(DEVICE)
    model.eval()

    return model


def preprocess_image(image_path):

    image = Image.open(image_path).convert("RGB")

    tensor = transform(image).unsqueeze(0)

    return image, tensor.to(DEVICE)


def predict_image(model, image_path):

    _, tensor = preprocess_image(image_path)

    with torch.no_grad():

        outputs = model(tensor)

        probabilities = torch.softmax(
            outputs,
            dim=1
        )

        confidence, prediction = torch.max(
            probabilities,
            dim=1
        )

    return {
        "class": CLASS_NAMES[prediction.item()],
        "confidence": confidence.item(),
        "class_index": prediction.item(),
        "probabilities": probabilities.squeeze().cpu().numpy()
    }


def generate_gradcam(model, image_path):

    original_image, input_tensor = preprocess_image(
        image_path
    )

    cam = GradCAM(
        model=model,
        target_layers=[model.layer4[-1]]
    )

    prediction = predict_image(
        model,
        image_path
    )

    grayscale_cam = cam(
        input_tensor=input_tensor,
        targets=[
            ClassifierOutputTarget(
                prediction["class_index"]
            )
        ]
    )[0]

    display_image = np.array(
        original_image.resize(
            (IMAGE_SIZE, IMAGE_SIZE)
        )
    ).astype(np.float32) / 255.0

    overlay = show_cam_on_image(
        display_image,
        grayscale_cam,
        use_rgb=True
    )

    return overlay