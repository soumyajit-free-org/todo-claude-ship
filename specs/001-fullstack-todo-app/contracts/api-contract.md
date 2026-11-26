# API Contract: Full-Stack Authenticated TODO Application

**Date**: 2026-11-26 | **Plan**: [../plan.md](../plan.md)
**Base URL**: `http://localhost:8000`

---

## Authentication Endpoints

### POST /auth/register

Create a new user account.

**Request body**:
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 201 | `{ "id": 1, "email": "user@example.com", "created_at": "2026-11-26T10:00:00Z" }` | Account created |
| 400 | `{ "detail": "Email already registered" }` | Duplicate email |
| 422 | `{ "detail": [ { "loc": ["body", "email"], "msg": "...", "type": "..." } ] }` | Validation error |

---

### POST /auth/login

Authenticate and receive an access token.

**Request body** (OAuth2 password form):
```
username=user@example.com&password=securepass123
```
Content-Type: `application/x-www-form-urlencoded`

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{ "access_token": "eyJ...", "token_type": "bearer" }` | Valid credentials |
| 401 | `{ "detail": "Invalid credentials" }` | Wrong email or password |

---

### GET /auth/me

Return the authenticated user's profile.

**Headers**: `Authorization: Bearer <access_token>`

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{ "id": 1, "email": "user@example.com", "created_at": "2026-11-26T10:00:00Z" }` | Valid token |
| 401 | `{ "detail": "Could not validate credentials" }` | Missing/invalid/expired token |

---

## TODO Endpoints

All require `Authorization: Bearer <access_token>` header.

### GET /todos

List the authenticated user's tasks (soft-deleted tasks excluded).

**Query parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| completed | boolean | *(none)* | Filter: `true` = completed only, `false` = active only, omitted = all |

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `[ { "id": 1, "title": "Buy milk", "description": null, "is_completed": false, "created_at": "2026-11-26T10:00:00Z" }, ... ]` | Success (may be empty array) |
| 401 | `{ "detail": "Could not validate credentials" }` | Unauthorized |

---

### POST /todos

Create a new task for the authenticated user.

**Request body**:
```json
{
  "title": "Buy milk",
  "description": "2% milk from the store"
}
```

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 201 | `{ "id": 1, "title": "Buy milk", "description": "2% milk from the store", "is_completed": false, "created_at": "2026-11-26T10:00:00Z" }` | Created |
| 422 | `{ "detail": [ { "loc": ["body", "title"], "msg": "...", "type": "..." } ] }` | Validation error (empty title, etc.) |
| 401 | `{ "detail": "Could not validate credentials" }` | Unauthorized |

---

### PUT /todos/{todo_id}

Update an existing task. Only the task owner can update.

**Path parameters**: `todo_id` (integer)

**Request body** (all fields optional):
```json
{
  "title": "Buy oat milk",
  "description": "From Trader Joe's",
  "is_completed": true
}
```

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{ "id": 1, "title": "Buy oat milk", "description": "From Trader Joe's", "is_completed": true, "created_at": "2026-11-26T10:00:00Z" }` | Updated |
| 404 | `{ "detail": "Todo not found" }` | Not found or not owned by user |
| 422 | `{ "detail": [ ... ] }` | Validation error (empty title, etc.) |
| 401 | `{ "detail": "Could not validate credentials" }` | Unauthorized |

**Note**: Returns 404 (not 403) when the todo belongs to another user, to avoid leaking existence information.

---

### DELETE /todos/{todo_id}

Soft-delete a task. Sets `deleted_at` timestamp. Only the task owner can delete.

**Path parameters**: `todo_id` (integer)

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 204 | *(empty)* | Soft-deleted |
| 404 | `{ "detail": "Todo not found" }` | Not found or not owned by user |
| 401 | `{ "detail": "Could not validate credentials" }` | Unauthorized |

---

## Common Patterns

**Authentication**: All protected endpoints require `Authorization: Bearer <token>` header. Invalid or expired tokens return `401`.

**Ownership check**: Todo endpoints that operate on a specific `todo_id` verify that `todo.owner_id == current_user.id` AND `todo.deleted_at IS NULL`. Mismatches return `404`.

**Error envelope**: All errors return `{ "detail": "..." }` (string) or `{ "detail": [ ... ] }` (array for validation errors).

**Timestamps**: All datetime fields use ISO 8601 format with UTC timezone (`Z` suffix).
