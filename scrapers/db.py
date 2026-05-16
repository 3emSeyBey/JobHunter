"""Supabase DB helpers for scrapers."""
from __future__ import annotations

import logging
import os
from typing import Any

from supabase import Client, create_client

log = logging.getLogger(__name__)


def client() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def load_settings(c: Client) -> dict[str, Any]:
    r = c.table("settings").select("*").eq("id", 1).limit(1).execute()
    return (r.data or [{}])[0]


def load_profiles(c: Client) -> list[dict[str, Any]]:
    r = c.table("profiles").select("*").execute()
    return r.data or []


def load_enabled_sources(c: Client) -> list[dict[str, Any]]:
    r = c.table("sources").select("*").eq("enabled", True).execute()
    return r.data or []


def existing_external_ids(c: Client, source_slug: str, ids: list[str]) -> set[str]:
    if not ids:
        return set()
    out: set[str] = set()
    # chunk to avoid query length blowup
    for i in range(0, len(ids), 200):
        chunk = ids[i : i + 200]
        r = (
            c.table("jobs")
            .select("external_id")
            .eq("source_slug", source_slug)
            .in_("external_id", chunk)
            .execute()
        )
        for row in r.data or []:
            out.add(row["external_id"])
    return out


def existing_content_hashes(c: Client, hashes: list[str]) -> set[str]:
    if not hashes:
        return set()
    out: set[str] = set()
    for i in range(0, len(hashes), 200):
        chunk = hashes[i : i + 200]
        r = c.table("jobs").select("content_hash").in_("content_hash", chunk).execute()
        for row in r.data or []:
            out.add(row["content_hash"])
    return out


def insert_jobs(c: Client, records: list[dict[str, Any]]) -> int:
    if not records:
        return 0
    inserted = 0
    for i in range(0, len(records), 100):
        chunk = records[i : i + 100]
        try:
            r = c.table("jobs").insert(chunk).execute()
            inserted += len(r.data or [])
        except Exception as e:  # noqa: BLE001
            log.warning("insert chunk failed (%s); falling back to per-row", e)
            for row in chunk:
                try:
                    c.table("jobs").insert(row).execute()
                    inserted += 1
                except Exception:
                    pass
    return inserted


def start_run(c: Client, trigger: str, source_slug: str | None = None) -> str:
    r = c.table("runs").insert({"trigger": trigger, "source_slug": source_slug}).execute()
    return r.data[0]["id"]


def finish_run(c: Client, run_id: str, **fields: Any) -> None:
    fields.setdefault("finished_at", "now()")
    # supabase-py needs ISO string for now(); use server default via update
    from datetime import datetime, timezone

    fields["finished_at"] = datetime.now(timezone.utc).isoformat()
    c.table("runs").update(fields).eq("id", run_id).execute()


def update_job(c: Client, job_id: str, **fields: Any) -> None:
    c.table("jobs").update(fields).eq("id", job_id).execute()
