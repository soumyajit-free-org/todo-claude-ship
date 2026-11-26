# Quickstart Validation Guide: Full-Stack Authenticated TODO Application

**Date**: 2026-11-26 | **Plan**: [plan.md](plan.md) | **API Contract**: [contracts/api-contract.md](contracts/api-contract.md)

## Prerequisites

- Python 3.12+
- Node.js 18+ and npm
- PostgreSQL 15+ (running and accessible)
- A terminal with `curl` or similar HTTP client for API validation

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` from `.env.example`:
```
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/todo_app
CORS_ORIGINS=http://localhost:5173
```

Run database migrations:
```bash
alembic upgrade head
```

Start the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

---

## Validation Scenarios

### V-001: User Registration (FR-001, FR-002, FR-003)

**Run**:
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpass123"}'
```

**Expected**: `201` with `{ "id": ..., "email": "test@example.com", "created_at": "..." }`. No password in response.

**Duplicate check**:
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "anotherpass"}'
```

**Expected**: `400` with `{ "detail": "Email already registered" }`.

---

### V-002: User Login (FR-004)

**Run**:
```bash
curl -X POST http://localhost:8000/auth/login \
  -d "username=test@example.com&password=testpass123"
```

**Expected**: `200` with `{ "access_token": "eyJ...", "token_type": "bearer" }`. Save the token for subsequent requests.

**Invalid credentials**:
```bash
curl -X POST http://localhost:8000/auth/login \
  -d "username=test@example.com&password=wrongpass"
```

**Expected**: `401` with `{ "detail": "Invalid credentials" }`.

---

### V-003: Authenticated Profile (FR-007)

**Run** (with token from V-002):
```bash
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer <access_token>"
```

**Expected**: `200` with user profile. Without the header: `401`.

---

### V-004: Create a Task (FR-008, FR-009)

**Run**:
```bash
curl -X POST http://localhost:8000/todos \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries", "description": "Milk and eggs"}'
```

**Expected**: `201` with the created task including `is_completed: false`.

**Empty title**:
```bash
curl -X POST http://localhost:8000/todos \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"title": ""}'
```

**Expected**: `422` validation error.

---

### V-005: List and Filter Tasks (FR-010, FR-014)

**Run** (create a few tasks first, toggle some as completed):
```bash
# All tasks
curl http://localhost:8000/todos \
  -H "Authorization: Bearer <access_token>"

# Active only
curl "http://localhost:8000/todos?completed=false" \
  -H "Authorization: Bearer <access_token>"

# Completed only
curl "http://localhost:8000/todos?completed=true" \
  -H "Authorization: Bearer <access_token>"
```

**Expected**: Correct filtered results. Soft-deleted tasks never appear.

---

### V-006: Toggle Completion (FR-011)

**Run**:
```bash
curl -X PUT http://localhost:8000/todos/1 \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"is_completed": true}'
```

**Expected**: `200` with `is_completed: true`. Toggle back with `false`.

---

### V-007: Edit a Task (FR-012)

**Run**:
```bash
curl -X PUT http://localhost:8000/todos/1 \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy organic groceries"}'
```

**Expected**: `200` with updated title, other fields unchanged.

---

### V-008: Soft Delete a Task (FR-013)

**Run**:
```bash
curl -X DELETE http://localhost:8000/todos/1 \
  -H "Authorization: Bearer <access_token>"
```

**Expected**: `204` empty response. Subsequent `GET /todos` MUST NOT include the deleted task.

---

### V-009: Data Isolation (FR-008, SC-003)

**Setup**: Register a second user, create tasks, then verify isolation.

```bash
# Register second user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "other@example.com", "password": "otherpass123"}'

# Login as second user
curl -X POST http://localhost:8000/auth/login \
  -d "username=other@example.com&password=otherpass123"
# Save this token as <other_token>

# List tasks as second user
curl http://localhost:8000/todos \
  -H "Authorization: Bearer <other_token>"
```

**Expected**: Empty array `[]` — second user sees none of first user's tasks.

**Cross-user access attempt**:
```bash
curl -X PUT http://localhost:8000/todos/1 \
  -H "Authorization: Bearer <other_token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Hacked!"}'
```

**Expected**: `404` — not `200` or `403`.

---

### V-010: Frontend End-to-End (SC-001, SC-004, SC-006)

1. Open `http://localhost:5173` — expect redirect to `/login`
2. Navigate to `/register`, create an account — expect redirect to `/login`
3. Log in with the new account — expect redirect to dashboard
4. Create a task — expect it appears in the list, input clears
5. Toggle the task checkbox — expect strikethrough, counter updates
6. Edit the task title — expect updated text persists
7. Delete the task — expect it disappears, counter updates
8. Refresh the browser — expect session persists, dashboard loads
9. With no tasks — expect empty-state message
10. Click Logout — expect redirect to `/login`

---

## Backend Test Suite

```bash
cd backend
pytest tests/ -v
```

**Expected**: All tests pass, covering:
- Registration (valid, duplicate email, weak password)
- Login (valid, invalid credentials)
- Token validation (valid, expired, malformed)
- CRUD operations (create, read, update, soft-delete)
- Ownership isolation (cross-user access denied)
- Filtering (all, active, completed)
- Soft-delete exclusion from queries
