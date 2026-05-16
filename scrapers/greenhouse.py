"""Greenhouse public ATS board API — per company slug."""
from __future__ import annotations

import httpx

from .base import BaseScraper, RawJob


class GreenhouseScraper(BaseScraper):
    slug = "greenhouse"

    def fetch(self):
        slugs = self.config.get("slugs", []) or []
        with httpx.Client(timeout=30, headers={"User-Agent": "JobHunter/0.1"}) as c:
            for s in slugs:
                try:
                    r = c.get(f"https://boards-api.greenhouse.io/v1/boards/{s}/jobs", params={"content": "true"})
                    r.raise_for_status()
                except Exception:
                    continue
                for j in r.json().get("jobs", []):
                    yield RawJob(
                        source_slug=self.slug,
                        external_id=f"{s}:{j['id']}",
                        url=j.get("absolute_url", ""),
                        title=j.get("title", ""),
                        company=s,
                        location=(j.get("location") or {}).get("name"),
                        salary=None,
                        description=(j.get("content") or "")[:8000],
                        posted_at=j.get("updated_at"),
                    )
