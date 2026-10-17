"""
ScanSaarthi — Model 1 Service (MRI vs Non-MRI)

Architecture: ResNet-18, 2 classes ["MRI_DATA", "NON_MRI_DATA"]
Preprocessing: RGB, Resize(224), ToTensor, ImageNet normalization
Checkpoint: state_dict (or dict with "model_state_dict" key)
"""

import logging
from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms

logger = logging.getLogger(__name__)

IMAGE_SIZE = 224
CLASS_NAMES = ["MRI_DATA", "NON_MRI_DATA"]

# Exact preprocessing from model1_things/model1_utils.py
_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


def _create_model() -> nn.Module:
    """Build a ResNet-18 with the correct FC head for 2 classes."""
    model = models.resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, len(CLASS_NAMES))
    return model


def load_model(model_path: str, device: torch.device) -> nn.Module:
    """Load Model 1 checkpoint and return the model in eval mode."""
    path = Path(model_path)
    if not path.exists():
        raise FileNotFoundError(f"Model 1 checkpoint not found: {path}")

    model = _create_model()

    checkpoint = torch.load(str(path), map_location=device, weights_only=False)

    # The checkpoint may be a raw state_dict or a dict with "model_state_dict"
    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        model.load_state_dict(checkpoint["model_state_dict"])
    else:
        model.load_state_dict(checkpoint)

    model.to(device)
    model.eval()
    logger.info("Model 1 loaded from %s on %s", path.name, device)
    return model


def predict(model: nn.Module, image: Image.Image, device: torch.device) -> dict:
    """
    Run MRI validation on a PIL Image.

    Returns:
        {
            "is_mri": bool,
            "prediction": "MRI_DATA" or "NON_MRI_DATA",
            "confidence": float,
            "probabilities": {"MRI_DATA": float, "NON_MRI_DATA": float},
        }
    """
    image_rgb = image.convert("RGB")
    tensor = _transform(image_rgb).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(tensor)
        probabilities = torch.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, dim=1)

    pred_index = predicted.item()
    probs = probabilities.squeeze().cpu().numpy()

    return {
        "is_mri": pred_index == 0,  # index 0 = MRI_DATA
        "prediction": CLASS_NAMES[pred_index],
        "confidence": confidence.item(),
        "probabilities": {
            CLASS_NAMES[i]: float(probs[i]) for i in range(len(CLASS_NAMES))
        },
    }
