# CyberGuard AI

CyberGuard AI is a full-stack cybersecurity portfolio project for SOC automation, threat intelligence, MITRE ATT&CK mapping, detection engineering, and security analytics. This repository is being built in phases so each module stays clean, testable, and easy to explain in interviews.

## Phase 1 Scope

- Base monorepo structure for backend, frontend, and Docker.
- FastAPI backend with health/status endpoints.
- Next.js frontend with a landing page and dashboard layout.
- Sidebar navigation and cards for SOC Analyst, Threat Intel, MITRE Mapping, and Detection Rules.
- Docker Compose setup for local development.

## Tech Stack

- Backend: Python, FastAPI
- Frontend: Next.js, React, Tailwind CSS
- Database: SQLite planned for Phase 2
- Auth: JWT planned for Phase 2
- AI: Local Ollama-ready architecture planned for later phases, with rule-based fallback logic first
- Deployment: Docker Compose

## Project Structure

```text
cyberguard-ai/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── db/
│   │   └── utils/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── README.md
└── .gitignore
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | Backend health check |
| GET | `/api/status` | Phase and platform status |

## Run Locally

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`.

Python 3.12 is recommended for local development. The Docker setup uses Python 3.12.

### Frontend

```bash
cd frontend
corepack enable
pnpm install
pnpm dev
```

Frontend runs at `http://localhost:3000`.

### Docker Compose

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Phase Roadmap

1. Project setup
2. JWT authentication and SQLite users
3. AI SOC Analyst module
4. MITRE ATT&CK local mapping
5. Threat intelligence enrichment
6. Sigma and YARA detection generation
7. Threat hunting console
8. Dashboard analytics
9. DevSecOps scanner
10. Docker polish and final README

## Portfolio Positioning

CyberGuard AI is designed to demonstrate practical cybersecurity engineering skills: API design, security workflow automation, local-first AI architecture, detection logic, ATT&CK mapping, dashboard UX, and production-style project organization.
