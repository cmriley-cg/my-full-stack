# app/services/form_populator.py
from __future__ import annotations
import json, time, logging
from typing import Dict, Any
from openai import AzureOpenAI, APIConnectionError, APIError, RateLimitError, AuthenticationError
from app.core.config import settings

logger = logging.getLogger(__name__)

# Lazily create a single client (reuse TCP)
_client_instance: AzureOpenAI | None = None

def _get_client() -> AzureOpenAI:
    global _client_instance
    if _client_instance is None:
        _client_instance = AzureOpenAI(
            api_key=settings.AZURE_OPENAI_KEY,
            api_version=settings.AZURE_OPENAI_VERSION,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
        )
    return _client_instance



MAINTENANCE_FIELDS = [
    "EngineerName","DateTime","Location","EquipmentID","JobNumber","WorkOrder",
    "PlannedReactive","StartTime","EndTime","Duration","ReportedIssue","FaultCode",
    "InitialDiagnosis","PartName","SerialNumber","Reason","Tools","Consumables",
    "Outcome","Raised","OrderNumber","PPE","PermitToWork","RiskAssessment",
    "Incidents","Description","LFE"
]

SYSTEM_PROMPT = """You are an assistant that extracts structured information from technician maintenance reports.
Return ONLY a single JSON object with the following fields (strings):
EngineerName, DateTime, Location, EquipmentID, JobNumber, WorkOrder, PlannedReactive, StartTime, EndTime, Duration, ReportedIssue, FaultCode, InitialDiagnosis, PartName, SerialNumber, Reason, Tools, Consumables, Outcome, Raised, OrderNumber, PPE, PermitToWork, RiskAssessment, Incidents, Description, LFE.
If a field is not mentioned, return an empty string for it. Do not include any extra text or explanations—JSON only.
"""

def _empty_fields() -> Dict[str, str]:
    return {k: "" for k in MAINTENANCE_FIELDS}

def _safe_json_parse(s: str) -> Dict[str, Any]:
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        return {}

async def populate_form_from_transcript(transcript: str) -> Dict[str, Any]:
    """
    Calls Azure OpenAI to extract maintenance fields from a transcript.
    Includes retry logic if the connection fails.
    Returns a dict: { "fields": {...}, "meta": {...} }
    """
    if not transcript or not transcript.strip():
        raise ValueError("Transcript is empty.")

    client = _get_client()

    max_retries = 3
    delay = 2  # seconds between retries
    last_error: Exception | None = None

    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"[FormPopulate] Calling Azure OpenAI (attempt {attempt})")
            resp = client.chat.completions.create(
                model=settings.AZURE_OPENAI_DEPLOYMENT,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Transcript:\n{transcript.strip()}"},
                ],
                temperature=0,
                response_format={"type": "json_object"},
            )
            # success
            break

        except (APIConnectionError, APIError, RateLimitError, AuthenticationError) as e:
            last_error = e
            logger.warning(f"⚠️ Azure OpenAI call failed on attempt {attempt}: {e}")
            if attempt < max_retries:
                time.sleep(delay)
                continue
            else:
                logger.error("❌ All retry attempts failed.")
                raise RuntimeError(f"Azure OpenAI connection failed after {max_retries} retries: {e}") from e
        except Exception as e:
            # catch-all for unexpected errors
            logger.exception("Unexpected error during OpenAI call")
            raise RuntimeError(f"Unexpected OpenAI error: {e}") from e

    # If loop exited without setting resp, raise the last error
    if last_error and "resp" not in locals():
        raise RuntimeError(f"Azure OpenAI call failed: {last_error}")

    content = (resp.choices[0].message.content or "").strip()
    data = _safe_json_parse(content)

    # Normalize fields
    fields = _empty_fields()
    for k in MAINTENANCE_FIELDS:
        v = data.get(k, "")
        fields[k] = "" if v is None else str(v)

    meta = {
        "model": settings.AZURE_OPENAI_DEPLOYMENT,
        "finish_reason": getattr(resp.choices[0], "finish_reason", None),
        "prompt_tokens": getattr(resp.usage, "prompt_tokens", None),
        "completion_tokens": getattr(resp.usage, "completion_tokens", None),
        "total_tokens": getattr(resp.usage, "total_tokens", None),
        "attempts": attempt,
    }

    return {"fields": fields, "meta": meta}
