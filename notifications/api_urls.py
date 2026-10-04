from django.urls import path

from . import api_views

urlpatterns = [
    path("notifications/", api_views.NotificationListView.as_view(), name="api-notifications"),
    path("notifications/unread-count/", api_views.UnreadCountView.as_view(), name="api-notifications-unread"),
    path("notifications/mark-all-read/", api_views.MarkAllReadView.as_view(), name="api-notifications-read-all"),
    path("notifications/<int:pk>/read/", api_views.MarkReadView.as_view(), name="api-notifications-read"),
]
