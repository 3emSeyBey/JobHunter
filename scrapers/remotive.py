"""Remotive — public JSON API. https://remotive.com/api/remote-jobs"""
from __future__ import annotations

import httpx

from .base import BaseScraper, RawJob


class RemotiveScraper(BaseScraper):
    slug = "remotive"
    URL = "https://remotive.com/api/remote-jobs"

    def fetch(self):
        with httpx.Client(timeout=30, headers={"User-Agent": "JobHunter/0.1 (mackcloydbacarisas@gmail.com)"}) as c:
            r = c.get(self.URL, params={"limit": 200})
            r.raise_for_status()
            data = r.json()
        for j in data.get("jobs", []):
            yield RawJob(
                source_slug=self.slug,
                external_id=str(j["id"]),
                url=j.get("url", ""),
                title=j.get("title", ""),
                company=j.get("company_name"),
                location=j.get("candidate_required_location"),
                salary=j.get("salary"),
                description=(j.get("description") or "")[:8000],
                posted_at=j.get("publication_date"),
            )
