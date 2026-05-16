"""Base scraper ABC. Inspired by Syndr's BaseWorker pattern."""
from __future__ import annotations

import hashlib
import logging
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Any, Iterable

log = logging.getLogger(__name__)

_WS = re.compile(r"\s+")
_PUNCT = re.compile(r"[^\w\s]")


def normalize_text(s: str) -> str:
    s = (s or "").lower()
    s = _PUNCT.sub(" ", s)
    s = _WS.sub(" ", s).strip()
    return s


def content_hash(title: str, company: str | None, description: str) -> str:
    base = f"{normalize_text(title)}|{normalize_text(company or '')}|{normalize_text(description)[:2000]}"
    return hashlib.sha256(base.encode("utf-8")).hexdigest()


@dataclass
class RawJob:
    source_slug: str
    external_id: str
    url: str
    title: str
    company: str | None = None
    location: str | None = None
    salary: str | None = None
    description: str = ""
    posted_at: str | None = None  # ISO 8601

    def to_record(self) -> dict[str, Any]:
        d = asdict(self)
        d["content_hash"] = content_hash(self.title, self.company, self.description)
        d["scraped_at"] = datetime.now(timezone.utc).isoformat()
        return d


@dataclass
class ScrapeResult:
    source_slug: str
    jobs: list[RawJob] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


class BaseScraper(ABC):
    """One subclass per board. Stateless — orchestrator handles DB."""

    slug: str = "base"

    def __init__(self, config: dict[str, Any] | None = None, secrets: dict[str, str] | None = None):
        self.config = config or {}
        self.secrets = secrets or {}

    @abstractmethod
    def fetch(self) -> Iterable[RawJob]:
        """Yield RawJob instances. Implementations should be resilient — log errors but keep going."""
        ...

    def run(self) -> ScrapeResult:
        result = ScrapeResult(source_slug=self.slug)
        try:
            for job in self.fetch():
                result.jobs.append(job)
        except Exception as e:  # noqa: BLE001
            log.exception("scraper %s top-level failure", self.slug)
            result.errors.append(f"{type(e).__name__}: {e}")
        return result
