from rest_framework.permissions import BasePermission


class IsAuthor(BasePermission):
    """Only the author of an object may edit or delete it."""

    message = "You can only change your own posts."

    def has_object_permission(self, request, view, obj):
        return obj.author_id == request.user.id
