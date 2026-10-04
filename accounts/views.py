from django.contrib.auth import get_user_model, login
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render

from .forms import RegisterForm

User = get_user_model()


def register(request):
    """Sign-up page. On success the user is logged in and sent to the home feed."""
    if request.user.is_authenticated:
        return redirect("home")
    form = RegisterForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.save()
        login(request, user)
        return redirect("home")
    return render(request, "accounts/register.html", {"form": form})


@login_required
def profile_page(request, username):
    """HTML shell for a profile; the details and posts are loaded by JS from the API."""
    profile_user = get_object_or_404(User, username=username)
    return render(request, "accounts/profile.html", {"profile_user": profile_user})
