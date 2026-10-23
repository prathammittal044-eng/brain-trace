"""
Brain-Trace — Model 2 Service (Dementia Stage Classifier)

Architecture : ResNet-18, 3 classes  ["Mild Demented", "Non Demented", "Very Mild Demented"]
Preprocessing: RGB, Resize(224), ToTensor, ImageNet normalisation
Checkpoint   : raw state_dict

Loading priority:
  1. Hugging Face Hub  (hf_repo / hf_filename)  — downloaded & cached locally
  2. Local path        (local_path)              — used as fallback

Only called when Model 1 has already validated the image as a brain MRI.
"""

import logging
from pathlib import Path
from typing import Optional

import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
from torchvision import models, transforms

logger = logging.getLogger(__name__)

IMAGE_SIZE  = 224
CLASS_NAMES = ["Mild Demented", "Non Demented", "Very Mild Demented"]

# Preprocessing identical to model2_things/model2_utils.py
_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _build_model() -> nn.Module:
    """ResNet-18 with a 3-class FC head (no pretrained weights)."""
    m = models.resnet18(weights=None)
    m.fc = nn.Linear(m.fc.in_features, len(CLASS_NAMES))
    return m


def _load_state(model: nn.Module, checkpoint_path: str, device: torch.device) -> None:
    """Load a raw state_dict .pth into *model* in-place."""
    raw = torch.load(checkpoint_path, map_location=device, weights_only=False)
    # Accept both raw state_dict and {"model_state_dict": ...} formats for safety
    state = raw.get("model_state_dict", raw) if isinstance(raw, dict) else raw
    model.load_state_dict(state)
    del raw
    del state
    import gc
    gc.collect()


def _download_from_hub(repo_id: str, filename: str, token: Optional[str]) -> str:
    """
    Pull *filename* from a Hugging Face Hub repo and return the local cached path.
    Raises ImportError if huggingface_hub is not installed.
    """
    from huggingface_hub import hf_hub_download  # lazy import
    logger.info("Downloading Model 2 from HF Hub: %s / %s", repo_id, filename)
    cached = hf_hub_download(repo_id=repo_id, filename=filename, token=token)
    logger.info("Model 2 checkpoint cached at: %s", cached)
    return cached


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def load_model(
    hf_repo: str,
    hf_filename: str,
    local_path: str,
    device: torch.device,
    hf_token: Optional[str] = None,
) -> nn.Module:
    """
    Load Model 2 and return it in eval mode.

    Loading order
    -------------
    1. Hugging Face Hub  (when hf_repo is non-empty)
    2. Local checkpoint  (local_path — used if HF download fails or hf_repo is empty)

    Parameters
    ----------
    hf_repo     : HF repo ID, e.g. "epsrbtcs/model2_mri_classifier"
    hf_filename : filename inside the repo, e.g. "best_model2.pth"
    local_path  : absolute path to a local .pth file (fallback)
    device      : torch.device("cpu") or torch.device("cuda")
    hf_token    : optional HF token (required only for private repos)
    """
    model = _build_model()
    checkpoint_path: Optional[str] = None

    # 1. Try Hugging Face Hub
    if hf_repo:
        try:
            checkpoint_path = _download_from_hub(hf_repo, hf_filename, hf_token)
        except Exception as exc:
            logger.warning(
                "HF Hub download failed for Model 2 (%s). Falling back to local. Error: %s",
                hf_repo, exc,
            )

    # 2. Fall back to local path
    if checkpoint_path is None:
        p = Path(local_path)
        if not p.exists():
            raise FileNotFoundError(
                f"Model 2 checkpoint not found locally at: {p}\n"
                f"HF repo '{hf_repo}' also failed — check logs above."
            )
        checkpoint_path = str(p)
        logger.info("Model 2 loading from local path: %s", checkpoint_path)

    _load_state(model, checkpoint_path, device)
    model.to(device)
    model.eval()
    logger.info("Model 2 ready  [source: %s]  [device: %s]", checkpoint_path, device)
    return model


def preprocess(image: Image.Image, device: torch.device) -> torch.Tensor:
    """Preprocess a PIL Image into the tensor Model 2 expects."""
    return _transform(image.convert("RGB")).unsqueeze(0).to(device)


def predict(model: nn.Module, image: Image.Image, device: torch.device) -> dict:
    """
    Classify the dementia stage from a validated brain MRI.

    Returns
    -------
    {
        "prediction"   : "Mild Demented" | "Non Demented" | "Very Mild Demented",
        "confidence"   : float  (0–1),
        "class_index"  : int,
        "probabilities": {"Mild Demented": float, "Non Demented": float, "Very Mild Demented": float},
    }
    """
    tensor = preprocess(image, device)

    with torch.no_grad():
        logits = model(tensor)
        probs  = F.softmax(logits, dim=1)
        conf, pred_idx = torch.max(probs, dim=1)

    idx      = pred_idx.item()
    prob_arr = probs.squeeze().cpu().numpy()

    return {
        "prediction"   : CLASS_NAMES[idx],
        "confidence"   : float(conf.item()),
        "class_index"  : idx,
        "probabilities": {CLASS_NAMES[i]: float(prob_arr[i]) for i in range(len(CLASS_NAMES))},
    }
