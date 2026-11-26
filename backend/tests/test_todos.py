from httpx import AsyncClient


async def _create(client: AsyncClient, headers: dict, title: str = "Task", **extra) -> dict:
    resp = await client.post("/todos", headers=headers, json={"title": title, **extra})
    assert resp.status_code == 201, resp.text
    return resp.json()


async def test_requires_auth(client: AsyncClient):
    assert (await client.get("/todos")).status_code == 401
    assert (await client.post("/todos", json={"title": "x"})).status_code == 401


async def test_create_todo(client: AsyncClient, user_headers: dict):
    todo = await _create(client, user_headers, "Buy groceries", description="Milk")
    assert todo["is_completed"] is False
    assert todo["description"] == "Milk"


async def test_create_empty_title_rejected(client: AsyncClient, user_headers: dict):
    for title in ("", "   "):
        resp = await client.post("/todos", headers=user_headers, json={"title": title})
        assert resp.status_code == 422


async def test_create_title_too_long_rejected(client: AsyncClient, user_headers: dict):
    resp = await client.post("/todos", headers=user_headers, json={"title": "x" * 256})
    assert resp.status_code == 422


async def test_list_is_sorted_newest_first(client: AsyncClient, user_headers: dict):
    first = await _create(client, user_headers, "first")
    second = await _create(client, user_headers, "second")
    resp = await client.get("/todos", headers=user_headers)
    assert [t["id"] for t in resp.json()] == [second["id"], first["id"]]


async def test_filter_by_completed(client: AsyncClient, user_headers: dict):
    a = await _create(client, user_headers, "a")
    await _create(client, user_headers, "b")
    await client.put(f"/todos/{a['id']}", headers=user_headers, json={"is_completed": True})

    done = (await client.get("/todos?completed=true", headers=user_headers)).json()
    active = (await client.get("/todos?completed=false", headers=user_headers)).json()
    everything = (await client.get("/todos", headers=user_headers)).json()
    assert [t["title"] for t in done] == ["a"]
    assert [t["title"] for t in active] == ["b"]
    assert len(everything) == 2


async def test_update_title_leaves_other_fields(client: AsyncClient, user_headers: dict):
    todo = await _create(client, user_headers, "old", description="desc")
    resp = await client.put(f"/todos/{todo['id']}", headers=user_headers, json={"title": "new"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "new"
    assert resp.json()["description"] == "desc"
    assert resp.json()["is_completed"] is False


async def test_update_empty_title_rejected(client: AsyncClient, user_headers: dict):
    todo = await _create(client, user_headers)
    resp = await client.put(f"/todos/{todo['id']}", headers=user_headers, json={"title": ""})
    assert resp.status_code == 422


async def test_users_cannot_see_each_others_todos(
    client: AsyncClient, user_headers: dict, other_headers: dict
):
    await _create(client, user_headers, "private")
    resp = await client.get("/todos", headers=other_headers)
    assert resp.status_code == 200
    assert resp.json() == []


async def test_cross_user_update_and_delete_return_404(
    client: AsyncClient, user_headers: dict, other_headers: dict
):
    todo = await _create(client, user_headers, "mine")
    put = await client.put(f"/todos/{todo['id']}", headers=other_headers, json={"title": "x"})
    delete = await client.delete(f"/todos/{todo['id']}", headers=other_headers)
    assert put.status_code == 404
    assert delete.status_code == 404
    still_there = (await client.get("/todos", headers=user_headers)).json()
    assert still_there[0]["title"] == "mine"


async def test_soft_delete(client: AsyncClient, user_headers: dict):
    todo = await _create(client, user_headers)
    resp = await client.delete(f"/todos/{todo['id']}", headers=user_headers)
    assert resp.status_code == 204
    assert resp.content == b""
    assert (await client.get("/todos", headers=user_headers)).json() == []


async def test_deleted_todo_not_found_on_update_or_delete(client: AsyncClient, user_headers: dict):
    todo = await _create(client, user_headers)
    await client.delete(f"/todos/{todo['id']}", headers=user_headers)
    put = await client.put(f"/todos/{todo['id']}", headers=user_headers, json={"title": "x"})
    again = await client.delete(f"/todos/{todo['id']}", headers=user_headers)
    assert put.status_code == 404
    assert again.status_code == 404


async def test_deleted_todo_excluded_from_filters(client: AsyncClient, user_headers: dict):
    todo = await _create(client, user_headers)
    await client.delete(f"/todos/{todo['id']}", headers=user_headers)
    for query in ("?completed=true", "?completed=false", ""):
        assert (await client.get(f"/todos{query}", headers=user_headers)).json() == []


async def test_timestamps_are_utc_with_z_suffix(client: AsyncClient, user_headers: dict):
    todo = await _create(client, user_headers)
    assert todo["created_at"].endswith("Z")
