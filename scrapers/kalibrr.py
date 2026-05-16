"""Kalibrr — HTML scrape via search queries. PH-focused."""
from __future__ import annotations

import json
import re

import httpx
from selectolax.parser import HTMLParser

from .base import BaseScraper, RawJob

_NEXT_DATA = re.compile(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', re.DOTALL)


class KalibrrScraper(BaseScraper):
    slug = "kalibrr"

    def fetch(self):
        queries = self.config.get("queries", ["python"])
        with httpx.Client(timeout=30, headers={"User-Agent": "JobHunter/0.1"}, follow_redirects=True) as c:
            for q in queries:
                url = f"https://www.kalibrr.com/home/te/{q.replace(' ', '-')}"
                try:
                    r = c.get(url)
                    r.raise_for_status()
                except Exception:
                    continue
                # Try __NEXT_DATA__ first (clean JSON)
                m = _NEXT_DATA.search(r.text)
                if m:
                    try:
                        data = json.loads(m.group(1))
                        jobs = (
                            data.get("props", {})
                                .get("pageProps", {})
                                .get("searchResults", {})
                                .get("jobs", [])
                        )
                        for j in jobs:
                            yield RawJob(
                                source_slug=self.slug,
                                external_id=str(j.get("id") or j.get("slug")),
                                url=f"https://www.kalibrr.com/c/{(j.get('company') or {}).get('slug','')}/jobs/{j.get('id','')}",
                                title=j.get("name", ""),
                                company=(j.get("company") or {}).get("name"),
                                location=(j.get("google_location") or {}).get("address_components", [{}])[0].get("long_name"),
                                salary=j.get("salary_range") or None,
                                description=(j.get("description") or "")[:8000],
                                posted_at=j.get("activation_date"),
                            )
                        continue
                    except Exception:
                        pass
                # HTML fallback
                doc = HTMLParser(r.text)
                for card in doc.css("a[href*='/jobs/']"):
                    href = card.attributes.get("href", "")
                    if not href.startswith("http"):
                        href = "https://www.kalibrr.com" + href
                    yield RawJob(
                        source_slug=self.slug,
                        external_id=href,
                        url=href,
                        title=(card.text() or "").strip()[:200],
                        company=None,
                        location="PH",
                        salary=None,
                        description="",
                        posted_at=None,
                    )
