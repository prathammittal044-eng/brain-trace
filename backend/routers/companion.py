"""
DemenX Companion Chat Router
"""

import logging
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from schemas.companion import CompanionChatRequest
from services.gemini_service import generate_companion_reply

logger = logging.getLogger("demenx.router.companion")
router = APIRouter(tags=["Companion"])


@router.post("/api/companion/chat")
@router.post("/api/v1/companion/chat")
async def companion_chat(req: CompanionChatRequest):
    """
    Process conversation messages with Gemini AI (or fallback to structured knowledge base),
    providing safe navigation actions and clinical disclaimers.
    """
    if not req.messages:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Messages array cannot be empty."}
        )

    msgs_dict = [{"role": m.role, "content": m.content} for m in req.messages]
    ctx_dict = req.context.model_dump() if req.context else None

    result = await generate_companion_reply(msgs_dict, ctx_dict)
    return JSONResponse(status_code=200, content=result)
