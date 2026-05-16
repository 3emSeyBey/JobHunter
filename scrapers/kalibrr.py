"""Kalibrr — public job-search JSON API. Beats __NEXT_DATA__ scrape."""
from __future__ import annotations

import logging

import httpx

from .base import BaseScraper, RawJob

log = logging.getLogger(__name__)

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"


class KalibrrScraper(BaseScraper):
    """Hits the public API the Kalibrr SPA uses. Public, JSON, no auth needed."""

    slug = "kalibrr"
    BASE = "https://www.kalibrr.com/kjs/job_board/search"

    def fetch(self):
        queries = self.config.get("queries", ["python"])
        with httpx.Client(
            timeout=30,
            headers={
                "User-Agent": UA,
                "Accept": "application/json",
                "Accept-Language": "en-US,en;q=0.9",
            },
            follow_redirects=True,
        ) as c:
            for q in queries:
                params = {"text": q, "limit": 30, "offset": 0}
                try:
                    r = c.get(self.BASE, params=params)
                    if r.status_code >= 400:
                        log.warning("kalibrr %s returned %s", q, r.status_code)
                        continue
                    data = r.json()
                except Exception as e:  # noqa: BLE001
                    log.warning("kalibrr fetch failed for %s: %s", q, e)
                    continue
                for j in data.get("jobs", []) or []:
                    company = (j.get("company") or {})
                    location = j.get("google_location") or {}
                    loc_name = None
                    addr = location.get("address_components") if isinstance(location, dict) else None
                    if isinstance(addr, list) and addr:
                        loc_name = addr[0].get("long_name") if isinstance(addr[0], dict) else None
                    yield RawJob(
                        source_slug=self.slug,
                        external_id=str(j.get("id") or j.get("slug") or ""),
                        url=f"https://www.kalibrr.com/c/{company.get('slug','')}/jobs/{j.get('id','')}",
                        title=j.get("name", "") or j.get("position_name", ""),
                        company=company.get("name"),
                        location=loc_name or "PH",
                        salary=j.get("salary_range"),
                        description=(j.get("description") or j.get("description_text") or "")[:8000],
                        posted_at=j.get("activation_date") or j.get("created_at"),
                    )
