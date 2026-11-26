# Implementation Plan: Phase 2 — Modern UI & Productivity Enhancements

**Branch**: `feature/dev-by-spec-kit` | **Date**: 2026-11-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-phase2-ui-productivity/spec.md`

## Summary

Phase 2 transforms the working MVP into a polished product through five independent feature slices: (1) a design-token-based theme system with dark mode, (2) toast notifications with optimistic updates and undo-delete, (3) due dates, priorities, search and server-side pagination, (4) drag-and-drop reordering with fractional positioning, and (5) optional refresh-token auth with HttpOnly cookies. A prerequisite testing-hygiene fix isolates the test database before any feature work begins.

## Technical Context

**Language/Version**: Python 3.12+ (backend), JavaScript/ES6+ with React 19 (frontend)

**Primary Dependencies**:
- Backend: FastAPI ≥0.110, SQLAlchemy 2.0 (async), Alembic ≥1.13, Pydantic v2, PyJWT, passlib+bcrypt, psycopg3
- Frontend: React 19, Vite, react-router-dom, axios, @dnd-kit/core + @dnd-kit/sortable (Feature 4 only)
- Dev/Test: pytest, pytest-asyncio, httpx, ruff, mypy (backend); Vitest, Testing Library (frontend)

**Storage**: PostgreSQL 15+ (production/dev), SQLite in-memory (test isolation)

**Testing**: pytest + httpx AsyncClient (backend), Vitest + React Testing Library (frontend)

**Target Platform**: Web application — server (Linux/any) + SPA (modern browsers)

**Project Type**: Full-stack web application (FastAPI API + React SPA)

**Performance Goals**: <50ms optimistic UI response, <200ms search over 1,000+ items, <150 KB gzipped initial JS bundle

**Constraints**: WCAG AA contrast in both themes, full keyboard operation, `prefers-reduced-motion` honored, all queries scoped to `owner_id`

**Scale/Scope**: Personal todo app; target 1,000+ todos per user with server-side pagination (~50/page)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Data Isolation & Security-First Auth | PASS | All new queries (search, filter, sort, reorder, pagination) scoped to `owner_id`. Refresh tokens scoped per user session. |
| II. Backend-Driven Truth & Contract Integrity | PASS | Filtering, sorting, search, pagination and position calculation are server-side. Pydantic v2 schemas for all new fields. |
| III. Clean Layered Architecture | PASS | Follows existing `routers/schemas/models/services/core` separation. Frontend extends existing `components/pages/services/context` pattern. |
| IV. Database Discipline & Migrations | PASS | Three Alembic migrations (0002: due_date+priority, 0003: position, 0004: refresh_tokens). All reversible. Indexes on (owner_id, due_date) and (owner_id, position). |
| V. Predictable API & Frontend UX Standards | PASS | GET /todos extended with query params (q, status, priority, due, sort, order, cursor). Pagination via cursor. JSON error envelopes. All UI states (loading/empty/error/success) covered. |
| VI. Test-First Verification | PASS | Each feature includes backend integration tests (filters, isolation, migration up/down) and frontend component/unit tests. Testing hygiene fix is P0. |

**Gate result: PASS** — no violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-phase2-ui-productivity/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── todos-api.md
│   └── auth-api.md
└── tasks.md              # Created by /speckit-tasks
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── core/             # config.py, database.py, security.py
│   ├── models/           # todo.py (extended), user.py, refresh_token.py (Feature 5)
│   ├── schemas/          # todo.py (extended), user.py, types.py
│   ├── routers/          # auth.py (extended), todos.py (extended)
│   └── services/         # todo_service.py (extended), user_service.py, token_service.py (Feature 5)
├── alembic/versions/     # 0002_due_date_priority.py, 0003_position.py, 0004_refresh_tokens.py
├── tests/                # conftest.py (fixed), test_auth.py, test_todos.py (extended)
└── requirements.txt

frontend/
├── src/
│   ├── components/       # Existing + ThemeToggle, Toast, SearchBox, FilterPopover, SortDropdown, DragHandle, SkeletonLoader, OfflineBanner, PriorityBadge, DueDateChip, ProgressBar
│   ├── pages/            # DashboardPage (extended), LoginPage, RegisterPage
│   ├── context/          # AuthContext (extended), ThemeContext (new), ToastContext (new)
│   ├── hooks/            # useTheme, useToast, useOptimistic, useSearch, usePagination
│   ├── services/         # api.ts (extended with refresh interceptor)
│   ├── styles/           # tokens.css (new), index.css (refactored to use tokens)
│   └── types/            # Extended with Priority, DueFilter, SortOption
└── tests/                # Extended per feature
```

**Structure Decision**: Web application layout matching the existing `backend/` + `frontend/` split. All new code extends existing directories; the only new top-level additions are `frontend/src/hooks/`, `frontend/src/styles/`, and `frontend/src/context/` (ThemeContext, ToastContext).

## Complexity Tracking

> No constitution violations — this section is intentionally empty.
