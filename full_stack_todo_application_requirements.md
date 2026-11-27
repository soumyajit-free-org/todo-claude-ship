# Software Requirements Specification (SRS): Full-Stack TODO Application

## 1. System Architecture Overview
* **Frontend:** React (Single Page Application)
* **Backend:** FastAPI (Python REST API)
* **Database:** PostgreSQL or SQLite (via SQLAlchemy ORM)
* **Authentication:** JWT (JSON Web Tokens) via OAuth2 Password Flow

---

## 2. Database Requirements (Schemas)
The database requires two primary tables with a **One-to-Many** relationship (one user can own multiple TODO items).

### `users` Table
| Column | Type | Constraints / Notes |
| :--- | :--- | :--- |
| `id` | Integer / UUID | Primary Key, Auto-increment |
| `email` / `username` | String | Unique, Indexed, Not Null |
| `hashed_password` | String | Not Null (Bcrypt hashed) |
| `created_at` | DateTime | Default: Current Timestamp |

### `todos` Table
| Column | Type | Constraints / Notes |
| :--- | :--- | :--- |
| `id` | Integer / UUID | Primary Key, Auto-increment |
| `title` | String | Not Null |
| `description` | String | Nullable (Optional details) |
| `is_completed` | Boolean | Default: `False` |
| `owner_id` | Integer / UUID | Foreign Key (`users.id`), Not Null |
| `created_at` | DateTime | Default: Current Timestamp |

---

## 3. Backend Requirements (FastAPI)

### Authentication Endpoints
* `POST /auth/register`: Accepts username/email and password. Hashes the password using `passlib`/`bcrypt` and creates a new user record. Returns user details (excluding the password).
* `POST /auth/login`: Verifies user credentials against the database. Returns a signed JWT `access_token` and `token_type: "bearer"`.
* `GET /auth/me`: Protected route. Validates the incoming JWT and returns the currently authenticated user's profile.

### TODO Endpoints (All Protected by JWT)
* `GET /todos`: Fetches all TODOs belonging *only* to the authenticated user (`owner_id == current_user.id`). Supports optional query parameters for filtering (e.g., `?completed=true`).
* `POST /todos`: Creates a new TODO linked to the authenticated user's `owner_id`.
* `PUT /todos/{todo_id}`: Updates an existing TODO's `title`, `description`, or `is_completed` status. Must verify that the TODO belongs to the requesting user before updating.
* `DELETE /todos/{todo_id}`: Deletes a specific TODO. Must verify ownership before deletion.

### Security & Middleware
* **CORS Middleware:** Configured to allow requests from the React frontend origin (e.g., `http://localhost:5173` or `http://localhost:3000`).
* **Pydantic Schemas:** Strict request payload validation and response serialization for all endpoints.
* **Dependency Injection:** Use FastAPI's `Depends` to extract and validate the JWT bearer token on all protected routes.

---

## 4. Frontend Requirements (React)

### Pages / Views
1. **Login Page (`/login`):** Form with username/email and password inputs, API error message display, and a navigation link to the Register page.
2. **Register Page (`/register`):** Form for creating a new account, password confirmation validation, and a navigation link to the Login page.
3. **Dashboard / TODO Page (`/`):** Protected route accessible only when authenticated. Contains the main application interface.

### UI Components & Features
* **Navbar:** Displays the logged-in user's username/email and a **Logout** button.
* **Add TODO Form:** Text input for the task title (and optional description) with an "Add" button or `Enter` key submission. Automatically clears the input field upon successful creation.
* **Filter Tabs:** Buttons to switch views between **All**, **Active** (incomplete), and **Completed** tasks.
* **Task Counter:** Displays the count of remaining active tasks (e.g., *"3 items left"*).
* **TODO List & Items:**
  * Checkbox to toggle `is_completed` status (applies strikethrough styling when checked).
  * Inline editing or modal to update the task text.
  * Delete button (trash icon) to remove the task.
* **Empty & Loading States:** Loading spinners while fetching data from FastAPI, and a helpful empty-state message when no tasks exist.

### State & API Management
* **Auth Context:** Global React Context to manage user state, JWT token, `login()`, and `logout()` functions.
* **Token Persistence:** Store the JWT in `localStorage` (or secure cookies) so user sessions persist across page refreshes.
* **Axios / Fetch Interceptor:** Automatically attaches the `Authorization: Bearer <token>` header to every outgoing API request, and automatically logs the user out if the backend returns a `401 Unauthorized` (expired or invalid token).
* **Protected Route Wrapper:** Redirects unauthenticated users attempting to access `/` back to `/login`.

---

## 5. Feature Checklist Summary

| Category | Feature | Priority |
| :--- | :--- | :--- |
| **Auth** | User Registration & Password Hashing | Must-Have |
| **Auth** | User Login & JWT Token Generation | Must-Have |
| **Auth** | Persistent Login & Logout | Must-Have |
| **Auth** | Data Isolation (Users only see their own tasks) | Must-Have |
| **CRUD** | Create new TODO | Must-Have |
| **CRUD** | View list of TODOs | Must-Have |
| **CRUD** | Toggle Complete / Incomplete status | Must-Have |
| **CRUD** | Edit existing TODO text | Must-Have |
| **CRUD** | Delete TODO | Must-Have |
| **UX** | Filter tasks (All / Active / Completed) | Recommended |
| **UX** | Remaining tasks counter | Recommended |
| **UX** | Loading spinners & API error notifications | Recommended |