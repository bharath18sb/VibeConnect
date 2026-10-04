"""Tiny helper functions so the other apps never build Notification rows by hand."""
from .models import Notification


def notify(recipient, sender, notif_type, post=None):
    """Create a notification. Never notify people about their own actions."""
    if recipient == sender:
        return None
    if notif_type == Notification.Type.COMMENT:
        # Every comment deserves its own notification.
        return Notification.objects.create(recipient=recipient, sender=sender, type=notif_type, post=post)
    # Likes/follows: at most one notification per (sender, recipient, post).
    obj, _ = Notification.objects.get_or_create(recipient=recipient, sender=sender, type=notif_type, post=post)
    return obj


def remove_notification(recipient, sender, notif_type, post=None):
    """Called on unlike/unfollow so stale notifications disappear."""
    Notification.objects.filter(recipient=recipient, sender=sender, type=notif_type, post=post).delete()
