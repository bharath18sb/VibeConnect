from django.conf import settings
from django.db import models


class Profile(models.Model):
    """Extra info for each user. The name/username/password live on Django's User."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    bio = models.CharField(max_length=300, blank=True)
    profile_image = models.ImageField(upload_to="profiles/", blank=True, null=True)

    def __str__(self):
        return f"Profile of {self.user.username}"
