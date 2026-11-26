from datetime import UTC, datetime
from typing import Annotated

from pydantic import PlainSerializer


def _to_utc_iso(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")


UTCDatetime = Annotated[datetime, PlainSerializer(_to_utc_iso, return_type=str)]
