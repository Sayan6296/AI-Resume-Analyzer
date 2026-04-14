# AI Resume Analyzer

A full-stack AI chatbot-style resume analyzer with a pure Python backend and a React frontend.

## Folder Structure

```text
AI Resume Analyzer/
├── backend/
│   └── server.py
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   └── vite.config.js
└── README.md
```

## Backend

- Uses only Python built-in libraries.
- Exposes `POST /analyze`.
- Reads resume text from the request body.
- Calls the OpenRouter Chat Completions API.
- Returns strengths, weaknesses, and suggestions to the frontend.

## Frontend

- React UI with a textarea for resume text.
- Sends a POST request to `http://localhost:8000/analyze`.
- Shows the AI analysis response in the page.

## Setup

### 1. Add Your OpenRouter API Key

In PowerShell:

```powershell
$env:OPENROUTER_API_KEY="your_openrouter_api_key_here"
```

Optional model override:

```powershell
$env:OPENROUTER_MODEL="openai/gpt-4o-mini"
```

If `OPENROUTER_MODEL` is not set, the backend uses `openai/gpt-4o-mini`.

### 2. Start The Backend

```powershell
cd backend
python server.py
```

The backend runs on:

```text
http://localhost:8000
```

### 3. Start The Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

The React app runs on:

```text
http://localhost:5173
```

## How It Works

1. The user pastes resume text into the React textarea.
2. The user clicks **Analyze Resume**.
3. React sends:

```json
{
  "resumeText": "..."
}
```

to:

```text
POST http://localhost:8000/analyze
```

4. The Python backend validates the request and creates a prompt for OpenRouter.
5. OpenRouter returns an AI-generated resume analysis.
6. The backend returns:

```json
{
  "analysis": "..."
}
```

7. The React UI displays the result.

## API Notes

OpenRouter's chat API uses:

```text
POST https://openrouter.ai/api/v1/chat/completions
Authorization: Bearer <OPENROUTER_API_KEY>
Content-Type: application/json
```

The backend implements this with Python's built-in `urllib.request`, so no backend package installation is needed.
