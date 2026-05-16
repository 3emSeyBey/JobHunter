"""HN Who Is Hiring — Algolia. Pulls latest monthly thread + parses top-level comments as jobs."""
from __future__ import annotations

import html as html_lib
import re

import httpx

from .base import BaseScraper, RawJob

_TAG = re.compile(r"<[^>]+>")
_REMOTE = re.compile(r"\bremote\b", re.IGNORECASE)


class HNScraper(BaseScraper):
    slug = "hn"

    def fetch(self):
        with httpx.Client(timeout=30, headers={"User-Agent": "JobHunter/0.1"}) as c:
            # Find latest "Ask HN: Who is hiring?" story
            search = c.get(
                "https://hn.algolia.com/api/v1/search_by_date",
                params={"query": "Ask HN: Who is hiring?", "tags": "story,author_whoishiring", "hitsPerPage": 1},
            )
            search.raise_for_status()
            hits = search.json().get("hits", [])
            if not hits:
                return
            story_id = hits[0]["objectID"]
            tree = c.get(f"https://hn.algolia.com/api/v1/items/{story_id}")
            tree.raise_for_status()
            data = tree.json()
        for child in data.get("children", []) or []:
            text = child.get("text") or ""
            if not text:
                continue
            # Only surface remote-tagged posts to save LLM budget
            if not _REMOTE.search(text):
                continue
            clean = html_lib.unescape(_TAG.sub(" ", text))
            title = clean.strip().split(" | ")[0][:200] if " | " in clean else clean.strip()[:200]
            yield RawJob(
                source_slug=self.slug,
                external_id=str(child["id"]),
                url=f"https://news.ycombinator.com/item?id={child['id']}",
                title=title or "(HN job)",
                company=None,
                location="Remote",
                salary=None,
                description=clean[:8000],
                posted_at=child.get("created_at"),
            )
