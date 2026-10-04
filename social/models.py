from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Follow(models.Model):
    """One row = 'follower follows following'.

    Reverse names (handy for counting):
        user.following -> Follow rows where this user is the follower
        user.followers -> Follow rows where this user is being followed
    """

    follower = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="following")
    following = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="followers")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            # Database-level guard against duplicate follows.
            models.UniqueConstraint(fields=["follower", "following"], name="unique_follow"),
        ]

    def clean(self):
        if self.follower_id and self.follower_id == self.following_id:
            raise ValidationError("You cannot follow yourself.")

    def save(self, *args, **kwargs):
        self.clean()  # also blocks self-follow from the admin / shell
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.follower} follows {self.following}"
