"""
MRI Scan Schemas
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class MriScanItemResponse(BaseModel):
    id: str
    date: str
    time: str
    type: str = "Brain MRI"
    uploader: str = "Uploaded by you"
    status: str
    prediction: Optional[str] = None
    confidence: Optional[str] = None
    progress: Optional[int] = None
    viewType: str = "axial"
    verified: bool = False
    analyzedOn: Optional[str] = None
    gradcam_url: Optional[str] = None
    report_preview: Optional[str] = None


class MriAnalysisResponseDTO(BaseModel):
    mri_scan_id: str
    filename: str
    prediction: str
    confidence: float
    report_preview: str
    model_pipeline: str
    gradcam_url: Optional[str] = None
    probabilities: Optional[Dict[str, float]] = None
    model1: Optional[Dict[str, Any]] = None
