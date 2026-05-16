"""Ashby public ATS — per company slug."""
from __future__ import annotations

import httpx

from .base import BaseScraper, RawJob


class AshbyScraper(BaseScraper):
    slug = "ashby"

    def fetch(self):
        slugs = self.config.get("slugs", []) or []
        with httpx.Client(timeout=30, headers={"User-Agent": "JobHunter/0.1"}) as c:
            for s in slugs:
                try:
                    r = c.get(f"https://api.ashbyhq.com/posting-api/job-board/{s}", params={"includeCompensation": "true"})
                    r.raise_for_status()
                except Exception:
                    continue
                for j in r.json().get("jobs", []):
                    comp = j.get("compensation") or {}
                    yield RawJob(
                        source_slug=self.slug,
                        external_id=f"{s}:{j.get('id')}",
                        url=j.get("jobUrl", ""),
                        title=j.get("title", ""),
                        company=s,
                        location=j.get("location") or j.get("locationName"),
                        salary=comp.get("compensationTierSummary") if isinstance(comp, dict) else None,
                        description=(j.get("descriptionPlain") or j.get("descriptionHtml") or "")[:8000],
                        posted_at=j.get("publishedAt"),
                    )
