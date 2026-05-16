"""We Work Remotely — RSS."""
from __future__ import annotations

import feedparser

from .base import BaseScraper, RawJob


class WWRScraper(BaseScraper):
    slug = "wwr"
    URL = "https://weworkremotely.com/remote-jobs.rss"

    def fetch(self):
        feed = feedparser.parse(self.URL)
        for e in feed.entries:
            title = e.get("title", "")
            # WWR titles often "Company: Role" — split
            company = None
            if ":" in title:
                left, right = title.split(":", 1)
                company, title_clean = left.strip(), right.strip()
            else:
                title_clean = title
            yield RawJob(
                source_slug=self.slug,
                external_id=e.get("id") or e.get("link", ""),
                url=e.get("link", ""),
                title=title_clean,
                company=company,
                location=None,
                salary=None,
                description=(e.get("summary") or "")[:8000],
                posted_at=e.get("published"),
            )
