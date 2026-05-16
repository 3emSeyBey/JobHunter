"""Cheap pre-LLM keyword pass with confidence scoring.

Confidence rubric (decides whether to spend LLM tokens):
- Title hit:           +3 per keyword (strongest signal — recruiter put it in the title)
- Description hit:     +1 per keyword
- Short description:   -2 (likely stub/spam)
- No company:          -1 (lower trust)
- Caps:                clamped to 0..10

Threshold (settings.min_confidence, default 3) gates the LLM call.
A title-only "python" hit alone = 3 → passes default. A single body hit (1) does NOT.
"""
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


def score_match(
    title: str,
    description: str,
    company: str | None,
    keywords: list[str],
) -> tuple[int, list[str]]:
    """Return (confidence_0_to_10, matched_keywords). Title hits weight 3x body."""
    t_hits = matched_keywords(title or "", keywords)
    d_hits = matched_keywords(description or "", keywords)
    all_hits = list(dict.fromkeys(t_hits + d_hits))  # dedup, preserve order
    if not all_hits:
        return 0, []
    score = 3 * len(t_hits) + len(d_hits)
    if len((description or "").strip()) < 120:
        score -= 2
    if not (company or "").strip():
        score -= 1
    score = max(0, min(10, score))
    return score, all_hits


def suggest_profile(
    title: str,
    description: str,
    company: str | None,
    dev_kw: list[str],
    psych_kw: list[str],
) -> tuple[str | None, list[str], int]:
    """Return (profile_slug, matched_keywords, confidence_0_to_10).

    Profile chosen by which side scores higher (title-weighted). Ties → dev.
    """
    dev_score, dev_hits = score_match(title, description, company, dev_kw)
    psych_score, psych_hits = score_match(title, description, company, psych_kw)
    if dev_score == 0 and psych_score == 0:
        return None, [], 0
    if dev_score >= psych_score:
        return "dev", dev_hits, dev_score
    return "psych", psych_hits, psych_score
