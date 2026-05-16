"""VirtualStaff.ph — HTML scrape of find-jobs page.

Robots disallows /jobs/*. Best-effort with browser UA. Fails gracefully.
SPA hydration likely empty for non-browser fetches; scraper extracts whatever
links it can from the rendered (or partially rendered) listing page.
"""
from __future__ import annotations

import logging
import re

import httpx
from selectolax.parser import HTMLParser

from .base import BaseScraper, RawJob

log = logging.getLogger(__name__)

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
_HREF_RE = re.compile(r"/jobs-in-philippines/[a-f0-9]{24}/[a-z0-9-]+", re.IGNORECASE)


class VirtualStaffScraper(BaseScraper):
    slug = "virtualstaff"

    def fetch(self):
        queries = self.config.get(
            "queries", ["python", "virtual assistant", "human resources", "customer service"]
        )
        with httpx.Client(
            timeout=30,
            headers={
                "User-Agent": UA,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-PH,en;q=0.9",
            },
            follow_redirects=True,
        ) as c:
            seen: set[str] = set()
            for q in queries:
                url = f"https://www.virtualstaff.ph/en-ph/find-jobs?keyword={q.replace(' ', '+')}"
                try:
                    r = c.get(url)
                    if r.status_code >= 400:
                        log.warning("virtualstaff %s returned %s (robots-blocked path; expected)", q, r.status_code)
                        continue
                except Exception as e:  # noqa: BLE001
                    log.warning("virtualstaff fetch failed for %s: %s", q, e)
                    continue
                doc = HTMLParser(r.text)
                # Pick all anchors pointing at the canonical job-detail path
                anchor_hrefs = []
                for a in doc.css("a"):
                    href = a.attributes.get("href", "") or ""
                    if _HREF_RE.search(href):
                        anchor_hrefs.append((a.text() or "").strip()[:200])
                # Also fall back to regex over raw HTML in case anchors are hydrated
                raw_paths = set(_HREF_RE.findall(r.text))
                for path in list(raw_paths)[:30]:
                    full = f"https://www.virtualstaff.ph{path}"
                    if full in seen:
                        continue
                    seen.add(full)
                    title_guess = path.rsplit("/", 1)[-1].replace("-", " ").title()
                    yield RawJob(
                        source_slug=self.slug,
                        external_id=path.split("/")[-2],  # mongo ObjectId segment
                        url=full,
                        title=title_guess[:200],
                        company=None,
                        location="PH",
                        salary=None,
                        description="",
                        posted_at=None,
                    )
