from django.contrib.auth import get_user_model
from rest_framework.generics import RetrieveAPIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Profile
from .serializers import ProfileUpdateSerializer, UserSerializer

User = get_user_model()


class MeView(APIView):
    """GET /api/me/   -> the logged-in user.
    PATCH /api/me/ -> edit own name, bio and profile picture."""

    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        return Response(UserSerializer(request.user, context={"request": request}).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = request.user
        profile, _ = Profile.objects.get_or_create(user=user)

        if "full_name" in data:
            first, _, last = data["full_name"].strip().partition(" ")
            user.first_name, user.last_name = first, last.strip()
            user.save()
        if "bio" in data:
            profile.bio = data["bio"].strip()

        if data.get("remove_image") and profile.profile_image:
            profile.profile_image.delete(save=False)
            profile.profile_image = None
        if "profile_image" in data:
            if profile.profile_image:
                profile.profile_image.delete(save=False)  # drop the old file
            profile.profile_image = data["profile_image"]
        profile.save()

        return Response(UserSerializer(user, context={"request": request}).data)


class UserDetailView(RetrieveAPIView):
    """GET /api/users/<username>/ -> any user's public profile."""

    serializer_class = UserSerializer
    queryset = User.objects.select_related("profile")
    lookup_field = "username"
