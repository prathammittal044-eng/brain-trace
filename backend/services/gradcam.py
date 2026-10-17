"""
ScanSaarthi — Grad-CAM Service for Model 2

Generates Grad-CAM heatmap overlays using the Model 2 (ResNet-18) architecture.
Target layer: model.layer4[-1] (from model2_things/model2_gradcam.py)
Uses pytorch-grad-cam library.
"""

import logging
from pathlib import Path

import cv2
import numpy as np
import torch
from PIL import Image
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget

from services import model2 as model2_service

logger = logging.getLogger(__name__)

IMAGE_SIZE = 224


def generate(
    model: torch.nn.Module,
    image: Image.Image,
    predicted_class_index: int,
    device: torch.device,
    output_path: Path,
) -> bool:
    """
    Generate a Grad-CAM overlay image and save it to output_path.

    Args:
        model: The loaded Model 2 in eval mode.
        image: Original PIL Image (any size).
        predicted_class_index: The class index from Model 2 prediction.
        device: torch device.
        output_path: Where to save the overlay JPEG.

    Returns:
        True if successful, False otherwise.
    """
    try:
        # Preprocess image for Model 2 (same transform used for inference)
        input_tensor = model2_service.preprocess(image, device)

        # Prepare the original image as a 224x224 float32 RGB array for overlay
        image_rgb = image.convert("RGB").resize((IMAGE_SIZE, IMAGE_SIZE))
        rgb_array = np.array(image_rgb).astype(np.float32) / 255.0

        # Target layer: model.layer4[-1] (from existing model2_gradcam.py)
        target_layers = [model.layer4[-1]]

        cam = GradCAM(model=model, target_layers=target_layers)
        grayscale_cam = cam(
            input_tensor=input_tensor,
            targets=[ClassifierOutputTarget(predicted_class_index)],
        )[0]

        # Create the overlay
        visualization = show_cam_on_image(
            rgb_array, grayscale_cam, use_rgb=True
        )

        # Save as JPEG (convert RGB → BGR for OpenCV)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(
            str(output_path),
            cv2.cvtColor(visualization, cv2.COLOR_RGB2BGR),
        )

        logger.info("Grad-CAM saved to %s", output_path)
        return True

    except Exception:
        logger.exception("Grad-CAM generation failed")
        return False
