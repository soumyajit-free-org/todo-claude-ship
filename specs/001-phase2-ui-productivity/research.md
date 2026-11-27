# Research: Phase 2 — Modern UI & Productivity Enhancements

**Date**: 2026-11-26 | **Plan**: [plan.md](plan.md) | **Spec**: [spec.md](spec.md)

## R1: Test Database Isolation Strategy

**Decision**: Use a separate PostgreSQL test database (`TEST_DATABASE_URL`) with a startup guard in `conftest.py` that aborts if `TEST_DATABASE_URL == DATABASE_URL`.

**Rationale**: The current setup defaults to in-memory SQLite but shares the same `DATABASE_URL` risk. A guard prevents accidental data wipes. Using PostgreSQL for tests ensures schema parity (SQLite lacks CHECK constraints, enums and some index behaviors used by the new migrations).

**Alternatives considered**:
- In-memory SQLite only: rejected — schema parity issues with PostgreSQL-specific features (enums, check constraints).
- Docker-per-test: rejected — too slow for rapid iteration; overkill for a single-developer project.

## R2: CSS Design Token Architecture

**Decision**: CSS custom properties on `:root` with `[data-theme="light"]` and `[data-theme="dark"]` selectors. An inline `<script>` in `index.html` reads `localStorage` (in try/catch) and sets `data-theme` before first paint. System mode uses `prefers-color-scheme` media query as fallback.

**Rationale**: Pure CSS custom properties require no runtime dependency, work with the existing plain-CSS setup, and enable instant theme switching via attribute change. The inline script eliminates FOUC (flash of unstyled content).

**Alternatives considered**:
- CSS-in-JS (styled-components, emotion): rejected — adds bundle weight, contradicts "prefer CSS and the platform" principle.
- Tailwind CSS: rejected — large scope change to migrate existing styles; spec says "prefer CSS."
- CSS Modules: viable but adds build complexity for marginal benefit in a single-stylesheet project.

## R3: Toast Notification System

**Decision**: Custom implementation using a React context provider (`ToastContext`) with a reducer for state management. No external library.

**Rationale**: The toast requirements (3-variant, auto-dismiss, pause on hover, stack limit of 3, aria-live regions, Retry/Undo actions) are specific enough that a custom implementation is simpler than configuring a library. The spec explicitly says "no new heavy dependencies without justification."

**Alternatives considered**:
- react-hot-toast (~5 KB): capable but doesn't natively support action buttons (Retry/Undo) or the specific aria-live variant switching (assertive for errors, polite for others).
- sonner (~4 KB): similar limitations with custom actions.

## R4: Optimistic Update Pattern

**Decision**: Per-item optimistic state tracked in a reducer alongside the main todo list. Each mutation gets a unique request ID; the reducer applies optimistic changes immediately, then confirms or rolls back based on server response.

**Rationale**: A reducer cleanly handles the apply/confirm/rollback lifecycle and prevents rapid-toggle race conditions by tracking in-flight state per item. This pattern integrates naturally with the existing React state management.

**Alternatives considered**:
- TanStack Query (React Query): powerful but heavy dependency (~30 KB) for optimistic mutations that could be handled with a focused reducer.
- SWR: similar trade-off; adds dependency weight for a pattern that's straightforward to implement directly.

## R5: Drag-and-Drop Library Justification (@dnd-kit)

**Decision**: Use `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop reordering.

**Rationale**: The spec requires mouse, touch, pen and full keyboard support with live-region announcements. @dnd-kit is the only actively maintained library that provides all of these out of the box with accessible defaults. Building this from scratch would be a significant accessibility engineering effort.

**Justification (required by constitution)**: @dnd-kit/core (~12 KB gzipped) + @dnd-kit/sortable (~4 KB gzipped) = ~16 KB total. This fits within the 150 KB budget. The alternative — building accessible drag-and-drop with keyboard sensors and ARIA announcements from scratch — would take several days and risk accessibility gaps.

**Alternatives considered**:
- react-beautiful-dnd: deprecated, no longer maintained.
- Native HTML drag-and-drop API: no keyboard support, no touch support, no accessibility features.
- Custom implementation: too costly for the accessibility requirements (keyboard sensors, live regions, focus management).

## R6: Fractional Positioning Algorithm

**Decision**: Use floating-point midpoint positioning. When an item moves between two neighbors, its new position = (before_position + after_position) / 2. When moved to the head, position = first_position - 1024. When moved to the tail, position = last_position + 1024. Rebalance when the gap between any two neighbors drops below 1e-10.

**Rationale**: Midpoint fractional positioning makes reorder a single-row UPDATE. The 1024 gap for head/tail insertions provides ample room before precision issues arise. Rebalancing (reassigning evenly-spaced integers to all items) is a rare background operation.

**Alternatives considered**:
- Integer positioning with gap rewriting: requires updating multiple rows on every move; O(n) worst case.
- Lexicographic string ordering: more complex, harder to index efficiently.
- Linked-list ordering: requires traversal; not efficient for SQL queries with ORDER BY.

## R7: Pagination Strategy

**Decision**: Cursor-based pagination using the `position` field (for manual sort) or `created_at`/`due_date`/`priority` (for other sorts), with a secondary tiebreaker on `id`. Page size defaults to 50. The API returns a `next_cursor` token; the frontend implements infinite scroll with a "Load more" button fallback.

**Rationale**: Cursor-based pagination is stable under concurrent insertions and deletions (no skipped/duplicated items). It works naturally with the fractional positioning system. The cursor is an opaque token encoding the sort key + id of the last item.

**Alternatives considered**:
- Offset-based (LIMIT/OFFSET): unstable when items are added or removed between pages; can skip or duplicate items.
- Keyset pagination without cursor token: exposes internal sort keys to the client, coupling frontend to backend sort implementation.

## R8: Refresh Token Rotation (Feature 5, Optional)

**Decision**: Server-side refresh token table with hashed tokens, expiry, `revoked_at`, and a `family_id` column linking all tokens in a rotation chain. Rotation creates a new token and marks the old one used. Reuse of a used token revokes the entire family.

**Rationale**: Family-based rotation detection is the industry standard for catching token theft. Storing hashed tokens (not plaintext) limits exposure if the database is compromised. HttpOnly + Secure + SameSite=Strict cookies prevent XSS-based token theft.

**CSRF protection**: Since refresh tokens are in cookies, all cookie-authenticated endpoints require a CSRF token. The access token (kept in memory) is not in a cookie, so regular API calls are not vulnerable to CSRF — only the `/auth/refresh` endpoint needs CSRF protection, delivered via a double-submit cookie pattern.

**Alternatives considered**:
- Sliding-window refresh (extend expiry on use): simpler but doesn't detect token theft.
- Short-lived tokens only (no refresh): current approach; causes the "logged out after 30 minutes" problem.

## R9: Search Implementation

**Decision**: Server-side ILIKE query on title and description with SQL wildcard escaping (`%` and `_` escaped). Debounced at 300ms on the frontend. Search input bounded to 100 characters.

**Rationale**: Server-side search keeps the architecture consistent (backend as truth) and works with pagination. ILIKE is sufficient for the expected scale (1,000+ items per user). Full-text search (tsvector) is overkill for this scale.

**Alternatives considered**:
- PostgreSQL full-text search (tsvector/tsquery): more powerful but adds migration complexity and is unnecessary for simple substring matching at this scale.
- Client-side filtering: breaks with pagination; loads all data upfront.

## R10: URL State Management for Filters

**Decision**: Store filter, search and sort state in URL query parameters using `useSearchParams` from react-router-dom. Parameters: `q`, `status`, `priority`, `due`, `sort`, `order`. Absent parameters use defaults (all statuses, all priorities, no due filter, sort by manual/created, desc).

**Rationale**: URL state makes views bookmarkable, shareable and refresh-safe. react-router-dom's `useSearchParams` is already a dependency and handles serialization/deserialization.

**Alternatives considered**:
- Component state only: loses state on refresh; not shareable.
- Redux/Zustand: adds dependency for state that URL params handle natively.
