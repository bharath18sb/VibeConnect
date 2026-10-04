from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, render

from .models import Post


@login_required
def home(request):
    return render(request, "posts/home.html")


@login_required
def bookmarks_page(request):
    return render(request, "posts/bookmarks.html")


@login_required
def post_detail(request, pk):
    post = get_object_or_404(Post, pk=pk)
    return render(request, "posts/post_detail.html", {"post": post})
