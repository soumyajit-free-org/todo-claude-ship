# Tasks: Full-Stack Authenticated TODO Application

**Input**: Design documents from `specs/001-fullstack-todo-app/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Included for critical auth and data isolation paths per constitution Principle VI.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Includes exact file paths per plan.md project structure

## Path Conventions

- **Backend**: `backend/app/`, `backend/tests/`, `backend/alembic/`
- **Frontend**: `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependency management, and configuration

- [X] T001 Create backend project structure: `backend/app/{__init__,main}.py`, `backend/app/{core,models,schemas,services,routers}/` directories per plan.md
- [X] T002 Create `backend/requirements.txt` with FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, PyJWT, passlib[bcrypt], uvicorn, python-dotenv, pydantic-settings, httpx (dev)
- [X] T003 [P] Create `backend/.env.example` with SECRET_KEY, DATABASE_URL, CORS_ORIGINS placeholders per research.md R-007
- [X] T004 [P] Create frontend project: `npx create-vite frontend --template react-ts` and install axios, react-router-dom
- [X] T005 [P] Create `backend/app/core/config.py` with pydantic-settings `Settings` class loading SECRET_KEY, DATABASE_URL, CORS_ORIGINS from environment

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Implement database engine and session dependency in `backend/app/core/database.py` — SQLAlchemy 2.0 synchronous sessions with `get_db` dependency per research.md R-004
- [X] T007 Create User ORM model in `backend/app/models/user.py` — fields per `data-model.md` `User` entity: `User.id` (Integer PK auto-increment), `User.email` (String(255) unique not-null indexed), `User.hashed_password` (String(255) not-null), `User.created_at` (DateTime not-null default now)
- [X] T008 [P] Create Todo ORM model in `backend/app/models/todo.py` — fields per `data-model.md` `Todo` entity: `Todo.id` (Integer PK auto-increment), `Todo.title` (String(255) not-null), `Todo.description` (Text nullable), `Todo.is_completed` (Boolean not-null default false), `Todo.owner_id` (Integer FK→users.id not-null indexed, ON DELETE CASCADE), `Todo.created_at` (DateTime not-null default now), `Todo.deleted_at` (DateTime nullable indexed). Add composite index on `(owner_id, deleted_at)` per data-model.md
- [X] T009 Initialize Alembic in `backend/alembic/` with `alembic init`, configure `alembic.ini` and `env.py` to read DATABASE_URL from settings, and generate initial migration for User and Todo tables
- [X] T010 [P] Implement JWT and password utilities in `backend/app/core/security.py` — password hashing via passlib/bcrypt (research.md R-002), JWT creation with 30-minute expiry (research.md R-001), JWT decode/validation, `get_current_user` dependency using FastAPI `Depends` + `OAuth2PasswordBearer`
- [X] T011 Configure FastAPI app factory in `backend/app/main.py` — CORS middleware with `CORS_ORIGINS` from config (research.md R-007), include auth and todo routers
- [X] T012 [P] Create Pydantic schemas in `backend/app/schemas/user.py` — `UserCreate` (email: EmailStr, password: str min 8 chars per `data-model.md` validation rules), `UserResponse` (id, email, created_at — no password), `Token` (access_token, token_type)
- [X] T013 [P] Create Pydantic schemas in `backend/app/schemas/todo.py` — `TodoCreate` (title: str max 255 not empty per `data-model.md` `Todo.title`, description: Optional[str] per `data-model.md` `Todo.description`), `TodoUpdate` (title: Optional[str], description: Optional[str], is_completed: Optional[bool]), `TodoResponse` (id, title, description, is_completed, created_at)
- [X] T014 [P] Create `backend/tests/conftest.py` with pytest fixtures: test database (separate PostgreSQL test DB), SQLAlchemy test session override, httpx.AsyncClient for FastAPI test app, `create_test_user` and `auth_headers` helpers

**Checkpoint**: Foundation ready — database, models, JWT, schemas, test fixtures all in place

---

## Phase 3: User Story 1 — Account Registration (Priority: P1) 🎯 MVP

**Goal**: New visitors can create accounts with email and password; system rejects duplicates and validates input

**Independent Test**: Submit registration form with valid/invalid inputs, verify account creation and error handling

### Tests for User Story 1

- [X] T015 [P] [US1] Integration tests for registration in `backend/tests/test_auth.py` — test cases: successful registration returns 201 with user (no password), duplicate email returns 400, invalid email returns 422, short password (<8 chars) returns 422

### Implementation for User Story 1

- [X] T016 [US1] Implement `UserService` in `backend/app/services/user_service.py` — `create_user` (hash password per `data-model.md` `User.hashed_password`, validate `User.email` uniqueness, return UserResponse), `get_user_by_email`
- [X] T017 [US1] Implement `POST /auth/register` in `backend/app/routers/auth.py` — accept `UserCreate`, delegate to `UserService.create_user`, return 201 `UserResponse`, handle duplicate email with 400 per api-contract.md
- [X] T018 [P] [US1] Create `frontend/src/pages/RegisterPage.tsx` — email input, password input, confirm password input, client-side validation (email format, password min 8 chars per `data-model.md` validation rules, password match), submit calls `POST /auth/register`, error display, link to login page
- [X] T019 [US1] Create `frontend/src/services/api.ts` — Axios instance with base URL config, response/request interceptors stub (auth header and 401 handling added in US2)

**Checkpoint**: Registration works end-to-end — new users can create accounts

---

## Phase 4: User Story 2 — User Login & Session Persistence (Priority: P1)

**Goal**: Registered users log in, receive a JWT, session persists across refreshes, expired tokens redirect to login

**Independent Test**: Log in with valid/invalid credentials, refresh browser to verify persistence, test token expiry redirect

### Tests for User Story 2

- [X] T020 [P] [US2] Integration tests for login in `backend/tests/test_auth.py` — test cases: valid credentials return 200 with access_token, invalid password returns 401, non-existent email returns 401, `GET /auth/me` with valid token returns user, `GET /auth/me` with expired/invalid token returns 401

### Implementation for User Story 2

- [X] T021 [US2] Add `verify_password` and `authenticate_user` to `backend/app/services/user_service.py` — verify password against `data-model.md` `User.hashed_password`, return user or None
- [X] T022 [US2] Implement `POST /auth/login` and `GET /auth/me` in `backend/app/routers/auth.py` — login accepts OAuth2 password form, returns Token; me returns UserResponse using `get_current_user` dependency per api-contract.md
- [X] T023 [US2] Create `frontend/src/context/AuthContext.tsx` — React Context with `user`, `token`, `login()`, `logout()`, `isAuthenticated` state; persist token to localStorage (research.md R-001); on mount check localStorage for existing token and validate via `GET /auth/me`
- [X] T024 [US2] Update `frontend/src/services/api.ts` — add request interceptor to attach `Authorization: Bearer <token>` header, add response interceptor to detect 401 and trigger logout (no infinite redirect loops per FR-018)
- [X] T025 [US2] Create `frontend/src/pages/LoginPage.tsx` — email and password inputs, submit calls `POST /auth/login`, store token via AuthContext, redirect to dashboard on success, display API errors, link to register page
- [X] T026 [US2] Create `frontend/src/App.tsx` with React Router — `ProtectedRoute` wrapper redirecting unauthenticated users to `/login` (FR-007), routes: `/login` → LoginPage, `/register` → RegisterPage, `/` → DashboardPage (protected)
- [X] T027 [US2] Create `frontend/src/components/Navbar.tsx` — display logged-in user email, Logout button that calls `AuthContext.logout()` and redirects to `/login`

**Checkpoint**: Full auth flow works — register, login, session persists across refresh, logout clears session

---

## Phase 5: User Story 3 — Create a New TODO (Priority: P1)

**Goal**: Authenticated users create tasks with title and optional description; task appears in list immediately

**Independent Test**: Log in, create tasks with various inputs, verify they appear in the list

### Implementation for User Story 3

- [X] T028 [US3] Implement `TodoService.create_todo` in `backend/app/services/todo_service.py` — accept TodoCreate + current_user, set `Todo.owner_id` from authenticated user (never client-supplied per `data-model.md`), validate `Todo.title` not empty and max 255 chars per `data-model.md` `Todo.title`, return TodoResponse
- [X] T029 [US3] Implement `POST /todos` in `backend/app/routers/todos.py` — protected endpoint, accept TodoCreate body, delegate to TodoService, return 201 TodoResponse per api-contract.md
- [X] T030 [P] [US3] Create `frontend/src/components/AddTodoForm.tsx` — text input for title (required, max 255 chars per `data-model.md` `Todo.title`), optional description field, submit on Enter or Add button click, clear input on success, validation error display
- [X] T031 [US3] Create `frontend/src/pages/DashboardPage.tsx` — initial scaffold with AddTodoForm, placeholder for TodoList, fetch todos on mount via `GET /todos`

**Checkpoint**: Users can create tasks that persist and appear in their list

---

## Phase 6: User Story 4 — View and Filter TODO List (Priority: P1)

**Goal**: Users view their personal task list, filter by status (All/Active/Completed), see active task count; strict data isolation

**Independent Test**: Create tasks in different states, switch filters, verify correct items and counts; test with two users for isolation

### Tests for User Story 4

- [X] T032 [P] [US4] Integration tests for data isolation in `backend/tests/test_todos.py` — test cases: User A's todos not visible to User B, User B cannot update/delete User A's todos (returns 404), soft-deleted todos excluded from all queries, filter by `completed=true` and `completed=false` returns correct subsets

### Implementation for User Story 4

- [X] T033 [US4] Implement `TodoService.get_todos` in `backend/app/services/todo_service.py` — query todos WHERE `owner_id == current_user.id` AND `deleted_at IS NULL` per `data-model.md` `Todo.deleted_at`; support optional `completed` filter parameter
- [X] T034 [US4] Implement `GET /todos` in `backend/app/routers/todos.py` — protected endpoint, accept optional `completed` query param, delegate to TodoService, return list of TodoResponse per api-contract.md
- [X] T035 [P] [US4] Create `frontend/src/components/FilterTabs.tsx` — three tabs: All, Active, Completed; track selected filter; callback to parent on filter change
- [X] T036 [P] [US4] Create `frontend/src/components/TaskCounter.tsx` — display count of active (incomplete) tasks as "N items left" (FR-014)
- [X] T037 [US4] Create `frontend/src/components/TodoList.tsx` — render list of TodoItem components, pass filter state from FilterTabs to API call or client-side filter
- [X] T038 [US4] Create `frontend/src/components/TodoItem.tsx` — display task title, checkbox (placeholder, wired in US5), edit button (placeholder, wired in US6), delete button (placeholder, wired in US7)
- [X] T039 [US4] Update `frontend/src/pages/DashboardPage.tsx` — integrate FilterTabs, TaskCounter, TodoList; manage todos state and filter state; pass data down to components
- [X] T040 [P] [US4] Create `frontend/src/types/index.ts` — TypeScript interfaces: `User` (id, email, created_at), `Todo` (id, title, description, is_completed, created_at), `AuthContextType`, API response types

**Checkpoint**: Full task list with filtering and counter; data isolation verified between users

---

## Phase 7: User Story 5 — Toggle Task Completion (Priority: P2)

**Goal**: Users toggle task completion with a single click; visual strikethrough and counter update immediately

**Independent Test**: Create tasks, toggle checkbox, verify strikethrough and counter changes

### Implementation for User Story 5

- [X] T041 [US5] Implement `TodoService.update_todo` in `backend/app/services/todo_service.py` — accept todo_id + TodoUpdate + current_user, verify ownership AND `deleted_at IS NULL` per `data-model.md` `Todo.owner_id` and `Todo.deleted_at`, update fields, return 404 if not found/not owned per api-contract.md
- [X] T042 [US5] Implement `PUT /todos/{todo_id}` in `backend/app/routers/todos.py` — protected endpoint, accept TodoUpdate body, delegate to TodoService, return TodoResponse or 404 per api-contract.md
- [X] T043 [US5] Wire toggle in `frontend/src/components/TodoItem.tsx` — checkbox click calls `PUT /todos/{id}` with `{is_completed: !current}`, apply strikethrough CSS when `is_completed` is true, update parent state to refresh counter

**Checkpoint**: Toggle completion works with visual feedback and counter updates

---

## Phase 8: User Story 6 — Edit Existing TODO (Priority: P2)

**Goal**: Users edit task title/description; changes persist immediately; empty title prevented

**Independent Test**: Create a task, edit its text, verify updated content persists; try clearing title

### Implementation for User Story 6

- [X] T044 [US6] Add inline edit mode to `frontend/src/components/TodoItem.tsx` — click edit button enters edit mode showing input fields pre-filled with current title/description; save calls `PUT /todos/{id}` with updated values; cancel restores original; validate `Todo.title` not empty per `data-model.md` `Todo.title`; exit edit mode on save or cancel

**Checkpoint**: Editing works with validation and cancel support

---

## Phase 9: User Story 7 — Delete a TODO (Priority: P2)

**Goal**: Users soft-delete tasks; deleted tasks disappear from all views and counters

**Independent Test**: Create a task, delete it, verify it disappears from list and counter; verify via API that soft-deleted tasks are excluded

### Tests for User Story 7

- [X] T045 [P] [US7] Integration tests for soft delete in `backend/tests/test_todos.py` — test cases: delete returns 204, deleted todo excluded from GET /todos, deleted todo returns 404 on PUT/DELETE, cross-user delete returns 404

### Implementation for User Story 7

- [X] T046 [US7] Implement `TodoService.delete_todo` in `backend/app/services/todo_service.py` — accept todo_id + current_user, verify ownership AND `deleted_at IS NULL`, set `Todo.deleted_at` to current timestamp per `data-model.md` `Todo.deleted_at` (soft delete per research.md R-003), return 404 if not found/not owned
- [X] T047 [US7] Implement `DELETE /todos/{todo_id}` in `backend/app/routers/todos.py` — protected endpoint, delegate to TodoService, return 204 on success per api-contract.md
- [X] T048 [US7] Wire delete in `frontend/src/components/TodoItem.tsx` — delete button (trash icon) calls `DELETE /todos/{id}`, remove task from parent state on success, counter updates

**Checkpoint**: Soft delete works; deleted tasks invisible in all views

---

## Phase 10: User Story 8 — Loading and Error States (Priority: P3)

**Goal**: Clear loading spinners, error notifications, and empty-state messages across all interactions

**Independent Test**: Simulate slow/failed API responses, verify spinners and error messages render correctly; verify empty state with no tasks

### Implementation for User Story 8

- [X] T049 [P] [US8] Create `frontend/src/components/EmptyState.tsx` — display helpful message when todo list is empty (e.g., "No tasks yet — add one above!" per spec FR-017)
- [X] T050 [US8] Add loading and error states to `frontend/src/pages/DashboardPage.tsx` — show loading spinner during initial fetch and mutations (FR-015), show error notification on API failures (FR-016), show EmptyState when todo list is empty, handle all four states: Loading, Empty, Error, Success per spec
- [X] T051 [US8] Add error display to `frontend/src/pages/LoginPage.tsx` and `frontend/src/pages/RegisterPage.tsx` — show API error messages (invalid credentials, duplicate email, network errors) with user-friendly formatting

**Checkpoint**: All UI states (Loading, Empty, Error, Success) handled across all pages

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Security hardening, edge cases, and final validation

- [X] T052 [P] Add request debouncing for completion toggle in `frontend/src/components/TodoItem.tsx` — prevent race conditions from rapid successive clicks per spec edge case
- [X] T053 [P] Add token expiry detection in `frontend/src/context/AuthContext.tsx` — on 401 response during any action, clear session and redirect to login with session-expired message per spec edge case; prevent infinite redirect loops
- [X] T054 [P] Add input preservation on network failure in `frontend/src/components/AddTodoForm.tsx` — if create request fails, preserve user input so they can retry per spec edge case
- [X] T055 Run `backend/tests/` full test suite (`pytest tests/ -v`) and verify all tests pass
- [X] T056 Run quickstart.md validation scenarios V-001 through V-010 end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 Registration (Phase 3)**: Depends on Foundational (Phase 2)
- **US2 Login (Phase 4)**: Depends on US1 backend (T016-T017) for user creation; frontend can start in parallel
- **US3 Create TODO (Phase 5)**: Depends on US2 (needs AuthContext and api interceptors)
- **US4 View & Filter (Phase 6)**: Depends on US3 (needs at least one created todo to verify)
- **US5 Toggle (Phase 7)**: Depends on US4 (needs TodoItem component and update endpoint)
- **US6 Edit (Phase 8)**: Depends on US4 (needs TodoItem component); can parallel with US5
- **US7 Delete (Phase 9)**: Depends on US4 (needs TodoItem component); can parallel with US5/US6
- **US8 Loading/Error (Phase 10)**: Depends on US3-US4 (needs DashboardPage scaffold); can start after Phase 6
- **Polish (Phase 11)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Registration)**: Can start after Foundational — no story dependencies
- **US2 (Login)**: Needs US1 backend for user creation to test against
- **US3 (Create TODO)**: Needs US2 for authenticated API access
- **US4 (View & Filter)**: Needs US3 for todo data to display
- **US5, US6, US7**: Need US4 for TodoItem component; can run in parallel with each other
- **US8**: Needs base dashboard from US3-US4; can run in parallel with US5-US7

### Parallel Opportunities

**Within Phase 2 (Foundational)**:
- T007 + T008 (User and Todo models) can run in parallel
- T010 + T012 + T013 + T014 (security, schemas, test fixtures) can run in parallel

**Within US4 (View & Filter)**:
- T035 + T036 + T040 (FilterTabs, TaskCounter, types) can run in parallel

**Across User Stories (after Phase 6)**:
- US5 + US6 + US7 + US8 can all proceed in parallel (different files, independent features)

**Within Phase 11 (Polish)**:
- T052 + T053 + T054 can run in parallel (different files)

---

## Parallel Example: After Phase 6

```text
# These four stories can proceed simultaneously:
Stream A: US5 — Toggle (T041-T043) — TodoItem checkbox + PUT endpoint
Stream B: US6 — Edit (T044) — TodoItem inline edit mode
Stream C: US7 — Delete (T045-T048) — TodoItem delete + DELETE endpoint
Stream D: US8 — Loading/Error (T049-T051) — EmptyState + DashboardPage states
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3 + US4)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 Registration
4. Complete Phase 4: US2 Login & Session
5. Complete Phase 5: US3 Create TODO
6. Complete Phase 6: US4 View & Filter
7. **STOP and VALIDATE**: Users can register, login, create tasks, view/filter their list with data isolation
8. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 + US2 → Auth works end-to-end (register, login, session)
3. US3 + US4 → Core TODO CRUD works (create, view, filter) — **MVP!**
4. US5 + US6 + US7 (parallel) → Full CRUD with toggle, edit, delete
5. US8 → Polish with loading/error/empty states
6. Phase 11 → Edge cases, security hardening, final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Tests included for auth flows and data isolation per constitution Principle VI
- All `Todo` queries MUST include `WHERE deleted_at IS NULL` per data-model.md soft delete lifecycle
- All `Todo` mutations MUST verify `owner_id == current_user.id` per constitution Principle I
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

---

## Phase 12: Convergence

- [X] T057 CRITICAL: Add a backend type checker (mypy or pyright) config in `backend/pyproject.toml` and fix all reported errors so type checks pass per Constitution Code Quality (missing)
- [X] T058 CRITICAL: Run `ruff format` on `backend/` (4 files currently unformatted) and ensure `ruff format --check` and `ruff check` both pass per Constitution Code Quality (partial)
- [X] T059 Run `backend/tests/` against a real PostgreSQL 15+ test database via `TEST_DATABASE_URL` and fix any SQLite/PostgreSQL divergence per T014 and Constitution IV (partial)
- [X] T060 Reconcile frontend linting with Constitution Code Quality: add ESLint config with zero errors, or document oxlint as a justified deviation in plan.md Complexity Tracking; remove stale `eslint-disable` comments in `frontend/src/context/AuthContext.tsx` and `frontend/src/pages/DashboardPage.tsx` per Constitution Code Quality (partial)
- [X] T061 Add frontend automated tests (Vitest + React Testing Library) in `frontend/src/` covering US1/AC3 password mismatch, US5 toggle, US6 edit/cancel and empty-title, and US8 loading/empty/error states per Constitution VI (partial)
- [X] T062 Fix `frontend/src/context/AuthContext.tsx` so a non-401 failure of `GET /auth/me` on load does not leave an authenticated session with no user; show an error or retry per FR-005 and FR-018 (partial)
