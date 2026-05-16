"""HireTalent.ph — NOT a true job board, it's an employer→talent marketplace.

Implemented to harvest SEO landing pages at /remote-jobs/{slug}-jobs-for-filipinos.
Each page describes a role + matching Filipino talent; we surface the page so
the LLM can decide whether it's worth Mack/Jenefer reaching out.
"""
from __future__ import annotations

import logging
import re

import httpx

from .base import BaseScraper, RawJob

log = logging.getLogger(__name__)

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
SITEMAP = "https://hiretalent.ph/sitemap/remote-jobs.xml"
_LOC = re.compile(r"<loc>([^<]+)</loc>")


class HireTalentScraper(BaseScraper):
    slug = "hiretalent"

    def fetch(self):
        # Optional explicit slug allowlist via config; otherwise scan sitemap for keyword matches
        allowed_terms = [t.lower() for t in (self.config.get("terms", []) or [
            "python", "backend", "developer", "virtual-assistant", "hr", "customer-service",
            "data-entry", "research", "psychometric", "ai", "annotation"
        ])]

        with httpx.Client(
            timeout=30,
            headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"},
            follow_redirects=True,
        ) as c:
            try:
                r = c.get(SITEMAP)
                r.raise_for_status()
            except Exception as e:  # noqa: BLE001
                log.warning("hiretalent sitemap fetch failed: %s", e)
                return
            urls = _LOC.findall(r.text)
            picked = [u for u in urls if any(t in u.lower() for t in allowed_terms)][:30]
            log.info("hiretalent: sitemap=%d picked=%d", len(urls), len(picked))

            for u in picked:
                slug = u.rstrip("/").rsplit("/", 1)[-1]
                title = slug.replace("-jobs-for-filipinos", "").replace("-", " ").title()
                yield RawJob(
                    source_slug=self.slug,
                    external_id=u,
                    url=u,
                    title=f"Remote {title} talent (PH)",
                    company="HireTalent.ph",
                    location="PH (remote)",
                    salary=None,
                    description=(
                        f"HireTalent.ph SEO landing page for: {title}. "
                        "Marketplace links Filipino talent to remote employers — verify role fit manually before applying."
                    ),
                    posted_at=None,
                )
