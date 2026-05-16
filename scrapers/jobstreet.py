"""JobStreet PH — public SERP JSON API (no auth).

Path is in robots.txt Disallow. Caller assumes risk. Mitigations:
- ≤1 req/sec
- Browser UA + Accept/Referer headers
- Small page size, only 1-2 pages per query
"""
from __future__ import annotations

import logging
import time

import httpx

from .base import BaseScraper, RawJob

log = logging.getLogger(__name__)

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"


class JobStreetPHScraper(BaseScraper):
    slug = "jobstreet"
    BASE = "https://ph.jobstreet.com/api/jobsearch/v5/search"

    def fetch(self):
        queries = self.config.get(
            "queries",
            ["python developer", "backend developer", "virtual assistant", "human resources", "customer service"],
        )
        page_size = int(self.config.get("page_size", 30))
        pages = int(self.config.get("pages", 1))

        with httpx.Client(
            timeout=30,
            headers={
                "User-Agent": UA,
                "Accept": "application/json",
                "Accept-Language": "en-PH,en;q=0.9",
                "Referer": "https://ph.jobstreet.com/",
                "x-seek-site": "Jobstreet",
            },
            follow_redirects=True,
        ) as c:
            seen_ids: set[str] = set()
            for q in queries:
                for page in range(1, pages + 1):
                    try:
                        r = c.get(
                            self.BASE,
                            params={
                                "siteKey": "PH-Main",
                                "sourcesystem": "houston",
                                "keywords": q,
                                "page": page,
                                "pageSize": page_size,
                                "include": "seodata",
                            },
                        )
                        if r.status_code >= 400:
                            log.warning("jobstreet %s page=%d returned %s", q, page, r.status_code)
                            break
                        data = r.json()
                    except Exception as e:  # noqa: BLE001
                        log.warning("jobstreet fetch failed for %s: %s", q, e)
                        break

                    rows = data.get("data") or []
                    if not rows:
                        break
                    for j in rows:
                        jid = str(j.get("id") or "")
                        if not jid or jid in seen_ids:
                            continue
                        seen_ids.add(jid)
                        locs = j.get("locations") or []
                        loc_label = ", ".join([l.get("label", "") for l in locs if isinstance(l, dict)]) or None
                        bullets = j.get("bulletPoints") or []
                        teaser = j.get("teaser") or ""
                        description = (teaser + "\n\n" + "\n• ".join(bullets))[:8000]
                        yield RawJob(
                            source_slug=self.slug,
                            external_id=jid,
                            url=f"https://ph.jobstreet.com/job/{jid}",
                            title=j.get("title", ""),
                            company=(j.get("companyName") or (j.get("employer") or {}).get("name")),
                            location=loc_label,
                            salary=j.get("salaryLabel"),
                            description=description,
                            posted_at=j.get("listingDate"),
                        )
                    time.sleep(1.0)  # polite — 1 req/sec
