from django.urls import path

from . import api_views

urlpatterns = [
    path("me/", api_views.MeView.as_view(), name="api-me"),
    path("users/<str:username>/", api_views.UserDetailView.as_view(), name="api-user"),
]
