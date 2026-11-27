# API Contract: Todos

**Date**: 2026-11-26 | **Base path**: `/todos`

All endpoints require `Authorization: Bearer <token>`. All queries are scoped to the authenticated user and exclude soft-deleted items (`deleted_at IS NULL`).

## GET /todos

List the authenticated user's todos with filtering, sorting, search and pagination.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string (max 100 chars) | — | Case-insensitive substring match on `title` and `description`. `%` and `_` are escaped. |
| `status` | `all` \| `active` \| `completed` | `all` | Filter by completion status. |
| `priority` | `low` \| `medium` \| `high` (comma-separated for multiple) | — | Filter by priority level(s). |
| `due` | `overdue` \| `today` \| `upcoming` \| `none` | — | Filter by due-date range. `upcoming` = next 7 days excluding today. |
| `sort` | `created` \| `due` \| `priority` \| `manual` | `manual` | Sort field. `manual` uses the `position` column. |
| `order` | `asc` \| `desc` | `desc` (for `created`), `asc` (for `due`, `priority`, `manual`) | Sort direction. |
| `cursor` | string (opaque) | — | Cursor from previous page's `next_cursor`. |
| `limit` | integer (1–100) | 50 | Page size. |

### Response: 200 OK

```json
{
  "items": [
    {
      "id": 1,
      "title": "Buy groceries",
      "description": "Milk, eggs, bread",
      "is_completed": false,
      "due_date": "2026-11-27",
      "priority": "high",
      "position": 2048.0,
      "created_at": "2026-11-25T10:30:00Z"
    }
  ],
  "next_cursor": "eyJpZCI6MTAsInBvcyI6NDA5Nn0=",
  "total_count": 142
}
```

- `next_cursor`: null when no more pages
- `total_count`: total matching items (before pagination), for `TaskCounter` display
- `items[].due_date`: ISO 8601 date string or null
- `items[].priority`: one of `low`, `medium`, `high`
- `items[].position`: float, used for manual sort order

## POST /todos

Create a new todo.

### Request Body

```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "due_date": "2026-11-27",
  "priority": "high"
}
```

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `title` | string (1–255) | Yes | — |
| `description` | string | No | `""` |
| `due_date` | ISO date string | No | null |
| `priority` | `low` \| `medium` \| `high` | No | `medium` |

### Response: 201 Created

Returns the full `TodoResponse` (same shape as items in GET). The new item's `position` is set to `max(position) + 1024` for the user, placing it at the end of the manual order.

### Errors

- `422`: Validation error (empty title, invalid priority, invalid date format)

## PUT /todos/{id}

Update an existing todo.

### Request Body

All fields optional; only provided fields are updated.

```json
{
  "title": "Buy groceries and snacks",
  "description": "Updated list",
  "is_completed": true,
  "due_date": "2026-11-28",
  "priority": "medium"
}
```

### Response: 200 OK

Returns the updated `TodoResponse`.

### Errors

- `404`: Todo not found or not owned by user
- `422`: Validation error

## DELETE /todos/{id}

Soft-delete a todo (sets `deleted_at`).

### Response: 200 OK

```json
{ "detail": "Todo deleted" }
```

### Errors

- `404`: Todo not found or not owned by user

## PATCH /todos/{id}/position

Reorder a todo relative to its neighbors.

### Request Body

```json
{
  "before_id": 5,
  "after_id": 3
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `before_id` | integer \| null | No | The todo that should come before this item. null = move to head. |
| `after_id` | integer \| null | No | The todo that should come after this item. null = move to tail. |

At least one of `before_id` or `after_id` must be provided.

### Position Calculation

- Both provided: `position = (before.position + after.position) / 2`
- `before_id` only (move to tail after it): `position = before.position + 1024`
- `after_id` only (move to head before it): `position = after.position - 1024`
- If the gap between neighbors < 1e-10, trigger rebalance for all user's todos

### Response: 200 OK

Returns the updated `TodoResponse` with the new `position`.

### Errors

- `404`: Referenced `before_id` or `after_id` not found or not owned by user
- `422`: Contradictory input (both null, or referenced items are not adjacent in expected order)
