from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.serializers import UserSerializer
from notifications.models import Notification
from notifications.services import notify, remove_notification

from .models import Follow

User = get_user_model()


def follow_state(me, target):
    return {
        "is_following": Follow.objects.filter(follower=me, following=target).exists(),
        "followers_count": target.followers.count(),
        "following_count": target.following.count(),
    }


class FollowView(APIView):
    """POST /api/users/<username>/follow/   -> follow
    DELETE /api/users/<username>/follow/ -> unfollow"""

    def post(self, request, username):
        target = get_object_or_404(User, username=username)
        if target == request.user:
            return Response({"detail": "You cannot follow yourself."}, status=status.HTTP_400_BAD_REQUEST)
        # get_or_create + the unique constraint = no duplicate follows.
        _, created = Follow.objects.get_or_create(follower=request.user, following=target)
        if created:
            notify(target, request.user, Notification.Type.FOLLOW)
        return Response(follow_state(request.user, target), status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def delete(self, request, username):
        target = get_object_or_404(User, username=username)
        Follow.objects.filter(follower=request.user, following=target).delete()
        remove_notification(target, request.user, Notification.Type.FOLLOW)
        return Response(follow_state(request.user, target))


class FollowersListView(ListAPIView):
    """GET /api/users/<username>/followers/ -> people who follow <username>"""

    serializer_class = UserSerializer

    def get_queryset(self):
        target = get_object_or_404(User, username=self.kwargs["username"])
        return User.objects.filter(following__following=target).select_related("profile").order_by("username")


class FollowingListView(ListAPIView):
    """GET /api/users/<username>/following/ -> people <username> follows"""

    serializer_class = UserSerializer

    def get_queryset(self):
        target = get_object_or_404(User, username=self.kwargs["username"])
        return User.objects.filter(followers__follower=target).select_related("profile").order_by("username")


class SearchUsersView(ListAPIView):
    """GET /api/search/?q=maya -> users whose username or name contains every word typed."""

    serializer_class = UserSerializer

    def get_queryset(self):
        q = self.request.query_params.get("q", "").strip()
        if not q:
            return User.objects.none()
        users = User.objects.filter(is_active=True).select_related("profile")
        for term in q.split():
            users = users.filter(
                Q(username__icontains=term) | Q(first_name__icontains=term) | Q(last_name__icontains=term)
            )
        return users.order_by("username")


class SuggestionsView(APIView):
    """GET /api/suggestions/ -> up to 5 random people you don't follow yet."""

    def get(self, request):
        users = (
            User.objects.filter(is_active=True)
            .exclude(pk=request.user.pk)
            .exclude(followers__follower=request.user)
            .select_related("profile")
            .order_by("?")[:5]
        )
        return Response(UserSerializer(users, many=True, context={"request": request}).data)
