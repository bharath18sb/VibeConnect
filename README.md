# VibeConnect

A mini social-media website built with **Django + Django REST Framework**, **SQLite** and **vanilla HTML / CSS / JavaScript** (no React, Vue, Angular, Node or Express).

Users can sign up, post text/images, like, comment, follow each other, search people, save posts and get notifications. Light/dark mode, toasts, loading skeletons, delete confirmations and a responsive layout are included.

---

## 1. Features

| Area | What you get |
|---|---|
| **Authentication** | Register, login, logout (Django built-in auth), PBKDF2-hashed passwords, every page and API endpoint protected |
| **Profiles** | Photo, full name, username, bio, followers/following counts, edit own profile, view anyone's profile |
| **Posts** | Text and/or image, edit & delete own posts, author + date + "edited" label, like/unlike with count |
| **Comments** | Add, list, delete own comments, live comment count |
| **Follow system** | Follow/unfollow, followers & following lists, no self-follow, no duplicate follow |
| **Home feed** | Own + followed users' posts, newest first, "Load more" pagination, plus an **Explore** tab (everyone) |
| **Search** | Live search (debounced) by username or name, Follow/Unfollow button on each result |
| **Notifications** | Follow / like / comment notifications, unread badge (auto-refreshes every 30 s), mark one / all as read |
| **Extras** | Bookmarks (Saved page), dark mode (saved in `localStorage`), toasts, skeleton loaders, delete confirmation dialog, double-click-to-like, `@mention` links, `#hashtag` highlighting, copy-post-link, "Who to follow" suggestions, image preview, character counters, animated login page, mobile bottom navigation |
| **Admin** | Users (with profile), posts, comments, likes, follows, bookmarks, notifications |

---

## 2. Quick start

Requires **Python 3.10+**.

```bash
# 1. (optional but recommended) create a virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 2. install dependencies
pip install -r requirements.txt

# 3. create the SQLite database
python manage.py migrate

# 4. (optional) add demo users and posts
python manage.py seed_demo

# 5. (optional) create an admin account for /admin/
python manage.py createsuperuser

# 6. run the server
python manage.py runserver
```

Open **http://127.0.0.1:8000/** and register, or log in with a demo account:

| Username | Password |
|---|---|
| `maya`, `arjun`, `sara`, `leo` | `vibe12345` |

Admin panel: http://127.0.0.1:8000/admin/

Run the automated tests with `python manage.py test`.

> If Django ever reports that model changes are not reflected in a migration, run `python manage.py makemigrations` and then `python manage.py migrate`.

---

## 3. Project structure

```
VibeConnect/
├── manage.py
├── requirements.txt
├── README.md
├── vibeconnect/              # project config
│   ├── settings.py           #   apps, database, auth, static/media, DRF
│   ├── urls.py               #   page URLs + /api/ URLs
│   └── pagination.py         #   5 items per page, ?page_size=N
├── accounts/                 # registration, login, Profile model, user API
│   ├── models.py             #   Profile (bio, profile_image)
│   ├── signals.py            #   auto-create Profile for every new User
│   ├── forms.py              #   RegisterForm / LoginForm
│   ├── views.py              #   register + profile page
│   ├── serializers.py        #   UserMini / User / ProfileUpdate serializers
│   ├── api_views.py          #   /api/me/ and /api/users/<username>/
│   └── management/commands/seed_demo.py
├── posts/                    # Post, Comment, Like, Bookmark
│   ├── models.py
│   ├── selectors.py          #   annotate like/comment counts in one query
│   ├── serializers.py
│   ├── permissions.py        #   IsAuthor
│   ├── api_views.py          #   PostViewSet (+like, bookmark, comments actions)
│   └── tests.py
├── social/                   # Follow model, follow/unfollow, search, suggestions
├── notifications/            # Notification model, helper service, API
├── templates/                # Django templates (base, auth, pages, partials)
├── static/
│   ├── css/style.css         #   design tokens, light/dark theme, animations
│   └── js/                   #   api.js, ui.js, postcard.js + one script per page
└── media/                    # uploaded profile pictures and post images
```

### How a request flows (good for a viva)

```
Browser (HTML page from Django template)
   │  JavaScript fetch()  +  session cookie  +  CSRF token
   ▼
Django URL router ──► DRF view / ViewSet ──► Serializer (validate + convert to JSON)
                                   │
                                   ▼
                          Django ORM ──► SQLite (db.sqlite3)
```

* **Pages** (`/`, `/u/<name>/`, `/search/` …) are normal Django views that only render a template shell.
* **Data** is loaded by JavaScript from the JSON API in `/api/…` using the Fetch API.
* **Security**: `login_required` on pages, `IsAuthenticated` on the API, CSRF token on every write request, `esc()` escaping of user text before it is inserted into the page, author-only permission for editing/deleting posts and comments.

---

## 4. Database models

```
User (Django) 1───1 Profile            bio, profile_image
User 1───* Post                        content, image, created_at, updated_at
Post 1───* Comment *───1 User          content, created_at
Post 1───* Like    *───1 User          created_at      UNIQUE(post, user)
User 1───* Bookmark *───1 Post         created_at      UNIQUE(user, post)
User 1───* Follow  *───1 User          follower → following   UNIQUE(follower, following)
Notification: recipient, sender, type (follow/like/comment), post (optional), is_read, created_at
```

Duplicate likes, bookmarks and follows are blocked **twice**: by a database `UniqueConstraint` and by `get_or_create()` in the API. Self-follow is blocked in `Follow.clean()/save()` and in the follow API.

---

## 5. REST API

All endpoints require login (session). Lists are paginated: `{count, next, previous, results}`.

| Method | URL | Purpose |
|---|---|---|
| GET / PATCH | `/api/me/` | Current user / edit own name, bio, photo |
| GET | `/api/users/<username>/` | Public profile |
| POST / DELETE | `/api/users/<username>/follow/` | Follow / unfollow |
| GET | `/api/users/<username>/followers/` | Followers list |
| GET | `/api/users/<username>/following/` | Following list |
| GET | `/api/search/?q=text` | Search users by username or name |
| GET | `/api/suggestions/` | "Who to follow" |
| GET | `/api/posts/?feed=home\|explore\|user&username=x` | Feed (home = own + followed) |
| POST | `/api/posts/` | Create post (JSON or multipart with `image`) |
| GET / PATCH / DELETE | `/api/posts/<id>/` | Read / edit / delete (edit & delete: author only) |
| POST / DELETE | `/api/posts/<id>/like/` | Like / unlike |
| POST / DELETE | `/api/posts/<id>/bookmark/` | Save / unsave |
| GET / POST | `/api/posts/<id>/comments/` | List / add comments |
| DELETE | `/api/comments/<id>/` | Delete own comment |
| GET | `/api/bookmarks/` | My saved posts |
| GET | `/api/notifications/` | My notifications |
| GET | `/api/notifications/unread-count/` | Number for the badge |
| POST | `/api/notifications/mark-all-read/` | Mark all read |
| POST | `/api/notifications/<id>/read/` | Mark one read |

Tip: while logged in, you can open any GET URL (e.g. `/api/posts/?feed=explore`) in the browser to see DRF's browsable API.

---

## 6. Frontend files

| File | Job |
|---|---|
| `api.js` | `fetch` wrapper: CSRF header, JSON/FormData, error messages |
| `ui.js` | toasts, modals, confirm dialog, theme toggle, avatars, follow buttons, unread badge |
| `postcard.js` | post card rendering + all post actions, and the `Feed` class (Load more) |
| `home.js`, `profile.js`, `search.js`, `notifications.js`, `bookmarks.js`, `post.js` | one script per page |

---

## 7. Viva cheat-sheet

* **Why DRF?** It gives serializers (validation + JSON), viewsets/routers (CRUD with little code), pagination and permissions.
* **How is auth done?** Django sessions. Passwords are hashed with PBKDF2-SHA256 + salt. The API reuses the session via `SessionAuthentication`, which is why JS sends the CSRF token.
* **How is the feed built?** `Post.objects.filter(Q(author=me) | Q(author_id__in=followed_ids))`, ordered by `-created_at`, then paginated.
* **How are like/comment counts computed efficiently?** `annotate(Count(...), Exists(...))` in `posts/selectors.py` – one SQL query for the whole page.
* **How do you prevent duplicates?** `UniqueConstraint` + `get_or_create`.
* **How does Load more work?** The API returns a `next` URL; the `Feed` class fetches it and appends cards.
* **Where does dark mode live?** CSS variables switch on `html[data-theme="dark"]`; the choice is stored in `localStorage` and applied before first paint.
* **XSS protection?** Django templates auto-escape; JavaScript escapes with `esc()` before using `innerHTML`.

---

## 8. Notes & ideas for extension

* Development settings are used by default (`DEBUG=True`). For deployment set `DJANGO_DEBUG=False`, `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, and serve `media/` with a real web server.
* The page loads the *Plus Jakarta Sans* font from Google Fonts; offline it falls back to the system font.
* Usernames cannot be changed after registration.
* Ideas: password reset by e-mail, hashtag pages, direct messages, WebSocket live notifications.
