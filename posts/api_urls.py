from django.urls import include, path
from rest_framework.routers import SimpleRouter

from . import api_views

router = SimpleRouter()
router.register("posts", api_views.PostViewSet, basename="post")

urlpatterns = [
    path("", include(router.urls)),
    path("comments/<int:pk>/", api_views.CommentDeleteView.as_view(), name="api-comment-delete"),
    path("bookmarks/", api_views.BookmarkListView.as_view(), name="api-bookmarks"),
]
