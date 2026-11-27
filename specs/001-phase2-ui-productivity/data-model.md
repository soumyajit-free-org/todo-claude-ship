# Data Model: Phase 2 — Modern UI & Productivity Enhancements

**Date**: 2026-11-26 | **Plan**: [plan.md](plan.md)

## Entity Changes

### Todo (extended) — Migration 0002 + 0003

Existing fields unchanged. New fields:

| Field | Type | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| `due_date` | DATE | Yes | NULL | Date only, no time component. Interpreted in user's local timezone on client. |
| `priority` | VARCHAR (enum: `low`, `medium`, `high`) | No | `medium` | DB CHECK constraint: value IN ('low', 'medium', 'high'). |
| `position` | DOUBLE PRECISION | No | (computed) | New items: max(position) + 1024. Reorder: midpoint of neighbors. |

**New indexes**:
- `ix_todos_owner_due_date` on `(owner_id, due_date)` — accelerates due-date filtering and sorting
- `ix_todos_owner_position` on `(owner_id, position)` — accelerates manual sort ordering

**Backfill rules**:
- Migration 0002: existing rows get `priority = 'medium'`, `due_date = NULL`
- Migration 0003: existing rows get `position` assigned sequentially by `created_at` order (1024, 2048, 3072, ...)

### Refresh Token (new, optional) — Migration 0004

| Field | Type | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | INTEGER (PK) | No | Auto | Primary key. |
| `user_id` | INTEGER (FK → users.id) | No | — | CASCADE on delete. |
| `token_hash` | VARCHAR(255) | No | — | SHA-256 hash of the refresh token. Never store plaintext. |
| `family_id` | UUID | No | — | Groups all tokens in a rotation chain. |
| `expires_at` | TIMESTAMP WITH TZ | No | — | Absolute expiry (e.g., 7 days from creation). |
| `revoked_at` | TIMESTAMP WITH TZ | Yes | NULL | Set when token is used (rotated) or revoked. |
| `created_at` | TIMESTAMP WITH TZ | No | now() | — |

**Indexes**:
- `ix_refresh_tokens_token_hash` UNIQUE on `(token_hash)` — fast lookup by hash
- `ix_refresh_tokens_family_id` on `(family_id)` — fast revocation of entire chain
- `ix_refresh_tokens_user_id` on `(user_id)` — cleanup queries per user

**State transitions**:
1. **Created**: `revoked_at = NULL`, token is active
2. **Rotated**: `revoked_at = now()`, a new token in the same family is created
3. **Revoked (theft detected)**: all tokens with matching `family_id` get `revoked_at = now()`
4. **Expired**: `expires_at < now()`, rejected on use regardless of `revoked_at`

## Migration Plan

### Migration 0002: `add_due_date_priority`

**Up**:
1. Add `due_date DATE` nullable column to `todos`
2. Add `priority VARCHAR` not-null column with server default `'medium'` and CHECK constraint
3. Create index `ix_todos_owner_due_date` on `(owner_id, due_date)`
4. Backfill: existing rows already get `'medium'` from server default; `due_date` remains NULL

**Down**:
1. Drop index `ix_todos_owner_due_date`
2. Drop columns `priority`, `due_date` from `todos`

### Migration 0003: `add_position`

**Up**:
1. Add `position DOUBLE PRECISION` nullable column to `todos`
2. Backfill: assign positions by `(owner_id, created_at)` order — 1024, 2048, 3072, ...
3. Set `position` to NOT NULL after backfill
4. Create index `ix_todos_owner_position` on `(owner_id, position)`

**Down**:
1. Drop index `ix_todos_owner_position`
2. Drop column `position` from `todos`

### Migration 0004: `add_refresh_tokens` (optional)

**Up**:
1. Create `refresh_tokens` table with all columns above
2. Create all three indexes

**Down**:
1. Drop `refresh_tokens` table (cascades indexes)

## Relationships

```
users (1) ──── (*) todos
  │
  └──── (*) refresh_tokens
```

- A user has many todos (existing)
- A user has many refresh tokens (new, optional)
- Todos have no relationship to refresh tokens
- All queries filter by `owner_id` and `deleted_at IS NULL` (existing constraint, unchanged)
