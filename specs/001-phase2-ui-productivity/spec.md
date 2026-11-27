# Feature Specification: Phase 2 — Modern UI & Productivity Enhancements

**Feature Branch**: `feature/dev-by-spec-kit`

**Created**: 2026-11-26

**Status**: Draft

**Input**: User description: "Phase 2 requirements from phase2.md — design system with dark mode, toasts and optimistic updates, due dates/priorities/search, drag-and-drop reordering, and optional refresh-token auth."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Design System and Theme Switching (Priority: P1)

A user opens the application and sees a cohesive, modern visual design with consistent styling across all screens (login, register, dashboard). They can switch between Light, Dark and System themes using a control in the navigation bar. The chosen theme persists across sessions and applies instantly without any flash of the wrong theme on page load. The System option follows the operating system's preference and updates live when the OS setting changes.

**Why this priority**: Every subsequent feature builds on this visual foundation. Without design tokens and theme support, later features cannot maintain visual consistency. This is the prerequisite for all Phase 2 work.

**Independent Test**: A user can open the app, switch between all three themes, reload, and confirm the theme persists. All screens render with consistent, token-based styling in both light and dark modes.

**Acceptance Scenarios**:

1. **Given** the user has never visited before, **When** they open the app and their OS is set to dark mode, **Then** the app renders in dark mode with no flash of light theme.
2. **Given** the user selects "Light" theme, **When** they reload the page, **Then** the app loads directly in light mode.
3. **Given** the user selects "System" and their OS is in light mode, **When** they change their OS to dark mode, **Then** the app updates to dark mode instantly without a reload.
4. **Given** any screen in either theme, **When** inspected for contrast ratios, **Then** all text and interactive controls meet WCAG AA (4.5:1 for normal text, 3:1 for large text and UI boundaries).
5. **Given** the app is viewed on a 320px-wide screen, **When** the user interacts with any element, **Then** all touch targets are at least 44x44px and the layout is usable without horizontal scrolling.

---

### User Story 2 — Toasts, Optimistic Updates and Undo Delete (Priority: P1)

A user performs actions on their todos (create, toggle, edit, delete) and sees the UI respond instantly regardless of network latency. If a network request fails, the UI reverts to the previous state and shows an error notification with a Retry option. When deleting a todo, the user sees a brief notification with an Undo action; pressing Undo restores the item without any server round-trip. Toast notifications appear for all significant actions and are accessible to screen readers.

**Why this priority**: Instant feedback and undo are critical to a polished user experience. Features 3 and 4 depend on this toast and optimistic-update infrastructure for their own feedback and rollback flows.

**Independent Test**: Toggle a todo's completion — the UI updates immediately. Simulate a network failure — the UI reverts and shows an error toast with Retry. Delete a todo — the undo toast appears and pressing Undo restores the item.

**Acceptance Scenarios**:

1. **Given** the user toggles a todo's completion, **When** the action is performed, **Then** the UI reflects the change in under 50ms regardless of network latency.
2. **Given** the network is unavailable, **When** a mutation fails, **Then** the UI reverts to the prior state and an error toast with a Retry action appears.
3. **Given** the user clicks Retry on a failed mutation toast, **When** the network has recovered, **Then** the mutation succeeds and the UI updates correctly.
4. **Given** the user deletes a todo, **When** the undo toast appears, **Then** pressing Undo within 5 seconds restores the item at its original position with no server request needed.
5. **Given** the user deletes a todo and does not press Undo, **When** the 5-second window expires or they navigate away, **Then** the delete request is sent to the server.
6. **Given** the user rapidly toggles the same todo multiple times, **When** the requests resolve, **Then** the final state is consistent and no duplicate or out-of-order requests occur.
7. **Given** an offline banner is showing, **When** the user attempts a mutation, **Then** the action fails immediately with a clear message rather than hanging silently.

---

### User Story 3 — Due Dates, Priorities and Search (Priority: P2)

A user adds a due date and priority level (low, medium, high) when creating or editing a todo. They can search their todos by title or description using a search box. They can filter by priority, due-date range (overdue, today, upcoming, none) and completion status, and sort by creation date, due date or priority. Active filters and search terms are reflected in the URL so the view survives refresh and can be shared.

**Why this priority**: Due dates and priorities turn the todo list into a real planning tool. Search and filtering are essential once the list grows. This builds on the design system (Feature 1) and uses the toast/optimistic infrastructure (Feature 2).

**Independent Test**: Create a todo with a due date of yesterday and priority "high". Verify the overdue badge appears. Search for it by title. Apply a priority filter and confirm only matching items show. Copy the URL, open in a new tab, and confirm the same filtered view loads.

**Acceptance Scenarios**:

1. **Given** the user creates a todo with due date "today" and priority "high", **When** the todo appears in the list, **Then** it shows a "Due today" chip and a "High" priority badge.
2. **Given** a todo has a due date in the past and is not completed, **When** the user views the list, **Then** the todo shows an "Overdue" chip in a danger style.
3. **Given** the user types in the search box, **When** 300ms have passed since the last keystroke, **Then** the list filters to todos matching the search term in title or description, with matches highlighted.
4. **Given** the user presses `/` anywhere on the page, **When** focus moves to the search box, **Then** they can type immediately. Pressing `Esc` clears the search.
5. **Given** the user applies a priority filter of "high" and sorts by due date ascending, **When** the URL is copied and opened in a new tab, **Then** the same filter and sort are applied.
6. **Given** two users exist, **When** User A searches or filters, **Then** only User A's todos are visible — no data from User B is ever returned.
7. **Given** the user has 1,000+ todos, **When** they perform a search, **Then** results appear in under 200ms on a standard development database.
8. **Given** an existing database with todos, **When** the data model changes are applied, **Then** existing rows receive a default priority of "medium" and a null due date, and the changes can be fully reversed.

---

### User Story 4 — Drag-and-Drop Reordering (Priority: P3)

A user manually reorders their todos by dragging items to new positions. The reordering works with mouse, touch, pen and keyboard. The new order persists across reloads and devices. Reordering is disabled when a search, filter or non-manual sort is active, with an explanation shown to the user.

**Why this priority**: Manual ordering adds a personal productivity dimension. It depends on Features 1-3 being in place for consistent UI, toast feedback and the data model.

**Independent Test**: Drag a todo from position 5 to position 2, reload, and confirm it stays at position 2. Use keyboard (Space to pick up, arrows to move, Space to drop) and verify the same result.

**Acceptance Scenarios**:

1. **Given** the user drags a todo to a new position, **When** the page is reloaded, **Then** the todo remains in the new position.
2. **Given** the user performs multiple rapid consecutive reorders, **When** all requests complete, **Then** the ordering is correct and no corruption occurs.
3. **Given** the user has the app open in two tabs, **When** a reorder is made in one tab and the other tab is refreshed, **Then** the second tab shows the updated order.
4. **Given** the user focuses a drag handle and uses keyboard controls, **When** they move an item, **Then** a live-region announcement states the item's new position (e.g., "Moved 'Buy milk' to position 3 of 8").
5. **Given** a search or non-manual sort is active, **When** the user attempts to drag, **Then** dragging is disabled and a tooltip explains why.
6. **Given** a reorder request fails, **When** the error occurs, **Then** the list reverts to its previous order and an error toast with Retry appears.
7. **Given** User A's todo list, **When** User A repositions a todo, **Then** the server rejects any reference to a todo not owned by User A.

---

### User Story 5 — Refresh Tokens and Secure Session Management (Priority: P4)

A user stays logged in beyond the 30-minute access-token lifetime without being unexpectedly logged out. The session is maintained securely through token rotation. Logging out revokes the session server-side. If a previously-used token is replayed, the entire token chain is revoked as a security measure.

**Why this priority**: This is an optional security enhancement. It removes the "logged out after 30 minutes" surprise but is not required for the core productivity features. It ships last, if approved.

**Independent Test**: Log in, wait for the access token to expire, perform an action — the session continues seamlessly. Log out and verify the session is revoked. Attempt to reuse an old refresh token and verify the entire chain is revoked.

**Acceptance Scenarios**:

1. **Given** the user is logged in and the access token has expired, **When** the user performs an action, **Then** the token is refreshed transparently and the action completes without interruption.
2. **Given** the user clicks "Logout", **When** the action completes, **Then** the session is revoked on the server and the user cannot use the old tokens.
3. **Given** an attacker replays a previously-rotated refresh token, **When** the server receives it, **Then** the entire refresh-token chain for that session is revoked.
4. **Given** multiple requests are in-flight when the access token expires, **When** the first request triggers a refresh, **Then** subsequent requests queue until the refresh completes, then proceed with the new token.
5. **Given** a refresh attempt fails, **When** the failure is detected, **Then** the user is logged out cleanly with an appropriate message.

---

### User Story 6 — Cross-Cutting: Testing Hygiene (Priority: P0)

Before any new feature work begins, the test infrastructure is fixed so that test runs cannot accidentally wipe the application's development database. Tests run against a separate database, and the test configuration explicitly refuses to execute against the application database URL.

**Why this priority**: This is a prerequisite for all other work. Without this fix, adding migrations and running tests risks destroying development data.

**Independent Test**: Run the test suite — it uses a separate database. Set `TEST_DATABASE_URL` equal to `DATABASE_URL` — the test runner refuses to start with a clear error.

**Acceptance Scenarios**:

1. **Given** the test suite is configured, **When** tests run, **Then** they execute against a separate database, not the application database.
2. **Given** `TEST_DATABASE_URL` is set to the same value as `DATABASE_URL`, **When** the test runner starts, **Then** it aborts with a clear error message refusing to run.

---

### Edge Cases

- What happens when `localStorage` is unavailable (private browsing, storage full)? Theme defaults to System and the app functions normally.
- What happens when the user switches themes while an animation is in progress? The theme change applies cleanly without breaking ongoing animations.
- What happens when a user has thousands of todos and applies search + multiple filters simultaneously? The system handles the combined query within performance targets.
- What happens when two browser tabs send conflicting reorder requests? The server resolves to a consistent state; both tabs converge after refresh.
- What happens at exactly midnight when "due today" flips to "overdue"? The overdue logic is correct across the midnight boundary in the user's local time zone.
- What happens when the refresh-token endpoint is unreachable during token rotation? The user is logged out cleanly rather than stuck in a broken state.
- What happens when the user deletes a todo and immediately closes the browser before the undo window expires? The deferred delete fires on page unload.

## Clarifications

### Session 2026-11-26

- Q: What date range does the "upcoming" due-date filter cover? → A: Next 7 days, excluding today (which has its own filter).
- Q: Should the todo list support pagination or load all items at once? → A: Server-side pagination with ~50 items per page and load-more or infinite scroll.

## Requirements *(mandatory)*

### Functional Requirements

**Design System & Theming**

- **FR-001**: System MUST provide a complete set of design tokens (colors, spacing, radii, shadows, typography, motion) replacing all hard-coded visual values.
- **FR-002**: System MUST support three theme modes: System (default), Light and Dark, with the user's choice persisted across sessions.
- **FR-003**: System MUST apply the theme before first paint with no flash of the wrong theme.
- **FR-004**: System mode MUST follow the operating system preference and update live when it changes.
- **FR-005**: All screens (login, register, dashboard) MUST be visually refreshed with consistent styling: cards, button variants (primary, secondary, ghost, danger), input focus rings, inline error patterns, skeleton loaders and a friendlier empty state.
- **FR-006**: Layout MUST be responsive from 320px width upward with touch targets of at least 44x44px.

**Toasts, Feedback & Optimistic Updates**

- **FR-007**: System MUST provide toast notifications in success, error and info variants, with auto-dismiss (~4s), pause on hover/focus, manual dismiss and a 3-toast stack limit.
- **FR-008**: Error toasts MUST be announced via `aria-live="assertive"`; other variants via `aria-live="polite"`.
- **FR-009**: Create, toggle, edit and delete operations MUST update the UI optimistically (immediately), rolling back on failure with an error toast and Retry action.
- **FR-010**: Delete MUST show an Undo action for 5 seconds. The server request is deferred; Undo restores the item with no API call.
- **FR-011**: Rapid repeated actions on the same item MUST be serialized to prevent out-of-order or duplicate requests.
- **FR-012**: All animations (item enter/exit, checkmark, filter cross-fade, theme transition) MUST respect `prefers-reduced-motion: reduce`.
- **FR-013**: System MUST show an offline banner when connectivity is lost and fail mutations fast with a clear message.

**Due Dates, Priorities & Search**

- **FR-014**: Users MUST be able to set an optional due date and a priority level (low, medium, high; default medium) when creating or editing a todo.
- **FR-015**: The todo list MUST display a priority badge (using color plus text, never color alone) and a due-date chip ("Due today", "Due tomorrow", date, or "Overdue" in danger style).
- **FR-016**: System MUST provide a debounced (300ms) search box matching title and description, with keyboard shortcut `/` to focus and `Esc` to clear, match highlighting, and a no-results state.
- **FR-017**: System MUST support filtering by status (all/active/completed), priority (low/medium/high) and due range (overdue/today/upcoming/none), and sorting by creation date, due date or priority. "Upcoming" means due within the next 7 days, excluding today.
- **FR-018**: Active filters, search and sort MUST be stored in the URL query string so views survive refresh and are shareable.
- **FR-019**: The task summary MUST show the count of overdue items alongside existing metrics.
- **FR-020**: Search input MUST be bounded to 100 characters and special characters must be handled safely.
- **FR-021**: All queries MUST remain scoped to the authenticated user's data with soft-deleted items excluded.
- **FR-021a**: The todo list MUST be paginated server-side with approximately 50 items per page. The UI MUST provide a load-more or infinite-scroll mechanism to fetch subsequent pages. Search, filter and sort MUST operate server-side across the full dataset, not just the loaded page.

**Drag-and-Drop Reordering**

- **FR-022**: Users MUST be able to reorder todos by dragging (mouse, touch, pen) or keyboard (Space to pick up, arrows to move, Space to drop, Esc to cancel).
- **FR-023**: Reorder MUST persist across reloads and devices, using fractional positioning to minimize write operations.
- **FR-024**: A live-region announcement MUST accompany each keyboard reorder move.
- **FR-025**: Dragging MUST be disabled when search, filter or non-manual sort is active, with a tooltip explaining why.
- **FR-026**: Failed reorders MUST roll back optimistically with an error toast and Retry.
- **FR-027**: The server MUST reject reorder references to todos not owned by the authenticated user.

**Refresh Tokens (Optional)**

- **FR-028**: System MUST support transparent token refresh so sessions survive beyond the access-token lifetime.
- **FR-029**: Logout MUST revoke the session server-side.
- **FR-030**: Reuse of a previously-rotated refresh token MUST revoke the entire token chain.
- **FR-031**: Concurrent requests during token refresh MUST be queued and retried with the new token.
- **FR-032**: Refresh tokens MUST be delivered in secure, HTTP-only cookies with CSRF protection on cookie-authenticated endpoints.

**Cross-Cutting**

- **FR-033**: Test infrastructure MUST use a separate database from the application and refuse to run if configured to use the same database.
- **FR-034**: Initial page load resources MUST stay under 150 KB gzipped, with route-level code splitting for auth pages.

### Key Entities

- **Todo** (extended): Existing todo item, now also carrying an optional due date, a priority level (low/medium/high), and a position for manual ordering. Each todo belongs to exactly one user.
- **Refresh Token** (new, optional): A server-side record of a hashed refresh token with expiry, revocation status and rotation chain linkage. Each token belongs to one user session.
- **Design Token**: A named visual property (color, spacing, radius, shadow, typography, motion duration) that defines the application's look across themes. Not a database entity — lives in the styling layer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch themes and see the full UI update instantly, with the choice surviving a page reload — zero flash of wrong theme observed.
- **SC-002**: All text and interactive-control contrast meets WCAG AA (4.5:1 normal text, 3:1 large text/UI boundaries) in both light and dark themes.
- **SC-003**: Accessibility audit scores at least 95 on login and dashboard pages.
- **SC-004**: UI reflects todo mutations (toggle, edit, delete, create) in under 50ms, independent of network latency.
- **SC-005**: Failed mutations revert and offer Retry; Retry succeeds when connectivity returns — 100% of rollback scenarios function correctly.
- **SC-006**: Undo-delete restores the item within the 5-second window with no server request; after the window, the deletion is committed.
- **SC-007**: Search across 1,000+ todos returns results in under 200ms.
- **SC-008**: Data isolation holds across all new features — no user can ever see, search, filter or reorder another user's todos (verified by automated two-user tests).
- **SC-009**: Reorders persist across page reload and multiple devices with no ordering corruption after rapid consecutive drags.
- **SC-010**: All keyboard-only and screen-reader interaction flows work correctly (theme toggle, toast dismiss, search, drag-and-drop) with appropriate announcements.
- **SC-011**: Data model changes can be applied and fully reversed on a database with existing data without data loss.
- **SC-012**: Sessions survive beyond the access-token lifetime (if refresh-token feature is included) without user-visible interruption.
- **SC-013**: Initial page load stays under 150 KB gzipped.

## Assumptions

- The MVP (Auth + CRUD + Data Isolation) has passed all acceptance criteria before Phase 2 work begins, per the constitution's Scope Discipline rule.
- The existing soft-delete mechanism (`deleted_at`) is used for the undo-delete feature with no backend changes required.
- Due dates are date-only (no time component) and interpreted in the user's local time zone on the client side.
- The "medium" priority is a sensible default for all existing todos during the data migration.
- Fractional positioning (midpoint between neighbors) is an acceptable reordering strategy, with rebalancing handled when gaps become too small.
- Feature 5 (refresh tokens) is optional and will only be implemented if explicitly approved.
- The system font stack is acceptable as the default typography; a custom variable font is an optional enhancement.
- No new heavy runtime dependencies are added without explicit justification, with a preference for built-in platform capabilities.
- The existing `AuthContext` and axios interceptor patterns will be extended rather than replaced.
- Performance targets assume a standard development database setup, not production-scale infrastructure.
