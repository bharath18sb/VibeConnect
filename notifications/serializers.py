from rest_framework import serializers

from accounts.serializers import UserMiniSerializer

from .models import Notification

MESSAGES = {
    Notification.Type.FOLLOW: "started following you",
    Notification.Type.LIKE: "liked your post",
    Notification.Type.COMMENT: "commented on your post",
}


class NotificationSerializer(serializers.ModelSerializer):
    sender = UserMiniSerializer(read_only=True)
    message = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()
    post_excerpt = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ["id", "sender", "type", "message", "url", "post", "post_excerpt", "is_read", "created_at"]

    def get_message(self, obj):
        return MESSAGES.get(obj.type, "interacted with you")

    def get_url(self, obj):
        if obj.post_id:
            return f"/post/{obj.post_id}/"
        return f"/u/{obj.sender.username}/"

    def get_post_excerpt(self, obj):
        if obj.post_id:
            text = obj.post.content or "[photo]"
            return text[:60] + ("…" if len(text) > 60 else "")
        return ""
