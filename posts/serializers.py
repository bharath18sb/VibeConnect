from rest_framework import serializers

from accounts.serializers import UserMiniSerializer

from .models import Bookmark, Comment, Like, Post

MAX_IMAGE_MB = 5


class PostSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)
    content = serializers.CharField(max_length=500, required=False, allow_blank=True)
    image = serializers.ImageField(required=False, allow_null=True)
    remove_image = serializers.BooleanField(write_only=True, required=False)

    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    is_edited = serializers.BooleanField(read_only=True)

    class Meta:
        model = Post
        fields = [
            "id", "author", "content", "image", "remove_image", "created_at", "updated_at",
            "is_edited", "like_count", "comment_count", "is_liked", "is_bookmarked", "is_owner",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    # -- computed fields: use the annotated value when present (list views), otherwise query
    def _user(self):
        return self.context["request"].user

    def get_like_count(self, obj):
        return obj.like_count if hasattr(obj, "like_count") else obj.likes.count()

    def get_comment_count(self, obj):
        return obj.comment_count if hasattr(obj, "comment_count") else obj.comments.count()

    def get_is_liked(self, obj):
        if hasattr(obj, "is_liked"):
            return obj.is_liked
        return Like.objects.filter(post=obj, user=self._user()).exists()

    def get_is_bookmarked(self, obj):
        if hasattr(obj, "is_bookmarked"):
            return obj.is_bookmarked
        return Bookmark.objects.filter(post=obj, user=self._user()).exists()

    def get_is_owner(self, obj):
        return obj.author_id == self._user().id

    # -- validation
    def validate_content(self, value):
        return value.strip()

    def validate_image(self, image):
        if image and image.size > MAX_IMAGE_MB * 1024 * 1024:
            raise serializers.ValidationError(f"Image must be smaller than {MAX_IMAGE_MB} MB.")
        return image

    def validate(self, attrs):
        """A post must contain text or an image (or both)."""
        remove = attrs.get("remove_image", False)
        content = attrs.get("content", self.instance.content if self.instance else "")
        if "image" in attrs:
            image = attrs["image"]
        elif remove:
            image = None
        else:
            image = self.instance.image if self.instance else None
        if not content and not image:
            raise serializers.ValidationError("A post needs some text or an image.")
        return attrs

    # -- create / update
    def create(self, validated_data):
        validated_data.pop("remove_image", None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        remove = validated_data.pop("remove_image", False)
        new_image = validated_data.get("image")
        if (remove or new_image) and instance.image:
            instance.image.delete(save=False)  # delete the old file from disk
            if remove and not new_image:
                instance.image = None
        return super().update(instance, validated_data)


class CommentSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)
    content = serializers.CharField(max_length=300)
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "author", "content", "created_at", "is_owner"]
        read_only_fields = ["id", "created_at"]

    def validate_content(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Comment cannot be empty.")
        return value

    def get_is_owner(self, obj):
        return obj.author_id == self.context["request"].user.id
