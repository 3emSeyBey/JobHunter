"""RemoteOK — public JSON. Requires non-default User-Agent."""
from __future__ import annotations

import httpx

from .base import BaseScraper, RawJob


class RemoteOKScraper(BaseScraper):
    slug = "remoteok"
    URL = "https://remoteok.com/api"

    def fetch(self):
        with httpx.Client(timeout=30, headers={"User-Agent": "JobHunter/0.1 (mackcloydbacarisas@gmail.com)"}) as c:
            r = c.get(self.URL)
            r.raise_for_status()
            data = r.json()
        # first element is metadata
        for j in data[1:] if isinstance(data, list) else []:
            if not isinstance(j, dict):
                continue
            yield RawJob(
                source_slug=self.slug,
                external_id=str(j.get("id", j.get("slug", ""))),
                url=j.get("url") or j.get("apply_url", ""),
                title=j.get("position") or j.get("title", ""),
                company=j.get("company"),
                location=j.get("location"),
                salary=j.get("salary") or (f"${j.get('salary_min','')}-${j.get('salary_max','')}" if j.get("salary_min") else None),
                description=(j.get("description") or "")[:8000],
                posted_at=j.get("date"),
            )
