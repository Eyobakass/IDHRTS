"""Dispute workflow helpers: state machine and appeal-window arithmetic."""
import logging
from datetime import date, timedelta

from django.conf import settings

logger = logging.getLogger(__name__)

# FR-DISP-003: the only valid forward transitions of the dispute lifecycle.
ALLOWED_TRANSITIONS = {
    'FILED': {'UNDER_REVIEW'},
    'UNDER_REVIEW': {'DECISION_ISSUED'},
    'DECISION_ISSUED': {'APPEALED', 'CLOSED'},
    'APPEALED': {'CLOSED'},
    'CLOSED': set(),
}

# FR-DISP-005/006: appeals are open for 15 working days after the ruling.
APPEAL_WINDOW_WORKING_DAYS = 15
APPEAL_WINDOW_CLOSED_MESSAGE = 'The 15-working-day appeal window has closed.'


def can_transition(current_status, target_status):
    return target_status in ALLOWED_TRANSITIONS.get(current_status, set())


def transition_error(current_status, target_status):
    return (
        f"Invalid transition: a dispute in {current_status} cannot move to "
        f"{target_status}."
    )


def public_holidays():
    """
    Addis Ababa public holidays excluded from the working-day count. Supplied as
    ISO dates in the PUBLIC_HOLIDAYS environment variable; unparseable entries
    are logged and ignored rather than breaking the deadline calculation.
    """
    holidays = set()
    for entry in getattr(settings, 'PUBLIC_HOLIDAYS', []):
        try:
            holidays.add(date.fromisoformat(entry))
        except (TypeError, ValueError):
            logger.warning("Ignoring malformed PUBLIC_HOLIDAYS entry: %s", entry)
    return holidays


def add_working_days(start_date, working_days, holidays=None):
    """Advance `start_date` by N working days (Mon-Fri, excluding holidays)."""
    holidays = public_holidays() if holidays is None else set(holidays)
    current = start_date
    remaining = working_days
    while remaining > 0:
        current += timedelta(days=1)
        if current.weekday() >= 5 or current in holidays:
            continue
        remaining -= 1
    return current


def appeal_deadline_for(ruling_at):
    """FR-DISP-005: 15 working days after the ruling date."""
    ruling_date = ruling_at.date() if hasattr(ruling_at, 'date') else ruling_at
    return add_working_days(ruling_date, APPEAL_WINDOW_WORKING_DAYS)


def appeal_window_open(dispute, today=None):
    if not dispute.appeal_deadline:
        return True
    today = today or date.today()
    return today <= dispute.appeal_deadline


def dispute_parties(dispute):
    return [party for party in (dispute.filer, dispute.respondent) if party]


def notify_status_change(dispute, recipients, message_en, message_am):
    """FR-DISP-008: SMS + in-app notification on every dispute status change."""
    from notifications.utils import notify

    for recipient in recipients:
        notify(
            recipient, 'DISPUTE_UPDATE', message_en, message_am,
            related_record_type='Dispute', related_record_id=dispute.id,
        )
