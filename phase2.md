# Phase 2: Modern UI & Productivity Enhancements

**Status:** Proposed · **Depends on:** MVP (Auth + CRUD + Data Isolation) passing all acceptance criteria, per the constitution's Scope Discipline rule.

Phase 2 turns the working MVP into a polished, modern product. It has five features, which can ship in the order below. Each is an independent vertical slice, so any of them can be built, tested and merged on its own.

| # | Feature | Backend change | Migration |
|---|---------|----------------|-----------|
| 1 | Design system, dark mode and visual refresh | None | No |
| 2 | Toasts, animations and optimistic updates | None | No |
| 3 | Due dates, priorities and search | New fields, query params | `0002` |
| 4 | Drag-and-drop reordering | `position` field, reorder endpoint | `0003` |
| 5 | Refresh tokens and cookie auth *(optional, security)* | New endpoints | `0004` |

---

## Current baseline

- **Frontend:** React 19, Vite, react-router-dom, axios, plain CSS in `frontend/src/index.css` with hard-coded colors. The components are `Navbar`, `AddTodoForm`, `FilterTabs`, `TaskCounter`, `TodoList`, `TodoItem` and `EmptyState`. Auth state lives in `AuthContext`.
- **Backend:** FastAPI with `GET/POST /todos`, `PUT/DELETE /todos/{id}`. The `Todo` model has `title`, `description`, `is_completed`, `owner_id`, `created_at` and a soft-delete `deleted_at`.
- **Auth:** 30-minute JWT in `localStorage`, with no refresh.

## Global principles

These apply to every feature below and come from the constitution.

- Every schema change ships with an Alembic migration. Every query stays scoped to `owner_id`.
- Frontend builds with zero TypeScript or lint errors (`npm run build`, `npm run lint`). Backend passes `ruff` and type checks.
- Every feature has tests: pytest for the API, Vitest and Testing Library for the UI.
- Accessibility is a requirement, not polish. That means WCAG AA contrast in both themes, full keyboard operation, visible focus rings, and `prefers-reduced-motion` honored for all animation.
- No new heavy dependencies without justification in the plan. Prefer CSS and the platform. Where a library is justified it is named below.

---

## Feature 1: Design system, dark mode and visual refresh

**Goal:** A cohesive, modern look with a user-selectable theme, built on design tokens instead of hard-coded colors.

### Requirements

1. **Design tokens.** Replace hard-coded values in `index.css` with CSS custom properties:
   - Color roles: `--bg`, `--surface`, `--surface-raised`, `--border`, `--text`, `--text-muted`, `--accent`, `--accent-contrast`, `--danger`, `--success`.
   - A spacing scale, a radius scale (`--radius-sm/md/lg`), shadow levels, a type scale and motion durations/easing.
2. **Theme toggle.** Three modes: **System** (default), **Light**, **Dark**.
   - Applied through `data-theme` on `<html>`. The system mode follows `prefers-color-scheme` and updates live when the OS setting changes.
   - The choice is persisted in `localStorage`, with all access in `try/catch`.
   - A small inline script in `index.html` sets the theme before first paint, so there is no flash of the wrong theme.
   - The control lives in the `Navbar` as an accessible button group or menu, with a label, current state announced, and a sun/moon/monitor icon.
3. **Visual refresh** of all existing screens (login, register, dashboard):
   - Cards with softer elevation, consistent radii and generous spacing.
   - Segmented-control styling for `FilterTabs`. A custom animated checkbox on `TodoItem`, with the completed state visibly distinct.
   - Primary, secondary, ghost and danger button variants with hover, active, focus-visible and disabled states.
   - Inputs with clear focus rings and inline error styling, plus a proper field-error pattern for forms.
   - A friendlier `EmptyState` (inline SVG illustration and a call to action) and skeleton loaders in place of the "Loading…" text.
   - A progress indicator in `TaskCounter` showing completed vs. total.
4. **Responsive layout.** Fluid layout from 320px up. Touch targets are at least 44×44px on mobile. The add form collapses to a single column on small screens.
5. **Typography.** System font stack by default. Optionally self-host one variable font (for example Inter) with `font-display: swap`.

### Acceptance criteria

- Switching theme updates the whole UI instantly, survives reload, and shows no flash on load.
- All text and interactive-control contrast is at least 4.5:1 (3:1 for large text and UI boundaries) in both themes.
- Lighthouse accessibility score is at least 95 on login and dashboard.
- No hard-coded color literals remain outside the token definitions.

### Tests

- Unit: theme hook (system/light/dark resolution, persistence, storage failure fallback).
- Component: toggle changes `data-theme`; `aria-pressed` or equivalent is correct.

---

## Feature 2: Toasts, animations and optimistic updates

**Goal:** The app feels instant and gives clear feedback. All of this is frontend-only.

### Requirements

1. **Toast system.** A `ToastProvider` and `useToast()` hook.
   - Variants are success, error and info. Toasts auto-dismiss after about 4 seconds and pause on hover or focus. Each can be dismissed manually, and the stack is capped at 3.
   - Rendered in an `aria-live="polite"` region (errors use `assertive`). Positioned bottom-right on desktop and bottom-center on mobile.
   - Standard messages for create, update, delete and network failure. Replace the scattered inline error text where a toast fits better. Field validation errors stay inline.
2. **Optimistic updates** for toggle-complete, edit and delete, and for create where the id can be reconciled.
   - The UI updates immediately. On failure it rolls back to the previous state and shows an error toast with a **Retry** action.
   - In-flight requests are tracked per item, so rapid toggling cannot produce out-of-order or duplicate requests.
3. **Undo delete.** Deleting shows a toast with an **Undo** action for 5 seconds.
   - The item is removed from the UI immediately, and the `DELETE` request is deferred until the window closes or the user navigates away.
   - Undo restores the item at its original position with no API call needed.
   - Soft delete already exists in the backend (`deleted_at`), so no backend change is required.
4. **Animations**, using CSS transitions and the Web Animations API, with no animation library:
   - New items slide and fade in. Removed items collapse smoothly.
   - Completing a todo animates the checkmark and the strikethrough.
   - Filter changes cross-fade the list. Theme change uses a short color transition.
   - All animation is disabled or reduced under `prefers-reduced-motion: reduce`.
5. **Offline awareness.** Show an unobtrusive banner when `navigator.onLine` is false. Mutations made offline fail fast with a clear message, not a silent hang.

### Acceptance criteria

- Toggling a todo reflects in the UI in under 50ms, independent of network latency.
- A failed mutation reverts the UI and offers Retry. Retry succeeds when the network returns.
- Undo within the window restores the item, and no delete request is ever sent for it.
- The screen-reader announcement test passes for toasts.

### Tests

- Unit: optimistic reducer (apply, confirm, rollback, rapid sequence).
- Component: undo flow with fake timers; retry flow with a mocked failing axios call.

---

## Feature 3: Due dates, priorities and search

**Goal:** Make the list useful for real planning.

### Data model (migration `0002`)

Add to `todos`:

| Column | Type | Notes |
|--------|------|-------|
| `due_date` | `DATE`, nullable | Date only, interpreted in the user's local time on the client. |
| `priority` | `SMALLINT` or enum `low/medium/high`, not null, default `medium` | Prefer a string enum with a DB check constraint for readability. |

Add an index on `(owner_id, due_date)`. The migration must be reversible, and existing rows get `priority = 'medium'` and `due_date = NULL`.

### API changes

- `TodoCreate` and `TodoUpdate` accept `due_date` and `priority`. `TodoResponse` returns them. Invalid priority values return `422`.
- `GET /todos` gains optional query parameters:
  - `q`: case-insensitive match on title and description. Escape `%` and `_`. Bound the length to 100 characters.
  - `status`: `all | active | completed`.
  - `priority`: one or more of `low`, `medium`, `high`.
  - `due`: `overdue | today | upcoming | none`.
  - `sort`: `created | due | priority`, with `order` of `asc` or `desc`.
- Defaults reproduce today's behavior, so existing clients keep working.
- All filters are applied inside the existing `owner_id` and `deleted_at IS NULL` scope.

### UI requirements

1. **Add and edit form:** an optional date picker (native `<input type="date">` styled to the design system) and a priority selector. Quick-pick chips for **Today**, **Tomorrow** and **Next week**.
2. **Todo item:** a priority badge (color plus text or icon, never color alone), and a due-date chip. The chip says "Due today" or "Due tomorrow", shows the date otherwise, and turns to a danger style with "Overdue" when past due and incomplete.
3. **Search box** in the toolbar:
   - Debounced at 300ms and cancelling stale requests.
   - `/` focuses it from anywhere. `Esc` clears it.
   - Matches are highlighted in titles and descriptions.
   - A "no results" state with a clear-search action.
4. **Filters and sort:** extend `FilterTabs` with a filter popover for priority and due ranges, and a sort dropdown. Active filters appear as removable chips. Filter, search and sort state is stored in the URL query string so views are shareable and survive refresh.
5. **Summary:** `TaskCounter` also shows the number of overdue items.

### Acceptance criteria

- A user can never see or search another user's todos (covered by a data-isolation test with two users).
- Search over 1,000 todos returns in under 200ms on the dev database.
- Overdue logic is correct across time zones and at midnight rollover.
- Migration upgrades and downgrades cleanly on a database with existing data.

### Tests

- Backend: validation, each filter and sort, combined filters, SQL-wildcard escaping, isolation, migration up and down.
- Frontend: debounced search, URL-state sync, overdue chip rendering, keyboard shortcuts.

---

## Feature 4: Drag-and-drop reordering

**Goal:** Let users prioritize manually by ordering their list.

### Data model (migration `0003`)

- Add `position` (`DOUBLE PRECISION` or `NUMERIC`, not null) to `todos`, with an index on `(owner_id, position)`.
- Backfill existing rows in `created_at` order, so current ordering is preserved.
- Use **fractional positioning**: a moved item takes the midpoint of its new neighbors. This makes a reorder a single-row update. A background or on-demand rebalance runs when the gap between neighbors drops below a threshold.

### API changes

- New todos get `position` greater than the current maximum, so they append to the end (or the top, if a newest-first order is chosen in the plan).
- `PATCH /todos/{id}/position` takes `{ "before_id": int | null, "after_id": int | null }`. The server computes the position. It returns `404` if a referenced id is not owned by the user, and `422` for contradictory input.
- `GET /todos` supports `sort=manual` (the default when no other sort is set).

### UI requirements

1. **Drag handle** on each item, usable with mouse, touch and pen. Libraries: `@dnd-kit/core` and `@dnd-kit/sortable` are recommended, since they are accessible and maintained. This dependency must be justified in `plan.md`.
2. **Keyboard reordering:** focus the handle, press `Space` to pick up, arrow keys to move, `Space` to drop, `Esc` to cancel. Moves are announced through a live region ("Moved *Buy milk* to position 3 of 8").
3. **Visuals:** a raised drag overlay, a placeholder showing the drop target, and smooth neighbor displacement. Reduced-motion users get instant moves.
4. **Optimistic and safe:** the list reorders immediately. A failed request rolls back with an error toast, as in Feature 2.
5. Dragging is disabled while a search or filter is active, or when the sort is not manual. A tooltip explains why.

### Acceptance criteria

- Reorders persist across reload and across devices.
- Rapid consecutive drags never corrupt ordering. Concurrent edits from two tabs converge after refresh.
- Fully operable with keyboard only, and screen-reader announcements are verified.
- A user cannot reposition relative to another user's todo.

### Tests

- Backend: midpoint math, rebalance, head and tail moves, isolation, `404` and `422` cases.
- Frontend: reorder reducer and keyboard-sensor interaction tests.

---

## Feature 5 (optional): Refresh tokens and cookie-based auth

The MVP research notes defer these to Phase 2: refresh tokens, and HttpOnly cookies as the safer alternative to `localStorage`. Do this feature only if the security improvement is wanted. It is not a UI feature, but it removes the "logged out after 30 minutes" surprise that would otherwise undercut the polished experience.

- Add a `refresh_tokens` table (migration `0004`) that stores hashed tokens with expiry, `revoked_at` and a rotation chain.
- `POST /auth/refresh` rotates the token. Reusing an old token revokes the whole chain. `POST /auth/logout` revokes the token server-side.
- Deliver the refresh token in an `HttpOnly; Secure; SameSite=Strict` cookie. Keep the short-lived access token in memory, not `localStorage`. Add CSRF protection to cookie-authenticated endpoints, as the plan must describe.
- The axios layer refreshes transparently on `401`, queues concurrent requests during refresh, and logs out cleanly if refresh fails.
- Acceptance: a session survives past the access-token lifetime, logout revokes the session, and token reuse is detected and rejected.

---

## Cross-cutting items

- **Testing hygiene (do first).** `DATABASE_URL` and `TEST_DATABASE_URL` currently point at the same database, and the pytest fixtures call `drop_all`, which wipes the app's tables. Point tests at a separate database or in-memory SQLite before adding any migration work, and make `conftest.py` refuse to run against a URL equal to `DATABASE_URL`.
- **Performance budget.** Initial JS is under 150 KB gzipped. Route-level code splitting for the auth pages.
- **Docs.** Update `README.md` with the theme, shortcuts (`/` for search, `Esc` to clear) and new API parameters. Add the new endpoints to the OpenAPI descriptions.
- **Definition of done for every feature:** migration (if any) reviewed and reversible, tests green, `build` and `lint` clean, keyboard and screen-reader pass done, and the README updated.

## Suggested delivery order

1. Testing hygiene fix.
2. Feature 1 (design system), which every later feature builds on visually.
3. Feature 2 (toasts and optimistic updates), which Features 3 and 4 reuse for feedback and rollback.
4. Feature 3, then Feature 4.
5. Feature 5, if approved.

## Out of scope for Phase 2

Multi-user sharing or collaboration, subtasks, recurring tasks, file attachments, push notifications, native mobile apps, and offline-first sync with a service worker.
