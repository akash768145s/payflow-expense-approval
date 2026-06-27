# PayFlow - Multi-Tenant SaaS Expense Approval System

PayFlow is a production-ready, full-stack expense approval system. It supports multi-tenancy on a shared PostgreSQL database, strict role-based access control (RBAC), auditing, and a robust status state machine.

---

## 🏛️ Architecture & Folder Structure

PayFlow follows a clean, layered architecture separating routing, controllers, services, database access (repositories), and models.

```
c:/PC/CS/Company/Creditright/
├── backend/                  # Fastify Backend Service
│   ├── prisma/               # Prisma Database Schema and Migrations
│   ├── src/
│   │   ├── app.ts            # Fastify App configuration
│   │   ├── server.ts         # Fastify bootstrapper
│   │   ├── config/           # Environment variables
│   │   ├── routes/           # Routes (0% Business Logic)
│   │   ├── controllers/      # Controllers (Handles req/res & validation)
│   │   ├── services/         # Services (Houses business rules & state machine)
│   │   ├── repositories/     # Repository layer (Strictly owns DB queries)
│   │   ├── middlewares/      # Security & Context Middlewares
│   │   ├── validators/       # Zod Request schemas
│   │   ├── utils/            # Custom error classes and handlers
│   │   └── types/            # Fastify request type overrides
│   │   └── tests/            # Vitest integration tests
├── frontend/                 # React Vite Frontend SPA
│   ├── src/
│   │   ├── app/              # Store bootstrap & App router
│   │   ├── components/       # Shared UI (Badge, Modal, Toast, Skeleton)
│   │   ├── features/         # Feature state slices (auth, claims, ui)
│   │   ├── layouts/          # AuthLayout, DashboardLayout
│   │   ├── pages/            # Page routers (LoginPage, DashboardPage)
│   │   ├── services/         # Axios wrapper services (authService, claimService)
│   │   ├── types/            # Shared TypeScript interfaces
│   │   └── utils/            # Helper utilities
│   ├── index.html
│   ├── tailwind.config.js    # Tailwind layout config
│   └── postcss.config.js
├── docker-compose.yml        # Multi-container local deployment
└── README.md
```

### Flow of control:
`Client Request` ➔ `Routes` ➔ `Middlewares` (Session Auth & Tenant Org Injection) ➔ `Validators` (Zod validation) ➔ `Controllers` ➔ `Services` (Permissions & State Machine checks) ➔ `Repositories` ➔ `Database (Prisma)`

---

## 🔒 Tenant Security & Rules

1. **Isolation**: Every request is authenticated, and the authenticated user's `organizationId` is injected into the context. Repositories filter all SQL queries by this tenant ID.
2. **Access Control**: Attempting to view or modify an expense claim belonging to another tenant organization returns a `404 Not Found` (rather than a `403 Forbidden`) to avoid leaking resource existence.
3. **Role Authorization**:
   - **`EMPLOYEE`**: Can create, edit, delete, and submit claims in `DRAFT` status. Can only view *their own* claims.
   - **`MANAGER`**: Can view *all* claims in their organization. Can approve or reject submitted claims. Cannot create claims, mark claims as paid, or approve their own claims.
   - **`FINANCE`**: Can view *all* claims in their organization. Can mark approved claims as paid.

---

## ⚙️ State Machine Transitions

Claims status transitions are strictly governed by a dedicated state machine service:
- `DRAFT` ➔ `SUBMITTED`
- `SUBMITTED` ➔ `APPROVED` or `REJECTED`
- `APPROVED` ➔ `PAID`
- `APPROVED` ➔ `DRAFT` (Action: Send Back for Revision, Manager only)

Managers cannot undo a payment. However, before Finance marks a claim as PAID, a manager may send an APPROVED claim back to the employee for correction. This preserves the audit trail while allowing accidental approvals to be corrected without creating accounting inconsistencies.

Any invalid transition (e.g. `PAID` ➔ `APPROVED`, or `REJECTED` ➔ `APPROVED`) throws a `409 Conflict` error. Every status change creates a record in the `AuditLog` table.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- PostgreSQL database
- Docker & Docker Compose (Optional)

### Environment Variables
Create a `.env` file at the root directory:
```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/payflow?schema=public"
PORT=3000
COOKIE_SECRET="super-secret-cookie-signing-key-32-chars-long"
NODE_ENV="development"
```

### Local Setup
1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Run migrations and seed the database**:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   npm run db:seed
   ```
3. **Start local servers**:
   - Backend:
     ```bash
     npm run dev:backend
     ```
   - Frontend (Vite):
     ```bash
     npm run dev:frontend
     ```
   Access the frontend at `http://localhost:5173`.

---

## 🐳 Running with Docker

To spin up PostgreSQL, the Backend, and the Nginx Frontend:
```bash
docker compose up --build
```
Access the client dashboard at `http://localhost:8080`.

- The database container holds persistent PG data.
- The backend automatically applies migrations and seeds the database with sample tenant organizations, users (Employees, Managers, Finance), and claims on boot if it detects the database is empty.
- All Axios requests are proxied from port `8080/api` to the backend on `3000` via Nginx, resolving CORS.

---

## 🧪 Testing

Vitest is configured for integration and unit testing:
```bash
cd backend
npm run test
```
The test suite validates:
- Strict cross-tenant boundaries (returns `404`).
- Employees & Finance users cannot approve claims (`403`).
- Managers cannot pay claims or approve their own claims (`403`).
- All state machine invalid transitions (`409`).
