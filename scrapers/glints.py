"""Glints — sitemap-driven discovery for PH."""
from __future__ import annotations

import re

import httpx
from selectolax.parser import HTMLParser

from .base import BaseScraper, RawJob


class GlintsScraper(BaseScraper):
    slug = "glints"
    SITEMAP = "https://glints.com/explore-page-id-sitemap.xml"

    def fetch(self):
        country = self.config.get("country", "ph")
        with httpx.Client(timeout=30, headers={"User-Agent": "JobHunter/0.1"}, follow_redirects=True) as c:
            try:
                r = c.get(self.SITEMAP)
                r.raise_for_status()
            except Exception:
                return
            urls = re.findall(r"<loc>([^<]+)</loc>", r.text)
            ph_urls = [u for u in urls if f"/{country}" in u.lower()][:30]
            for u in ph_urls:
                try:
                    page = c.get(u)
                    page.raise_for_status()
                except Exception:
                    continue
                doc = HTMLParser(page.text)
                title = doc.css_first("h1")
                desc = doc.css_first("meta[name='description']")
                yield RawJob(
                    source_slug=self.slug,
                    external_id=u,
                    url=u,
                    title=(title.text() if title else "").strip()[:200],
                    company=None,
                    location="PH",
                    salary=None,
                    description=(desc.attributes.get("content", "") if desc else "")[:8000],
                    posted_at=None,
                )
