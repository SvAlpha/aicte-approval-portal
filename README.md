# AI-Supported AICTE Approval Process Portal

**Course Code:** BTCS706N / BTIT706N  
**Institution:** Shri Vaishnav Institute of Information Technology (SVIIT), Shri Vaishnav Vidyapeeth Vishwavidyalaya (SVVV), Indore  
**Project Team:** Jayant Dhakad (Team Lead), Shreyansh Pachwariya, Raghav Verma, Abhishek Singh  
**Project Guide:** Prof. Namrata Bhatt  
**Specification Standard:** IEEE Std 830-1998 (*Software Requirements Specification v1.0*)

---

## 1. Project Overview and Features

The **AI-Supported AICTE Approval Process Portal** is a role-based web application that digitizes the technical institution approval workflow of the All India Council for Technical Education (AICTE). It serves three distinct roles (**College / Institution**, **Evaluator**, and **AICTE Admin**) and integrates two modular AI decision-support services behind Strategy Pattern interfaces:

* **Role-Based Authentication & Session Security (SRS Section 3.1):**
  * Unauthenticated visits default to the **Portal Sign In & Institution Registration** view.
  * User roles (`College`, `Evaluator`, `AICTEAdmin`) are resolved strictly from verified server-side account records rather than client-selected dropdowns.
  * Passwords are never stored or exposed in plain text (`#password` private ES2022 class fields + salted SHA-256 / bcrypt-format hashes).
  * Evaluators whose `is_verified` or `is_active` flag is `false` are rejected at sign-in and on protected API requests (`SRS 3.1 REQ-5`).
  * Public registration is restricted exclusively to `College` accounts (`SRS 3.1 REQ-1`).
  * Sessions use signed HMAC-SHA256 JSON Web Tokens (JWT) with expiration (`exp`) validation and server-side token revocation upon logout (`POST /api/auth/logout`).
* **College / Institution Workspace (SRS Section 3.2):**
  * Submit program approval applications with 5 mandatory statutory document categories (*Trust/Society Registration*, *Land and Infrastructure*, *Faculty List*, *Affidavit*, *Fee Payment Proof*).
  * Enforces file format (`PDF`, `JPG`, `PNG`) and size (`<= 10 MB`) validation (`SRS 3.2 REQ-3`) and prevents duplicate active submissions for the same program.
  * Real-time 6-stage lifecycle tracking (`Applied`, `Under Review`, `Clarification Requested`, `Recommended`, `Approved`, `Rejected`).
  * Conditional `<<extend>>` **Re-upload Flagged Document** workflow (`SRS 3.2 REQ-7`): replacement upload unlocks only on the specific document with an open `ClarificationRequest`, displays the evaluator's query anonymously (`SRS 3.4 REQ-4 & BR-4`), and automatically re-runs OCR extraction upon replacement (`SRS 3.3 REQ-3`).
* **AI Module 1 — Document Review & Field Extraction (`IDocumentProcessor` / `TesseractOCRService`, SRS Section 3.3):**
  * Extracts document text, calculates scan readability confidence (%), generates an executive summary, and highlights regulatory entities (registration numbers, built-up area in sq.ft vs. the 4,000 sq.ft norm, faculty count, payment UTR, and dates).
  * Clearly distinguishes scan readability confidence from regulatory compliance and provides a side-by-side manual full-text inspection view (`SRS 3.3 REQ-4 & REQ-5`).
* **Evaluator Workspace (SRS Section 3.4):**
  * Displays only applications assigned to the authenticated evaluator (`SRS 3.4 REQ-1`).
  * Enables document-specific clarification requests and formal recommendation submission (`Accept` / `Reject`, review comments, `site_visit_confirmed` checkbox, and timestamp) with explicit confirmation dialogs (`SRS 5.2`).
  * Enforces field-level access control on profile updates (`expertise` and `availability` are self-editable; `is_verified` and `is_active` are Admin-controlled per `SRS 3.4 REQ-7`).
* **AI Module 2 — Evaluator Suitability & Workload Matching (`IEvaluatorMatcher` / `NLPMatchingService`, SRS Section 3.5):**
  * Scores eligible (`is_active && is_verified && availability === 'Available'`) evaluators using domain keyword similarity (65% weight) and dynamically computed active workload count (35% weight, calculated live from active assigned applications per `SRS 3.5 REQ-2`).
* **AICTE Admin Workspace & Analytics (SRS Sections 3.6 & 3.7):**
  * System-wide application monitoring, AI-assisted evaluator assignment confirmation (`SRS 3.5 REQ-5`), evaluator onboarding and verification management, and confidential residential address visibility (`SRS 5.3 Privacy`).
  * Two-stage decision governance: preserves the evaluator's recommendation (`evaluator_recommendation`, `recommendation_submitted_at`) separately from the Admin's binding final decision (`final_decision`, `final_decision_reason`, `final_decision_at` per `SRS 3.6 REQ-6`).
  * Operational analytics (status counts and mean processing turnaround time) and an immutable audit log (`SRS 5.3`).

---

## 2. Technology Stack and Prerequisites

| Layer | Technology | Version / Requirement |
| :--- | :--- | :--- |
| **Runtime Environment** | Node.js | `v18.0.0+` (verified on `v18.20.4`; includes built-in `node --test` runner) |
| **Package Manager** | npm | `v9.0.0+` |
| **Frontend Framework** | React + Vite + Tailwind CSS + Lucide Icons | React `18.3.x`, Vite `5.3.x` |
| **Backend API** | Node.js HTTP / Express REST Architecture | Modular `controllers/`, `models/`, `services/`, `middleware/`, `database/` |
| **Database** | PostgreSQL (3NF Schema) + In-Memory Store | PostgreSQL `14+` (`backend/database/schema.sql`) with zero-config in-memory fallback (`backend/database/db.js`) |
| **Version Control & CI/CD** | Git + GitHub Actions | Git `2.30+` (`.github/workflows/ci.yml`) |

---

## 3. Important Files and Folder Structure

```text
aicte-approval-portal/
├── .github/workflows/ci.yml           # 4-Stage GitHub Actions CI/CD Pipeline (Lint, Test, OOP Audit, Deploy)
├── backend/
│   ├── controllers/
│   │   ├── ApplicationController.js   # Orchestrates submission, OCR, clarification loop, matcher & decisions
│   │   └── AuthController.js          # Server-resolved role login, College registration, /me & /logout
│   ├── database/
│   │   ├── db.js                      # Singleton DatabaseConnection + salted hash & token revocation store
│   │   └── schema.sql                 # PostgreSQL 3NF DDL for all 6 core entities + audit_logs + seed data
│   ├── middleware/
│   │   └── authMiddleware.js          # HMAC-SHA256 JWT sign/verify with expiry (exp) & authorizeRoles() RBAC
│   ├── models/
│   │   ├── College.js                 # Private #password, applyForApplication(), reuploadDocument()
│   │   ├── Application.js             # Lifecycle state machine & separate Stage 1 / Stage 2 decision fields
│   │   ├── Evaluator.js               # Private #password, REQ-5 login gate, REQ-7 field-level permissions
│   │   ├── Document.js                # REQ-3 file format/size validation & IDocumentProcessor delegation
│   │   ├── AICTEAdmin.js              # Private #password, assignEvaluator(), manageEvaluator(), finalizeDecision()
│   │   └── ClarificationRequest.js    # Anonymized toCollegeView() (strips raised_by_evaluator_id per BR-4)
│   ├── services/
│   │   ├── IDocumentProcessor.js      # <<interface>> Strategy abstraction for AI Module 1
│   │   ├── TesseractOCRService.js     # Concrete OCR & regulatory field extraction strategy
│   │   ├── IEvaluatorMatcher.js       # <<interface>> Strategy abstraction for AI Module 2
│   │   └── NLPMatchingService.js      # Concrete TF-IDF domain similarity + dynamic workload matcher
│   ├── tests/
│   │   ├── unit.test.js               # 7 unit test suites (Encapsulation, RBAC, Strategy, File Validation, JWT)
│   │   └── integration.test.js        # 2 end-to-end workflow, cross-institution isolation & HTTP API suites
│   ├── package.json
│   └── server.js                      # REST API HTTP server entry point (Port 5000)
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    # Complete multi-role React application & UML traceability reference
│   │   └── main.jsx                   # React DOM entry point
│   ├── index.html                     # HTML shell (Vite entry)
│   ├── package.json
│   ├── vercel.json                    # Vercel static build descriptor
│   └── vite.config.js                 # Vite dev server configuration (Port 5173)
├── docs/uml/                          # All 9 UML Diagrams (Use Case, Object, Class, Activity, Sequence, etc.)
├── render.yaml                        # Render cloud deployment & Managed PostgreSQL descriptor
├── setup_git.sh                       # Script to initialize/verify multi-branch Git history & PR merges
├── .env.example                       # Safe environment variable template (no hardcoded secrets)
└── README.md
```

---

## 4. Dependency Installation

Open a terminal in the project root directory (`aicte-approval-portal`):

```bash
# 1. Install backend packages (optional for running built-in tests/server, required for external DB/Express drivers)
cd backend
npm install

# 2. Install frontend React + Vite packages
cd ../frontend
npm install
```

---

## 5. Environment Variables and Safe Configuration (`.env.example`)

Copy `.env.example` to `backend/.env` when configuring custom secrets or an external PostgreSQL database:

```bash
cp .env.example backend/.env
```

Contents of `.env.example` (never commit real production secrets to Git):

```ini
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/aicte_portal
JWT_SECRET=replace-with-256-bit-production-secret
JWT_EXPIRY_SECONDS=28800
OCR_ENGINE_LANG=eng
FRONTEND_ORIGIN=http://localhost:5173
```

---

## 6. Database Setup, Initialization, and Migrations

The project supports two execution modes:

1. **Zero-Config In-Memory Mode (Default for Local Demo & Automated CI Tests):**
   * `DatabaseConnection.getInstance()` (`backend/database/db.js`) automatically initializes an in-memory relational store (`colleges`, `evaluators`, `aicte_admins`, `applications`, `documents`, `clarification_requests`, `audit_logs`) so the backend server and all 9 automated tests run immediately without requiring a local PostgreSQL service.
2. **External PostgreSQL 3NF Database Mode (Production / Staging):**
   * Create a PostgreSQL database named `aicte_portal` and run the migration script:
     ```bash
     psql -U postgres -d aicte_portal -f backend/database/schema.sql
     ```

---

## 7. External Service & AI Module Configuration

Per **SRS Section 2.5 (Open-Source Mandate)**, this project requires **zero paid third-party API keys**:
* **AI Module 1 (`TesseractOCRService`):** Uses deterministic pattern recognition and token extraction over uploaded document text streams (and supports `tesseract.js` for image buffers).
* **AI Module 2 (`NLPMatchingService`):** Computes TF-IDF / tokenized domain keyword overlap (65% weight) and live active workload balance (35% weight) locally with zero external API calls.

---

## 8 & 9. Exact Commands and Startup Order (Multi-Terminal Guide)

Start the **Backend API Server** first, followed by the **Frontend Vite Server** in a second terminal:

### Terminal 1 — Backend API Server (`backend/`)
```bash
cd backend
npm start
```
*Expected output:* `AICTE Approval Portal API listening on port 5000`

### Terminal 2 — Frontend React Server (`frontend/`)
```bash
cd frontend
npm run dev
```
*Expected output:* Vite dev server starts and opens `http://localhost:5173`.

---

## 10. Verified Local URLs and Ports

| Service | Local URL | Default Port | Configuration Source |
| :--- | :--- | :--- | :--- |
| **React Frontend Portal** | `http://localhost:5173` | `5173` | `frontend/vite.config.js` |
| **Backend REST API Server** | `http://localhost:5000` | `5000` | `backend/server.js` (`process.env.PORT \|\| 5000`) |
| **API Health Check** | `http://localhost:5000/api/health` | `5000` | Returns `{"status":"ok","service":"AI-Supported AICTE Approval Portal API"}` |

---

## 11. Build, Test, and Lint Commands

Run these commands from the `backend/` or `frontend/` directories:

```bash
# Run all 9 automated Unit, Security, and HTTP Integration tests (in backend/)
cd backend
npm test

# Run backend syntax & static check (in backend/)
npm run lint

# Build production static frontend bundle (in frontend/)
cd ../frontend
npm run build
```

---

## 12. Documented Non-Production Evaluation Demo Accounts

For academic evaluation and viva demonstration, the portal includes four non-production seeded accounts (also accessible via the **"Fill Login"** buttons on the Sign-In page or the opt-in **Demo Helper** toggle in the top bar):

| Role | Name / Institution | Email Credential | Test Password | Purpose in Evaluation |
| :--- | :--- | :--- | :--- | :--- |
| **College** | SVIIT College of Engineering (`college_101`) | `admin@sviit.edu` | `College@123` | Inspect `application_A501` (`Recommended`) & `application_A502` (`Clarification Requested`), re-upload flagged `document_D907`, or submit a new application. |
| **Evaluator** | Dr. R. Sharma (`evaluator_22`) | `r.sharma@iitb.ac.in` | `Evaluator@123` | View assigned applications (`A501`, `A502`), inspect OCR findings vs. manual source text, request clarifications, or submit a recommendation. |
| **AICTE Admin** | Dr. Vikram Sethi (`admin_01`) | `admin@aicte-india.org` | `Admin@123` | Run the Evaluator Matcher on unassigned `application_A503`, manage evaluator verification flags, record binding final decisions, and inspect analytics/audit logs. |
| **Evaluator (Unverified)** | Dr. K. V. Subramanian (`evaluator_25`) | `kv.sub@annauniv.edu` | `Evaluator@123` | Demonstrates **SRS 3.1 REQ-5** security enforcement: login is blocked because `is_verified = false`. |

---

## 13. Common Errors and Troubleshooting Steps

* **Error: `fatal: bad object refs/heads/develop` when running `git log` after extracting on Windows:**
  * *Cause:* Some Windows archive extractors skip empty `.git` subdirectories or alter read-only loose object permissions.
  * *Fix:* Run `./setup_git.sh` in Git Bash from the project root to rebuild the complete multi-branch commit and Pull Request history cleanly.
* **Error: `Port 5000 is already in use` (`EADDRINUSE`):**
  * *Fix:* Start the backend on an alternate port: `PORT=5001 npm start`.
* **Error: `node --test` unrecognized flag:**
  * *Cause:* Node.js version is older than `v18.0.0`.
  * *Fix:* Upgrade to Node.js `v18 LTS` or `v20 LTS` (`node -v`).

---

## 14. Known Limitations and External Service Notes

* **In-Memory Persistence vs. External PostgreSQL:** By default, runtime changes made during a demo session are stored in memory (and active session tokens are persisted in browser `localStorage`) so the project runs out-of-the-box on any lab machine without a local database server. Connecting persistent storage across server restarts requires executing `backend/database/schema.sql` on a PostgreSQL instance and wiring `pg.Pool` queries to `DATABASE_URL`.
* **Document Upload Content Extraction in Browser Sandbox:** When selecting a local `.pdf`, `.jpg`, or `.png` file in the browser, the portal validates the real filename extension and byte size (`<= 10 MB` per `SRS 3.2 REQ-3`) and runs `TesseractOCRService` over the document text buffer. Full binary raster-to-text OCR on scanned image bitmaps requires the `tesseract.js` WebAssembly worker or native `tesseract-ocr` binary in production.
