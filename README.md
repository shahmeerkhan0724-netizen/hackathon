# HCM Lite — AI-Assisted Human Capital Management System

**HCM Lite** is a production-minded, modular, and secure Human Capital Management platform developed for the **Saylani Hackathon**. It features an enterprise-grade Node.js/Express backend, an elegant React/Vite dashboard, and an integrated Groq LLM copilot that provides read-only conversational business intelligence and HR operational acceleration.

---

## 1. System Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        HCM Lite Architecture                           │
└────────────────────────────────────────────────────────────────────────┘

 [ Client: React 19 + Vite 8 + Ant Design + Tailwind CSS v4 ]
                               │
                      Axios / Bearer JWT
                               ▼
 [ Backend: Express 5 + Node.js ES Modules (server/) ]
   ├── Authentication & RBAC (Admin, HR, Employee)
   ├── Rate Limiting (express-rate-limit) & Security Headers (Helmet)
   ├── Zod Request Validation & Error Formatting (ApiError)
   ├── Server-Authoritative Time & Geofenced Attendance
   ├── Progressive Tax Engine (Pakistan Slabs 1–5) & PDFKit Payslips
   ├── Append-Only Audit Logging with Secret Masking
   └── Groq AI Copilot (Function Calling / Read-Only Tools)
                               │
               Mongoose ORM (Compound Unique Indexes)
                               ▼
       [ Database: MongoDB Atlas / Replicated Cluster ]
```

---

## 2. Technology Stack

### Backend (`server/`)
- **Runtime:** Node.js (ES Modules, `"type": "module"`)
- **Web Framework:** Express 5
- **Database & ODM:** MongoDB Atlas with Mongoose (17 defined models with compound indexes)
- **Security & Auth:** JSON Web Tokens (JWT), bcryptjs password hashing, Helmet, express-rate-limit
- **Validation:** Zod schemas
- **Document Generation:** PDFKit for production-ready payslip PDF generation
- **CSV Processing:** csv-parse and csv-stringify for dry-run validation and bulk imports/exports
- **AI Integration:** Groq SDK (`openai/gpt-oss-20b` / `llama3-70b-8192`) with read-only tools
- **Testing:** Node.js native test runner (`node --test tests/**/*.test.js`)

### Frontend (`client/`)
- **Framework:** React 19 with Vite 8
- **UI Components:** Ant Design (antd v6) with enterprise Indigo theme (`#4338CA`)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Routing:** React Router v8 with declarative role-protected routes
- **Icons:** React Icons (`react-icons/fi`)
- **State Management:** React Context API (`AuthContext`)

---

## 3. User Roles & Access Control Matrix

| Feature / Module | Admin | HR | Employee |
| :--- | :---: | :---: | :---: |
| First-Run Company Setup | **Yes** (initial) | No | No |
| Company Settings & Work Policies | **Yes** | Read-Only | Read-Only |
| Department & Designation Management | **Yes** | Read-Only | Read-Only |
| Employee Directory & Profile (Full) | **Yes** | **Yes** | Own Only |
| Employee Onboarding & Temporary Password | **Yes** | **Yes** | No |
| CSV Dry-Run Import & Employee Export | **Yes** | **Yes** | No |
| Daily Check-In / Check-Out | Own | Own | **Own Only** |
| Attendance Board & Correction Review | **Yes** | **Yes** | Correction Request Only |
| Leave Applications | Own | Own | **Own Only** |
| Leave Approval / Rejection | No | **Yes** | No |
| Salary Structure Configuration | **Yes** | **Yes** | No |
| Payroll Run Generation (Draft) | No | **Yes** | No |
| Payroll Run Finalization (Lock) | **Yes** | No | No |
| Payslip PDF Access & Download | **Yes** | **Yes** | Own Only (IDOR Protected) |
| System Audit Logs (Append-Only) | **Yes** | No | No |
| Groq AI HR Copilot & Smart Leave | **Yes** | **Yes** | **Yes** (Role-scoped data) |
| Announcements & Broadcasts | Post/Read | Post/Read | Read-Only |

---

## 4. Quick Start Guide

### Prerequisites
- Node.js >= 20.x (tested on v25.2.1)
- MongoDB instance (MongoDB Atlas connection string or local MongoDB)
- Groq API Key (optional for AI features)

### Step 1: Clone and Configure Backend
```bash
cd server
cp .env.example .env
npm install
```

Configure `server/.env`:
```env
PORT=8000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/hackathon?retryWrites=true&w=majority
JWT_SECRET=your_jwt_super_secret_key_minimum_32_characters_long
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
AI_API_KEY=your_groq_api_key_here
AI_MODEL=openai/gpt-oss-20b
```

### Step 2: Run Backend Tests
Run the automated test suite across all 20 requirements:
```bash
npm test
```
*Result: 30 passing tests (13 unit tests, 17 integration tests).*

### Step 3: Start the Backend Server
```bash
npm start
# or for live reload during development:
npm run dev
```
The server connects to MongoDB and listens on `http://localhost:8000`.

### Step 4: Configure and Start Frontend
```bash
cd ../client
cp .env.example .env
npm install
npm run dev
```
Frontend launches at `http://localhost:5173`.

### Step 5: First-Run Initialization
1. Navigate to `http://localhost:5173`.
2. The application detects that no company exists and directs you to `/setup`.
3. Fill in Company Name, Domain, Currency, and initial Admin credentials.
4. Once completed, log in as the Admin or HR.

---

## 5. Automated Verification & Test Coverage

The test suite in `server/tests/` verifies all functional and non-functional requirements:

```text
✔ Req 20: Invalid request bodies should be rejected with consistent 400 errors
✔ Req 1: First-run setup should succeed once and reject a second initialization with 409
✔ Req 2: Valid login succeeds; invalid credentials fail (401)
✔ Req 4: Missing or invalid JWT is rejected (401)
✔ Req 5: Role middleware blocks unauthorized operations
✔ Req 6: Employee A cannot read Employee B's profile (IDOR protection)
✔ Req 7: Duplicate daily check-in returns 409, including concurrent attempts
✔ Req 8: Check-out cannot precede check-in
✔ Req 10: Overlapping and over-quota leave requests are rejected
✔ Req 11: Only HR can decide leave requests (Employee and Admin cannot)
✔ Req 13 & 14: Only Admin can finalize payroll; Finalized payroll cannot be changed
✔ Req 15: Employees cannot access another employee's payslip PDF
✔ Req 16: Dashboard calculations use database records
✔ Req 17: AI tools obey caller permissions and fail safely when API key is missing
✔ Req 18: Users cannot access another user's notifications
✔ Req 19: Only Admin can view audit logs
✔ Unit Tests: Working Days & Holiday deduction utility (Req 9)
✔ Unit Tests: Progressive Pakistan Tax Slabs 1–5 calculation (Req 12)
✔ Unit Tests: Passwords hashing, JWT verification, and ApiError format (Req 3 & 4)

Total: 30 passed, 0 failed, 100% clean exit.
```

---

## 6. Frontend Build Verification

The frontend has been verified with production build checks:
```bash
cd client
npm run build
```
Build output:
```text
vite v8.3.5 building client environment for production...
transforming...
✓ 1658 modules transformed.
rendering chunks...
dist/index.html                     0.45 kB
dist/assets/index-Opgki6gz.css     40.22 kB
dist/assets/index-BUQQEwzN.js   1,470.86 kB
✓ built in 7.26s
```

---

## 7. Deliverables & Repository Structure

- [server/](file:///C:/Users/kk/OneDrive/Desktop/hackathone/server) — Backend with Express 5, Mongoose, JWT, PDFKit, and Groq SDK
- [server/README.md](file:///C:/Users/kk/OneDrive/Desktop/hackathone/server/README.md) — Detailed backend API specifications and route table
- [client/](file:///C:/Users/kk/OneDrive/Desktop/hackathone/client) — Frontend with React 19, Vite 8, Ant Design, Tailwind v4
- [client/README.md](file:///C:/Users/kk/OneDrive/Desktop/hackathone/client/README.md) — Frontend architecture and styling documentation
