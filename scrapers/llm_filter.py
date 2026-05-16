"""LLM-based relevancy filter. Gemini Flash Lite. Single paid component."""
from __future__ import annotations

import json
import logging
import os
import re
from typing import Any

import google.generativeai as genai

log = logging.getLogger(__name__)

_JSON_FENCE = re.compile(r"```(?:json)?\s*(\{.*?\})\s*```", re.DOTALL)


def _extract_json(text: str) -> dict[str, Any] | None:
    if not text:
        return None
    m = _JSON_FENCE.search(text)
    raw = m.group(1) if m else text
    raw = raw.strip()
    # find first { and matching last }
    if "{" in raw:
        start = raw.index("{")
        end = raw.rindex("}")
        raw = raw[start : end + 1]
    try:
        return json.loads(raw)
    except Exception:
        return None


def classify(job: dict[str, Any], profile: dict[str, Any], system_prompt: str, model: str) -> dict[str, Any]:
    """Returns {'relevant': bool, 'score': int, 'reason': str, 'red_flags': [str]}."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"relevant": False, "score": 0, "reason": "no GEMINI_API_KEY", "red_flags": ["config"]}

    genai.configure(api_key=api_key)
    gm = genai.GenerativeModel(model_name=model, system_instruction=system_prompt)

    payload = {
        "candidate_profile": {
            "name": profile.get("name"),
            "bio": profile.get("bio"),
            "skills": profile.get("skills"),
            "experience": profile.get("experience"),
            "preferred_roles": profile.get("preferred_roles"),
            "qualifications": profile.get("qualifications"),
        },
        "job_post": {
            "title": job.get("title"),
            "company": job.get("company"),
            "location": job.get("location"),
            "salary": job.get("salary"),
            "url": job.get("url"),
            "description": (job.get("description") or "")[:6000],
        },
    }
    user_msg = "Evaluate this candidate / job pair. Reply with JSON only.\n\n" + json.dumps(payload, indent=2)

    try:
        resp = gm.generate_content(user_msg, generation_config={"temperature": 0.1, "max_output_tokens": 400})
        parsed = _extract_json(resp.text) or {}
    except Exception as e:  # noqa: BLE001
        log.exception("gemini error")
        return {"relevant": False, "score": 0, "reason": f"gemini error: {e}", "red_flags": ["llm-error"]}

    return {
        "relevant": bool(parsed.get("relevant", False)),
        "score": int(parsed.get("score", 0) or 0),
        "reason": (parsed.get("reason") or "")[:500],
        "red_flags": parsed.get("red_flags") or [],
    }
