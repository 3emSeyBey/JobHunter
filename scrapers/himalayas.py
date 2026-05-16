"""Himalayas — public JSON API."""
from __future__ import annotations

import httpx

from .base import BaseScraper, RawJob


class HimalayasScraper(BaseScraper):
    slug = "himalayas"
    URL = "https://himalayas.app/jobs/api"

    def fetch(self):
        with httpx.Client(timeout=30, headers={"User-Agent": "JobHunter/0.1"}) as c:
            r = c.get(self.URL, params={"limit": 20, "offset": 0})
            r.raise_for_status()
            data = r.json()
        for j in data.get("jobs", []):
            yield RawJob(
                source_slug=self.slug,
                external_id=str(j.get("guid") or j.get("id") or j.get("slug")),
                url=j.get("applicationLink") or f"https://himalayas.app/jobs/{j.get('slug','')}",
                title=j.get("title", ""),
                company=(j.get("companyName") or (j.get("company") or {}).get("name")),
                location=", ".join(j.get("locationRestrictions", []) or []) or None,
                salary=(f"${j.get('minSalary')}-${j.get('maxSalary')}" if j.get("minSalary") else None),
                description=(j.get("excerpt") or j.get("description") or "")[:8000],
                posted_at=j.get("pubDate") or j.get("publishedDate"),
            )
