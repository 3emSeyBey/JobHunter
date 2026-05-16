"""Lever public ATS — per company slug."""
from __future__ import annotations

import httpx

from .base import BaseScraper, RawJob


class LeverScraper(BaseScraper):
    slug = "lever"

    def fetch(self):
        slugs = self.config.get("slugs", []) or []
        with httpx.Client(timeout=30, headers={"User-Agent": "JobHunter/0.1"}) as c:
            for s in slugs:
                try:
                    r = c.get(f"https://api.lever.co/v0/postings/{s}", params={"mode": "json"})
                    r.raise_for_status()
                except Exception:
                    continue
                for j in r.json():
                    cats = j.get("categories") or {}
                    yield RawJob(
                        source_slug=self.slug,
                        external_id=f"{s}:{j.get('id')}",
                        url=j.get("hostedUrl", ""),
                        title=j.get("text", ""),
                        company=s,
                        location=cats.get("location"),
                        salary=cats.get("commitment"),
                        description=(j.get("descriptionPlain") or j.get("description") or "")[:8000],
                        posted_at=str(j.get("createdAt", "")) or None,
                    )
