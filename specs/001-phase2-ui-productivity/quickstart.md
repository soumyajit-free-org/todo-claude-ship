# Quickstart Validation Guide: Phase 2

**Date**: 2026-11-26 | **Plan**: [plan.md](plan.md)

This guide documents runnable validation scenarios that prove each Phase 2 feature works end-to-end. Run these after implementation to verify acceptance criteria.

## Prerequisites

- PostgreSQL running with two databases: app DB (`DATABASE_URL`) and test DB (`TEST_DATABASE_URL`)
- Backend dependencies installed: `pip install -r requirements.txt`
- Frontend dependencies installed: `npm install` in `frontend/`
- All migrations applied: `alembic upgrade head`

## Validation 0: Testing Hygiene

**Goal**: Confirm test database isolation before any feature work.

### Scenario A: Tests use separate database
```bash
cd backend
TEST_DATABASE_URL="postgresql://user:pass@localhost/todo_test" pytest -v
```
**Expected**: All tests run against `todo_test` database. App database is untouched.

### Scenario B: Guard rejects shared database
```bash
cd backend
TEST_DATABASE_URL="$DATABASE_URL" pytest
```
**Expected**: pytest aborts immediately with error: "TEST_DATABASE_URL must not equal DATABASE_URL"

## Validation 1: Design System & Dark Mode

**Goal**: Theme switching works, persists, and meets contrast requirements.

### Scenario A: Theme toggle
1. Open the app in a browser
2. Click the theme toggle in the navbar
3. Cycle through: System → Light → Dark → System
**Expected**: Each theme applies instantly. Icons update (sun/moon/monitor).

### Scenario B: Persistence across reload
1. Select "Dark" theme
2. Reload the page
**Expected**: Page loads directly in dark mode with no flash.

### Scenario C: System mode follows OS
1. Select "System" theme
2. Change OS dark mode setting
**Expected**: App theme updates live without reload.

### Scenario D: Contrast audit
```bash
cd frontend
npx lighthouse http://localhost:5173/login --only-categories=accessibility --output=json | jq '.categories.accessibility.score'
```
**Expected**: Score >= 0.95. Repeat for `/dashboard`.

### Run tests
```bash
cd frontend && npm test -- --grep "theme"
cd backend  # No backend tests for this feature
```

## Validation 2: Toasts & Optimistic Updates

**Goal**: Instant feedback, rollback on failure, undo delete.

### Scenario A: Optimistic toggle
1. Open DevTools Network tab, set throttling to "Slow 3G"
2. Click a todo's checkbox
**Expected**: Checkbox toggles immediately (<50ms perceived). Network request fires in background.

### Scenario B: Rollback on failure
1. Disconnect network (DevTools → Offline)
2. Toggle a todo's checkbox
**Expected**: Checkbox toggles, then reverts. Error toast appears with Retry button.

### Scenario C: Undo delete
1. Delete a todo
2. Click "Undo" on the toast within 5 seconds
**Expected**: Todo reappears at its original position. No DELETE request was sent.

### Scenario D: Undo expires
1. Delete a todo
2. Wait 5 seconds without clicking Undo
**Expected**: Toast dismisses. Network tab shows the DELETE request was sent.

### Scenario E: Screen reader announcements
1. Enable screen reader (or inspect `aria-live` regions)
2. Create a todo
**Expected**: Success toast is announced via `aria-live="polite"`.

### Run tests
```bash
cd frontend && npm test -- --grep "toast\|optimistic\|undo"
```

## Validation 3: Due Dates, Priorities & Search

**Goal**: New fields work, search and filters function, pagination loads correctly.

### Scenario A: Create with due date and priority
1. Click "Add Todo"
2. Set title, pick "Tomorrow" quick chip, select "High" priority
3. Submit
**Expected**: Todo appears with "Due tomorrow" chip and "High" priority badge.

### Scenario B: Overdue display
1. Create a todo with due date = yesterday
2. Leave it incomplete
**Expected**: "Overdue" chip in danger style appears on the todo.

### Scenario C: Search with keyboard shortcut
1. Press `/` from anywhere on the dashboard
2. Type a search term that matches a todo's title
**Expected**: Search box focuses. After 300ms debounce, list filters. Matches are highlighted.

### Scenario D: Filter and URL persistence
1. Open the filter popover, select "High" priority
2. Set sort to "Due date ascending"
3. Copy the URL, open in a new tab
**Expected**: Same filter and sort are applied in the new tab.

### Scenario E: Pagination
1. Ensure the user has 60+ todos
2. Load the dashboard
**Expected**: First 50 items load. Scrolling down or clicking "Load more" fetches the next page.

### Scenario F: Data isolation
```bash
cd backend && pytest tests/test_todos.py -k "isolation" -v
```
**Expected**: User A's search/filter never returns User B's todos.

### Run tests
```bash
cd backend  && pytest tests/test_todos.py -v
cd frontend && npm test -- --grep "search\|filter\|priority\|due"
```

## Validation 4: Drag-and-Drop Reordering

**Goal**: Reorder persists, keyboard works, disabled when filtered.

### Scenario A: Mouse drag
1. Clear all filters and search (manual sort active)
2. Drag a todo from position 5 to position 2
3. Reload the page
**Expected**: Todo stays at position 2.

### Scenario B: Keyboard reorder
1. Tab to a drag handle, press Space
2. Press Up arrow twice, press Space to drop
**Expected**: Item moves up two positions. Live-region announces new position.

### Scenario C: Disabled during search
1. Type a search term in the search box
2. Try to drag a todo
**Expected**: Drag handle is disabled. Tooltip explains "Reordering is disabled while search or filters are active."

### Scenario D: Rapid reorders
1. Quickly drag three different items to new positions in succession
2. Reload
**Expected**: All three positions are correct.

### Run tests
```bash
cd backend  && pytest tests/test_todos.py -k "position\|reorder" -v
cd frontend && npm test -- --grep "drag\|reorder"
```

## Validation 5: Refresh Tokens (Optional)

**Goal**: Session survives token expiry, logout revokes, theft detected.

### Scenario A: Transparent refresh
1. Log in. Note the access token expiry (30 min)
2. Wait for access token to expire (or mock the expiry in dev tools)
3. Perform an action (e.g., create a todo)
**Expected**: Action succeeds without login prompt. Network tab shows `/auth/refresh` call.

### Scenario B: Logout revocation
1. Log out
2. Attempt to use the old refresh token (via curl or DevTools)
**Expected**: 401 Unauthorized.

### Scenario C: Token reuse detection
```bash
cd backend && pytest tests/test_auth.py -k "token_reuse" -v
```
**Expected**: Reusing a rotated token revokes the entire family.

### Run tests
```bash
cd backend  && pytest tests/test_auth.py -v
cd frontend && npm test -- --grep "refresh\|auth"
```

## Full Test Suite

```bash
# Backend
cd backend && pytest -v

# Frontend
cd frontend && npm test

# Lint and type checks
cd backend  && ruff check . && mypy .
cd frontend && npm run build && npm run lint

# Accessibility
cd frontend && npx lighthouse http://localhost:5173/login --only-categories=accessibility
cd frontend && npx lighthouse http://localhost:5173/dashboard --only-categories=accessibility
```

**All tests green + build clean + lint clean + accessibility score >= 95 = Phase 2 complete.**
