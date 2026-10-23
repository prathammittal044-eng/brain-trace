"""
Brain-Trace — Model 1 Service (MRI vs Non-MRI Gatekeeper)

Architecture : ResNet-18, 2 classes  ["MRI_DATA", "NON_MRI_DATA"]
Preprocessing: RGB, Resize(224), ToTensor, ImageNet normalisation
Checkpoint   : state_dict  OR  {"model_state_dict": ...}

Loading priority:
  1. Hugging Face Hub  (hf_repo / hf_filename)  — downloaded & cached locally
  2. Local path        (local_path)              — used as fallback
"""

import logging
from pathlib import Path
from typing import Optional

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms

logger = logging.getLogger(__name__)

IMAGE_SIZE   = 224
CLASS_NAMES  = ["MRI_DATA", "NON_MRI_DATA"]

# Preprocessing identical to model1_things/model1_utils.py
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
    """ResNet-18 with a 2-class FC head (no pretrained weights)."""
    m = models.resnet18(weights=None)
    m.fc = nn.Linear(m.fc.in_features, len(CLASS_NAMES))
    return m


def _load_state(model: nn.Module, checkpoint_path: str, device: torch.device) -> None:
    """Load a .pth checkpoint into *model* in-place (handles both formats)."""
    raw = torch.load(checkpoint_path, map_location=device, weights_only=False)
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
    from huggingface_hub import hf_hub_download  # lazy import — keeps torch startup fast
    logger.info("Downloading Model 1 from HF Hub: %s / %s", repo_id, filename)
    cached = hf_hub_download(repo_id=repo_id, filename=filename, token=token)
    logger.info("Model 1 checkpoint cached at: %s", cached)
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
    Load Model 1 and return it in eval mode.

    Loading order
    -------------
    1. Hugging Face Hub  (when hf_repo is non-empty)
    2. Local checkpoint  (local_path — used if HF download fails or hf_repo is empty)

    Parameters
    ----------
    hf_repo     : HF repo ID, e.g. "epsrbtcs/model1_mri_vs_nonmri"
    hf_filename : filename inside the repo, e.g. "best_model1.pth"
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
                "HF Hub download failed for Model 1 (%s). Falling back to local. Error: %s",
                hf_repo, exc,
            )

    # 2. Fall back to local path
    if checkpoint_path is None:
        p = Path(local_path)
        if not p.exists():
            raise FileNotFoundError(
                f"Model 1 checkpoint not found locally at: {p}\n"
                f"HF repo '{hf_repo}' also failed — check logs above."
            )
        checkpoint_path = str(p)
        logger.info("Model 1 loading from local path: %s", checkpoint_path)

    _load_state(model, checkpoint_path, device)
    model.to(device)
    model.eval()
    logger.info("Model 1 ready  [source: %s]  [device: %s]", checkpoint_path, device)
    return model


def predict(model: nn.Module, image: Image.Image, device: torch.device) -> dict:
    """
    Gate-check: is this image a brain MRI?

    Returns
    -------
    {
        "is_mri"       : bool,
        "prediction"   : "MRI_DATA" | "NON_MRI_DATA",
        "confidence"   : float  (0–1),
        "probabilities": {"MRI_DATA": float, "NON_MRI_DATA": float},
    }
    """
    tensor = _transform(image.convert("RGB")).unsqueeze(0).to(device)

    with torch.no_grad():
        logits = model(tensor)
        probs  = torch.softmax(logits, dim=1)
        conf, pred_idx = torch.max(probs, dim=1)

    idx  = pred_idx.item()
    prob_arr = probs.squeeze().cpu().numpy()

    return {
        "is_mri"       : idx == 0,          # index 0 → MRI_DATA
        "prediction"   : CLASS_NAMES[idx],
        "confidence"   : float(conf.item()),
        "probabilities": {CLASS_NAMES[i]: float(prob_arr[i]) for i in range(len(CLASS_NAMES))},
    }
