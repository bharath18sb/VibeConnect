from django.contrib import admin

from .models import Bookmark, Comment, Like, Post


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "author", "short_content", "has_image", "created_at")
    list_filter = ("created_at",)
    search_fields = ("content", "author__username")
    date_hierarchy = "created_at"

    @admin.display(description="Content")
    def short_content(self, obj):
        return obj.content[:60]

    @admin.display(boolean=True, description="Image?")
    def has_image(self, obj):
        return bool(obj.image)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "author", "content", "created_at")
    search_fields = ("content", "author__username")


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "user", "created_at")


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "post", "created_at")
