"""Cheap pre-LLM keyword pass. Two outputs per job: matched keywords + suggested profile."""
from __future__ import annotations

from .base import normalize_text


def check_negative(text: str, negatives: list[str]) -> str | None:
    n = normalize_text(text)
    for k in negatives:
        if k and normalize_text(k) in n:
            return k
    return None


def matched_keywords(text: str, keywords: list[str]) -> list[str]:
    n = normalize_text(text)
    return [k for k in keywords if k and normalize_text(k) in n]


def suggest_profile(text: str, dev_kw: list[str], psych_kw: list[str]) -> tuple[str | None, list[str]]:
    """Return (suggested_profile, matched_keywords).

    Profile chosen by which keyword set has more hits.
    Returns (None, []) if neither set matches.
    """
    dev_hits = matched_keywords(text, dev_kw)
    psych_hits = matched_keywords(text, psych_kw)
    if not dev_hits and not psych_hits:
        return None, []
    if len(dev_hits) >= len(psych_hits):
        return "dev", dev_hits
    return "psych", psych_hits
