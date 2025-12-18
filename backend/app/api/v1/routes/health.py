from fastapi import APIRouter, HTTPException, status

from app.core.logging import get_logger
from app.core.exceptions import LLMServiceError
from app.services.llm.llm_service import get_llm_service

router = APIRouter()
logger = get_logger(__name__)


@router.get("/llm", summary="LLM health check")
async def llm_health_check():
    """
    Lightweight LLM probe. Calls the configured provider/model with a tiny
    deterministic prompt and verifies the response shape without exposing
    secrets.
    """
    service = get_llm_service()

    try:
        response_text = await service.generate_text(
            prompt="Reply with a single word: OK",
            temperature=0.0,
            max_tokens=5,
        )

        if isinstance(response_text, str) and "ok" in response_text.lower():
            return {
                "status": "ok",
                "provider": service.provider,
                "model": service.model_name,
            }

        logger.warning("LLM health probe returned unexpected content")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="LLM responded unexpectedly",
        )

    except LLMServiceError as e:
        logger.error(f"LLM health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        logger.error("Unexpected error during LLM health check", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="LLM health check failed",
        )

