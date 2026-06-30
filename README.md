# CyberGuard AI

CyberGuard AI is a full-stack Security Operations Center platform for alert investigation, threat intelligence, MITRE ATT&CK mapping, detection engineering, threat hunting, and executive security reporting.

The platform uses deterministic, explainable analysis and local intelligence datasets. It runs without paid APIs or internet-dependent security services, making it suitable for repeatable demonstrations, local labs, and cybersecurity engineering portfolios.

## Core Capabilities

- JWT authentication with user and administrator roles
- Secure password hashing with bcrypt
- SQLite persistence through SQLAlchemy
- AI SOC Analyst with severity scoring and incident reports
- Local MITRE ATT&CK knowledge base and log-to-technique mapping
- Offline enrichment for IP addresses, domains, file hashes, and CVEs
- Sigma and YARA detection rule generation
- Threat hunting with pattern matching and attack timelines
- Security Operations Center dashboard with live SQLite analytics
- Executive security reports with copy, print, and Markdown export

## Platform Modules

### AI SOC Analyst

Analyzes authentication, network, malware, and other security events. Results include severity, risk score, suspicious indicators, MITRE ATT&CK mappings, threat intelligence enrichment, recommended actions, and an incident report.

### Threat Intelligence

Enriches indicators using local datasets and deterministic rules:

- Public, private, loopback, and reserved IP classification
- Known suspicious IP reputation
- Suspicious and known malicious domain detection
- MD5, SHA-1, and SHA-256 identification
- Local CVE severity, CVSS, description, and mitigation lookup

### MITRE ATT&CK Knowledge Base

Provides local technique search, detailed defensive guidance, detection ideas, mitigations, example keywords, and automatic mappings from logs.

### Detection Engineering

Generates recruiter-friendly Sigma and YARA rules from suspicious behavior. Each package includes an explanation, false-positive notes, recommended log sources, severity, and enriched MITRE mappings.

### Threat Hunting

Searches pasted logs for authentication, PowerShell, network, and credential-access behavior. It extracts timestamps, identifies matching lines, calculates risk, maps techniques, and reconstructs an attack timeline.

### Security Operations Dashboard

Aggregates existing SQLite records into:

- Alert and severity KPIs
- Security posture score
- MITRE technique distribution
- IOC category and tag analytics
- Alert, detection, and hunt trends
- Recent activity and latest security records
- Executive-ready Markdown reports

## Technology Stack

| Layer | Technology |
| --- | --- |
| Backend | Python 3.12, FastAPI, Pydantic |
| Database | SQLite, SQLAlchemy |
| Authentication | JWT, python-jose, passlib, bcrypt |
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS, Lucide icons |
| Analytics | Recharts |
| Local data | JSON MITRE and threat intelligence datasets |
| Containers | Docker Compose |

## Architecture

```text
Browser
  |
  v
Next.js frontend (localhost:3000)
  |
  | Bearer JWT / JSON
  v
FastAPI backend (127.0.0.1:8000)
  |
  +-- Authentication and role checks
  +-- Deterministic security analysis services
  +-- Local MITRE and threat intelligence JSON
  |
  v
SQLite database
  +-- users
  +-- investigations
  +-- detection_rules
  +-- hunting_results
```

Backend modules follow a service-oriented structure:

```text
backend/app/
|-- api/          # FastAPI routes
|-- core/         # Configuration and JWT security
|-- data/         # Local MITRE and threat intelligence datasets
|-- db/           # SQLAlchemy engine and sessions
|-- models/       # Database models
|-- schemas/      # Pydantic request and response contracts
|-- services/     # Security analysis and dashboard logic
`-- main.py       # Application setup and router registration
```

Frontend routes and API clients are organized as:

```text
frontend/
|-- app/
|   |-- dashboard/
|   |   |-- detection-engineering/
|   |   |-- mitre/
|   |   |-- reports/
|   |   |-- soc-analyst/
|   |   |-- threat-hunting/
|   |   `-- threat-intel/
|   |-- login/
|   `-- register/
`-- lib/          # Typed API and authentication clients
```

## Local Setup

### Prerequisites

- Python 3.12
- Node.js 20 or newer
- pnpm 11
- Git

### Backend

Open PowerShell in the repository root:

```powershell
cd backend
py -3.12 -m pip install -r requirements.txt
py -3.12 -m uvicorn app.main:app --reload
```

The backend is available at:

- API: `http://127.0.0.1:8000`
- Swagger documentation: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`

### Frontend

Open a second PowerShell window:

```powershell
cd frontend
npx.cmd pnpm@11.0.7 install
npx.cmd pnpm@11.0.7 dev
```

Open `http://localhost:3000`.

### Docker Compose

```powershell
docker compose up --build
```

## Configuration

The backend reads the following optional environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///./cyberguard.db` | SQLAlchemy database connection |
| `JWT_SECRET_KEY` | Development fallback | JWT signing secret |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Access token lifetime |

Set a strong JWT secret before any shared or deployed use:

```powershell
$env:JWT_SECRET_KEY = "replace-with-a-long-random-secret"
```

The frontend uses `NEXT_PUBLIC_API_BASE_URL` when provided and otherwise connects to `http://127.0.0.1:8000`.

## API Overview

All security workflow endpoints require a Bearer JWT unless noted otherwise.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Public backend health check |
| `POST` | `/api/auth/register` | Register a user and return a token |
| `POST` | `/api/auth/login` | Authenticate and return a token |
| `GET` | `/api/auth/me` | Return the current user |
| `GET` | `/api/protected/dashboard` | Validate protected dashboard access |
| `GET` | `/api/protected/admin` | Validate administrator access |
| `POST` | `/api/soc/analyze` | Analyze and store a security alert |
| `GET` | `/api/soc/history` | Return recent investigations |
| `GET` | `/api/mitre/techniques` | List local MITRE techniques |
| `GET` | `/api/mitre/techniques/{technique_id}` | Return one technique |
| `POST` | `/api/mitre/map-log` | Map log content to MITRE techniques |
| `POST` | `/api/threat-intel/enrich` | Enrich an IP, domain, hash, or CVE |
| `GET` | `/api/threat-intel/ip/{ip}` | Enrich an IP address |
| `GET` | `/api/threat-intel/cve/{cve}` | Look up a local CVE |
| `POST` | `/api/detection/generate` | Generate Sigma and YARA rules |
| `GET` | `/api/detection/history` | Return recent generated rules |
| `POST` | `/api/hunting/query` | Run a deterministic threat hunt |
| `GET` | `/api/hunting/history` | Return recent hunts |
| `GET` | `/api/dashboard/overview` | Return SOC metrics and analytics |
| `GET` | `/api/dashboard/report` | Generate an executive Markdown report |

## Recommended Test Workflow

1. Register a user and sign in.
2. Analyze a failed-login or suspicious PowerShell event in AI SOC Analyst.
3. Review MITRE mappings and automatic source/destination IP enrichment.
4. Open the alert in Threat Hunting and inspect the generated timeline.
5. Generate a Sigma/YARA detection package from the investigation.
6. Return to the Security Operations Center and verify that KPIs and charts update.
7. Open Executive Reports and test Copy, Download Markdown, and Print.

## Security Notes

- Passwords are hashed and never stored as plaintext.
- JWTs expire after the configured lifetime.
- Protected endpoints validate Bearer tokens and user activity status.
- CORS is restricted to the configured local frontend origins.
- Local datasets and deterministic analysis keep security decisions explainable.
- The browser stores the access token in local storage for this MVP. A production deployment should prefer secure, HTTP-only cookies and add refresh-token rotation, rate limiting, audit logging, and managed secret storage.
- Generated rules and enrichment results are defensive aids and should be validated before use in a production SIEM or endpoint platform.

## Validation

Frontend type checking and production build:

```powershell
cd frontend
npx.cmd tsc --noEmit
npx.cmd next build
```

Backend syntax validation:

```powershell
cd backend
py -3.12 -m compileall app
```

## Project Scope

CyberGuard AI is focused on safe, defensive security workflows. It does not execute malware, exploit systems, or run offensive tooling. Future integrations can add optional data providers such as OTX or NVD while preserving the current offline-first analysis path.
