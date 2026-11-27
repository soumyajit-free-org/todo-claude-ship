# Tasks: Phase 2 — Modern UI & Productivity Enhancements

**Input**: Design documents from `specs/001-phase2-ui-productivity/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included per feature as specified in spec.md and the constitution (Principle VI).

**Organization**: Tasks grouped by user story. Each story is independently testable after its phase completes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US0–US5)

---

## Phase 1: Setup

**Purpose**: Prerequisite infrastructure changes before any feature work.

- [x] T001 Fix test database isolation: update `backend/tests/conftest.py` to use a dedicated `TEST_DATABASE_URL` and add a startup guard that aborts if `TEST_DATABASE_URL == DATABASE_URL` (see `research.md` R1)
- [x] T002 [P] Add `TEST_DATABASE_URL` configuration to `backend/app/core/config.py` via pydantic-settings
- [x] T003 [P] Update backend test fixtures in `backend/tests/conftest.py` to use PostgreSQL test database instead of in-memory SQLite for schema parity
- [x] T004 Verify test suite runs green against isolated test database: `cd backend && pytest -v`

**Checkpoint**: Test infrastructure is safe. All subsequent migration and feature work can proceed without risk of data wipes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that ALL user stories depend on.

**Warning**: No user story work can begin until this phase is complete.

- [x] T005 Create CSS design tokens file `frontend/src/styles/tokens.css` with color roles (`--bg`, `--surface`, `--surface-raised`, `--border`, `--text`, `--text-muted`, `--accent`, `--accent-contrast`, `--danger`, `--success`), spacing scale, radius scale (`--radius-sm/md/lg`), shadow levels, type scale, and motion durations/easing — light theme values as defaults on `:root`
- [x] T006 Add dark theme token overrides in `frontend/src/styles/tokens.css` under `[data-theme="dark"]` selector, with `prefers-color-scheme: dark` media query for system mode fallback
- [x] T007 Add inline theme-init script to `frontend/index.html` that reads `localStorage` theme preference (in try/catch) and sets `data-theme` attribute on `<html>` before first paint to prevent FOUC
- [x] T008 Refactor `frontend/src/index.css` to replace all hard-coded color literals with CSS custom property references from `tokens.css`; import `tokens.css` at the top
- [x] T009 [P] Create `ThemeContext` provider in `frontend/src/context/ThemeContext.jsx` with `useTheme` hook exposing `theme` (system/light/dark), `resolvedTheme` (light/dark), and `setTheme`; persist to `localStorage` in try/catch; listen to `prefers-color-scheme` changes for system mode
- [x] T010 [P] Create `ThemeToggle` component in `frontend/src/components/ThemeToggle.jsx` with sun/moon/monitor icons, accessible button group with `aria-pressed`/`aria-label`, wired to `ThemeContext`
- [x] T011 Add `ThemeToggle` to `frontend/src/components/Navbar.jsx`
- [x] T012 [P] Create `ToastContext` provider in `frontend/src/context/ToastContext.jsx` with `useToast` hook; reducer manages toast stack (max 3), supports success/error/info variants, auto-dismiss ~4s, pause on hover/focus, manual dismiss; `aria-live="polite"` region (errors use `assertive`)
- [x] T013 [P] Create `Toast` component in `frontend/src/components/Toast.jsx` rendering the toast stack; positioned bottom-right on desktop, bottom-center on mobile; supports action buttons (Retry, Undo) on individual toasts
- [x] T014 Mount `ThemeContext.Provider` and `ToastContext.Provider` in `frontend/src/main.jsx` (or app root), wrapping the router

**Checkpoint**: Design tokens, theme switching, and toast infrastructure are in place. All subsequent features build on these.

---

## Phase 3: User Story 1 — Design System and Theme Switching (Priority: P1) 🎯 MVP

**Goal**: Cohesive modern visual design with user-selectable light/dark/system theme, responsive layout, and WCAG AA contrast.

**Independent Test**: Switch between all three themes, reload, confirm persistence and no FOUC. Inspect contrast ratios in both themes. Test at 320px width.

### Tests for User Story 1

- [ ] T015 [P] [US1] Write theme hook unit tests in `frontend/src/context/__tests__/ThemeContext.test.tsx`: system/light/dark resolution, localStorage persistence, storage failure fallback, OS preference change listener
- [ ] T016 [P] [US1] Write ThemeToggle component tests in `frontend/src/components/__tests__/ThemeToggle.test.tsx`: toggle changes `data-theme`, `aria-pressed` correctness, all three modes cycle

### Implementation for User Story 1

- [x] T017 [P] [US1] Restyle `frontend/src/components/Navbar.jsx` with design tokens: consistent spacing, shadow, responsive layout
- [x] T018 [P] [US1] Create button variant styles in `frontend/src/styles/tokens.css` (or `index.css`): primary, secondary, ghost, danger with hover, active, focus-visible, and disabled states
- [x] T019 [P] [US1] Restyle `frontend/src/pages/LoginPage.jsx` and `frontend/src/pages/RegisterPage.jsx` with card styling, focus rings, inline error patterns, consistent tokens
- [x] T020 [P] [US1] Restyle `frontend/src/components/FilterTabs.jsx` as segmented-control with token-based styling
- [x] T021 [P] [US1] Restyle `frontend/src/components/TodoItem.jsx` with custom animated checkbox (completion visually distinct), token-based colors
- [x] T022 [P] [US1] Restyle `frontend/src/components/AddTodoForm.jsx` with token-based inputs, focus rings, single-column collapse on small screens
- [x] T023 [P] [US1] Create `SkeletonLoader` component in `frontend/src/components/SkeletonLoader.jsx` to replace "Loading..." text in `TodoList`
- [x] T024 [P] [US1] Redesign `frontend/src/components/EmptyState.jsx` with inline SVG illustration and call-to-action button
- [x] T025 [P] [US1] Create `ProgressBar` component in `frontend/src/components/ProgressBar.jsx` showing completed vs. total; integrate into `TaskCounter`
- [x] T026 [US1] Ensure all touch targets are at least 44x44px; verify responsive layout from 320px up with no horizontal scroll
- [x] T027 [US1] Run Lighthouse accessibility audit on login and dashboard; fix any issues to achieve score >= 95
- [x] T028 [US1] Verify zero hard-coded color literals remain outside token definitions in `frontend/src/`

**Checkpoint**: Full visual refresh complete. Theme switching works, persists, no FOUC. WCAG AA contrast in both themes. Responsive from 320px.

---

## Phase 4: User Story 2 — Toasts, Optimistic Updates and Undo Delete (Priority: P1)

**Goal**: Instant UI feedback for all mutations, rollback on failure with Retry, undo-delete with 5-second window, offline awareness.

**Independent Test**: Toggle a todo with slow network — UI updates instantly. Disconnect network — UI reverts, error toast with Retry. Delete a todo — Undo within 5s restores it.

### Tests for User Story 2

- [x] T029 [P] [US2] Write optimistic reducer unit tests in `frontend/src/hooks/__tests__/useOptimistic.test.js`: apply, confirm, rollback, rapid-sequence deduplication
- [x] T030 [P] [US2] Write undo-delete component tests in `frontend/src/components/__tests__/TodoList.test.jsx`: undo flow with fake timers, deferred delete fires after window
- [x] T031 [P] [US2] Write retry flow tests in `frontend/src/components/__tests__/Toast.test.jsx`: retry on failed mutation with mocked failing axios call

### Implementation for User Story 2

- [x] T032 [US2] Create `useOptimistic` hook in `frontend/src/hooks/useOptimistic.js`: per-item optimistic state via reducer; apply/confirm/rollback lifecycle; unique request IDs; serialized rapid actions per item to prevent out-of-order requests
- [x] T033 [US2] Integrate optimistic updates into `frontend/src/services/api.ts` and `frontend/src/pages/DashboardPage.jsx` for toggle-complete, edit, delete, and create operations; on failure roll back and show error toast with Retry via `useToast`
- [x] T034 [US2] Implement undo-delete flow: on delete, remove from UI immediately, show toast with Undo action for 5 seconds, defer DELETE request until window closes or user navigates away; Undo restores item at original position with no API call
- [x] T035 [P] [US2] Add CSS transitions and Web Animations API animations in `frontend/src/index.css`: new items slide/fade in, removed items collapse, checkmark animation, filter cross-fade, theme color transition; all disabled under `prefers-reduced-motion: reduce`
- [x] T036 [P] [US2] Create `OfflineBanner` component in `frontend/src/components/OfflineBanner.jsx`: shows banner when `navigator.onLine` is false; mutations fail fast with clear toast message
- [x] T037 [US2] Replace scattered inline error text with toast notifications where appropriate (keep field validation errors inline)
- [x] T038 [US2] Verify screen-reader announcement for toasts: success/info via `aria-live="polite"`, errors via `aria-live="assertive"`

**Checkpoint**: All mutations are optimistic with <50ms perceived response. Rollback + Retry works. Undo-delete works within 5s window. Toasts accessible. Offline banner shows.

---

## Phase 5: User Story 3 — Due Dates, Priorities and Search (Priority: P2)

**Goal**: Due dates, priority levels, debounced search, server-side filtering/sorting with URL state, pagination.

**Independent Test**: Create a todo with yesterday's due date and "high" priority — overdue badge appears. Search by title. Apply priority filter. Copy URL to new tab — same view loads. Scroll past 50 items — next page loads.

### Tests for User Story 3

- [x] T039 [P] [US3] Write backend tests in `backend/tests/test_todos.py`: validation of `due_date`/`priority` fields per `data-model.md` `Todo.due_date` (DATE, nullable) and `Todo.priority` (enum low/medium/high, not null, default medium); each filter (`q`, `status`, `priority`, `due`); each sort; combined filters; SQL-wildcard escaping; cursor pagination; two-user data isolation
- [x] T040 [P] [US3] Write migration up/down tests: verify migration 0002 applies cleanly, backfills `priority='medium'` and `due_date=NULL`, and downgrades without data loss
- [x] T041 [P] [US3] Write frontend tests in `frontend/src/components/__tests__/`: debounced search, URL-state sync via `useSearchParams`, overdue chip rendering, `/` keyboard shortcut focus

### Implementation for User Story 3

- [x] T042 [US3] Create Alembic migration `0002_add_due_date_priority` in `backend/alembic/versions/`: add `due_date` (DATE, nullable) and `priority` (VARCHAR, not null, default 'medium', CHECK constraint) columns per `data-model.md` `Todo.due_date` and `Todo.priority`; create index `ix_todos_owner_due_date` on `(owner_id, due_date)`; backfill existing rows; reversible
- [x] T043 [US3] Update `Todo` model in `backend/app/models/todo.py`: add `due_date` and `priority` fields per `data-model.md` `Todo.due_date` and `Todo.priority`
- [x] T044 [US3] Update schemas in `backend/app/schemas/todo.py`: add `due_date` (optional date) and `priority` (enum) to `TodoCreate`, `TodoUpdate`, `TodoResponse` per `data-model.md` `Todo.due_date` and `Todo.priority`; validate invalid priority returns 422
- [x] T045 [US3] Extend `GET /todos` in `backend/app/routers/todos.py` with query parameters per `contracts/todos-api.md`: `q` (ILIKE search, escaped wildcards, max 100 chars), `status`, `priority`, `due` (overdue/today/upcoming=next 7 days excluding today/none), `sort`, `order`
- [x] T046 [US3] Implement cursor-based pagination in `backend/app/services/todo_service.py` per `contracts/todos-api.md`: `cursor`/`limit` params, return `items`, `next_cursor`, `total_count`; all queries scoped to `owner_id` and `deleted_at IS NULL`
- [x] T047 [P] [US3] Create `PriorityBadge` component in `frontend/src/components/PriorityBadge.jsx`: color + text label (never color alone) for low/medium/high
- [x] T048 [P] [US3] Create `DueDateChip` component in `frontend/src/components/DueDateChip.jsx`: shows "Due today", "Due tomorrow", date, or "Overdue" in danger style; interprets date in user's local timezone
- [x] T049 [US3] Integrate `PriorityBadge` and `DueDateChip` into `frontend/src/components/TodoItem.jsx`
- [x] T050 [US3] Add date picker (native `<input type="date">`) and priority selector to `frontend/src/components/AddTodoForm.jsx` with quick-pick chips (Today, Tomorrow, Next week)
- [x] T051 [P] [US3] Create `SearchBox` component in `frontend/src/components/SearchBox.jsx`: debounced at 300ms, cancels stale requests, `/` to focus, `Esc` to clear, match highlighting, no-results state with clear action; max 100 chars
- [x] T052 [US3] Create `useSearch` hook in `frontend/src/hooks/useSearch.js` managing debounce, cancel, and integration with `useSearchParams`
- [x] T053 [P] [US3] Create `FilterPopover` component in `frontend/src/components/FilterPopover.jsx`: priority filter (low/medium/high checkboxes), due range filter (overdue/today/upcoming/none); active filters shown as removable chips
- [x] T054 [P] [US3] Create `SortDropdown` component in `frontend/src/components/SortDropdown.jsx`: sort by created/due/priority/manual, order asc/desc
- [x] T055 [US3] Store filter, search, and sort state in URL query parameters via `useSearchParams` in `frontend/src/pages/DashboardPage.jsx`; ensure views survive refresh and are shareable
- [x] T056 [US3] Create `usePagination` hook in `frontend/src/hooks/usePagination.js`: cursor-based infinite scroll with "Load more" fallback; integrates with filter/sort/search state
- [x] T057 [US3] Update `frontend/src/components/TaskCounter.jsx` to show overdue count alongside existing completed/total metrics
- [x] T058 [US3] Update `frontend/src/types/` with `Priority`, `DueFilter`, `SortOption`, and extended `Todo` type including `due_date`, `priority`, `position`

**Checkpoint**: Due dates, priorities, search, filters, sort, and pagination all working. URL state persists. Data isolation verified. Migration reversible.

---

## Phase 6: User Story 4 — Drag-and-Drop Reordering (Priority: P3)

**Goal**: Manual reordering via drag-and-drop (mouse, touch, pen, keyboard) with fractional positioning, persisted server-side.

**Independent Test**: Drag a todo to new position, reload — stays. Keyboard: Space → arrows → Space. Disabled during search/filter.

### Tests for User Story 4

- [x] T059 [P] [US4] Write backend tests in `backend/tests/test_todos.py`: PATCH position endpoint midpoint math, head/tail moves, rebalance trigger, two-user isolation, 404 and 422 error cases per `contracts/todos-api.md`
- [x] T060 [P] [US4] Write migration up/down tests: verify migration 0003 adds `position` column per `data-model.md` `Todo.position` (DOUBLE PRECISION, not null), backfills by `created_at` order (1024, 2048, ...), and downgrades cleanly
- [x] T061 [P] [US4] Write frontend tests in `frontend/src/components/__tests__/`: reorder reducer state management, keyboard-sensor interaction

### Implementation for User Story 4

- [x] T062 [US4] Create Alembic migration `0003_add_position` in `backend/alembic/versions/`: add `position` (DOUBLE PRECISION) column per `data-model.md` `Todo.position`; backfill existing rows by `(owner_id, created_at)` order with values 1024, 2048, 3072...; set NOT NULL after backfill; create index `ix_todos_owner_position` on `(owner_id, position)`; reversible
- [x] T063 [US4] Update `Todo` model in `backend/app/models/todo.py`: add `position` field per `data-model.md` `Todo.position`
- [x] T064 [US4] Update `TodoResponse` schema in `backend/app/schemas/todo.py` to include `position`
- [x] T065 [US4] Implement `PATCH /todos/{id}/position` endpoint in `backend/app/routers/todos.py` per `contracts/todos-api.md`: accepts `before_id`/`after_id`, computes midpoint position, returns 404 for unowned references, 422 for contradictory input
- [x] T066 [US4] Implement position calculation and rebalance logic in `backend/app/services/todo_service.py`: midpoint between neighbors, head/tail with ±1024 offset, rebalance all user's items when gap < 1e-10
- [x] T067 [US4] Add `sort=manual` as default sort in `GET /todos` (when no other sort specified) using `position` column, in `backend/app/routers/todos.py`
- [x] T068 [US4] Set `position = max(position) + 1024` for new todos in `backend/app/services/todo_service.py` create flow
- [x] T069 [US4] Install `@dnd-kit/core` and `@dnd-kit/sortable` in `frontend/`: `npm install @dnd-kit/core @dnd-kit/sortable` (justified in `research.md` R5)
- [x] T070 [US4] Create `DragHandle` component in `frontend/src/components/DragHandle.jsx`: visible handle on each `TodoItem`, usable with mouse, touch, pen
- [x] T071 [US4] Integrate `@dnd-kit` sortable context into `frontend/src/components/TodoList.jsx`: drag overlay, placeholder, smooth neighbor displacement, keyboard sensors (Space to pick/drop, arrows to move, Esc to cancel)
- [x] T072 [US4] Add live-region announcements for keyboard reorder in `frontend/src/components/TodoList.jsx`: "Moved '{title}' to position {n} of {total}"
- [x] T073 [US4] Disable dragging when search, filter, or non-manual sort is active; show tooltip explaining why on disabled drag handles
- [x] T074 [US4] Implement optimistic reorder: update list order immediately on drop, call PATCH position endpoint, roll back with error toast on failure (reuses toast/optimistic infrastructure from US2)
- [x] T075 [US4] Add `prefers-reduced-motion` support: instant moves instead of animated displacement

**Checkpoint**: Drag-and-drop works with mouse, touch, pen, and keyboard. Reorders persist. Disabled during search/filter. Accessible announcements. No ordering corruption on rapid drags.

---

## Phase 7: User Story 5 — Refresh Tokens and Secure Session Management (Priority: P4, Optional)

**Goal**: Sessions survive beyond 30-minute access-token lifetime via refresh-token rotation with theft detection.

**Independent Test**: Log in, wait for access token to expire, perform action — session continues. Log out — session revoked. Reuse old token — entire chain revoked.

### Tests for User Story 5

- [-] T076 [P] [US5] Write backend tests in `backend/tests/test_auth.py`: refresh endpoint happy path, expired token rejection, token reuse detection (family revocation), logout revocation, concurrent refresh queuing per `contracts/auth-api.md`
- [-] T077 [P] [US5] Write migration up/down tests: verify migration 0004 creates `refresh_tokens` table per `data-model.md` `RefreshToken` entity with all fields and indexes, and downgrades cleanly

### Implementation for User Story 5

- [-] T078 [US5] Create Alembic migration `0004_add_refresh_tokens` in `backend/alembic/versions/`: create `refresh_tokens` table per `data-model.md` `RefreshToken` entity (id, user_id FK, token_hash, family_id UUID, expires_at, revoked_at, created_at); create indexes (`ix_refresh_tokens_token_hash` UNIQUE, `ix_refresh_tokens_family_id`, `ix_refresh_tokens_user_id`); reversible
- [-] T079 [US5] Create `RefreshToken` model in `backend/app/models/refresh_token.py` per `data-model.md` `RefreshToken` entity
- [-] T080 [US5] Create `token_service.py` in `backend/app/services/`: create token (hash + store), rotate token (mark old as used, create new in same family), validate token (check hash, expiry, revoked_at), revoke family (set `revoked_at` on all tokens with matching `family_id`)
- [-] T081 [US5] Implement `POST /auth/refresh` endpoint in `backend/app/routers/auth.py` per `contracts/auth-api.md`: read refresh token from HttpOnly cookie, validate, rotate, return new access token; detect reuse and revoke family
- [-] T082 [US5] Implement `POST /auth/logout` endpoint in `backend/app/routers/auth.py` per `contracts/auth-api.md`: revoke refresh token, clear cookies
- [-] T083 [US5] Add CSRF protection: set `csrf_token` cookie on login/refresh; validate `X-CSRF-Token` header on `/auth/refresh` and `/auth/logout` per `contracts/auth-api.md` cookie specification
- [-] T084 [US5] Update `POST /auth/login` in `backend/app/routers/auth.py`: issue refresh token in HttpOnly cookie alongside access token in response body
- [-] T085 [US5] Update `frontend/src/services/api.ts`: store access token in memory (not localStorage), add axios response interceptor to catch 401, call `/auth/refresh`, queue concurrent requests during refresh, retry with new token; on refresh failure, logout cleanly
- [-] T086 [US5] Update `frontend/src/context/AuthContext.jsx`: remove access token from localStorage, store in memory; update login/logout flows to handle cookies

**Checkpoint**: Sessions survive token expiry. Logout revokes server-side. Token reuse detected and family revoked. CSRF protected. Access token no longer in localStorage.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final quality pass across all features.

- [ ] T087 [P] Update `README.md` with theme toggle documentation, keyboard shortcuts (`/` for search, `Esc` to clear), new API parameters (query params, pagination, position endpoint), and refresh-token auth (if implemented)
- [ ] T088 [P] Add OpenAPI descriptions for all new/modified endpoints in route decorators
- [ ] T089 [P] Verify route-level code splitting for auth pages (`LoginPage`, `RegisterPage`) in `frontend/src/` to meet 150 KB gzipped bundle target
- [ ] T090 Run `ruff check .` and `mypy .` in `backend/`; fix any issues
- [ ] T091 Run `npm run build` and `npm run lint` in `frontend/`; fix any issues
- [ ] T092 Run full quickstart.md validation scenarios end-to-end
- [ ] T093 Verify all animations respect `prefers-reduced-motion: reduce`
- [ ] T094 Final keyboard and screen-reader pass: theme toggle, toast dismiss, search, drag-and-drop

**Checkpoint**: All features polished. Build clean. Lint clean. Accessibility verified. README updated.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1 — Design System)**: Depends on Phase 2
- **Phase 4 (US2 — Toasts/Optimistic)**: Depends on Phase 2 + Phase 3 (uses design tokens)
- **Phase 5 (US3 — Due Dates/Search)**: Depends on Phase 2 + Phase 4 (uses toast/optimistic infrastructure)
- **Phase 6 (US4 — Drag-and-Drop)**: Depends on Phase 2 + Phase 4 + Phase 5 (uses toasts, requires position migration after due_date migration)
- **Phase 7 (US5 — Refresh Tokens)**: Depends on Phase 2 only — can run in parallel with US1–US4 if desired
- **Phase 8 (Polish)**: Depends on all implemented user stories

### User Story Dependencies

- **US1 (Design System)**: Foundation only — no other story dependency
- **US2 (Toasts/Optimistic)**: Depends on US1 (design tokens for toast styling)
- **US3 (Due Dates/Search)**: Depends on US2 (toast/optimistic for new CRUD operations)
- **US4 (Drag-and-Drop)**: Depends on US2 + US3 (toasts for rollback, migration ordering)
- **US5 (Refresh Tokens)**: Independent of US1–US4 (can be built in parallel)

### Parallel Opportunities Within Phases

- **Phase 2**: T005–T008 sequential (token refactoring chain); T009, T010, T012, T013 parallel (independent components)
- **Phase 3**: T015–T016 parallel (tests); T017–T025 mostly parallel (independent component restyling)
- **Phase 4**: T029–T031 parallel (tests); T035, T036 parallel with main implementation
- **Phase 5**: T039–T041 parallel (tests); T047, T048, T051, T053, T054 parallel (independent components)
- **Phase 6**: T059–T061 parallel (tests); backend tasks sequential; frontend T069–T075 mostly sequential
- **Phase 7**: T076–T077 parallel (tests); backend sequential; frontend T085–T086 sequential

---

## Parallel Example: User Story 3

```
# Tests (parallel):
T039: Backend filter/sort/pagination tests
T040: Migration up/down tests
T041: Frontend search/filter tests

# Backend (sequential):
T042 → T043 → T044 → T045 → T046

# Frontend components (parallel after backend):
T047: PriorityBadge component
T048: DueDateChip component
T051: SearchBox component
T053: FilterPopover component
T054: SortDropdown component

# Frontend integration (sequential):
T049 → T050 → T052 → T055 → T056 → T057 → T058
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (test isolation)
2. Complete Phase 2: Foundational (design tokens, theme, toasts)
3. Complete Phase 3: US1 — Design System
4. Complete Phase 4: US2 — Toasts & Optimistic Updates
5. **STOP and VALIDATE**: App has modern look + instant feedback
6. Deploy/demo MVP

### Incremental Delivery

1. Setup + Foundational → Safe test infrastructure + design tokens + toasts
2. Add US1 → Visual refresh with dark mode (MVP visual milestone)
3. Add US2 → Instant feedback, undo-delete (MVP interaction milestone)
4. Add US3 → Due dates, priorities, search, pagination (planning features)
5. Add US4 → Manual reordering (productivity feature)
6. Add US5 → Refresh tokens (optional security hardening)
7. Polish → README, accessibility audit, bundle check

Each increment is independently testable and deployable.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently
- Feature 5 (Refresh Tokens) is optional — skip Phase 7 if not approved
- All data-model.md field citations reference canonical constraints; do not duplicate constraint values in task descriptions
