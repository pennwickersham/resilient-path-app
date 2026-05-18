import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from llm_client import LocalGemmaClient
from prompts import MedicalPrompts

class ECWLocalHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        # Allow CORS so the browser extension can talk to localhost
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            action = data.get('action')
            patient_data = data.get('patient_data', {})
            
            client = LocalGemmaClient(base_url="http://localhost:11434/v1")
            response_text = ""

            if action == 'generate_summary':
                user_prompt = f"Patient Data:\n{json.dumps(patient_data, indent=2)}"
                response_text = client.generate_completion(
                    system_prompt=MedicalPrompts.PATIENT_HISTORY_SYSTEM,
                    user_prompt=user_prompt
                )
            
            elif action == 'generate_prior_auth':
                target = data.get('target', 'Requested Treatment')
                user_prompt = f"Patient Data:\n{json.dumps(patient_data, indent=2)}\nTarget Request: {target}"
                response_text = client.generate_completion(
                    system_prompt=MedicalPrompts.PRIOR_AUTH_SYSTEM,
                    user_prompt=user_prompt
                )
            
            else:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "Unknown action"}).encode('utf-8'))
                return

            self._set_headers()
            self.wfile.write(json.dumps({"result": response_text}).encode('utf-8'))
            
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

def run_server(port=8080):
    server_address = ('', port)
    httpd = HTTPServer(server_address, ECWLocalHandler)
    print(f"Local AI Server running on http://localhost:{port}")
    print("Waiting for browser extension to send data...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    print("Server stopped.")

if __name__ == '__main__':
    run_server()
