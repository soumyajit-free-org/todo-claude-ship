from datetime import timedelta

from httpx import AsyncClient

from app.core.security import create_access_token
from tests.conftest import auth_headers, create_test_user


async def test_register_success(client: AsyncClient):
    resp = await client.post(
        "/auth/register", json={"email": "a@example.com", "password": "password123"}
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "a@example.com"
    assert "id" in body and "created_at" in body
    assert "password" not in body and "hashed_password" not in body


async def test_register_duplicate_email(client: AsyncClient):
    await create_test_user(client, "dup@example.com")
    resp = await client.post(
        "/auth/register", json={"email": "DUP@example.com", "password": "password123"}
    )
    assert resp.status_code == 400
    assert resp.json() == {"detail": "Email already registered"}


async def test_register_invalid_email(client: AsyncClient):
    resp = await client.post("/auth/register", json={"email": "nope", "password": "password123"})
    assert resp.status_code == 422


async def test_register_short_password(client: AsyncClient):
    resp = await client.post("/auth/register", json={"email": "s@example.com", "password": "short"})
    assert resp.status_code == 422


async def test_login_success(client: AsyncClient):
    await create_test_user(client)
    resp = await client.post(
        "/auth/login", data={"username": "test@example.com", "password": "testpass123"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["token_type"] == "bearer" and body["access_token"]


async def test_login_wrong_password(client: AsyncClient):
    await create_test_user(client)
    resp = await client.post(
        "/auth/login", data={"username": "test@example.com", "password": "wrongpass"}
    )
    assert resp.status_code == 401
    assert resp.json() == {"detail": "Invalid credentials"}


async def test_login_unknown_email(client: AsyncClient):
    resp = await client.post(
        "/auth/login", data={"username": "ghost@example.com", "password": "whatever123"}
    )
    assert resp.status_code == 401


async def test_me_with_valid_token(client: AsyncClient):
    await create_test_user(client)
    headers = await auth_headers(client)
    resp = await client.get("/auth/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"


async def test_me_without_token(client: AsyncClient):
    resp = await client.get("/auth/me")
    assert resp.status_code == 401


async def test_me_with_malformed_token(client: AsyncClient):
    resp = await client.get("/auth/me", headers={"Authorization": "Bearer not-a-jwt"})
    assert resp.status_code == 401
    assert resp.json() == {"detail": "Could not validate credentials"}


async def test_me_with_expired_token(client: AsyncClient):
    user = await create_test_user(client)
    token = create_access_token(user["id"], expires_delta=timedelta(seconds=-1))
    resp = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401
