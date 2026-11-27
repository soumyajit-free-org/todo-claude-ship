# Todo App

Full-stack authenticated todo app: FastAPI + SQLAlchemy + PostgreSQL backend, React + Vite + TypeScript frontend. Feature specs live in `specs/`, and `todo-constitution.md` holds the binding project principles (read it before architectural changes).

## Commands

Backend (run from `backend/`):
- `uvicorn app.main:app --reload` — dev server
- `alembic upgrade head` — apply migrations
- `pytest` — tests (needs a separate Postgres DB via `TEST_DATABASE_URL`; `conftest.py` exits if it equals `DATABASE_URL`, because tests drop all tables)
- `ruff check .` and `mypy .` — lint and strict type check
- Copy `.env.example` to `.env` (`SECRET_KEY`, `DATABASE_URL`, `TEST_DATABASE_URL`, `CORS_ORIGINS`)

Frontend (run from `frontend/`):
- `npm run dev` — Vite dev server (http://localhost:5173)
- `npm run build` — `tsc -b` + Vite build
- `npm run lint` — oxlint (must be clean)
- `npm test` — vitest (jsdom)

Before finishing frontend work run `npx tsc -b`, `npm run lint`, and `npm test`; all three are currently clean.

## Architecture

Backend (`backend/app/`): `routers/` (HTTP only) -> `services/` (business logic, ownership checks) -> `models/` (SQLAlchemy). `schemas/` holds Pydantic v2 contracts; `core/` holds config, security/JWT, DB session.
- Every todo query must be scoped to the authenticated user; never trust client-supplied user IDs.
- Never return ORM models or raw dicts from routes; use response schemas.
- Schema changes go through Alembic migrations, never `create_all()` outside tests.
- Business rules belong in backend services, not duplicated in React.
- Todos are soft-deleted and ordered by a float `position` (reordering via `PATCH /todos/{id}/position`); list endpoint is cursor-paginated.

Frontend (`frontend/src/`): `pages/` (routes), `components/`, `context/` (auth, theme, toast), `hooks/`, `services/api.ts` (all HTTP calls), `types.ts`.

## Frontend conventions

- Context files are split: the context object, types, and `useX` hook live in a plain `.ts` file (`auth.ts`, `theme.ts`, `toast.ts`); the `.tsx` file exports only the provider. oxlint's fast-refresh rule fails otherwise.
- Avoid `setState` synchronously inside effects and impure calls (`new Date()`) during render; the linter flags both. Derive values instead (see `queryKey` in `DashboardPage.tsx`).
- Every async view handles loading, empty, error, and success states.
- Test setup (`src/test/setup.ts`) mocks `window.matchMedia` (absent in jsdom) and resets mocks after each test; keep new global test shims there.

## Workflow

- Features follow Spec-Kit: `/speckit.specify` -> `/speckit.plan` -> `/speckit.tasks` -> `/speckit.implement`.
- Auth flows and cross-user access (user A touching user B's todo) require automated integration tests.
- Changes under `.claude/` (including `approvals.yml`) require two human approvals.
