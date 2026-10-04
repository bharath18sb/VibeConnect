"""Root URL configuration. Page URLs come first, JSON API URLs live under /api/."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    # HTML pages
    path("", include("accounts.urls")),
    path("", include("posts.urls")),
    path("", include("social.urls")),
    path("", include("notifications.urls")),
    # JSON API (Django REST Framework)
    path("api/", include("accounts.api_urls")),
    path("api/", include("posts.api_urls")),
    path("api/", include("social.api_urls")),
    path("api/", include("notifications.api_urls")),
]

# Serve uploaded images while developing (DEBUG=True only).
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
