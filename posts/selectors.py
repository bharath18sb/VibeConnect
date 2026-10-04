"""Reusable queryset helpers (kept out of views so views stay short)."""
from django.db.models import Count, Exists, OuterRef

from .models import Bookmark, Like


def annotate_posts(queryset, user):
    """Add like_count, comment_count, is_liked, is_bookmarked to each post in ONE query."""
    return queryset.select_related("author", "author__profile").annotate(
        like_count=Count("likes", distinct=True),
        comment_count=Count("comments", distinct=True),
        is_liked=Exists(Like.objects.filter(post=OuterRef("pk"), user=user)),
        is_bookmarked=Exists(Bookmark.objects.filter(post=OuterRef("pk"), user=user)),
    )
