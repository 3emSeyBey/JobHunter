"""Glints — explore page HTML scrape.

Sitemap path was blocked by CDN (403). Fallback: hit the search-page HTML
and parse hydrated SSR markup. Throttle aggressively to stay polite.
"""
from __future__ import annotations

import logging

import httpx
from selectolax.parser import HTMLParser

from .base import BaseScraper, RawJob

log = logging.getLogger(__name__)

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"


class GlintsScraper(BaseScraper):
    slug = "glints"

    def fetch(self):
        queries = self.config.get("queries", ["python", "virtual-assistant", "customer-service"])
        country = self.config.get("country", "ph")
        with httpx.Client(
            timeout=30,
            headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"},
            follow_redirects=True,
        ) as c:
            for q in queries:
                url = f"https://glints.com/{country}/opportunities/jobs/explore?keyword={q}&country={country.upper()}"
                try:
                    r = c.get(url)
                    if r.status_code >= 400:
                        log.warning("glints %s returned %s", url, r.status_code)
                        continue
                except Exception as e:  # noqa: BLE001
                    log.warning("glints fetch failed: %s", e)
                    continue
                doc = HTMLParser(r.text)
                for card in doc.css("a[href*='/opportunities/jobs/']")[:30]:
                    href = card.attributes.get("href", "") or ""
                    if not href.startswith("http"):
                        href = "https://glints.com" + href
                    yield RawJob(
                        source_slug=self.slug,
                        external_id=href,
                        url=href,
                        title=(card.text() or "").strip()[:200] or "(Glints job)",
                        company=None,
                        location=country.upper(),
                        salary=None,
                        description="",
                        posted_at=None,
                    )
