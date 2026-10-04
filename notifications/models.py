from django.conf import settings
from django.db import models


class Notification(models.Model):
    """'sender did <type> to recipient' (optionally about a post)."""

    class Type(models.TextChoices):
        FOLLOW = "follow", "Follow"
        LIKE = "like", "Like"
        COMMENT = "comment", "Comment"

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_notifications")
    type = models.CharField(max_length=10, choices=Type.choices)
    post = models.ForeignKey("posts.Post", on_delete=models.CASCADE, null=True, blank=True, related_name="notifications")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.sender} -> {self.recipient}: {self.type}"
