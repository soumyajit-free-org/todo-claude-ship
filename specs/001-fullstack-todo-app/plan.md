# Implementation Plan: Full-Stack Authenticated TODO Application

**Branch**: `feature/dev-by-spec-kit` | **Date**: 2026-11-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-fullstack-todo-app/spec.md`

## Summary

Build a full-stack authenticated TODO application with a FastAPI backend and React frontend. Users register, log in via JWT, and perform CRUD operations on tasks scoped to their account. The backend enforces strict data isolation, Pydantic validation, and soft-delete semantics. The frontend provides filtered task views, inline editing, completion toggling, and robust error/loading states.

## Technical Context

**Language/Version**: Python 3.12+ (backend), TypeScript/ES6+ (frontend)

**Primary Dependencies**: FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, PyJWT, Passlib/Bcrypt (backend); React 18+, Vite, React Router, Axios (frontend)

**Storage**: PostgreSQL 15+

**Testing**: pytest + httpx.AsyncClient (backend integration tests)

**Target Platform**: Web (modern desktop browsers: Chrome, Firefox, Edge, Safari latest two versions)

**Project Type**: Web application (SPA frontend + REST API backend)

**Performance Goals**: Login-to-dashboard < 3s, task toggle visual update < 1s, 100 concurrent authenticated users

**Constraints**: All secrets via environment variables, CORS restricted to configured frontend origin, no wildcard `*` with credentials

**Scale/Scope**: Moderate user base (up to hundreds of users), single deployment environment

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Strict User Data Isolation & Security-First Auth | PASS | All TODO operations scoped by `owner_id` from JWT; passwords hashed with Bcrypt; short-lived JWTs |
| II. Backend-Driven Truth & Contract Integrity | PASS | FastAPI is single source of truth; Pydantic v2 schemas on all routes; OpenAPI contract |
| III. Clean Layered Architecture | PASS | Backend: routers/schemas/models/services/core; Frontend: services/context/components/pages |
| IV. Database Discipline & Migrations | PASS | PostgreSQL primary store; Alembic migrations; explicit FKs, indexes, constraints; soft delete with `deleted_at` |
| V. Predictable API & Frontend UX Standards | PASS | Deterministic sorting/filtering; centralized auth interceptor; Loading/Empty/Error/Success states |
| VI. Test-First Verification for Critical Paths | PASS | Auth flows and ownership boundaries tested with pytest + httpx.AsyncClient |

**Gate result: PASS** — no violations, no complexity tracking entries needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-fullstack-todo-app/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-contract.md  # REST API endpoint contracts
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app factory, CORS, lifespan
│   ├── core/
│   │   ├── config.py        # pydantic-settings: SECRET_KEY, DATABASE_URL, etc.
│   │   ├── security.py      # JWT creation/validation, password hashing
│   │   └── database.py      # SQLAlchemy async engine, session dependency
│   ├── models/
│   │   ├── user.py          # User ORM model
│   │   └── todo.py          # Todo ORM model (with deleted_at)
│   ├── schemas/
│   │   ├── user.py          # UserCreate, UserResponse, TokenResponse
│   │   └── todo.py          # TodoCreate, TodoUpdate, TodoResponse
│   ├── services/
│   │   ├── user_service.py  # Registration, lookup, credential verification
│   │   └── todo_service.py  # CRUD + ownership checks + soft delete
│   └── routers/
│       ├── auth.py          # POST /auth/register, POST /auth/login, GET /auth/me
│       └── todos.py         # GET/POST /todos, PUT/DELETE /todos/{id}
├── alembic/
│   ├── alembic.ini
│   └── versions/            # Migration scripts
├── tests/
│   ├── conftest.py          # Fixtures: test DB, async client, auth helpers
│   ├── test_auth.py         # Registration, login, invalid credentials, token expiry
│   └── test_todos.py        # CRUD, ownership isolation, soft delete, filtering
├── requirements.txt
└── .env.example

frontend/
├── src/
│   ├── main.tsx             # React entry point
│   ├── App.tsx              # Router setup, protected route wrapper
│   ├── context/
│   │   └── AuthContext.tsx   # Auth state, login/logout, token persistence
│   ├── services/
│   │   └── api.ts           # Axios instance, auth interceptor, 401 handling
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── DashboardPage.tsx
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── AddTodoForm.tsx
│   │   ├── FilterTabs.tsx
│   │   ├── TaskCounter.tsx
│   │   ├── TodoList.tsx
│   │   ├── TodoItem.tsx
│   │   └── EmptyState.tsx
│   └── types/
│       └── index.ts         # Shared TypeScript interfaces
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

**Structure Decision**: Web application with separate `backend/` and `frontend/` directories. Backend follows the constitution's layered architecture (routers/schemas/models/services/core). Frontend separates API communication, auth context, reusable components, and page-level views.

## Complexity Tracking

> One justified deviation, listed below.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Frontend lint uses oxlint instead of ESLint (Constitution: Code Quality) | The Vite 8 / TypeScript 7 template ships oxlint; `typescript-eslint` has no release supporting TypeScript 7, so ESLint cannot be installed without forcing a broken peer resolution | ESLint with `--legacy-peer-deps`: unsupported combination that may silently mis-lint. Revisit when typescript-eslint supports TypeScript 7 |
