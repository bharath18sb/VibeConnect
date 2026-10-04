from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(ListAPIView):
    """GET /api/notifications/ -> my notifications, newest first (paginated)."""

    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).select_related(
            "sender", "sender__profile", "post"
        )


class UnreadCountView(APIView):
    """GET /api/notifications/unread-count/ -> {"unread_count": 3}"""

    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({"unread_count": count})


class MarkAllReadView(APIView):
    """POST /api/notifications/mark-all-read/"""

    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"unread_count": 0})


class MarkReadView(APIView):
    """POST /api/notifications/<id>/read/"""

    def post(self, request, pk):
        Notification.objects.filter(pk=pk, recipient=request.user).update(is_read=True)
        unread = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({"unread_count": unread})
