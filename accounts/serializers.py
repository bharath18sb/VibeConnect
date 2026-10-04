from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()
MAX_IMAGE_MB = 3


def _profile_image_url(user):
    profile = getattr(user, "profile", None)  # None if the profile row is missing
    if profile and profile.profile_image:
        return profile.profile_image.url
    return None


class UserMiniSerializer(serializers.ModelSerializer):
    """Small user card used inside posts, comments and notifications."""

    full_name = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "full_name", "profile_image"]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_profile_image(self, obj):
        return _profile_image_url(obj)


class UserSerializer(UserMiniSerializer):
    """Full public profile, including counters and the 'am I following them?' flag."""

    bio = serializers.SerializerMethodField()
    raw_full_name = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    is_me = serializers.SerializerMethodField()

    class Meta(UserMiniSerializer.Meta):
        fields = UserMiniSerializer.Meta.fields + [
            "bio", "raw_full_name", "date_joined", "followers_count",
            "following_count", "posts_count", "is_following", "is_me",
        ]

    def _me(self):
        request = self.context.get("request")
        return request.user if request else None

    def get_bio(self, obj):
        profile = getattr(obj, "profile", None)
        return profile.bio if profile else ""

    def get_raw_full_name(self, obj):
        return obj.get_full_name()

    def get_followers_count(self, obj):
        return obj.followers.count()  # Follow rows where `following` is this user

    def get_following_count(self, obj):
        return obj.following.count()  # Follow rows where `follower` is this user

    def get_posts_count(self, obj):
        return obj.posts.count()

    def get_is_following(self, obj):
        me = self._me()
        if not me or me == obj:
            return False
        return obj.followers.filter(follower=me).exists()

    def get_is_me(self, obj):
        return self._me() == obj


class ProfileUpdateSerializer(serializers.Serializer):
    """Validates the 'Edit profile' form (works with JSON or multipart uploads)."""

    full_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    bio = serializers.CharField(max_length=300, required=False, allow_blank=True)
    profile_image = serializers.ImageField(required=False)
    remove_image = serializers.BooleanField(required=False)

    def validate_profile_image(self, image):
        if image.size > MAX_IMAGE_MB * 1024 * 1024:
            raise serializers.ValidationError(f"Image must be smaller than {MAX_IMAGE_MB} MB.")
        return image
