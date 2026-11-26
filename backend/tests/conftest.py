import os
import sys

from dotenv import load_dotenv

load_dotenv()
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://localhost/todo_app")

from collections.abc import AsyncGenerator, Generator  # noqa: E402

import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402

import app.models  # noqa: E402, F401
from app.core.config import settings  # noqa: E402
from app.core.database import Base, get_db  # noqa: E402
from app.main import app as fastapi_app  # noqa: E402

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", settings.TEST_DATABASE_URL)
if TEST_DATABASE_URL.startswith("postgresql://"):
    TEST_DATABASE_URL = "postgresql+psycopg://" + TEST_DATABASE_URL[len("postgresql://"):]

if not TEST_DATABASE_URL:
    sys.exit("ERROR: TEST_DATABASE_URL is not set. Tests require a dedicated test database.")

_app_db = os.environ.get("DATABASE_URL", "")
if _app_db.startswith("postgresql://"):
    _app_db = "postgresql+psycopg://" + _app_db[len("postgresql://"):]
if TEST_DATABASE_URL == _app_db:
    sys.exit(
        "ERROR: TEST_DATABASE_URL must not equal DATABASE_URL. "
        "Tests require a separate database to avoid wiping application data."
    )


def _make_engine():
    return create_engine(TEST_DATABASE_URL, pool_pre_ping=True)


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = _make_engine()
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    testing_session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    session = testing_session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)
        engine.dispose()


@pytest_asyncio.fixture()
async def client(db_session: Session) -> AsyncGenerator[AsyncClient, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    fastapi_app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as ac:
        yield ac
    fastapi_app.dependency_overrides.clear()


async def create_test_user(
    client: AsyncClient, email: str = "test@example.com", password: str = "testpass123"
) -> dict:
    resp = await client.post("/auth/register", json={"email": email, "password": password})
    assert resp.status_code == 201, resp.text
    return resp.json()


async def auth_headers(
    client: AsyncClient, email: str = "test@example.com", password: str = "testpass123"
) -> dict[str, str]:
    resp = await client.post("/auth/login", data={"username": email, "password": password})
    assert resp.status_code == 200, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest_asyncio.fixture()
async def user_headers(client: AsyncClient) -> dict[str, str]:
    await create_test_user(client)
    return await auth_headers(client)


@pytest_asyncio.fixture()
async def other_headers(client: AsyncClient) -> dict[str, str]:
    await create_test_user(client, "other@example.com", "otherpass123")
    return await auth_headers(client, "other@example.com", "otherpass123")
