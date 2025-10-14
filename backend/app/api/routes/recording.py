from fastapi import APIRouter, HTTPException
# import threading
# import time
# import os
import azure.cognitiveservices.speech as speechsdk
from app.core.config import settings
# from app.models import Message
# from app.api.deps import CurrentUser
from app.services.speech import (
    start_session,
    stop_session,
    transcribe_wav_file,
    synth_then_recognize,
)

router = APIRouter(prefix="/record", tags=["recording"])

# Routings

@router.post("/start")
def start_recording():

    key = settings.AZURE_SPEECH_KEY
    region = settings.AZURE_SPEECH_REGION
    if not key or not region:
        raise HTTPException(status_code=500, detail="Azure Speech credentials not configured")
    try:
        start_session(key, region)
    except RuntimeError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return {"status": "recording_started"}


@router.post("/stop")
def stop_recording():

    try:
        transcript = stop_session(timeout_sec=10)
    except RuntimeError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return {"status": "stopped", "transcript": transcript}


@router.post("/testfile")
def test_file_recognition():
    """
    Debug: transcribe a .wav file instead of using the microphone
    """
    key = settings.AZURE_SPEECH_KEY
    region = settings.AZURE_SPEECH_REGION
    if not key or not region:
        raise HTTPException(status_code=500, detail="Azure Speech credentials not configured")

    # Prefer: pass a path from the client or a test fixture path from config
    # transcript = transcribe_wav_file(key, region, "/absolute/path/to/file.wav")

    transcript = synth_then_recognize(
        key,
        region,
        text="Hello Christina, this is a loopback test.",
        stt_language="en-GB",
        voice="en-GB-SoniaNeural",
    )
    return {"status": "completed", "transcript": transcript}


# Placeholder for file upload route, user can then upload their own audio file for transcription to the front end.
@router.post("/testfile")
def upload_file_recognition():

    transcript = "This is a placeholder transcript."

    return {"status": "completed", "transcript": transcript}