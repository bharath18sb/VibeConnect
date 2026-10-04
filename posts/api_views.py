from django.db.models import OuterRef, Q, Subquery
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import ListAPIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.models import Notification
from notifications.services import notify, remove_notification
from social.models import Follow

from .models import Bookmark, Comment, Like, Post
from .permissions import IsAuthor
from .selectors import annotate_posts
from .serializers import CommentSerializer, PostSerializer


class PostViewSet(viewsets.ModelViewSet):
    """
    GET    /api/posts/?feed=home|explore|user&username=x   list (paginated)
    POST   /api/posts/                                     create
    GET    /api/posts/<id>/                                one post
    PATCH  /api/posts/<id>/                                edit (author only)
    DELETE /api/posts/<id>/                                delete (author only)
    POST/DELETE /api/posts/<id>/like/                      like / unlike
    POST/DELETE /api/posts/<id>/bookmark/                  save / unsave
    GET/POST    /api/posts/<id>/comments/                  list / add comments
    """

    serializer_class = PostSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ("update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsAuthor()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = annotate_posts(Post.objects.all(), user)
        if self.action != "list":
            return queryset

        feed = self.request.query_params.get("feed", "home")
        if feed == "home":  # my posts + posts of people I follow
            following_ids = Follow.objects.filter(follower=user).values_list("following_id", flat=True)
            queryset = queryset.filter(Q(author=user) | Q(author_id__in=following_ids))
        elif feed == "user":  # one person's profile page
            queryset = queryset.filter(author__username=self.request.query_params.get("username", ""))
        # feed == "explore": everyone's posts
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    # ---- likes -----------------------------------------------------------
    @action(detail=True, methods=["post", "delete"])
    def like(self, request, pk=None):
        post = self.get_object()
        if request.method == "POST":
            _, created = Like.objects.get_or_create(post=post, user=request.user)  # no duplicates
            if created:
                notify(post.author, request.user, Notification.Type.LIKE, post)
        else:
            Like.objects.filter(post=post, user=request.user).delete()
            remove_notification(post.author, request.user, Notification.Type.LIKE, post)
        return Response({"liked": request.method == "POST", "like_count": post.likes.count()})

    # ---- bookmarks -------------------------------------------------------
    @action(detail=True, methods=["post", "delete"])
    def bookmark(self, request, pk=None):
        post = self.get_object()
        if request.method == "POST":
            Bookmark.objects.get_or_create(post=post, user=request.user)
        else:
            Bookmark.objects.filter(post=post, user=request.user).delete()
        return Response({"bookmarked": request.method == "POST"})

    # ---- comments --------------------------------------------------------
    @action(detail=True, methods=["get", "post"])
    def comments(self, request, pk=None):
        post = self.get_object()
        context = {"request": request}
        if request.method == "GET":
            queryset = post.comments.select_related("author", "author__profile")
            return Response(CommentSerializer(queryset, many=True, context=context).data)

        serializer = CommentSerializer(data=request.data, context=context)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(post=post, author=request.user)
        notify(post.author, request.user, Notification.Type.COMMENT, post)
        return Response(
            {"comment": CommentSerializer(comment, context=context).data, "comment_count": post.comments.count()},
            status=status.HTTP_201_CREATED,
        )


class CommentDeleteView(APIView):
    """DELETE /api/comments/<id>/ -> delete my own comment."""

    def delete(self, request, pk):
        comment = get_object_or_404(Comment, pk=pk)
        if comment.author_id != request.user.id:
            return Response({"detail": "You can only delete your own comments."}, status=status.HTTP_403_FORBIDDEN)
        post = comment.post
        comment.delete()
        return Response({"comment_count": post.comments.count()})


class BookmarkListView(ListAPIView):
    """GET /api/bookmarks/ -> posts I saved, most recently saved first."""

    serializer_class = PostSerializer

    def get_queryset(self):
        user = self.request.user
        saved_at = Bookmark.objects.filter(post=OuterRef("pk"), user=user).values("created_at")[:1]
        return (
            annotate_posts(Post.objects.all(), user)
            .filter(is_bookmarked=True)
            .annotate(saved_at=Subquery(saved_at))
            .order_by("-saved_at")
        )
