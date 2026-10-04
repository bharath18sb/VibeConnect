from django.urls import path

from . import api_views

urlpatterns = [
    path("users/<str:username>/follow/", api_views.FollowView.as_view(), name="api-follow"),
    path("users/<str:username>/followers/", api_views.FollowersListView.as_view(), name="api-followers"),
    path("users/<str:username>/following/", api_views.FollowingListView.as_view(), name="api-following"),
    path("search/", api_views.SearchUsersView.as_view(), name="api-search"),
    path("suggestions/", api_views.SuggestionsView.as_view(), name="api-suggestions"),
]
