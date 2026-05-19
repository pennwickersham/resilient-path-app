import json
from llm_client import LocalGemmaClient
from extractor import ECWExtractor
from fhir_client import ECWFhirClient
from prompts import MedicalPrompts
import textwrap

def generate_patient_summary(client: LocalGemmaClient, extractor: ECWExtractor, patient_id: str):
    print(f"\n--- Generating Patient Summary for {patient_id} via FHIR ---")
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


def run_ambient_encounter(client: LocalGemmaClient, extractor: ECWExtractor, patient_id: str):
    print("\n--- Starting Ambient Encounter ---")
    
    # Mocking audio recording for testing
    transcript = "Doctor: Hi Jane, how is that knee pain doing? Patient: It's really bad doc, the ibuprofen 800mg isn't touching it anymore. I can barely walk up the stairs. Doctor: I'm sorry to hear that. Given your obesity and the severe osteoarthritis we saw on the x-ray, I think it's time we do an MRI of that knee to see if there's a meniscus tear, and I'll refer you to orthopedics. Patient: Sounds good."
    print(f"\n[Mock] Recording Audio...\nTranscript: {transcript}")
    
    print("\nFetching current problem list from FHIR...")
    history = extractor.get_patient_history(patient_id)
    
    user_prompt = f"Existing Problem List: {json.dumps(history['problem_list'])}\nTranscript:\n{transcript}"

    print("\nGenerating Structured ICD/CPT JSON with Gemma4...")
    # Using temperature 0.0 to ensure strict JSON compliance
    ai_response = client.generate_completion(
        system_prompt=MedicalPrompts.AMBIENT_SOAP_JSON_SYSTEM,
        user_prompt=user_prompt,
        temperature=0.0 
    )
    
    print("\n>>> PARSED STRUCTURED CLINICAL DATA <<<")
    try:
        # Strip potential markdown formatting if the LLM output ```json ... ```
        clean_json = ai_response.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json[7:-3].strip()
        elif clean_json.startswith("```"):
            clean_json = clean_json[3:-3].strip()
            
        data = json.loads(clean_json)
        
        print(f"HPI: {textwrap.fill(data.get('subjective_hpi', ''), width=80)}\n")
        print("DIAGNOSES & PLAN:")
        for diag in data.get('diagnoses', []):
            print(f"  - Condition: {diag.get('condition')} [ICD-10: {diag.get('icd_10')}]")
            print(f"    Status:    {diag.get('status')}")
            print(f"    Plan:      {diag.get('plan')}")
            if diag.get('cpt_codes'):
                print(f"    CPT Codes: {', '.join(diag.get('cpt_codes'))}")
            print("")
            
        print(f"FOLLOW UP: {data.get('follow_up', '')}")
    except json.JSONDecodeError as e:
        print("Error: Gemma4 failed to output valid JSON. Raw output was:")
        print(ai_response)
        
    print(">" * 39 + "\n")


def main():
    # Initialize the clients
    llm_client = LocalGemmaClient(base_url="http://localhost:11434/v1")
    
    # This will use the env vars if set, otherwise falls back to mocking
    fhir_client = ECWFhirClient() 
    extractor = ECWExtractor(fhir_client)
    
    patient_id = "12345" # Example FHIR ID
    
    while True:
        print("\n==== eCW FHIR + Gemma4 Ambient AI ===")
        print("1. Generate Patient History Summary")
        print("2. Start Ambient Encounter (Structured ICD-10/CPT Extraction)")
        print("3. Exit")
        
        choice = input("Select an option (1-3): ")
        
        if choice == "1":
            generate_patient_summary(llm_client, extractor, patient_id)
        elif choice == "2":
            run_ambient_encounter(llm_client, extractor, patient_id)
        elif choice == "3":
            print("Exiting...")
            break
        else:
            print("Invalid option.")

if __name__ == "__main__":
    main()
