# API Contract: Auth (Extended for Feature 5)

**Date**: 2026-11-26 | **Base path**: `/auth`

Feature 5 (refresh tokens) is optional. Existing endpoints are unchanged. New endpoints below are added only if Feature 5 is implemented.

## Existing Endpoints (unchanged)

- `POST /auth/register` — Create account (email + password)
- `POST /auth/login` — Get access token (OAuth2 password form)
- `GET /auth/me` — Get current user profile

## POST /auth/refresh (new, Feature 5)

Rotate the refresh token and issue a new access token.

### Request

No body required. The refresh token is read from the `refresh_token` HttpOnly cookie. A CSRF token must be included via the `X-CSRF-Token` header (double-submit cookie pattern).

### Response: 200 OK

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

The response also sets a new `refresh_token` cookie (HttpOnly, Secure, SameSite=Strict) with the rotated token.

### Errors

- `401`: Refresh token missing, expired, or revoked
- `403`: CSRF token missing or invalid
- `401` (theft detected): Reused token triggers revocation of the entire token family. Response includes `"detail": "Token reuse detected. All sessions revoked."`

## POST /auth/logout (new, Feature 5)

Revoke the current refresh token.

### Request

No body. Reads the `refresh_token` cookie. CSRF token required via `X-CSRF-Token`.

### Response: 200 OK

```json
{ "detail": "Logged out" }
```

The response clears the `refresh_token` cookie.

### Errors

- `401`: No valid refresh token

## Cookie Specification

| Cookie | Value | Flags |
|--------|-------|-------|
| `refresh_token` | Opaque token string | `HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=604800` |
| `csrf_token` | Random token string | `Secure; SameSite=Strict; Path=/; Max-Age=604800` |

- `refresh_token` is scoped to `/auth` path to limit exposure
- `csrf_token` is readable by JavaScript (not HttpOnly) for the double-submit pattern
- Max-Age of 604800 = 7 days, matching the refresh token server-side expiry

## Token Lifecycle

1. **Login**: Server issues access token (in response body, 30 min) + refresh token (in cookie, 7 days) + CSRF token (in cookie)
2. **API calls**: Frontend sends access token in `Authorization` header (from memory, not localStorage)
3. **Token refresh**: When access token expires (401), frontend calls `/auth/refresh`; server rotates refresh token, returns new access token
4. **Logout**: Frontend calls `/auth/logout`; server revokes refresh token, clears cookies
5. **Theft detection**: If a rotated (used) refresh token is presented, server revokes all tokens in that family
