from django.contrib.auth.decorators import login_required
from django.shortcuts import render


@login_required
def search_page(request):
    return render(request, "social/search.html", {"q": request.GET.get("q", "")})
