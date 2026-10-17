"""
ScanSaarthi — Model 2 Service (Dementia Classification)

Architecture: ResNet-18, 3 classes ["Mild Demented", "Non Demented", "Very Mild Demented"]
Preprocessing: RGB, Resize(224), ToTensor, ImageNet normalization
Checkpoint: raw state_dict
"""

import logging
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
from torchvision import models, transforms

logger = logging.getLogger(__name__)

IMAGE_SIZE = 224
CLASS_NAMES = ["Mild Demented", "Non Demented", "Very Mild Demented"]

# Exact preprocessing from model2_things/model2_utils.py
_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


def _create_model() -> nn.Module:
    """Build a ResNet-18 with the correct FC head for 3 classes."""
    model = models.resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, len(CLASS_NAMES))
    return model


def load_model(model_path: str, device: torch.device) -> nn.Module:
    """Load Model 2 checkpoint and return the model in eval mode."""
    path = Path(model_path)
    if not path.exists():
        raise FileNotFoundError(f"Model 2 checkpoint not found: {path}")

    model = _create_model()
    model.load_state_dict(
        torch.load(str(path), map_location=device, weights_only=False)
    )
    model.to(device)
    model.eval()
    logger.info("Model 2 loaded from %s on %s", path.name, device)
    return model


def preprocess(image: Image.Image, device: torch.device) -> torch.Tensor:
    """Preprocess a PIL Image into the tensor Model 2 expects."""
    image_rgb = image.convert("RGB")
    return _transform(image_rgb).unsqueeze(0).to(device)


def predict(model: nn.Module, image: Image.Image, device: torch.device) -> dict:
    """
    Run dementia classification on a PIL Image.

    Returns:
        {
            "prediction": str,
            "confidence": float,
            "class_index": int,
            "probabilities": {"Mild Demented": float, ...},
        }
    """
    tensor = preprocess(image, device)

    with torch.no_grad():
        outputs = model(tensor)
        probabilities = F.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, dim=1)

    pred_index = predicted.item()
    probs = probabilities.squeeze().cpu().numpy()

    return {
        "prediction": CLASS_NAMES[pred_index],
        "confidence": confidence.item(),
        "class_index": pred_index,
        "probabilities": {
            CLASS_NAMES[i]: float(probs[i]) for i in range(len(CLASS_NAMES))
        },
    }
