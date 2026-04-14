import json
import os
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer


HOST = "0.0.0.0"
PORT = 8000
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "openai/gpt-4o-mini"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")


def load_env_file(path):
    if not os.path.exists(path):
        return

    with open(path, "r", encoding="utf-8") as env_file:
        for line in env_file:
            line = line.strip()

            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")

            if key and not os.environ.get(key):
                os.environ[key] = value


def json_response(handler, status_code, payload):
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status_code)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.end_headers()
    handler.wfile.write(body)


def build_resume_prompt(resume_text):
    return (
        "Analyze this resume and provide feedback.\n\n"
        "Resume:\n" + resume_text + "\n\n"
        "Format your response as:\n"
        "STRENGTHS:\n[2-3 bullet points]\n\n"
        "WEAKNESSES:\n[2-3 bullet points]\n\n"
        "SUGGESTIONS:\n[2-3 bullet points]"
    )


def call_openrouter(resume_text):
    load_env_file(ENV_PATH)
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY environment variable is not set.")

    model = os.environ.get("OPENROUTER_MODEL", DEFAULT_MODEL)
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an expert resume reviewer. IMPORTANT: Always start your response with:\n"
                    "Score: [number 0-100]\n"
                    "Fit: [low or medium or high]\n"
                    "Impact: [number 0-100]\n\n"
                    "Then provide detailed feedback in the requested format."
                ),
            },
            {"role": "user", "content": build_resume_prompt(resume_text)},
        ],
        "temperature": 0.3,
        "max_tokens": 1200,
    }

    request_body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        OPENROUTER_URL,
        data=request_body,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "AI Resume Analyzer",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            response_body = response.read().decode("utf-8")
            data = json.loads(response_body)
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenRouter request failed: {exc.code} {error_body}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Could not reach OpenRouter: {exc.reason}") from exc

    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError("OpenRouter returned an unexpected response format.") from exc


class ResumeAnalyzerHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path != "/analyze":
            json_response(self, 404, {"error": "Route not found."})
            return

        content_length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(content_length).decode("utf-8")

        try:
            body = json.loads(raw_body)
        except json.JSONDecodeError:
            json_response(self, 400, {"error": "Invalid JSON body."})
            return

        resume_text = body.get("resumeText", "").strip()
        if not resume_text:
            json_response(self, 400, {"error": "resumeText is required."})
            return

        try:
            analysis = call_openrouter(resume_text)
        except RuntimeError as exc:
            json_response(self, 500, {"error": str(exc)})
            return

        json_response(self, 200, {"analysis": analysis})

    def log_message(self, format, *args):
        print("%s - %s" % (self.address_string(), format % args))


def run_server():
    server = HTTPServer((HOST, PORT), ResumeAnalyzerHandler)
    print(f"Backend running at http://{HOST}:{PORT}")
    print("POST resume text to /analyze")
    server.serve_forever()


if __name__ == "__main__":
    load_env_file(ENV_PATH)
    run_server()
