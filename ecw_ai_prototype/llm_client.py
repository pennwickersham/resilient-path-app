import os
import requests
import json
from typing import Dict, Any, Optional

class LocalGemmaClient:
    """
    Client for interacting with a local Gemma4 (26B A4B) model.
    Assumes the model is hosted via Ollama or LM Studio, which expose an OpenAI-compatible API.
    """
    def __init__(self, base_url: str = "http://localhost:11434/v1", api_key: str = "lm-studio"):
        self.base_url = base_url
        self.api_key = api_key
        # Default model string; adjust if your local server uses a different name for Gemma4
        self.default_model = "gemma4-26b-a4b" 

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

    def generate_completion(self, system_prompt: str, user_prompt: str, model: Optional[str] = None, temperature: float = 0.1) -> str:
        """
        Sends a prompt to the local Gemma model and returns the text response.
        We use a low temperature by default to keep medical extractions grounded and deterministic.
        """
        endpoint = f"{self.base_url}/chat/completions"
        
        payload = {
            "model": model or self.default_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": temperature,
            "max_tokens": 2048,
        }

        try:
            response = requests.post(endpoint, headers=self._get_headers(), json=payload)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
        except requests.exceptions.RequestException as e:
            print(f"Error communicating with local Gemma4 model: {e}")
            return f"Error: {e}"

# Example Usage:
if __name__ == "__main__":
    client = LocalGemmaClient()
    # Test connection
    print("Testing local Gemma4 connection...")
    response = client.generate_completion(
        system_prompt="You are a helpful AI medical assistant.",
        user_prompt="Explain what a Prior Authorization is in one sentence."
    )
    print(f"Response: {response}")
