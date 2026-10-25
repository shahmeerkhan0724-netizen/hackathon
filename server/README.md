# HCM Lite — AI-Assisted Human Capital Management System Backend

Production-ready, modular, secure Node.js backend built with Express 5, MongoDB, Mongoose, JWT authentication, and Groq SDK for the Saylani Hackathon.

---

## 1. Architecture & Design Principles

The backend is organized with strict separation of concerns into distinct layers:

```text
server/
├── server.js                  # Entrypoint, DB connection, graceful shutdown
├── app.js                     # Express app configuration, security, routes mounting
├── package.json               # Dependencies and scripts (ES modules)
├── .env.example               # Environment variable template
├── config/
│   ├── db.js                  # Robust Mongoose connection manager with reconnection
│   ├── env.js                 # Environment variable loader & validator
│   └── constants.js           # Roles, statuses, leave quotas, system defaults
├── models/                    # 17 Mongoose schemas with compound indexes & constraints
├── routes/                    # Modular Express routes with permission & rate limit middleware
├── controllers/               # Thin HTTP handlers invoking services via asyncHandler
├── services/                  # Core business logic, transactions, and aggregations
├── middleware/                # Authenticate, authorize, validate, rateLimiters, errorHandler
├── validators/                # Zod request validation schemas
├── utils/                     # ApiError, workingDays, taxCalculator, audit, pagination
├── tests/
│   ├── unit.test.js           # Unit tests (tax slabs, working days, hashing, JWT)
│   └── api.test.js            # End-to-end integration tests (20 test requirements)
└── README.md                  # Complete documentation and API contract table
```

### Key Security & Integrity Guarantees
- **No IDOR (Insecure Direct Object References):** Employees can never view another employee's profile, attendance records, leaves, or payslip PDFs.
- **Role-Based Access Control (RBAC):** Strict verification across `ADMIN`, `HR`, and `EMPLOYEE`.
  - Admin: System configuration, initial setup, account administration, audit logs, payroll finalization.
  - HR: Employee directory, onboarding, salary structures, leave decisions, attendance correction decisions, draft payroll. Cannot finalize payroll or view audit logs.
  - Employee: Self-service attendance (check-in/check-out), leave applications, own leave balances, own payslips, and self-profile updates (contact & emergency info only).
- **Concurrency & Race Condition Protection:**
  - Setup initialization cannot be executed twice (HTTP 409 Conflict).
  - One check-in per employee per local calendar day enforced via compound unique indexes and atomic operations.
  - Concurrency-safe leave decision updates preventing duplicate approvals.
  - Immutable finalized payroll runs with Admin-only authorization.
- **Server-Authoritative Time:** Server timestamps are authoritative; client-provided check-in times are rejected.
- **Safe Auditing:** All critical business actions are logged to an append-only `AuditLog` collection with password hashes, secrets, and tokens automatically redacted.

---

## 2. Environment Variables

Create a `.env` file in the `server/` directory:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | HTTP Server port | `8000` |
| `NODE_ENV` | Application environment (`development` / `production` / `test`) | `development` |
| `MONGODB_URI` | MongoDB Atlas or local connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key used to sign JWT tokens (min 32 chars) | `your_secure_jwt_secret_key` |
| `JWT_EXPIRES_IN`| Token lifespan | `1d` |
| `CLIENT_URL` | Frontend URL for CORS authorization | `http://localhost:5173` |
| `ADMIN_EMAIL` | Optional default initial Admin email | `admin@hcmlite.com` |
| `ADMIN_PASSWORD`| Optional default initial Admin password | `AdminSecure123!` |
| `AI_API_KEY` | Groq API Key | `gsk_...` |
| `AI_MODEL` | Groq Model ID | `llama-3.3-70b-versatile` |

---

## 3. Local Setup & Commands

### Prerequisites
- Node.js `v20.0.0+` (verified on Node `v25.2.1`)
- MongoDB Atlas cluster or local MongoDB instance

### Installation & Run

```bash
cd server

# Install dependencies (all packages are already pinned in package.json)
npm install

# Start development server with auto-reload
npm run dev

# Run all 30 automated tests
npm test

# Run production server
npm start
```

---

## 4. First-Run Setup Workflow

1. Check system status:
   ```http
   GET /api/setup/status
   ```
   Returns `{ isInitialized: false }` if no Admin or Company exists.

2. Initialize Company and Initial Admin:
   ```http
   POST /api/setup/initialize
   Content-Type: application/json

   {
     "companyName": "Acme Global Technologies",
     "adminEmail": "admin@acme.com",
     "adminPassword": "AdminSecurePassword123!",
     "officeStartTime": "09:00",
     "gracePeriodMinutes": 15,
     "halfDayHours": 5,
     "weekendDays": [0, 6]
   }
   ```
   - Creates the Company document.
   - Creates the initial `ADMIN` account with hashed password.
   - Automatically seeds default leave types (Annual: 14, Sick: 8, Casual: 10, Unpaid: 0).
   - Generates and returns an initial JWT authentication token.
   - Rejects any subsequent attempts with `409 Conflict`.

---

## 5. API Contract Table

All endpoints use `/api` prefix and return consistent JSON structures:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Validation failed / Unauthorized / Conflict",
  "errors": []
}
```

### Endpoints Specification

| Method | Endpoint | Auth | Roles | Request Body / Query | Success Status | Description |
| :--- | :--- | :---: | :---: | :--- | :---: | :--- |
| `GET` | `/api/health` | No | Public | None | `200` | Health check & DB connection status |
| `GET` | `/api/setup/status` | No | Public | None | `200` | Checks first-run initialization status |
| `POST` | `/api/setup/initialize` | No | Public | `{ companyName, adminEmail, adminPassword, ... }` | `201` | Atomic first-run company & admin setup (409 if exists) |
| `POST` | `/api/auth/login` | No | Public | `{ email, password }` | `200` | Authenticate and obtain JWT token |
| `GET` | `/api/auth/me` | Yes | All | None | `200` | Get authenticated user profile & linked employee |
| `POST` | `/api/auth/logout` | Yes | All | None | `200` | Logout session |
| `POST` | `/api/auth/change-password` | Yes | All | `{ currentPassword, newPassword }` | `200` | Change password for logged in user |
| `POST` | `/api/users/hr` | Yes | ADMIN | `{ email, password }` | `201` | Create HR user account |
| `PATCH` | `/api/users/:id/reset-password` | Yes | ADMIN, HR | `{ newPassword }` | `200` | Reset password for an account (forces password change) |
| `PATCH` | `/api/users/:id/toggle-status` | Yes | ADMIN, HR | `{ isActive: boolean }` | `200` | Activate or deactivate user account |
| `GET` | `/api/company` | Yes | ADMIN, HR | None | `200` | Get company settings and profile |
| `PUT` | `/api/company/settings` | Yes | ADMIN | `{ name, settings: { officeStartTime, ... } }` | `200` | Update company settings |
| `GET` | `/api/departments` | Yes | All | `?isActive=true` | `200` | List company departments |
| `POST` | `/api/departments` | Yes | ADMIN | `{ name, code, description }` | `201` | Create department |
| `PUT` | `/api/departments/:id` | Yes | ADMIN | `{ name, code, description, isActive }` | `200` | Update department |
| `DELETE` | `/api/departments/:id` | Yes | ADMIN | None | `200` | Delete department (blocks if employees assigned) |
| `GET` | `/api/designations` | Yes | All | `?department=:id` | `200` | List company designations |
| `POST` | `/api/designations` | Yes | ADMIN | `{ title, department, description }` | `201` | Create designation |
| `PUT` | `/api/designations/:id` | Yes | ADMIN | `{ title, department, description, isActive }` | `200` | Update designation |
| `DELETE` | `/api/designations/:id` | Yes | ADMIN | None | `200` | Delete designation (blocks if employees assigned) |
| `GET` | `/api/leave-types` | Yes | All | None | `200` | List configured leave types & quotas |
| `POST` | `/api/leave-types` | Yes | ADMIN | `{ name, code, daysPerYear, isPaid, isUnlimited }`| `201` | Create custom leave type |
| `PUT` | `/api/leave-types/:id` | Yes | ADMIN | `{ name, daysPerYear, isPaid, isUnlimited }` | `200` | Update leave type quota |
| `DELETE` | `/api/leave-types/:id` | Yes | ADMIN | None | `200` | Delete leave type (blocks if used in requests) |
| `GET` | `/api/holidays` | Yes | All | `?year=2026` | `200` | List public holidays |
| `POST` | `/api/holidays` | Yes | ADMIN | `{ title, date: "YYYY-MM-DD", description }` | `201` | Create company holiday |
| `PUT` | `/api/holidays/:id` | Yes | ADMIN | `{ title, date, description }` | `200` | Update holiday |
| `DELETE` | `/api/holidays/:id` | Yes | ADMIN | None | `200` | Delete holiday |
| `GET` | `/api/employees` | Yes | ADMIN, HR | `?page=1&limit=10&search=alice&department=:id` | `200` | Paginated employee directory |
| `POST` | `/api/employees` | Yes | HR | `{ firstName, lastName, email, department, ... }` | `201` | Create employee and login account |
| `GET` | `/api/employees/me` | Yes | EMPLOYEE | None | `200` | Own Employee 360 profile |
| `PATCH` | `/api/employees/me` | Yes | EMPLOYEE | `{ phone, address, emergencyContact, bankDetails }`| `200` | Update self profile (safe fields only) |
| `GET` | `/api/employees/export` | Yes | ADMIN, HR | None | `200` | Export employee directory to CSV |
| `POST` | `/api/employees/import` | Yes | HR | CSV text (`?dryRun=true` or `false`) | `200` | CSV Import with dry-run error report |
| `GET` | `/api/employees/:id` | Yes | ADMIN, HR, EMPLOYEE (self) | None | `200` | Employee 360 profile (IDOR protected) |
| `PUT` | `/api/employees/:id` | Yes | ADMIN, HR | `{ firstName, department, designation, ... }` | `200` | Update employee information |
| `POST` | `/api/attendance/check-in` | Yes | EMPLOYEE | `{ note? }` | `200` | Server-authoritative daily check-in (409 on duplicate) |
| `POST` | `/api/attendance/check-out` | Yes | EMPLOYEE | `{ note? }` | `200` | Check-out and calculate worked hours |
| `GET` | `/api/attendance/me` | Yes | EMPLOYEE | `?month=5&year=2026` | `200` | Own attendance history |
| `GET` | `/api/attendance` | Yes | ADMIN, HR | `?date=YYYY-MM-DD` | `200` | Daily attendance board & status roster |
| `POST` | `/api/attendance/corrections` | Yes | EMPLOYEE | `{ date, requestedCheckIn, requestedCheckOut, reason }` | `201` | Submit attendance correction request |
| `GET` | `/api/attendance/corrections` | Yes | All | `?status=PENDING` | `200` | List correction requests (scoped by role) |
| `PATCH` | `/api/attendance/corrections/:id/decision` | Yes | HR | `{ status: "APPROVED"/"REJECTED", decisionNote }` | `200` | HR decides correction (updates attendance) |
| `POST` | `/api/leaves` | Yes | EMPLOYEE | `{ leaveTypeCode, startDate, endDate, reason }` | `201` | Apply for leave (validates working days & quota) |
| `GET` | `/api/leaves/me` | Yes | EMPLOYEE | `?page=1&limit=10` | `200` | Own leave request history |
| `GET` | `/api/leaves/balance/me` | Yes | EMPLOYEE | None | `200` | Own leave balances across all types |
| `GET` | `/api/leaves` | Yes | ADMIN, HR | `?status=PENDING` | `200` | All company leave requests |
| `PATCH` | `/api/leaves/:id/cancel` | Yes | EMPLOYEE | None | `200` | Cancel own pending leave request |
| `PATCH` | `/api/leaves/:id/decision` | Yes | HR | `{ status: "APPROVED"/"REJECTED", decisionNote }` | `200` | HR decides leave request (creates notification) |
| `PUT` | `/api/payroll/salary-structures/:employeeId` | Yes | HR | `{ basicSalary, otherAllowances? }` | `200` | Set salary structure (HRA=40%, Medical=10%) |
| `GET` | `/api/payroll/salary-structures/:employeeId` | Yes | ADMIN, HR | None | `200` | View salary structure |
| `POST` | `/api/payroll/runs` | Yes | HR | `{ year: 2026, month: 5, notes? }` | `201` | Prepare monthly payroll draft line items |
| `GET` | `/api/payroll/runs` | Yes | ADMIN, HR | `?year=2026` | `200` | List monthly payroll runs |
| `GET` | `/api/payroll/runs/:id` | Yes | ADMIN, HR | None | `200` | Payroll run details with employee payslips |
| `POST` | `/api/payroll/runs/:id/finalize` | Yes | ADMIN | None | `200` | Finalize payroll run (Admin only, immutable) |
| `GET` | `/api/payroll/me/payslips` | Yes | EMPLOYEE | `?year=2026` | `200` | Own finalized payslips |
| `GET` | `/api/payroll/me/payslips/:id` | Yes | EMPLOYEE | None | `200` | Own payslip detail (IDOR protected) |
| `GET` | `/api/payroll/me/payslips/:id/pdf` | Yes | EMPLOYEE | None | `200` | Download real PDF payslip document (PDFKit) |
| `GET` | `/api/payroll/payslips/:id` | Yes | ADMIN, HR | None | `200` | View payslip detail |
| `GET` | `/api/payroll/payslips/:id/pdf` | Yes | ADMIN, HR | None | `200` | Download employee PDF payslip |
| `GET` | `/api/dashboard/admin` | Yes | ADMIN | None | `200` | Headcount, attrition, payroll cost, audits |
| `GET` | `/api/dashboard/hr` | Yes | HR | None | `200` | Attendance stats, pending approvals, late comers |
| `GET` | `/api/dashboard/me` | Yes | EMPLOYEE | None | `200` | Own status, hours worked, late count, balances |
| `POST` | `/api/ai/chat` | Yes | All | `{ message, messages? }` | `200` | Groq AI chat with read-only permissioned tools |
| `POST` | `/api/ai/summary` | Yes | ADMIN, HR | `{ kpis? }` | `200` | 3-5 concise executive dashboard insight bullets |
| `POST` | `/api/ai/smart-leave` | Yes | All | `{ query: "I need 2 days off next Monday" }` | `200` | AI parser generating pre-filled leave form JSON |
| `GET` | `/api/announcements` | Yes | All | `?page=1&limit=10` | `200` | List company announcements |
| `POST` | `/api/announcements` | Yes | ADMIN, HR | `{ title, content, targetAudience, priority }` | `201` | Post company announcement |
| `GET` | `/api/notifications` | Yes | All | `?isRead=false` | `200` | Own in-app notifications |
| `PATCH` | `/api/notifications/:id/read` | Yes | All | None | `200` | Mark notification as read (IDOR protected) |
| `PATCH` | `/api/notifications/read-all` | Yes | All | None | `200` | Mark all own notifications as read |
| `GET` | `/api/audit` | Yes | ADMIN | `?action=...&entityType=...` | `200` | Paginated append-only system audit log |

---

## 6. Known Limitations & Operational Notes

1. **MongoDB Replica Set & Transactions:**
   - Multi-document operations use atomic find-and-modify queries (`findOneAndUpdate`, unique indexes, and rollback cleanup). In production deployments connected to a replica set, native MongoDB sessions and transactions are fully supported.
2. **Groq AI Provider:**
   - When `AI_API_KEY` is not supplied, AI endpoints return clean, deterministic fallbacks without throwing 500 errors or leaking provider stack traces.
   - Rate limiting is strictly enforced at 20 requests per hour per user via `aiLimiter`.
3. **Proration & Tax Slabs:**
   - The tax slabs implemented are demonstration calculations derived from the hackathon brief. They reflect progressive annual gross brackets and divide annual tax by 12 for monthly deduction.
