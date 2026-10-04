"""
python manage.py seed_demo

Creates a few demo users, follows, posts, likes and comments so you can try the
app straight away. Safe to run more than once (it never creates duplicates).
All demo accounts use the password:  vibe12345
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from posts.models import Comment, Like, Post
from social.models import Follow
from notifications.services import notify

User = get_user_model()

DEMO_USERS = [
    ("maya", "Maya Rao", "Coffee, code and long walks. Building things in Bengaluru."),
    ("arjun", "Arjun Mehta", "Photographer. Chasing golden hour."),
    ("sara", "Sara Khan", "Reading one book a week. #bookclub"),
    ("leo", "Leo Fernandes", "Guitar, gaming and good food."),
]

DEMO_POSTS = {
    "maya": ["Just shipped my first Django project! #django #python", "Rainy Bengaluru evenings call for filter coffee."],
    "arjun": ["Golden hour never gets old. What is your favourite time of day to shoot?"],
    "sara": ["Finished a great novel today. Recommendations for the next one? @leo"],
    "leo": ["New riff learned. Practice makes progress. #guitar"],
}


class Command(BaseCommand):
    help = "Create demo users, posts, follows, likes and comments."

    def handle(self, *args, **options):
        users = {}
        for username, full_name, bio in DEMO_USERS:
            first, _, last = full_name.partition(" ")
            user, created = User.objects.get_or_create(
                username=username,
                defaults={"first_name": first, "last_name": last, "email": f"{username}@example.com"},
            )
            if created:
                user.set_password("vibe12345")
                user.save()
            user.profile.bio = bio
            user.profile.save()
            users[username] = user

        for username, texts in DEMO_POSTS.items():
            for text in texts:
                Post.objects.get_or_create(author=users[username], content=text)

        pairs = [("maya", "arjun"), ("maya", "sara"), ("arjun", "maya"), ("sara", "leo"), ("leo", "maya")]
        for a, b in pairs:
            _, created = Follow.objects.get_or_create(follower=users[a], following=users[b])
            if created:
                notify(users[b], users[a], "follow")

        first_post = Post.objects.filter(author=users["maya"]).order_by("created_at").first()
        if first_post:
            for name in ("arjun", "sara", "leo"):
                _, created = Like.objects.get_or_create(post=first_post, user=users[name])
                if created:
                    notify(first_post.author, users[name], "like", first_post)
            if not Comment.objects.filter(post=first_post).exists():
                Comment.objects.create(post=first_post, author=users["arjun"], content="Congrats Maya! 🎉")
                notify(first_post.author, users["arjun"], "comment", first_post)

        self.stdout.write(self.style.SUCCESS(
            "Demo data ready. Log in as maya / arjun / sara / leo with password: vibe12345"
        ))
