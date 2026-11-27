from datetime import date, timedelta

from httpx import AsyncClient


async def _create(client: AsyncClient, headers: dict, title: str = "Task", **extra) -> dict:
    resp = await client.post("/todos", headers=headers, json={"title": title, **extra})
    assert resp.status_code == 201, resp.text
    return resp.json()


def _items(resp) -> list[dict]:
    """Extract items list from paginated response."""
    return resp.json()["items"]


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

async def test_requires_auth(client: AsyncClient):
    assert (await client.get("/todos")).status_code == 401
    assert (await client.post("/todos", json={"title": "x"})).status_code == 401


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

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


async def test_create_with_due_date_and_priority(client: AsyncClient, user_headers: dict):
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    todo = await _create(client, user_headers, "Deadline task", due_date=tomorrow, priority="high")
    assert todo["due_date"] == tomorrow
    assert todo["priority"] == "high"


async def test_create_defaults_priority_medium(client: AsyncClient, user_headers: dict):
    todo = await _create(client, user_headers, "No priority set")
    assert todo["priority"] == "medium"
    assert todo["due_date"] is None


async def test_create_invalid_priority_rejected(client: AsyncClient, user_headers: dict):
    resp = await client.post(
        "/todos", headers=user_headers, json={"title": "bad", "priority": "critical"}
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# List (paginated response)
# ---------------------------------------------------------------------------

async def test_list_returns_paginated_response(client: AsyncClient, user_headers: dict):
    await _create(client, user_headers, "one")
    resp = await client.get("/todos", headers=user_headers)
    body = resp.json()
    assert "items" in body
    assert "next_cursor" in body
    assert "total_count" in body
    assert body["total_count"] == 1
    assert len(body["items"]) == 1


async def test_list_is_sorted_newest_first(client: AsyncClient, user_headers: dict):
    first = await _create(client, user_headers, "first")
    second = await _create(client, user_headers, "second")
    resp = await client.get("/todos?sort=created_at&order=desc", headers=user_headers)
    items = _items(resp)
    assert [t["id"] for t in items] == [second["id"], first["id"]]


async def test_filter_by_completed(client: AsyncClient, user_headers: dict):
    a = await _create(client, user_headers, "a")
    await _create(client, user_headers, "b")
    await client.put(f"/todos/{a['id']}", headers=user_headers, json={"is_completed": True})

    done = _items(await client.get("/todos?completed=true", headers=user_headers))
    active = _items(await client.get("/todos?completed=false", headers=user_headers))
    everything = _items(await client.get("/todos", headers=user_headers))
    assert [t["title"] for t in done] == ["a"]
    assert [t["title"] for t in active] == ["b"]
    assert len(everything) == 2


# ---------------------------------------------------------------------------
# Search (q param)
# ---------------------------------------------------------------------------

async def test_search_by_title(client: AsyncClient, user_headers: dict):
    await _create(client, user_headers, "Buy groceries")
    await _create(client, user_headers, "Walk the dog")
    items = _items(await client.get("/todos?q=groceries", headers=user_headers))
    assert len(items) == 1
    assert items[0]["title"] == "Buy groceries"


async def test_search_case_insensitive(client: AsyncClient, user_headers: dict):
    await _create(client, user_headers, "Buy Groceries")
    items = _items(await client.get("/todos?q=buy", headers=user_headers))
    assert len(items) == 1


async def test_search_escapes_sql_wildcards(client: AsyncClient, user_headers: dict):
    await _create(client, user_headers, "100% done")
    await _create(client, user_headers, "another task")
    items = _items(await client.get("/todos?q=100%25", headers=user_headers))
    assert len(items) == 1
    assert items[0]["title"] == "100% done"


async def test_search_escapes_underscore(client: AsyncClient, user_headers: dict):
    await _create(client, user_headers, "file_name")
    await _create(client, user_headers, "filename")
    items = _items(await client.get("/todos?q=file_name", headers=user_headers))
    assert len(items) == 1
    assert items[0]["title"] == "file_name"


# ---------------------------------------------------------------------------
# Filter by priority
# ---------------------------------------------------------------------------

async def test_filter_by_priority(client: AsyncClient, user_headers: dict):
    await _create(client, user_headers, "low task", priority="low")
    await _create(client, user_headers, "high task", priority="high")
    await _create(client, user_headers, "medium task", priority="medium")

    high = _items(await client.get("/todos?priority=high", headers=user_headers))
    assert len(high) == 1
    assert high[0]["title"] == "high task"

    low = _items(await client.get("/todos?priority=low", headers=user_headers))
    assert len(low) == 1
    assert low[0]["title"] == "low task"


async def test_filter_invalid_priority_rejected(client: AsyncClient, user_headers: dict):
    resp = await client.get("/todos?priority=critical", headers=user_headers)
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Filter by due date
# ---------------------------------------------------------------------------

async def test_filter_due_overdue(client: AsyncClient, user_headers: dict):
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    await _create(client, user_headers, "overdue", due_date=yesterday)
    await _create(client, user_headers, "no date")

    items = _items(await client.get("/todos?due=overdue", headers=user_headers))
    assert len(items) == 1
    assert items[0]["title"] == "overdue"


async def test_filter_due_overdue_excludes_completed(client: AsyncClient, user_headers: dict):
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    todo = await _create(client, user_headers, "overdue done", due_date=yesterday)
    await client.put(f"/todos/{todo['id']}", headers=user_headers, json={"is_completed": True})

    items = _items(await client.get("/todos?due=overdue", headers=user_headers))
    assert len(items) == 0


async def test_filter_due_today(client: AsyncClient, user_headers: dict):
    today_str = date.today().isoformat()
    await _create(client, user_headers, "today task", due_date=today_str)
    await _create(client, user_headers, "no date")

    items = _items(await client.get("/todos?due=today", headers=user_headers))
    assert len(items) == 1
    assert items[0]["title"] == "today task"


async def test_filter_due_upcoming(client: AsyncClient, user_headers: dict):
    in_3_days = (date.today() + timedelta(days=3)).isoformat()
    today_str = date.today().isoformat()
    in_10_days = (date.today() + timedelta(days=10)).isoformat()

    await _create(client, user_headers, "upcoming", due_date=in_3_days)
    await _create(client, user_headers, "today", due_date=today_str)
    await _create(client, user_headers, "far out", due_date=in_10_days)

    items = _items(await client.get("/todos?due=upcoming", headers=user_headers))
    assert len(items) == 1
    assert items[0]["title"] == "upcoming"


async def test_filter_due_none(client: AsyncClient, user_headers: dict):
    await _create(client, user_headers, "no date")
    await _create(client, user_headers, "has date", due_date=date.today().isoformat())

    items = _items(await client.get("/todos?due=none", headers=user_headers))
    assert len(items) == 1
    assert items[0]["title"] == "no date"


# ---------------------------------------------------------------------------
# Sorting
# ---------------------------------------------------------------------------

async def test_sort_by_position_asc(client: AsyncClient, user_headers: dict):
    a = await _create(client, user_headers, "a")
    b = await _create(client, user_headers, "b")
    items = _items(await client.get("/todos?sort=position&order=asc", headers=user_headers))
    assert items[0]["id"] == a["id"]
    assert items[1]["id"] == b["id"]


async def test_sort_by_due_date_asc(client: AsyncClient, user_headers: dict):
    later = (date.today() + timedelta(days=5)).isoformat()
    sooner = (date.today() + timedelta(days=1)).isoformat()
    a = await _create(client, user_headers, "later", due_date=later)
    b = await _create(client, user_headers, "sooner", due_date=sooner)

    items = _items(await client.get("/todos?sort=due_date&order=asc", headers=user_headers))
    assert items[0]["id"] == b["id"]
    assert items[1]["id"] == a["id"]


async def test_sort_by_priority(client: AsyncClient, user_headers: dict):
    await _create(client, user_headers, "medium", priority="medium")
    await _create(client, user_headers, "high", priority="high")
    await _create(client, user_headers, "low", priority="low")

    items = _items(await client.get("/todos?sort=priority&order=asc", headers=user_headers))
    priorities = [t["priority"] for t in items]
    assert priorities == sorted(priorities)


# ---------------------------------------------------------------------------
# Cursor pagination
# ---------------------------------------------------------------------------

async def test_cursor_pagination(client: AsyncClient, user_headers: dict):
    for i in range(5):
        await _create(client, user_headers, f"item-{i}")

    resp = await client.get(
        "/todos?limit=3&sort=position&order=asc", headers=user_headers,
    )
    page1 = resp.json()
    assert len(page1["items"]) == 3
    assert page1["total_count"] == 5
    assert page1["next_cursor"] is not None

    page2 = (await client.get(
        f"/todos?limit=3&sort=position&order=asc&cursor={page1['next_cursor']}",
        headers=user_headers,
    )).json()
    assert len(page2["items"]) == 2
    assert page2["next_cursor"] is None

    all_ids = [t["id"] for t in page1["items"]] + [t["id"] for t in page2["items"]]
    assert len(set(all_ids)) == 5


# ---------------------------------------------------------------------------
# Combined filters
# ---------------------------------------------------------------------------

async def test_combined_priority_and_search(client: AsyncClient, user_headers: dict):
    await _create(client, user_headers, "Buy groceries", priority="high")
    await _create(client, user_headers, "Buy shoes", priority="low")
    await _create(client, user_headers, "Walk dog", priority="high")

    items = _items(await client.get("/todos?q=Buy&priority=high", headers=user_headers))
    assert len(items) == 1
    assert items[0]["title"] == "Buy groceries"


# ---------------------------------------------------------------------------
# Data isolation with filters
# ---------------------------------------------------------------------------

async def test_users_cannot_see_each_others_todos(
    client: AsyncClient, user_headers: dict, other_headers: dict
):
    await _create(client, user_headers, "private")
    resp = await client.get("/todos", headers=other_headers)
    assert resp.status_code == 200
    assert _items(resp) == []


async def test_search_data_isolation(
    client: AsyncClient, user_headers: dict, other_headers: dict
):
    await _create(client, user_headers, "secret report")
    await _create(client, other_headers, "other report")

    user_items = _items(await client.get("/todos?q=report", headers=user_headers))
    assert len(user_items) == 1
    assert user_items[0]["title"] == "secret report"

    other_items = _items(await client.get("/todos?q=report", headers=other_headers))
    assert len(other_items) == 1
    assert other_items[0]["title"] == "other report"


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

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


async def test_cross_user_update_and_delete_return_404(
    client: AsyncClient, user_headers: dict, other_headers: dict
):
    todo = await _create(client, user_headers, "mine")
    put = await client.put(f"/todos/{todo['id']}", headers=other_headers, json={"title": "x"})
    delete = await client.delete(f"/todos/{todo['id']}", headers=other_headers)
    assert put.status_code == 404
    assert delete.status_code == 404
    items = _items(await client.get("/todos", headers=user_headers))
    assert items[0]["title"] == "mine"


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

async def test_soft_delete(client: AsyncClient, user_headers: dict):
    todo = await _create(client, user_headers)
    resp = await client.delete(f"/todos/{todo['id']}", headers=user_headers)
    assert resp.status_code == 204
    assert resp.content == b""
    assert _items(await client.get("/todos", headers=user_headers)) == []


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
        assert _items(await client.get(f"/todos{query}", headers=user_headers)) == []


# ---------------------------------------------------------------------------
# Timestamps
# ---------------------------------------------------------------------------

async def test_timestamps_are_utc_with_z_suffix(client: AsyncClient, user_headers: dict):
    todo = await _create(client, user_headers)
    assert todo["created_at"].endswith("Z")


# ---------------------------------------------------------------------------
# Position / Reorder (US4)
# ---------------------------------------------------------------------------

async def test_position_assigned_on_create(client: AsyncClient, user_headers: dict):
    a = await _create(client, user_headers, "a")
    b = await _create(client, user_headers, "b")
    assert a["position"] > 0
    assert b["position"] > a["position"]


async def test_reorder_midpoint(client: AsyncClient, user_headers: dict):
    a = await _create(client, user_headers, "a")
    b = await _create(client, user_headers, "b")
    c = await _create(client, user_headers, "c")

    resp = await client.patch(
        f"/todos/{c['id']}/position",
        headers=user_headers,
        json={"after_id": a["id"], "before_id": b["id"]},
    )
    assert resp.status_code == 200
    new_pos = resp.json()["position"]
    assert a["position"] < new_pos < b["position"]


async def test_reorder_tail(client: AsyncClient, user_headers: dict):
    a = await _create(client, user_headers, "a")
    b = await _create(client, user_headers, "b")

    resp = await client.patch(
        f"/todos/{a['id']}/position",
        headers=user_headers,
        json={"after_id": b["id"]},
    )
    assert resp.status_code == 200
    assert resp.json()["position"] == b["position"] + 1024


async def test_reorder_head(client: AsyncClient, user_headers: dict):
    a = await _create(client, user_headers, "a")
    b = await _create(client, user_headers, "b")

    resp = await client.patch(
        f"/todos/{b['id']}/position",
        headers=user_headers,
        json={"before_id": a["id"]},
    )
    assert resp.status_code == 200
    assert resp.json()["position"] == a["position"] - 1024


async def test_reorder_both_null_rejected(client: AsyncClient, user_headers: dict):
    todo = await _create(client, user_headers, "task")
    resp = await client.patch(
        f"/todos/{todo['id']}/position",
        headers=user_headers,
        json={},
    )
    assert resp.status_code == 422


async def test_reorder_404_for_unowned_reference(
    client: AsyncClient, user_headers: dict, other_headers: dict
):
    mine = await _create(client, user_headers, "mine")
    theirs = await _create(client, other_headers, "theirs")
    resp = await client.patch(
        f"/todos/{mine['id']}/position",
        headers=user_headers,
        json={"after_id": theirs["id"]},
    )
    assert resp.status_code == 404


async def test_reorder_isolation(
    client: AsyncClient, user_headers: dict, other_headers: dict
):
    a = await _create(client, user_headers, "a")
    b = await _create(client, user_headers, "b")

    resp = await client.patch(
        f"/todos/{a['id']}/position",
        headers=other_headers,
        json={"after_id": b["id"]},
    )
    assert resp.status_code == 404
