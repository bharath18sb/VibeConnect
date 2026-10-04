from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """5 items per page by default; the client may ask for ?page_size=N (max 50)."""

    page_size = 5
    page_size_query_param = "page_size"
    max_page_size = 50
