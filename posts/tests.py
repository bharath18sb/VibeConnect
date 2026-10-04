"""Run with:  python manage.py test"""
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from notifications.models import Notification
from social.models import Follow

from .models import Like, Post

User = get_user_model()


class VibeConnectApiTests(TestCase):
    def setUp(self):
        self.alice = User.objects.create_user("alice", password="pass12345")
        self.bob = User.objects.create_user("bob", password="pass12345")
        self.carol = User.objects.create_user("carol", password="pass12345")
        self.api = APIClient()
        self.api.force_authenticate(self.alice)

    def test_profile_is_created_automatically(self):
        self.assertTrue(hasattr(self.alice, "profile"))

    def test_cannot_follow_yourself(self):
        response = self.api.post("/api/users/alice/follow/")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Follow.objects.count(), 0)

    def test_follow_twice_creates_one_follow_and_one_notification(self):
        self.api.post("/api/users/bob/follow/")
        self.api.post("/api/users/bob/follow/")
        self.assertEqual(Follow.objects.filter(follower=self.alice, following=self.bob).count(), 1)
        self.assertEqual(Notification.objects.filter(recipient=self.bob, type="follow").count(), 1)

    def test_unfollow_removes_follow(self):
        self.api.post("/api/users/bob/follow/")
        self.api.delete("/api/users/bob/follow/")
        self.assertEqual(Follow.objects.count(), 0)

    def test_like_is_unique_and_notifies_author(self):
        post = Post.objects.create(author=self.bob, content="hello")
        self.api.post(f"/api/posts/{post.id}/like/")
        response = self.api.post(f"/api/posts/{post.id}/like/")
        self.assertEqual(Like.objects.count(), 1)
        self.assertEqual(response.data["like_count"], 1)
        self.assertEqual(Notification.objects.filter(recipient=self.bob, type="like").count(), 1)

    def test_comment_creates_notification_and_only_owner_can_delete(self):
        post = Post.objects.create(author=self.bob, content="hello")
        created = self.api.post(f"/api/posts/{post.id}/comments/", {"content": "nice"}, format="json")
        self.assertEqual(created.status_code, 201)
        self.assertEqual(Notification.objects.filter(recipient=self.bob, type="comment").count(), 1)

        comment_id = created.data["comment"]["id"]
        other = APIClient()
        other.force_authenticate(self.bob)
        self.assertEqual(other.delete(f"/api/comments/{comment_id}/").status_code, 403)
        self.assertEqual(self.api.delete(f"/api/comments/{comment_id}/").status_code, 200)

    def test_home_feed_shows_own_and_followed_posts_only(self):
        Post.objects.create(author=self.alice, content="mine")
        Post.objects.create(author=self.bob, content="bobs")
        Post.objects.create(author=self.carol, content="carols")
        Follow.objects.create(follower=self.alice, following=self.bob)
        response = self.api.get("/api/posts/?feed=home")
        texts = [p["content"] for p in response.data["results"]]
        self.assertCountEqual(texts, ["mine", "bobs"])

    def test_only_author_can_delete_post(self):
        post = Post.objects.create(author=self.bob, content="bobs")
        self.assertEqual(self.api.delete(f"/api/posts/{post.id}/").status_code, 403)
        self.assertTrue(Post.objects.filter(pk=post.pk).exists())

    def test_empty_post_is_rejected(self):
        response = self.api.post("/api/posts/", {"content": "   "}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_search_finds_by_name_and_username(self):
        self.bob.first_name, self.bob.last_name = "Bobby", "Tables"
        self.bob.save()
        by_name = self.api.get("/api/search/?q=tables")
        by_username = self.api.get("/api/search/?q=bo")
        self.assertEqual([u["username"] for u in by_name.data["results"]], ["bob"])
        self.assertIn("bob", [u["username"] for u in by_username.data["results"]])
