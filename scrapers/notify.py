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


def format_job_email(job: dict[str, Any], profile: dict[str, Any]) -> tuple[str, str]:
    subject = f"[JobHunter:{profile.get('slug','')}] {job.get('title','')[:80]} — {job.get('company') or job.get('source_slug')}"
    html = f"""
    <div style="font-family:system-ui,sans-serif;max-width:640px">
      <h2 style="margin:0 0 8px">{job.get('title','')}</h2>
      <p style="color:#666;margin:0 0 12px">{job.get('company') or '—'} · {job.get('location') or '—'} · {job.get('source_slug','')}</p>
      <p><b>Why relevant:</b> {job.get('ai_reason','')}</p>
      <p><b>Score:</b> {job.get('ai_score','')}/100</p>
      <p><b>Salary:</b> {job.get('salary') or '—'}</p>
      <p><a href="{job.get('url','')}" style="background:#000;color:#fff;padding:10px 14px;text-decoration:none;border-radius:6px;display:inline-block">View posting →</a></p>
      <hr>
      <pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;color:#444;font-size:13px">{(job.get('description') or '')[:1500]}</pre>
    </div>
    """
    return subject, html


def format_job_telegram(job: dict[str, Any], profile: dict[str, Any]) -> str:
    return (
        f"<b>[{profile.get('slug','').upper()}] {job.get('title','')[:120]}</b>\n"
        f"{job.get('company') or '—'} · {job.get('location') or '—'} · <i>{job.get('source_slug','')}</i>\n"
        f"Score: {job.get('ai_score','')}/100\n"
        f"{job.get('ai_reason','')}\n\n"
        f"{job.get('url','')}"
    )
