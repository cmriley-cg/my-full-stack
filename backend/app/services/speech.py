# app/services/speech.py
import threading
import time
from typing import Optional

import azure.cognitiveservices.speech as speechsdk

# In-process recorder state. Good enough for dev;
# for production, replace with a session store.
_state = {
    "thread": None,          # type: Optional[threading.Thread]
    "stop_event": None,      # type: Optional[threading.Event]
    "transcript": None,      # type: Optional[str]
}
_state_lock = threading.Lock()


def _capture_audio(speech_key: str, region: str, stop_event: threading.Event) -> None:
    """
    Runs on a background thread, listens to the *server's* default mic,
    accumulates recognized text, and writes it into _state["transcript"].
    """
    speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=region)
    audio_config = speechsdk.AudioConfig(use_default_microphone=True)
    recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

    pieces: list[str] = []

    def on_recognized(evt: speechsdk.SpeechRecognitionEventArgs):
        if hasattr(evt.result, "text") and evt.result.text:
            pieces.append(evt.result.text)

    recognizer.recognized.connect(on_recognized)
    recognizer.start_continuous_recognition()

    try:
        while not stop_event.is_set():
            time.sleep(0.1)
    finally:
        recognizer.stop_continuous_recognition()

    with _state_lock:
        _state["transcript"] = " ".join(pieces)


def start_session(speech_key: str, region: str) -> None:
    """
    Starts the background mic capture session.
    Raises RuntimeError if a session is already running.
    """
    with _state_lock:
        thread: Optional[threading.Thread] = _state["thread"]
        if thread and thread.is_alive():
            raise RuntimeError("Recording already in progress")

        stop_event = threading.Event()
        worker = threading.Thread(
            target=_capture_audio,
            args=(speech_key, region, stop_event),
            daemon=True,
        )
        _state.update({"thread": worker, "stop_event": stop_event, "transcript": None})
        worker.start()


def stop_session(timeout_sec: float = 10.0) -> str:
    """
    Stops the background session and returns the transcript.
    Raises RuntimeError if no session is running.
    """
    with _state_lock:
        thread: Optional[threading.Thread] = _state["thread"]
        stop_event: Optional[threading.Event] = _state["stop_event"]

        if not thread or not thread.is_alive() or not stop_event:
            raise RuntimeError("No recording in progress")

        stop_event.set()

    # join outside the state lock to avoid blocking other readers
    thread.join(timeout=timeout_sec)

    with _state_lock:
        transcript = _state.get("transcript") or ""
        # Optionally clear state here if you don't want reuse
        return transcript


def transcribe_wav_file(speech_key: str, region: str, wav_path: str) -> str:
    """
    Transcribe a single WAV (or supported) file once.
    """
    cfg = speechsdk.SpeechConfig(subscription=speech_key, region=region)
    audio = speechsdk.AudioConfig(filename=wav_path)
    recognizer = speechsdk.SpeechRecognizer(speech_config=cfg, audio_config=audio)

    result = recognizer.recognize_once()
    if not result:
        return ""

    if result.reason == speechsdk.ResultReason.RecognizedSpeech:
        return result.text or ""
    if result.reason == speechsdk.ResultReason.NoMatch:
        # print("NoMatch details:", result.no_match_details)
        return ""
    if result.reason == speechsdk.ResultReason.Canceled:
        # det = result.cancellation_details
        return ""

    return result.text or ""


def synth_then_recognize(
    speech_key: str,
    region: str,
    text: str = "Hello, this is a test of the text to speech service using a synthesis voice.",
    stt_language: str = "en-GB",
    voice: str = "en-GB-SoniaNeural",
) -> str:
    """
    1) TTS to raw PCM bytes (in memory)
    2) Feed bytes to STT via PushAudioInputStream
    3) Return recognized text
    """
    # TTS
    tts_cfg = speechsdk.SpeechConfig(subscription=speech_key, region=region)
    tts_cfg.speech_synthesis_voice_name = voice
    tts_cfg.set_speech_synthesis_output_format(
        speechsdk.SpeechSynthesisOutputFormat.Raw16Khz16BitMonoPcm
    )
    tts = speechsdk.SpeechSynthesizer(speech_config=tts_cfg, audio_config=None)
    tts_result = tts.speak_text_async(text).get()
    if tts_result.reason != speechsdk.ResultReason.SynthesizingAudioCompleted:
        return ""

    audio_bytes = tts_result.audio_data

    # STT
    stt_cfg = speechsdk.SpeechConfig(subscription=speech_key, region=region)
    stt_cfg.speech_recognition_language = stt_language
    stream_format = speechsdk.audio.AudioStreamFormat(
        samples_per_second=16000, bits_per_sample=16, channels=1
    )
    push_stream = speechsdk.audio.PushAudioInputStream(stream_format=stream_format)
    push_stream.write(audio_bytes)
    push_stream.close()

    audio_in = speechsdk.audio.AudioConfig(stream=push_stream)
    recognizer = speechsdk.SpeechRecognizer(speech_config=stt_cfg, audio_config=audio_in)
    result = recognizer.recognize_once_async().get()

    if result.reason == speechsdk.ResultReason.RecognizedSpeech:
        return result.text or ""
    return ""
