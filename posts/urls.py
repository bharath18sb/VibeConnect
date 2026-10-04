from django.urls import path

from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("bookmarks/", views.bookmarks_page, name="bookmarks"),
    path("post/<int:pk>/", views.post_detail, name="post_detail"),
]
