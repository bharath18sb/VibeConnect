from .models import Profile


def my_profile(request):
    """Makes `my_profile` available in every template (used for the navbar avatar)."""
    if request.user.is_authenticated:
        profile, _ = Profile.objects.get_or_create(user=request.user)
        return {"my_profile": profile}
    return {}
