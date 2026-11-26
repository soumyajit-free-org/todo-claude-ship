# Project Constitution: Full-Stack Authenticated TODO Application

## Core Principles

### I. Strict User Data Isolation & Security-First Auth
- Every task, tag, subtask, and user preference MUST be strictly scoped to the authenticated user (`owner_id`).
- No endpoint accessing user-owned resources may trust client-supplied user IDs; ownership MUST always be derived from the verified JWT token and validated on the database query level.
- Passwords MUST be hashed using Argon2 or Bcrypt (`passlib`/`pwdlib`) before storage; plaintext passwords or tokens MUST never be logged or returned in responses.
- Access tokens MUST be short-lived JWTs paired with secure refresh token rotation or explicit `401 Unauthorized` handling on expiration.

### II. Backend-Driven Truth & Contract Integrity
- FastAPI is the single source of truth for all business logic, validation, sorting, filtering, and persistence.
- Every API route MUST enforce strict Pydantic v2 request and response schemas—raw ORM models or unvalidated dictionaries MUST never be returned directly.
- API changes MUST preserve backwards compatibility or be explicitly versioned and documented in OpenAPI specs before frontend consumption.

### III. Clean Layered Architecture
- **Backend (FastAPI):** Follow a strict separation of concerns:
  - `routers/` (HTTP routing & dependency injection only)
  - `schemas/` (Pydantic input/output contracts)
  - `models/` (SQLAlchemy ORM models)
  - `services/` (business logic & ownership verification)
  - `core/` (config, security, JWT, database session management)
- **Frontend (React):** Separate API communication (`services/api.ts`), authentication state (`context/AuthContext.tsx`), reusable UI primitives (`components/`), and route-level views (`pages/`).
- Business rules (e.g., overdue calculation rules, recurring task rollover, bulk status validation) MUST reside in backend services, not duplicated across React components.

### IV. Database Discipline & Migrations
- PostgreSQL is the primary relational data store; SQLite may only be used for isolated local unit tests if schema parity is guaranteed.
- All schema changes (including v2 additions like priorities, due dates, tags, subtasks, and soft deletes) MUST be managed through version-controlled **Alembic** migrations—never via `Base.metadata.create_all()` in production.
- Foreign keys, uniqueness constraints (e.g., per-user tag names, unique user emails), and query indexes (`owner_id`, `due_date`, `is_completed`, `deleted_at`) MUST be explicitly defined.

### V. Predictable API & Frontend UX Standards
- All list endpoints (`GET /todos`) MUST support deterministic sorting, filtering (`status`, `priority`, `tag`, `q`), and consistent JSON error envelopes (`{ "detail": "..." }`).
- Frontend HTTP clients MUST use centralized interceptors to attach `Authorization: Bearer <token>` headers and handle `401` session expiration gracefully without infinite redirect loops.
- Every async UI state MUST explicitly handle **Loading**, **Empty**, **Error**, and **Success** states—no silent failures or blank screens.

### VI. Test-First Verification for Critical Paths
- Authentication flows (register, login, invalid credentials, expired token) and authorization boundaries (User A attempting to read, update, or delete User B's TODO) MUST have automated integration tests (`pytest` + `httpx.AsyncClient`).
- No feature specification is considered complete until its acceptance scenarios pass automated verification.

---

## Technology Stack & Constraints

- **Backend:** Python 3.12+, FastAPI, SQLAlchemy 2.0 (async or clean session dependency), Alembic, Pydantic v2, PyJWT, Passlib/Bcrypt.
- **Frontend:** React 18+, Vite, TypeScript (preferred) or modern ES6+, React Router, Axios/Fetch wrapper with auth interceptors.
- **Database:** PostgreSQL 15+.
- **Environment & Secrets:** All secrets (`SECRET_KEY`, `DATABASE_URL`, `CORS_ORIGINS`) MUST be loaded via environment variables (`pydantic-settings`) and never committed to source control.
- **CORS:** Strictly restricted to configured frontend origins; wildcard `*` origins with credentials are prohibited.

---

## Development Workflow & Spec-Kit Governance

- **Spec-Driven Execution:** Every new feature (starting with MVP Auth + CRUD, followed by Priorities/Due Dates, Tags/Search, Subtasks, and Refresh Tokens) MUST follow the Spec-Kit lifecycle:
  1. `/speckit.specify` — Define user stories, functional requirements, and edge cases.
  2. `/speckit.plan` — Map database schemas, Alembic migrations, API contracts, and React components.
  3. `/speckit.tasks` — Break work into small, independently testable vertical slices.
  4. `/speckit.implement` — Execute tasks while adhering to this constitution.
- **Scope Discipline:** Core MVP (Auth + CRUD + Data Isolation) MUST pass all acceptance criteria before implementing Phase 2 enhancements.
- **Code Quality:** Backend code MUST pass linting/formatting (`ruff`) and type checks; frontend code MUST build cleanly with zero TypeScript/ESLint errors before merging.

---

## Governance

- This constitution supersedes ad-hoc coding shortcuts and convenience patterns across all specs, plans, and implementation tasks.
- Any deviation from these principles (e.g., skipping an Alembic migration or relaxing an auth check) requires an explicit justification documented in the feature's `plan.md` under **Complexity Tracking**.
- Amendments to this constitution require updating the version and ratification date below.

**Version:** 1.0.0 | **Ratified:** 2026-11-25 | **Last Amended:** 2026-11-25