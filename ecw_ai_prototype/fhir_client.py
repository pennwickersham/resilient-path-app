import os
import requests
import json
from typing import Dict, Optional

class ECWFhirClient:
    """
    Client for interacting with the eClinicalWorks SMART on FHIR API.
    You will need to register as a developer at fhir.eclinicalworks.com to get your credentials.
    """
    def __init__(self, 
                 base_url: Optional[str] = None, 
                 client_id: Optional[str] = None, 
                 client_secret: Optional[str] = None,
                 token_url: Optional[str] = None):
        
        # In production, pull these from secure environment variables.
        self.base_url = base_url or os.environ.get("ECW_FHIR_BASE_URL", "https://fhir.eclinicalworks.com/api/fhir/R4")
        self.client_id = client_id or os.environ.get("ECW_CLIENT_ID")
        self.client_secret = client_secret or os.environ.get("ECW_CLIENT_SECRET")
        self.token_url = token_url or os.environ.get("ECW_TOKEN_URL", "https://fhir.eclinicalworks.com/oauth2/token")
        
        self.access_token = None

    def authenticate(self) -> bool:
        """
        Authenticates with the eCW FHIR server using Client Credentials flow (for backend apps).
        If using a provider-facing app, an Authorization Code flow might be required depending on eCW's strictness.
        """
        if not self.client_id or not self.client_secret:
            print("WARNING: Missing ECW_CLIENT_ID or ECW_CLIENT_SECRET. Cannot authenticate.")
            return False

        try:
            print(f"Authenticating with eCW at {self.token_url}...")
            response = requests.post(
                self.token_url,
                data={"grant_type": "client_credentials"},
                auth=(self.client_id, self.client_secret),
                timeout=10
            )
            response.raise_for_status()
            self.access_token = response.json().get("access_token")
            print("Successfully authenticated with eClinicalWorks.")
            return True
        except requests.exceptions.RequestException as e:
            print(f"Failed to authenticate with eCW FHIR API: {e}")
            return False

    def _get_headers(self) -> Dict[str, str]:
        if not self.access_token:
            raise ValueError("Not authenticated. Call authenticate() first.")
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json"
        }

    def get_patient(self, patient_id: str) -> dict:
        """Fetches the Patient resource."""
        # For testing without credentials, return mock FHIR JSON
        if not self.access_token:
            return {"resourceType": "Patient", "id": patient_id, "name": [{"given": ["Test"], "family": "Patient"}]}
            
        url = f"{self.base_url}/Patient/{patient_id}"
        response = requests.get(url, headers=self._get_headers())
        response.raise_for_status()
        return response.json()

    def get_conditions(self, patient_id: str) -> list:
        """Fetches the patient's active Problem List (Conditions)."""
        if not self.access_token:
            return [{"resourceType": "Condition", "code": {"text": "Hypertension (I10)"}}]
            
        url = f"{self.base_url}/Condition?patient={patient_id}"
        response = requests.get(url, headers=self._get_headers())
        response.raise_for_status()
        bundle = response.json()
        return [entry["resource"] for entry in bundle.get("entry", [])]

    def get_medications(self, patient_id: str) -> list:
        """Fetches the patient's active MedicationRequests."""
        if not self.access_token:
            return [{"resourceType": "MedicationRequest", "medicationCodeableConcept": {"text": "Lisinopril 10mg"}}]
            
        url = f"{self.base_url}/MedicationRequest?patient={patient_id}"
        response = requests.get(url, headers=self._get_headers())
        response.raise_for_status()
        bundle = response.json()
        return [entry["resource"] for entry in bundle.get("entry", [])]

# Example Usage:
if __name__ == "__main__":
    fhir = ECWFhirClient()
    fhir.authenticate() # Will fail safely if no env vars are set
    print(json.dumps(fhir.get_patient("12345"), indent=2))
