# PayFlow — Multi-Tenant Expense Approval Service

PayFlow is a production-ready, multi-tenant Software-as-a-Service (SaaS) application designed for managing and processing employee expense claims. Featuring a robust role-based access control (RBAC) permission structure and a validated state machine workflow, PayFlow ensures clean tenant separation and secure financial operations on a unified database.

---

## Features

* **Multi-Tenant Architecture**: Complete isolation of tenant data. A shared PostgreSQL database segregates data logically by organization, and cross-tenant resource attempts yield a `404 Not Found` response to prevent ID enumeration.
* **Role-Based Access Control (RBAC)**: Supports three distinct roles: `EMPLOYEE`, `MANAGER`, and `FINANCE`.
* **Cookie-Based Session Authentication**: Uses signed, secure `httpOnly` cookies with custom cryptographic secrets to protect against XSS and session hijacking.
* **State Machine Validation**: All status changes are governed by a central State Machine Service, preventing invalid state jumps (e.g. a `REJECTED` claim cannot jump to `PAID`). Invalid actions return a `409 Conflict`.
* **Send Back for Revision Workflow**: An APPROVED claim can be returned by a manager to `DRAFT` status with comments if it has not been marked `PAID` by Finance, allowing correction.
* **Audit Logging**: Every state transition is recorded in the `AuditLog` table, tracking the author, target claim, status changes, timestamp, and transition comments.
* **Automatic Database Migration**: Database schemas are compiled and automatically migrated on container boot via Prisma.
* **Idempotent Database Seeding**: On container startup, a seeder automatically verifies if the database is empty. If empty, it populates demo organizations, users, and expense claims.
* **Repository Architecture (DAO)**: A clean data-access layer isolates SQL operations, enforcing tenant isolation at the query layer.
* **Docker Deployment**: Multi-container local workspace containing PostgreSQL, Fastify API Backend, and a React SPA served through Nginx.
* **GitHub Actions CI**: Automated CI pipeline that executes linting, typechecking, building, and integration tests against a test PostgreSQL instance.
* **System Health Endpoint**: Provides `/health` to verify database connectivity and overall API health status.

---

## Tech Stack

| Component | Technology |
| --- | --- |
| **Backend** | Node.js (v20), TypeScript, Fastify, Zod (validation) |
| **Frontend** | React (v18), TypeScript, Vite, Tailwind CSS, Redux Toolkit, Axios |
| **Database** | PostgreSQL (v15), Prisma ORM |
| **Authentication** | Signed `httpOnly` secure session cookies |
| **Containerization** | Docker, Docker Compose, Nginx (routing & proxying) |
| **CI/CD** | GitHub Actions |

---

## Architecture

PayFlow follows a strict layered architecture:

```
c:/PC/CS/Company/Creditright/
├── backend/                  # Fastify Backend Service
│   ├── prisma/               # Database Schema, Migrations & Seeding
│   ├── src/
│   │   ├── app.ts            # Fastify server config and middleware registration
│   │   ├── server.ts         # Fastify bootstrapper
│   │   ├── controllers/      # Route controllers (Request/Response handling)
│   │   ├── services/         # Core business logic & State Machine Service
│   │   ├── repositories/     # Repository layer (Handles all database queries)
│   │   ├── middlewares/      # Tenant context injection & Session auth guards
│   │   ├── validators/       # Zod Request validation schemas
│   │   ├── utils/            # Custom HTTP exceptions and error handlers
│   │   └── tests/            # Vitest integration & permission tests
├── frontend/                 # React Frontend SPA
│   ├── src/
│   │   ├── app/              # Redux Store config
│   │   ├── components/       # Reusable UI elements (Badges, Dialogs, Toasts)
│   │   ├── features/         # Redux state slices (auth, claims, ui)
│   │   ├── layouts/          # Auth & Dashboard Layouts
│   │   ├── pages/            # View routers (LoginPage, DashboardPage)
│   │   ├── services/         # Axios wrapper client services
│   │   └── utils/            # Format helpers
├── docker-compose.yml        # Multi-container workspace conductor
└── README.md
```

* **Flow of Control**: `Client Request` ➔ `Router` ➔ `Auth/Tenant Middleware` ➔ `Validator` ➔ `Controller` ➔ `Service (State Machine)` ➔ `Repository (Tenant Filter)` ➔ `PostgreSQL`.

---

## Running Locally

### Prerequisites
* Node.js (v20+)
* PostgreSQL (v15+)

### Local Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/payflow?schema=public"
   PORT=3000
   COOKIE_SECRET="super-secret-cookie-signing-key-32-chars-long"
   NODE_ENV="development"
   ```

3. **Run Prisma Migrations & Seed**:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   npm run db:seed
   ```

4. **Start Development Servers**:
   * **Backend (Fastify)**:
     ```bash
     npm run dev:backend
     ```
   * **Frontend (Vite)**:
     ```bash
     npm run dev:frontend
     ```
     Access the local frontend at: `http://localhost:5173`.

---

## Running with Docker

You can run the entire workspace with one command. Docker automatically configures PostgreSQL, runs schema migrations, seeds demo accounts, and spins up the Nginx frontend.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/akash768145s/payflow-expense-approval.git
   cd payflow-expense-approval
   ```

2. **Configure environment variables**:
   Create a local `.env` file:
   * **Linux/macOS**: `cp .env.example .env`
   * **Windows Powershell**: `Copy-Item .env.example .env`

3. **Build and start the services**:
   ```bash
   docker compose up --build -d
   ```

4. **Access the Services**:
   * **Frontend**: [http://localhost:8080](http://localhost:8080)
   * **Backend API Health Check**: [http://localhost:3000/health](http://localhost:3000/health)

To tear down all containers and clear the persistent database volume:
```bash
docker compose down -v
```

---

## Seeded Demo Accounts

The database includes two distinct sandbox organizations (Acme and Globex). Use the password `password123` to log in:

| Organization | Role | Name | Email | Password |
| --- | --- | --- | --- | --- |
| **Acme** | Employee | John Doe | `john@acme.com` | `password123` |
| **Acme** | Manager | Bob Jones | `bob@acme.com` | `password123` |
| **Acme** | Finance | David Smith | `david@acme.com` | `password123` |
| **Globex** | Employee | Jane Doe | `jane@globex.com` | `password123` |
| **Globex** | Manager | Frank Miller | `frank@globex.com` | `password123` |
| **Globex** | Finance | Henry Davis | `henry@globex.com` | `password123` |

---

## API Overview

### Authentication
* `POST /auth/login` - Authenticates credentials and issues signed `httpOnly` session cookies.
* `POST /auth/logout` - Revokes session cookie.
* `GET /auth/me` - Resolves the current authenticated profile.

### Expense Claims
* `GET /claims` - Lists tenant-filtered claims.
* `GET /claims/:id` - Retrieves detailed claim data.
* `POST /claims` - Creates a new claim (`EMPLOYEE` only).
* `PUT /claims/:id` - Updates an existing draft (`EMPLOYEE` only).
* `DELETE /claims/:id` - Deletes a draft (`EMPLOYEE` only).
* `POST /claims/:id/submit` - Submits a claim for approval (`EMPLOYEE` only).
* `POST /claims/:id/approve` - Approves a submitted claim (`MANAGER` only).
* `POST /claims/:id/reject` - Rejects a submitted claim (`MANAGER` only).
* `POST /claims/:id/send-back` - Returns an approved claim for revision (`MANAGER` only).
* `POST /claims/:id/pay` - Disburses payment and marks as paid (`FINANCE` only).

### Health Check
* `GET /health` - Verifies database connectivity.

---

## Assumptions

1. **Expense Claim States & Revisions**:
   * Submitted, rejected, and paid claims are immutable.
   * If a manager mistakenly approves a claim, they can send it back to `DRAFT` (Action: `SEND_BACK`) if Finance has not marked it as `PAID`. This lets the employee correct details and resubmit.
2. **Approval Constraints**:
   * Managers cannot approve their own claims. (In this implementation, managers are restricted from filing claims entirely to maintain accounting separation).
3. **Data Field Constraints**:
   * Claim amounts must be positive numbers greater than 0.
   * Claim categories and descriptions must be non-empty strings.

---

## Security

* **httpOnly Cookies**: Sessions are stored in signed `httpOnly` secure cookies, protecting the application from cross-site scripting (XSS) attacks.
* **Tenant Isolation**: Query-level boundaries are enforced in the Repository layer, utilizing the authenticated user's `organizationId`. Trying to view or edit a claim from another tenant returns a `404 Not Found` (rather than a `403 Forbidden`) to prevent resource enumeration.
* **Role-Based Guards**: Checks are enforced at both controller and service levels to verify user access rights before executing database changes.
* **Immutable Logs**: Every state change creates a tamper-proof audit trail.

---

## Testing

Vitest is configured for integration and unit testing:
```bash
cd backend
$env:DATABASE_URL="postgresql://postgres:hello@127.0.0.1:5432/payflow?schema=public" # Local PG override
npm run test
```

The test suite validates:
* **Tenant boundaries**: Verifies that users cannot access resources belonging to other organizations.
* **Role access controls**: Blocks employees and finance members from performing approvals.
* **State machine**: Validates status jumps, transitions, and blocking rules.

---

## CI

A GitHub Actions pipeline runs on every push:
1. Installs workspaces dependencies.
2. Runs TypeScript compilers to check type safety (`typecheck`).
3. Compiles the build outputs.
4. Starts a containerized PostgreSQL database.
5. Runs the integration test suite.

---

## Future Improvements

* **Database Pagination**: Add cursor-based pagination for the expense lists.
* **Filtering & Search**: Support backend-driven filter options (e.g. status, date ranges).
* **Optimistic Locking**: Add version columns to claims to prevent concurrent modification conflicts.
* **Notifications**: Set up email notifications for revisions and approvals.
* **File Uploads**: Integrate AWS S3 storage for receipt photo uploads.

---

## Known Limitations

* **Session Storage**: Active user sessions are stored in-memory. For multi-node scaling in production, session tracking would need to be moved to a Redis cache.
* **Sorting & Filtering**: Searching and filtering is currently done in memory or using basic client-side sorting instead of database pagination.

---

## Versions

* **Node.js**: v20 (Alpine base image)
* **PostgreSQL**: v15 (Alpine base image)
