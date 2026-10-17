"""
DemenX Companion Gemini AI Service and Knowledge Base Fallback
"""

import os
import re
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
import config

logger = logging.getLogger("demenx.gemini")

# Navigation destination registry
NAVIGATION_REGISTRY = {
    "home": {"title": "Home Landing Page", "actionText": "Return to Home Page"},
    "dashboard": {"title": "Patient Dashboard Overview", "actionText": "Go to Dashboard Overview"},
    "cognitiveTest": {"title": "Cognitive Assessment Center", "actionText": "Go to Cognitive Test"},
    "startAssessment": {"title": "Start Daily Assessment", "actionText": "Start Assessment Workspace"},
    "assessmentResults": {"title": "Latest Assessment Results", "actionText": "View Results Breakdown"},
    "assessmentHistory": {"title": "Assessment History", "actionText": "View Previous Assessments"},
    "cognitiveReport": {"title": "Full Cognitive Report", "actionText": "Open Printable Report"},
    "myScans": {"title": "My Scans & MRI Viewer", "actionText": "Open My Scans"},
    "uploadScan": {"title": "Upload Brain MRI Scan", "actionText": "Upload New MRI Scan"},
    "appointments": {"title": "Appointments & Doctor Directory", "actionText": "View Appointments"},
    "bookAppointment": {"title": "Book Doctor Consultation", "actionText": "Book Consultation"},
    "messages": {"title": "Direct Doctor Messages", "actionText": "Open Messaging"},
    "settings": {"title": "Patient Profile & Settings", "actionText": "Open Settings & Profile"},
}

COMPANION_SYSTEM_INSTRUCTION = """
You are the DemenX Companion, a supportive, knowledgeable AI guide embedded inside DemenX — the AI-Powered Brain Health Screening and Cognitive Monitoring Platform.

Key DemenX Capabilities:
1. Deep Learning MRI Pipeline:
   - Upload brain MRI (JPG, PNG, DICOM)
   - Sequential Model 1 (ResNet-18) validates if image is a real Brain MRI vs Non-MRI
   - Sequential Model 2 (ResNet-18) classifies structural indicators: Non Demented, Very Mild Demented, Mild Demented
   - Generates Grad-CAM visual heatmaps highlighting relevant brain structures
2. Daily Cognitive Assessment:
   - 5 interactive domains: Memory Recall, Sustained Attention, Working Memory Sequences, Pattern/Rule Challenge, Visual-Spatial Challenge
   - Daily Cognitive Activity Score (0-100)
3. Brain Health Passport & Scan History
4. Doctor Directory & Appointments
5. Direct Doctor Messaging & Tele-consultation
6. Client-Side & Server PDF Reports

Medical Boundaries & Tone:
- You are an informational assistant, NOT a medical doctor.
- NEVER diagnose dementia or claim clinical certainty.
- Clarify that AI MRI classification and cognitive activity scores are experimental screening tools.
- Recommend consultation with a qualified neurologist for persistent symptoms.

Navigation Action Directive:
When the user's intent matches navigating to a DemenX screen, append a structured action tag at the very end of your response:
<<<ACTION:{"type":"navigate","destination":"<destination_key>","label":"<button_label>"}>>>

Permitted destination keys:
home, dashboard, cognitiveTest, startAssessment, assessmentResults, assessmentHistory, cognitiveReport, myScans, uploadScan, appointments, bookAppointment, messages, settings.
"""

KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    {
        "keywords": ["mri", "upload", "scan", "dicom", "imaging"],
        "answer": (
            "You can upload brain MRI scans (JPG, PNG, DICOM) in the 'My Scans' section. "
            "Our dual-stage AI validates the scan using Model 1, classifies structural patterns with Model 2, "
            "and generates an explainable Grad-CAM heatmap highlighting regions of interest."
        ),
        "destination": "myScans",
        "label": "Open My Scans →",
        "followUps": ["How does MRI validation work?", "What is Grad-CAM?"]
    },
    {
        "keywords": ["cognitive", "test", "assessment", "quiz", "memory", "activity"],
        "answer": (
            "DemenX offers a 5-minute Daily Cognitive Activity Test covering Memory Recall, "
            "Sustained Attention, Working Memory, Pattern Reasoning, and Visual-Spatial alignment. "
            "Scores provide longitudinal trend monitoring to discuss with your doctor."
        ),
        "destination": "cognitiveTest",
        "label": "Start Cognitive Assessment →",
        "followUps": ["Can I practice first?", "How is the score calculated?"]
    },
    {
        "keywords": ["doctor", "appointment", "schedule", "book", "neurologist", "consultation"],
        "answer": (
            "You can explore our directory of certified neurologists and book in-person or tele-consultation "
            "appointments directly through DemenX. Dr. Rajesh Sharma and other specialists are available."
        ),
        "destination": "appointments",
        "label": "View Doctors & Appointments →",
        "followUps": ["How to book an appointment?", "Can doctors see my scan results?"]
    },
    {
        "keywords": ["message", "chat", "contact", "telehealth", "dr rajesh"],
        "answer": (
            "You can communicate directly with your care team and neurologist via encrypted messaging. "
            "You can attach cognitive reports or recent MRI scans to your messages."
        ),
        "destination": "messages",
        "label": "Open Messages →",
        "followUps": ["Send a message to Dr. Rajesh", "Attach my latest scan"]
    },
    {
        "keywords": ["report", "pdf", "download", "export"],
        "answer": (
            "You can view and download high-resolution PDF reports of both your MRI scans and "
            "Cognitive Assessment results. Historical reports are stored securely in your Brain Passport."
        ),
        "destination": "cognitiveReport",
        "label": "View Report & PDF →",
        "followUps": ["Download latest report", "View past assessments"]
    },
    {
        "keywords": ["history", "past", "previous", "trends"],
        "answer": (
            "All previous cognitive assessment sessions and MRI scans are saved in your personal history. "
            "You can inspect past domain scores, duration, and download reports for each test date."
        ),
        "destination": "assessmentHistory",
        "label": "Open Assessment History →",
        "followUps": ["View latest test score", "How to track progress over time?"]
    }
]


def extract_action_from_text(raw_text: str) -> Tuple[str, Optional[Dict[str, Any]]]:
    """Parse <<<ACTION:{...}>>> from AI response text."""
    clean_text = raw_text
    action = None
    pattern = r'<<<ACTION:(\{.*?\})>>>'
    match = re.search(pattern, raw_text, re.DOTALL)
    if match:
        clean_text = re.sub(pattern, '', raw_text).strip()
        try:
            parsed = json.loads(match.group(1))
            dest = parsed.get("destination")
            if dest in NAVIGATION_REGISTRY:
                action = {
                    "type": "navigate",
                    "destination": dest,
                    "label": parsed.get("label") or NAVIGATION_REGISTRY[dest]["actionText"]
                }
        except Exception:
            logger.warning("Failed to parse action JSON from text")

    # Fallback keyword extraction if model omitted action tag
    if not action:
        lower = clean_text.lower()
        if any(w in lower for w in ["history", "previous test", "past result"]):
            action = {"type": "navigate", "destination": "assessmentHistory", "label": "Open Assessment History →"}
        elif any(w in lower for w in ["upload", "my scan", "mri"]):
            action = {"type": "navigate", "destination": "myScans", "label": "Open My Scans →"}
        elif any(w in lower for w in ["book", "appointment", "schedule", "doctor"]):
            action = {"type": "navigate", "destination": "appointments", "label": "Open Appointments →"}
        elif any(w in lower for w in ["cognitive", "assessment", "memory test"]):
            action = {"type": "navigate", "destination": "cognitiveTest", "label": "Explore Cognitive Test →"}
        elif any(w in lower for w in ["message", "chat"]):
            action = {"type": "navigate", "destination": "messages", "label": "Open Messages →"}

    return clean_text, action


def get_knowledge_base_match(query: str) -> Optional[Dict[str, Any]]:
    """Match user query against local knowledge base."""
    q = query.lower()
    for entry in KNOWLEDGE_BASE:
        if any(kw in q for kw in entry["keywords"]):
            return {
                "answer": entry["answer"],
                "action": {
                    "type": "navigate",
                    "destination": entry["destination"],
                    "label": entry["label"]
                },
                "followUps": entry.get("followUps", [])
            }
    return None


async def generate_companion_reply(
    messages: List[Dict[str, str]],
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generate reply using Gemini if GEMINI_API_KEY is configured,
    otherwise fallback seamlessly to knowledge base.
    """
    latest_msg = messages[-1]["content"] if messages else ""
    kb_match = get_knowledge_base_match(latest_msg)

    api_key = config.GEMINI_API_KEY
    if api_key:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)

            ctx_note = ""
            if context:
                ctx_note = (
                    f"\nUser Current Screen Context: Route='{context.get('currentRoute')}', "
                    f"Tab='{context.get('activeTab')}', SubView='{context.get('cognitiveSubView')}', "
                    f"Role='{context.get('userRole')}'."
                )
            full_prompt = f"{COMPANION_SYSTEM_INSTRUCTION}{ctx_note}"

            # Format contents
            formatted_contents = []
            for m in messages:
                role = "model" if m.get("role") in ("assistant", "model") else "user"
                formatted_contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})

            candidate_models = [config.GEMINI_MODEL, "gemini-2.5-flash", "gemini-1.5-flash"]
            for model_name in candidate_models:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=formatted_contents,
                        config={
                            "system_instruction": full_prompt,
                            "temperature": 0.3,
                            "max_output_tokens": 600
                        }
                    )
                    if response.text:
                        clean_text, action = extract_action_from_text(response.text)
                        return {
                            "success": True,
                            "message": clean_text,
                            "action": action or (kb_match.get("action") if kb_match else None),
                            "modelUsed": model_name,
                            "followUps": kb_match.get("followUps") if kb_match else ["How do I start a test?", "Can I upload my MRI?"]
                        }
                except Exception as model_err:
                    logger.warning("Gemini model %s failed: %s", model_name, model_err)

        except Exception as exc:
            logger.warning("Gemini invocation failed, falling back to knowledge base: %s", exc)

    # Fallback to local knowledge base
    if kb_match:
        return {
            "success": True,
            "message": kb_match["answer"],
            "action": kb_match["action"],
            "modelUsed": "knowledge-base",
            "followUps": kb_match.get("followUps")
        }

    return {
        "success": True,
        "message": (
            "Hello! I am your DemenX Companion. I can help guide you through Brain MRI analysis, "
            "daily cognitive assessments, viewing your Brain Health Passport, booking doctor appointments, "
            "or messaging your healthcare team. How can I assist you today?"
        ),
        "action": {
            "type": "navigate",
            "destination": "cognitiveTest",
            "label": "Explore Cognitive Test →"
        },
        "modelUsed": "fallback",
        "followUps": ["What is DemenX?", "How do I upload an MRI scan?", "Start cognitive test"]
    }
