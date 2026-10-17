"""
ScanSaarthi — Image Validation Utilities
"""

import logging
from pathlib import Path

from PIL import Image

from config import ALLOWED_EXTENSIONS, MAX_UPLOAD_SIZE

logger = logging.getLogger(__name__)


class ImageValidationError(Exception):
    """Raised when an uploaded image fails validation."""
    pass


def validate_extension(filename: str) -> str:
    """Check that the file extension is allowed. Returns the lowercase extension."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ImageValidationError(
            f"Unsupported file type '{ext}'. "
            f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    return ext


def validate_size(content: bytes) -> None:
    """Check that file content is within the allowed size limit."""
    if len(content) > MAX_UPLOAD_SIZE:
        size_mb = MAX_UPLOAD_SIZE / (1024 * 1024)
        raise ImageValidationError(
            f"File size ({len(content) / (1024*1024):.1f} MB) exceeds "
            f"the maximum allowed size ({size_mb:.0f} MB)."
        )


def load_and_validate_image(content: bytes) -> Image.Image:
    """
    Decode image bytes into a PIL Image.
    Verifies that the data is actually a valid, readable image.
    """
    import io

    try:
        image = Image.open(io.BytesIO(content))
        image.load()  # Force full decode to catch truncated/corrupt files
    except Exception as exc:
        raise ImageValidationError(
            "The uploaded file could not be read as an image. "
            "It may be corrupted or not a valid image file."
        ) from exc

    return image
