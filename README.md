Yep bro 👍 Here is the **plain version**. Copy from `# 🌐 VibeConnect` all the way to the end and paste directly into `README.md`.

 # 🌐 VibeConnect — Mini Social Media Platform

 VibeConnect is a full-stack mini social-media web application built with **Django, Django REST Framework, SQLite, HTML, CSS and Vanilla JavaScript**.

 The application allows users to create posts, interact with other users, follow people, like and comment on posts, save posts, manage profiles and receive notifications.

 The project combines Django templates for page rendering with a REST API and JavaScript Fetch API for dynamic interactions.

---

 ## ✨ Features

 ### 👤 Authentication & Profiles

 - User registration and login
- Django session-based authentication
- Secure PBKDF2 password hashing
- User profiles
- Profile pictures
- Full name and username
- User bio
- Followers and following counts
- Edit own profile
- View other users' profiles
- Protected pages and API endpoints

 ### 📝 Posts

 - Create text posts
- Upload images
- Edit own posts
- Delete own posts
- Display author and creation date
- Edited indicator
- Like / unlike posts
- Like counter
- Double-click to like
- Copy post link
- @mentions
- #hashtags

 ### 💬 Comments

 - Add comments
- View comments
- Delete own comments
- Live comment count

 ### 🤝 Follow System

 - Follow users
- Unfollow users
- Followers list
- Following list
- Follow / unfollow from search
- Who to follow suggestions
- Prevent self-following
- Prevent duplicate follows

 ### 🏠 Home Feed

 - Personalized home feed
- Posts from followed users
- Own posts included
- Newest posts first
- Load-more pagination
- Explore feed containing posts from all users

 ### 🔎 Search

 - Search users by username
- Search users by name
- Debounced live search
- Follow / unfollow directly from search results

 ### 🔔 Notifications

 Users receive notifications for:

 - New followers
- Likes
- Comments

 Additional features:

 - Unread notification badge
- Automatic unread-count refresh
- Mark individual notification as read
- Mark all notifications as read

 ### 🔖 Bookmarks

 - Save posts
- Remove saved posts
- Dedicated saved posts page
- Duplicate bookmarks prevented

 ### 🎨 UI / UX

 - Responsive design
- Desktop, tablet and mobile support
- Light / dark mode
- Theme preference stored in localStorage
- Toast notifications
- Loading skeletons
- Confirmation dialogs
- Image preview
- Character counters
- Animated login page
- Mobile bottom navigation
- Responsive post cards

 ### 🛠️ Admin Panel

 Django Admin provides management for:

 - Users
- Profiles
- Posts
- Comments
- Likes
- Follows
- Bookmarks
- Notifications

---

 ## 🛠️ Tech Stack

 | Technology | Purpose |
| --- | --- |
| Python | Backend programming |
| Django | Web framework |
| Django REST Framework | REST API |
| SQLite | Database |
| HTML5 | Page structure |
| CSS3 | Styling and responsive design |
| JavaScript | Dynamic interactions |
| Django Templates | Page rendering |
| Fetch API | API communication |

No React, Vue, Angular, Node.js or Express is used.

---

 # 🚀 Quick Start

 ## Requirements

 - Python 3.10+
- pip
- Git

 ## 1\. Clone the repository

```
git clone https://github.com/YOUR_USERNAME/VibeConnect.git
cd VibeConnect
```

 ## 2\. Create a virtual environment

 ### Windows

```
python -m venv venv
venv\Scripts\activate
```

 ### macOS / Linux

```
python3 -m venv venv
source venv/bin/activate
```

 ## 3\. Install dependencies

```
pip install -r requirements.txt
```

 ## 4\. Create the database

```
python manage.py migrate
```

 ## 5\. Add demo data

 Optional:

```
python manage.py seed_demo
```

 ### Demo Accounts

 | Username | Password |
| --- | --- |
| maya | vibe12345 |
| arjun | vibe12345 |
| sara | vibe12345 |
| leo | vibe12345 |

## 6\. Create an admin account

 Optional:

```
python manage.py createsuperuser
```

 ## 7\. Run the application

```
python manage.py runserver
```

 Open:

 http://127.0.0.1:8000/

 Admin panel:

 http://127.0.0.1:8000/admin/

---

 # 🏗️ Project Structure

```
VibeConnect/
│
├── manage.py
├── requirements.txt
├── README.md
├── .gitignore
│
├── vibeconnect/
│   ├── settings.py
│   ├── urls.py
│   ├── pagination.py
│   └── ...
│
├── accounts/
│   ├── models.py
│   ├── forms.py
│   ├── views.py
│   ├── serializers.py
│   ├── api_views.py
│   ├── signals.py
│   └── management/
│       └── commands/
│           └── seed_demo.py
│
├── posts/
│   ├── models.py
│   ├── selectors.py
│   ├── serializers.py
│   ├── permissions.py
│   ├── api_views.py
│   └── tests.py
│
├── social/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   └── ...
│
├── notifications/
│   ├── models.py
│   ├── api_views.py
│   └── ...
│
├── templates/
│   ├── base.html
│   ├── auth/
│   ├── pages/
│   └── partials/
│
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js
│       ├── ui.js
│       ├── postcard.js
│       ├── home.js
│       ├── profile.js
│       ├── search.js
│       ├── notifications.js
│       ├── bookmarks.js
│       └── post.js
│
└── media/
```

---

 # 🔄 Application Architecture

 VibeConnect follows a Django + REST API architecture.

```
Browser
   │
   │ HTML + JavaScript
   ▼
Django URL Router
   │
   ├───────────────┐
   │               │
   ▼               ▼
Django Views    DRF API Views
   │               │
   │               ▼
   │           Serializers
   │               │
   └───────┬───────┘
           ▼
       Django ORM
           │
           ▼
         SQLite
```

 Django templates provide the page structure while JavaScript communicates with the REST API for dynamic functionality.

 The API handles:

 - Posts
- Likes
- Comments
- Followers
- Search
- Notifications
- Bookmarks
- User profiles

---

 # 🗄️ Database Models

 The main relationships are:

```
User
 │
 ├── Profile
 │
 ├── Post
 │    ├── Comment
 │    ├── Like
 │    └── Bookmark
 │
 ├── Follow
 │
 └── Notification
```

 ### User / Profile

 Stores authentication and profile information.

 ### Post

 Stores:

 - Content
- Image
- Author
- Creation date
- Updated date

 ### Comment

 Stores comments associated with posts and users.

 ### Like

 Stores which users liked which posts.

 Duplicate likes are prevented using database constraints.

 ### Bookmark

 Stores saved posts.

 Duplicate bookmarks are prevented using database constraints.

 ### Follow

 Stores follower → following relationships.

 Self-following and duplicate follows are prevented.

 ### Notification

 Stores:

 - Recipient
- Sender
- Notification type
- Related post
- Read/unread status
- Creation date

---

 # 🔌 REST API

 All API endpoints require an authenticated session.

 ## Authentication / Users

 | Method | Endpoint | Purpose |
| --- | --- | --- |
| GET / PATCH | /api/me/ | View/update current user |
| GET | /api/users/\<username\>/ | View public profile |
| POST / DELETE | /api/users/\<username\>/follow/ | Follow/unfollow |
| GET | /api/users/\<username\>/followers/ | Followers |
| GET | /api/users/\<username\>/following/ | Following |

## Search

 | Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | /api/search/?q=text | Search users |
| GET | /api/suggestions/ | Follow suggestions |

## Posts

 | Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | /api/posts/ | List posts |
| POST | /api/posts/ | Create post |
| GET | /api/posts/\<id\>/ | View post |
| PATCH | /api/posts/\<id\>/ | Edit post |
| DELETE | /api/posts/\<id\>/ | Delete post |
| POST / DELETE | /api/posts/\<id\>/like/ | Like/unlike |
| POST / DELETE | /api/posts/\<id\>/bookmark/ | Save/unsave |

## Comments

 | Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | /api/posts/\<id\>/comments/ | List comments |
| POST | /api/posts/\<id\>/comments/ | Add comment |
| DELETE | /api/comments/\<id\>/ | Delete own comment |

## Bookmarks

```
GET /api/bookmarks/
```

 Returns the current user's saved posts.

 ## Notifications

```
GET  /api/notifications/
GET  /api/notifications/unread-count/
POST /api/notifications/mark-all-read/
POST /api/notifications/<id>/read/
```

---

 # 🎨 Frontend

 The frontend uses:

 - HTML5
- CSS3
- Vanilla JavaScript
- Django Templates
- Fetch API
- CSS Variables
- Local Storage

 The project does not use:

 - React
- Vue
- Angular
- Node.js
- Express

---

 # 🔐 Security

 The project includes multiple security measures:

 - Django authentication
- Session-based authentication
- PBKDF2 password hashing
- CSRF protection
- login\_required for protected pages
- DRF IsAuthenticated protection
- Author-only permissions
- Django ORM for database queries
- Database UniqueConstraint
- Django template auto-escaping
- JavaScript text escaping
- Self-follow prevention
- User-specific protected actions

---

 # 🌙 Dark Mode

 VibeConnect supports both light and dark themes.

 The theme is implemented using CSS variables.

 The selected theme is stored in browser localStorage, allowing the user's preference to persist between sessions.

---

 # 🧪 Testing

 Run the Django test suite with:

```
python manage.py test
```

 Django automatically discovers and runs the project's tests.

---

 # ⚙️ Useful Django Commands

 ### Start development server

```
python manage.py runserver
```

 ### Create migrations

```
python manage.py makemigrations
```

 ### Apply migrations

```
python manage.py migrate
```

 ### Create admin account

```
python manage.py createsuperuser
```

 ### Seed demo data

```
python manage.py seed_demo
```

 ### Run tests

```
python manage.py test
```

---

 # ⚙️ Configuration

 Development settings are used by default.

 For production deployment, configure environment variables such as:

```
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=your-secret-key
DJANGO_ALLOWED_HOSTS=your-domain.com
```

 Production deployments should also use:

 - PostgreSQL or another production database
- Proper static-file serving
- Production media storage
- HTTPS
- Secure cookies
- Production web server

---

 # 🧠 Viva / Interview Cheat Sheet

 ### Why Django?

 Django provides:

 - Authentication
- ORM
- Admin panel
- URL routing
- Security features
- Template system

 ### Why Django REST Framework?

 DRF provides:

 - Serializers
- API validation
- ViewSets
- Routers
- Pagination
- Permissions
- JSON responses

 ### How is authentication handled?

 Django session authentication is used.

 The browser maintains the session cookie while JavaScript sends the CSRF token with write requests.

 ### How is the feed generated?

 The home feed contains posts from the current user and users they follow.

 Posts are ordered by newest creation date.

 ### How are duplicate likes prevented?

 Duplicate likes are prevented using:

 - Database UniqueConstraint
- get\_or\_create()

 ### How are duplicate follows prevented?

 Duplicate follows are prevented using:

 - UniqueConstraint
- get\_or\_create()

 Self-following is also explicitly prevented.

 ### How does pagination work?

 The API returns paginated results containing:

 - count
- next
- previous
- results

 The frontend follows the next URL when loading additional posts.

 ### How is XSS protection handled?

 Django templates automatically escape user content.

 JavaScript also escapes user-generated text before inserting it into HTML.

---

 # 🔮 Future Improvements

 Possible future enhancements:

 - Password reset through email
- Email verification
- Real-time notifications using WebSockets
- Direct messaging
- Stories
- Video posts
- Post sharing
- Hashtag pages
- Advanced post search
- Infinite scrolling
- OAuth / Google login
- PostgreSQL production database
- Cloud image storage
- Docker deployment
- CI/CD pipeline
- Automated API documentation

---

 # 👨‍💻 Author

 **Bharath S B**

 This project demonstrates full-stack web development using:

 - Python
- Django
- Django REST Framework
- SQLite
- HTML
- CSS
- JavaScript
- REST APIs
- Authentication
- Database design

---

 ⭐ **VibeConnect is a learning-focused full-stack social-media application built to demonstrate modern Django and REST API development.**