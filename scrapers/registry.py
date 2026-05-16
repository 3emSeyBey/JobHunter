"""Source slug → BaseScraper subclass."""
from __future__ import annotations

from .ashby import AshbyScraper
from .base import BaseScraper
from .glints import GlintsScraper
from .greenhouse import GreenhouseScraper
from .himalayas import HimalayasScraper
from .hn import HNScraper
from .kalibrr import KalibrrScraper
from .lever import LeverScraper
from .onlinejobs_ph import OnlineJobsPHScraper
from .remoteok import RemoteOKScraper
from .remotive import RemotiveScraper
from .wwr import WWRScraper

REGISTRY: dict[str, type[BaseScraper]] = {
    "remotive": RemotiveScraper,
    "remoteok": RemoteOKScraper,
    "himalayas": HimalayasScraper,
    "wwr": WWRScraper,
    "hn": HNScraper,
    "greenhouse": GreenhouseScraper,
    "lever": LeverScraper,
    "ashby": AshbyScraper,
    "kalibrr": KalibrrScraper,
    "glints": GlintsScraper,
    "onlinejobs_ph": OnlineJobsPHScraper,
}


def build(slug: str, config: dict, secrets: dict | None = None) -> BaseScraper:
    cls = REGISTRY[slug]
    return cls(config=config, secrets=secrets or {})
