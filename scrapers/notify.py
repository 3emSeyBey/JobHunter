"""Notifications: Telegram + Gmail SMTP."""
from __future__ import annotations

import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

import httpx

log = logging.getLogger(__name__)


def telegram_send(text: str, chat_id: str | None = None) -> bool:
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat = chat_id or os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat:
        return False
    try:
        r = httpx.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat, "text": text[:4000], "parse_mode": "HTML", "disable_web_page_preview": False},
            timeout=15,
        )
        r.raise_for_status()
        return True
    except Exception:
        log.exception("telegram send failed")
        return False


def email_send(to: list[str], subject: str, html: str) -> bool:
    user = os.environ.get("GMAIL_USER")
    pw = os.environ.get("GMAIL_APP_PASSWORD")
    if not user or not pw or not to:
        return False
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = user
    msg["To"] = ", ".join(to)
    msg.attach(MIMEText(html, "html"))
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as s:
            s.login(user, pw)
            s.sendmail(user, to, msg.as_string())
        return True
    except Exception:
        log.exception("email send failed")
        return False


def _esc(s: Any) -> str:
    import html as _html

    return _html.escape(str(s) if s is not None else "")


def format_digest_email(jobs: list[dict[str, Any]], profile: dict[str, Any]) -> tuple[str, str]:
    """One email per profile, listing every relevant job from this run."""
    slug = profile.get("slug", "").upper()
    n = len(jobs)
    subject = f"[JobHunter:{slug}] {n} new relevant job{'s' if n != 1 else ''} — {profile.get('name','')}"
    rows: list[str] = []
    for j in sorted(jobs, key=lambda x: x.get("ai_score") or 0, reverse=True):
        rows.append(
            f"""
        <div style="border:1px solid #2a2f3e;border-radius:10px;padding:14px;margin-bottom:10px;background:#0f1320">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:start">
            <h3 style="margin:0;font-size:15px;color:#f5f7ff">{_esc(j.get('title',''))}</h3>
            <span style="font-family:'Fira Code',monospace;color:#22c55e;font-weight:600;white-space:nowrap">{_esc(j.get('ai_score','?'))}/100</span>
          </div>
          <p style="margin:6px 0;color:#9aa3b8;font-size:12px">
            {_esc(j.get('company') or '—')} · {_esc(j.get('location') or '—')} ·
            <span style="font-family:'Fira Code',monospace">{_esc(j.get('source_slug',''))}</span>
            {f" · {_esc(j.get('salary'))}" if j.get('salary') else ""}
          </p>
          <p style="margin:6px 0 10px;color:#cdd5e0;font-size:13px">{_esc(j.get('ai_reason',''))}</p>
          <a href="{_esc(j.get('url',''))}" style="background:#22c55e;color:#04130a;padding:8px 12px;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;display:inline-block">View posting →</a>
        </div>"""
        )
    html = f"""
    <div style="font-family:'Fira Sans',system-ui,sans-serif;max-width:680px;margin:0 auto;background:#020617;color:#f5f7ff;padding:18px">
      <h1 style="margin:0 0 6px;font-size:18px">JobHunter · {_esc(slug)} digest</h1>
      <p style="margin:0 0 16px;color:#9aa3b8;font-size:13px">
        {n} relevant job{'s' if n != 1 else ''} for {_esc(profile.get('name',''))}.
      </p>
      {''.join(rows)}
      <p style="margin-top:20px;color:#5b6478;font-size:11px;font-family:'Fira Code',monospace">
        Sent only to {_esc(profile.get('notify_email',''))} · jobhunter
      </p>
    </div>
    """
    return subject, html


def format_digest_telegram(jobs: list[dict[str, Any]], profile: dict[str, Any]) -> str:
    """One Telegram message per profile, top-N relevant jobs."""
    slug = profile.get("slug", "").upper()
    n = len(jobs)
    lines = [f"<b>JobHunter · {slug}</b> · {n} new relevant"]
    for j in sorted(jobs, key=lambda x: x.get("ai_score") or 0, reverse=True)[:10]:
        score = j.get("ai_score", "?")
        title = (j.get("title") or "")[:90]
        company = j.get("company") or j.get("source_slug", "")
        lines.append(
            f"\n<b>{score}/100</b> · {_esc(title)}\n"
            f"<i>{_esc(company)}</i> · {_esc(j.get('location','—'))}\n"
            f"{_esc((j.get('ai_reason') or '')[:160])}\n"
            f"{j.get('url','')}"
        )
    if n > 10:
        lines.append(f"\n…and {n - 10} more.")
    return "\n".join(lines)
