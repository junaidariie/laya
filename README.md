# Laya AI Customer Support

> 🎬 **Demo video:** [https://youtu.be/OGQVYSR0TI8](https://youtu.be/OGQVYSR0TI8)

An AI-powered customer support console that uses **Laya** to classify and route incoming tickets, **LangGraph** to orchestrate the pipeline, and **GPT-OSS 120B via Groq** to generate responses — all streamed live to a React frontend.

---

## How it works

Every ticket you submit goes through a 3-step pipeline:

```
User Message
     │
     ▼
┌─────────────┐
│Laya Analysis│  ← classifies department, urgency, refund probability
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Route Ticket │  ← decides: AI response or human escalation
└──────┬──────┘
       │
       ├── critical urgency or security/legal keywords
       │         ▼
       │   ┌──────────────────┐
       │   │ Human Escalation │
       │   └──────────────────┘
       │
       └── everything else
                 ▼
         ┌───────────────────┐
         │ LLM Response      │  ← GPT-OSS 120B via Groq, streamed live
         └───────────────────┘
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Ticket classification | Laya Router |
| Pipeline orchestration | LangGraph |
| LLM | GPT-OSS 120B via Groq API |
| Backend | FastAPI + Server-Sent Events |
| Frontend | React + Vite |

---

## Prerequisites

Make sure you have these installed before starting:

- **Python 3.10+**
- **Node.js 18+** and **npm**
- A **Groq API key** — get one free at [console.groq.com](https://console.groq.com)

---

## Project structure

```
customer support laya/
├── app.py                        # FastAPI backend, SSE streaming endpoint
├── requirements.txt              # Python dependencies
├── .env                          # Your API keys (you create this)
├── services/
│   ├── Laya_service.py           # Laya router setup and ticket analysis
│   └── LangGraph_service.py      # LangGraph pipeline, routing logic, LLM call
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx               # Main app, SSE stream handler
        ├── index.css             # All styles
        └── components/
            ├── Sidebar.jsx
            ├── InputArea.jsx     # Textarea + example chips
            ├── AnalysisPanel.jsx # Pipeline trace + Laya metrics
            └── ResponsePanel.jsx # Streaming LLM response
```

---

## Setup

### 1. Clone or download the project

If you downloaded a zip, extract it. Open a terminal and navigate into the project folder:

```bash
cd "customer support laya"
```

### 2. Create your `.env` file

Create a file called `.env` in the root of the project (next to `app.py`) with the following:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Replace `your_groq_api_key_here` with your actual key from [console.groq.com](https://console.groq.com).

### 3. Set up the Python backend

Create and activate a virtual environment:

```bash
# Create virtual environment
python -m venv myvenv

# Activate it — Windows
myvenv\Scripts\activate

# Activate it — Mac/Linux
source myvenv/bin/activate
```

Install all dependencies:

```bash
pip install -r requirements.txt
```

> This may take a few minutes the first time as it downloads Laya and its model weights.

### 4. Set up the React frontend

```bash
cd frontend
npm install
cd ..
```

---

## Running locally

You need **two terminals open at the same time** — one for the backend, one for the frontend.

### Terminal 1 — Start the backend

```bash
# Make sure your virtual environment is active
myvenv\Scripts\activate

# Start the FastAPI server
uvicorn app:app --reload
```

You should see:

```
⏳ Loading Laya router...
✅ Laya router ready.

INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Terminal 2 — Start the frontend

```bash
cd frontend
npm run dev
```

You should see:

```
  VITE v8.x.x  ready in Xms

  ➜  Local:   http://localhost:5173/
```

### Open the app

Go to **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## Using the app

**Type a ticket** in the textarea and press Enter (or click Send).

**Or click a quick example chip** — the question fills the textarea so you can read it, then auto-submits after 1.2 seconds. You can edit it or click Send early to skip the wait.

**Watch the pipeline run live:**
- The Pipeline Trace panel shows each node activating in real time
- The Analysis Panel fills in department, urgency, confidence scores, and probability gauges as Laya finishes
- The Response Panel streams the LLM reply word by word

**Routing logic:**
- Tickets containing words like `hacked`, `legal action`, `lawsuit`, `fraud`, `unauthorized access` → escalated to human
- Tickets scored as `critical` urgency by Laya → escalated to human
- Everything else → handled by the AI

---

## API endpoints

The backend exposes two endpoints if you want to test directly:

| Method | URL | Description |
|---|---|---|
| GET | `http://127.0.0.1:8000/` | Health check |
| POST | `http://127.0.0.1:8000/chat/stream` | Submit a ticket, returns SSE stream |

Example request with curl:

```bash
curl -X POST http://127.0.0.1:8000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "I was charged twice this month"}' \
  --no-buffer
```

---

## Troubleshooting

**Laya takes a long time to start**
This is normal on first run — it downloads model weights. Subsequent starts are faster.

**`GROQ_API_KEY` not found error**
Make sure your `.env` file is in the root folder (same level as `app.py`) and contains the correct key.

**Frontend shows a connection error**
Make sure the backend is running on port 8000 before opening the frontend. Check Terminal 1 for errors.

**Everything routes to human escalation**
The routing is intentionally strict — only `critical` urgency tickets or messages containing explicit security/legal keywords escalate. Normal billing, technical, and account questions should always go to AI.

**Port already in use**
If port 8000 is taken, run the backend on a different port:
```bash
uvicorn app:app --reload --port 8001
```
Then update the `API` constant in `frontend/src/App.jsx` to match.
