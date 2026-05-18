import json
from llm_client import LocalGemmaClient
from extractor import ECWExtractor
from prompts import MedicalPrompts
import textwrap

def generate_patient_summary(client: LocalGemmaClient, extractor: ECWExtractor, patient_id: str):
    print(f"\n--- Generating Patient Summary for {patient_id} ---")
    history = extractor.get_patient_history(patient_id)
    demo = extractor.get_patient_demographics(patient_id)
    
    user_prompt = f"Demographics: {json.dumps(demo)}\nHistory: {json.dumps(history)}"
    
    print("\nSending data to Gemma4...")
    summary = client.generate_completion(
        system_prompt=MedicalPrompts.PATIENT_HISTORY_SYSTEM,
        user_prompt=user_prompt,
        temperature=0.2
    )
    
    print("\n>>> PATIENT SUMMARY <<<")
    print(textwrap.fill(summary, width=80))
    print(">" * 23 + "\n")


def generate_prior_auth(client: LocalGemmaClient, extractor: ECWExtractor, patient_id: str, target_request: str):
    print(f"\n--- Generating Prior Auth for {target_request} ---")
    history = extractor.get_patient_history(patient_id)
    demo = extractor.get_patient_demographics(patient_id)
    
    user_prompt = f"""
Patient Demographics: {json.dumps(demo)}
Medical History & Current Problem List: {json.dumps(history)}
Target Request (Medication/Procedure): {target_request}
"""
    
    print("\nDrafting letter with Gemma4...")
    letter = client.generate_completion(
        system_prompt=MedicalPrompts.PRIOR_AUTH_SYSTEM,
        user_prompt=user_prompt,
        temperature=0.1
    )
    
    print("\n>>> PRIOR AUTHORIZATION DRAFT <<<")
    print(letter)
    print(">" * 33 + "\n")


def run_ambient_encounter(client: LocalGemmaClient):
    print("\n--- Starting Ambient Encounter ---")
    print("NOTE: This requires faster-whisper and a working microphone.")
    
    # In a real scenario, you'd initialize this once
    # We use a mocked transcript here if the user doesn't want to actually record right now.
    mock_recording = input("Do you want to mock the audio recording for testing? (y/n): ")
    
    if mock_recording.lower() == 'y':
        transcript = "Doctor: Hi Jane, how is that knee pain doing? Patient: It's really bad doc, the ibuprofen 800mg isn't touching it anymore. I can barely walk up the stairs. Doctor: I'm sorry to hear that. Given your obesity and the severe osteoarthritis we saw on the x-ray, I think it's time we do an MRI of that knee to see if there's a meniscus tear, and I'll refer you to orthopedics. Patient: Sounds good."
        print(f"\nMock Transcript: {transcript}")
    else:
        from ambient_listener import AmbientListener
        try:
            listener = AmbientListener(device="cpu") # Or cuda
            listener.start_recording()
            input("\nPress Enter to STOP recording...\n")
            transcript = listener.stop_recording_and_transcribe()
            print(f"\nReal Transcript: {transcript}")
        except Exception as e:
            print(f"Failed to record audio: {e}")
            return

    print("\nGenerating SOAP Note with Gemma4...")
    soap_note = client.generate_completion(
        system_prompt=MedicalPrompts.AMBIENT_SOAP_NOTE_SYSTEM,
        user_prompt=f"Transcript:\n{transcript}",
        temperature=0.1
    )
    
    print("\n>>> GENERATED SOAP NOTE <<<")
    print(soap_note)
    print(">" * 27 + "\n")


def main():
    # Initialize the LLM Client (assuming LM Studio/Ollama is running locally)
    client = LocalGemmaClient(base_url="http://localhost:11434/v1")
    
    # Initialize Extractor (Mocking RPA mode for testing)
    extractor = ECWExtractor(mode="rpa")
    
    patient_id = "ACTIVE_SCREEN"
    
    while True:
        print("\n==== eClinicalWorks + Gemma4 Local AI ===")
        print("1. Generate Patient History Summary")
        print("2. Generate Prior Authorization")
        print("3. Start Ambient Listening Encounter (Replace Sunoh)")
        print("4. Exit")
        
        choice = input("Select an option (1-4): ")
        
        if choice == "1":
            generate_patient_summary(client, extractor, patient_id)
        elif choice == "2":
            target = input("Enter target medication or procedure for Prior Auth (e.g. 'MRI Left Knee'): ")
            generate_prior_auth(client, extractor, patient_id, target)
        elif choice == "3":
            run_ambient_encounter(client)
        elif choice == "4":
            print("Exiting...")
            break
        else:
            print("Invalid option.")

if __name__ == "__main__":
    main()
