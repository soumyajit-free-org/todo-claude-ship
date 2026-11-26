# Data Model: Full-Stack Authenticated TODO Application

**Date**: 2026-11-26 | **Plan**: [plan.md](plan.md)

## Entity Relationship

```
User 1──────* Todo
(one user owns zero or more todos)
```

---

## Entities

### User

Represents a registered individual who can own and manage tasks.

| Attribute | Type | Constraints | Notes |
|-----------|------|-------------|-------|
| id | Integer | Primary key, auto-increment | Unique identifier |
| email | String(255) | Unique, not null, indexed | Login identifier; validated format |
| hashed_password | String(255) | Not null | Bcrypt hash; never returned in responses |
| created_at | DateTime | Not null, default: current timestamp | Account creation time |

**Uniqueness rules**:
- `email` MUST be unique across all users (case-insensitive comparison recommended at application layer)

**Indexes**:
- Primary key on `id`
- Unique index on `email`

---

### Todo

Represents a single task owned by exactly one user.

| Attribute | Type | Constraints | Notes |
|-----------|------|-------------|-------|
| id | Integer | Primary key, auto-increment | Unique identifier |
| title | String(255) | Not null | Task title; max 255 characters enforced |
| description | Text | Nullable | Optional task details |
| is_completed | Boolean | Not null, default: false | Completion status |
| owner_id | Integer | Foreign key → users.id, not null, indexed | Ownership; cascading delete if user removed |
| created_at | DateTime | Not null, default: current timestamp | Task creation time |
| deleted_at | DateTime | Nullable, indexed | Soft delete timestamp; null = active |

**Uniqueness rules**:
- No uniqueness constraint on `title` (users may have tasks with identical titles)

**Indexes**:
- Primary key on `id`
- Index on `owner_id` (all queries filter by owner)
- Index on `is_completed` (filter queries)
- Index on `deleted_at` (soft delete exclusion in every query)
- Composite index on `(owner_id, deleted_at)` recommended for the most common query pattern

**Foreign keys**:
- `owner_id` → `users.id` (ON DELETE CASCADE)

---

## State Transitions

### Todo Lifecycle

```
                  ┌──────────────┐
     Create ───►  │    Active    │
                  │ is_completed │
                  │   = false    │
                  └──────┬───────┘
                         │
                 Toggle  │  Toggle
                   ▼     │    ▲
                  ┌──────┴───────┐
                  │  Completed   │
                  │ is_completed │
                  │   = true     │
                  └──────────────┘
                         │
                  (from either state)
                         │
                   Soft Delete
                         ▼
                  ┌──────────────┐
                  │   Deleted    │
                  │ deleted_at   │
                  │   ≠ null     │
                  └──────────────┘
```

**Rules**:
- A task starts as Active (`is_completed = false`, `deleted_at = null`)
- Toggle switches between Active and Completed (flips `is_completed`)
- Soft delete sets `deleted_at` to current timestamp from either Active or Completed state
- Soft-deleted tasks are excluded from all user-facing queries (`WHERE deleted_at IS NULL`)
- Future: a purge operation could hard-delete records where `deleted_at < (now - retention_period)`

---

## Validation Rules

| Entity | Field | Rule |
|--------|-------|------|
| User | email | Valid email format; unique; not empty; max 255 chars |
| User | password (input) | Minimum 8 characters; never stored in plaintext |
| Todo | title | Not empty; max 255 characters |
| Todo | description | Optional; no max enforced (Text type) |
| Todo | owner_id | MUST match authenticated user's id; never client-supplied |
