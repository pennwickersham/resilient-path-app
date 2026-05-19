from fhir_client import ECWFhirClient

class ECWExtractor:
    """
    Extracts patient data purely via the official eClinicalWorks SMART on FHIR API.
    """
    def __init__(self, fhir_client: ECWFhirClient):
        self.fhir = fhir_client
        # Ensure we are authenticated
        self.fhir.authenticate()

    def get_patient_demographics(self, patient_id: str) -> dict:
        print(f"[FHIR] Extracting Demographics for {patient_id}...")
        patient_data = self.fhir.get_patient(patient_id)
        
        # Parse standard FHIR R4 Patient resource
        name_obj = patient_data.get("name", [{}])[0]
        name = f"{name_obj.get('given', [''])[0]} {name_obj.get('family', '')}".strip()
        dob = patient_data.get("birthDate", "Unknown")
        gender = patient_data.get("gender", "Unknown")
        
        return {"name": name, "dob": dob, "gender": gender}

    def get_patient_history(self, patient_id: str) -> dict:
        print(f"[FHIR] Extracting Clinical History for {patient_id}...")
        
        # 1. Fetch Problem List
        conditions = self.fhir.get_conditions(patient_id)
        problem_list = []
        for c in conditions:
            # FHIR Condition.code.text or Condition.code.coding[0].display
            code_text = c.get("code", {}).get("text")
            if not code_text:
                codings = c.get("code", {}).get("coding", [])
                if codings:
                    code_text = codings[0].get("display", "Unknown Condition")
            if code_text:
                problem_list.append(code_text)

        # 2. Fetch Active Medications
        meds = self.fhir.get_medications(patient_id)
        med_list = []
        for m in meds:
            med_text = m.get("medicationCodeableConcept", {}).get("text")
            if med_text:
                med_list.append(med_text)

        return {
            "problem_list": problem_list,
            "medications": med_list
        }

# Example Usage:
if __name__ == "__main__":
    client = ECWFhirClient()
    extractor = ECWExtractor(client)
    print(extractor.get_patient_demographics("12345"))
    print(extractor.get_patient_history("12345"))
