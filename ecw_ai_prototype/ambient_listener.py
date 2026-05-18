import pyaudio
import wave
import threading
import time
import tempfile
import os
from faster_whisper import WhisperModel

class AmbientListener:
    """
    Handles continuous audio recording from the microphone and transcribes it locally using Faster-Whisper.
    """
    def __init__(self, model_size="distil-whisper-large-v3", device="cuda"):
        # We default to device="cuda" assuming an NVIDIA GPU for the 26B Gemma model, but can fallback to "cpu"
        self.chunk = 1024
        self.format = pyaudio.paInt16
        self.channels = 1
        self.rate = 16000
        self.is_recording = False
        self.frames = []
        self.audio = pyaudio.PyAudio()
        self.stream = None
        self.temp_file = os.path.join(tempfile.gettempdir(), "ambient_encounter.wav")
        
        print(f"Loading local Whisper model ({model_size}) on {device}...")
        # compute_type="float16" for GPU, "int8" for CPU
        compute_type = "float16" if device == "cuda" else "int8"
        try:
            self.model = WhisperModel(model_size, device=device, compute_type=compute_type)
            print("Whisper model loaded successfully.")
        except Exception as e:
            print(f"Failed to load Whisper model (Ensure CUDA is setup or switch to CPU): {e}")

    def start_recording(self):
        self.is_recording = True
        self.frames = []
        self.stream = self.audio.open(format=self.format,
                                      channels=self.channels,
                                      rate=self.rate,
                                      input=True,
                                      frames_per_buffer=self.chunk)
        print("Listening for ambient encounter... (Press stop to transcribe)")
        
        # Start recording thread
        self.record_thread = threading.Thread(target=self._record)
        self.record_thread.start()

    def _record(self):
        while self.is_recording:
            try:
                data = self.stream.read(self.chunk, exception_on_overflow=False)
                self.frames.append(data)
            except IOError as e:
                print(f"Audio Overflow: {e}")

    def stop_recording_and_transcribe(self) -> str:
        self.is_recording = False
        if self.record_thread:
            self.record_thread.join()
            
        self.stream.stop_stream()
        self.stream.close()
        
        # Save to temp wav file
        print("Processing audio...")
        wf = wave.open(self.temp_file, 'wb')
        wf.setnchannels(self.channels)
        wf.setsampwidth(self.audio.get_sample_size(self.format))
        wf.setframerate(self.rate)
        wf.writeframes(b''.join(self.frames))
        wf.close()

        # Transcribe
        segments, info = self.model.transcribe(self.temp_file, beam_size=5)
        transcript = ""
        for segment in segments:
            transcript += segment.text + " "
            
        # Clean up
        if os.path.exists(self.temp_file):
            os.remove(self.temp_file)
            
        return transcript.strip()

# Example Usage:
if __name__ == "__main__":
    listener = AmbientListener(device="cpu") # Fallback to CPU for quick testing
    listener.start_recording()
    
    try:
        # Record for 5 seconds just as a test
        time.sleep(5)
    except KeyboardInterrupt:
        pass
        
    transcript = listener.stop_recording_and_transcribe()
    print(f"\nFinal Transcript: {transcript}")
