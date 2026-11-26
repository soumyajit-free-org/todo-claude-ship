# Research: Full-Stack Authenticated TODO Application

**Date**: 2026-11-26 | **Plan**: [plan.md](plan.md)

## Overview

No critical NEEDS CLARIFICATION items remained after the spec and clarification phases. This research documents technology best-practice decisions and patterns for the chosen stack.

---

## R-001: JWT Authentication Strategy

**Decision**: Use short-lived access tokens (30-minute expiry) stored in `localStorage`, with explicit logout clearing the token. No refresh token rotation in MVP scope.

**Rationale**: The constitution requires short-lived JWTs (Principle I). A 30-minute window balances security with usability for a task-management app. Refresh tokens are listed as a Phase 2 enhancement in the constitution's development workflow. Storing in `localStorage` enables persistence across refreshes (FR-005) and aligns with the requirements doc.

**Alternatives considered**:
- HttpOnly cookies: More secure against XSS but adds CSRF complexity and complicates the SPA architecture. Deferred to Phase 2 alongside refresh tokens.
- Session-based auth: Conflicts with the JWT requirement in the constitution and requirements.

---

## R-002: Password Hashing Algorithm

**Decision**: Use Bcrypt via `passlib[bcrypt]` with default work factor (12 rounds).

**Rationale**: The constitution (Principle I) specifies Argon2 or Bcrypt. Bcrypt is the more widely supported choice with mature Python libraries. The requirements doc explicitly names `passlib`/`bcrypt`. Default 12 rounds provides strong security within acceptable response times (~250ms).

**Alternatives considered**:
- Argon2: Stronger against GPU attacks but adds a C dependency (`argon2-cffi`). Acceptable upgrade path for future hardening.

---

## R-003: Soft Delete Implementation Pattern

**Decision**: Add a nullable `deleted_at` (DateTime) column to the `todos` table. All list/read queries filter with `WHERE deleted_at IS NULL`. Delete endpoint sets `deleted_at = now()` instead of removing the row.

**Rationale**: Aligns with constitution Principle IV (which references `deleted_at` indexing) and the clarification session decision. Enables future trash/undo features without data loss.

**Alternatives considered**:
- Hard delete: Simpler but conflicts with constitution and prevents future recovery features.
- Separate `is_deleted` boolean: Works but provides less information than a timestamp (no "when deleted" audit trail).

---

## R-004: SQLAlchemy Session Strategy

**Decision**: Use SQLAlchemy 2.0 with synchronous sessions via FastAPI dependency injection (`Depends(get_db)`). Each request gets its own session, committed on success, rolled back on error.

**Rationale**: Synchronous SQLAlchemy is simpler to set up and debug for an MVP. The constitution allows "async or clean session dependency" (Tech Stack section). The clean dependency injection pattern satisfies Principle III's separation of concerns.

**Alternatives considered**:
- Async SQLAlchemy with `asyncpg`: Better concurrency under load but adds complexity (async session management, async test fixtures). Suitable upgrade when scaling beyond 100 concurrent users.

---

## R-005: Frontend State Management

**Decision**: Use React Context for auth state (`AuthContext`) and local component state + `useEffect` for task data. No external state library.

**Rationale**: The app has two state domains: auth (global, shared across pages) and tasks (local to dashboard). React Context handles auth cleanly per the requirements. Task state is confined to one page, so `useState`/`useEffect` suffice. Adding Redux or Zustand would violate YAGNI for this scope.

**Alternatives considered**:
- Redux/Zustand: Overkill for a single-page task list; adds bundle size and boilerplate.
- React Query/TanStack Query: Good for caching/revalidation but adds a dependency for a simple CRUD list. Consider for Phase 2 if offline support or optimistic updates are added.

---

## R-006: API Error Envelope

**Decision**: All error responses use the standard FastAPI error format: `{ "detail": "Human-readable error message" }`. Validation errors use Pydantic's `422` with field-level detail array.

**Rationale**: The constitution (Principle V) requires consistent JSON error envelopes. FastAPI's built-in `HTTPException` and Pydantic validation errors already follow this pattern, requiring no custom middleware.

**Alternatives considered**:
- Custom error wrapper with error codes: More structured but adds complexity for MVP. Can layer on top later without breaking changes.

---

## R-007: CORS Configuration

**Decision**: Configure CORS middleware with an explicit `CORS_ORIGINS` environment variable (comma-separated list of allowed origins). Default to `http://localhost:5173` for development.

**Rationale**: The constitution (Tech Stack section) prohibits wildcard `*` origins with credentials. An environment variable allows different origins per environment without code changes.

**Alternatives considered**:
- Hardcoded origins: Inflexible across environments.
- Wildcard `*`: Explicitly prohibited by constitution.
