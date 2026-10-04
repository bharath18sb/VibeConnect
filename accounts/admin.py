from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Profile

User = get_user_model()


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False


class UserAdmin(BaseUserAdmin):
    """Django's normal user admin plus the Profile editable on the same page."""

    inlines = [ProfileInline]
    list_display = ("username", "email", "first_name", "last_name", "is_staff", "date_joined")

    def get_inline_instances(self, request, obj=None):
        # On the "add user" page the Profile is created automatically by a signal,
        # so showing the inline there would try to create it twice.
        return super().get_inline_instances(request, obj) if obj else []


admin.site.unregister(User)
admin.site.register(User, UserAdmin)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "bio")
    search_fields = ("user__username", "bio")
