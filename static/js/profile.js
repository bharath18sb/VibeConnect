/* profile.js — profile header, user's posts, followers/following lists, edit profile */
document.addEventListener('DOMContentLoaded', async () => {
  const header = $('#profile-header');
  const username = header.dataset.username;
  let user = null;

  function headerHTML(u) {
    const joined = new Date(u.date_joined).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const bio = u.bio
      ? `<p class="profile-bio">${esc(u.bio)}</p>`
      : `<p class="muted">${u.is_me ? 'Add a bio so people know who you are.' : 'No bio yet.'}</p>`;
    return `<div class="profile-cover"></div>
      <div class="profile-body">
        <div class="profile-avatar">${avatarHTML(u, 112)}</div>
        <div class="profile-top">
          <div>
            <h1>${esc(u.full_name)}</h1>
            <p class="muted">@${esc(u.username)} &middot; Joined ${esc(joined)}</p>
          </div>
          <div class="profile-actions">
            ${u.is_me ? `<button class="btn btn-ghost" id="edit-profile-btn">${icon('edit')} Edit profile</button>` : followButtonHTML(u)}
          </div>
        </div>
        ${bio}
        <div class="profile-stats">
          <div class="stat"><strong>${u.posts_count}</strong><span>Posts</span></div>
          <button class="stat" data-list="followers"><strong id="followers-count">${u.followers_count}</strong><span>Followers</span></button>
          <button class="stat" data-list="following"><strong id="following-count">${u.following_count}</strong><span>Following</span></button>
        </div>
      </div>`;
  }

  function render() { header.innerHTML = headerHTML(user); }

  try {
    user = await API.get(`/api/users/${encodeURIComponent(username)}/`);
    render();
  } catch (err) {
    header.innerHTML = '<div class="empty-state"><h3>Could not load this profile</h3></div>';
    return;
  }

  // ----- their posts -----
  const feed = new Feed({
    list: $('#feed'),
    moreButton: $('#load-more'),
    url: `/api/posts/?feed=user&username=${encodeURIComponent(username)}`,
    emptyHTML: `<div class="empty-state card"><h3>No posts yet</h3><p class="muted">${user.is_me ? 'Share your first post from the home page.' : 'This user has not posted anything.'}</p></div>`,
  });
  feed.load();

  // Keep the follower count fresh after Follow / Unfollow.
  document.addEventListener('follow:changed', (e) => {
    if (e.detail.username !== username) return;
    user.is_following = e.detail.is_following;
    user.followers_count = e.detail.followers_count;
    $('#followers-count').textContent = user.followers_count;
  });

  // ----- followers / following modal -----
  const usersList = $('#users-list');
  const usersMore = $('#users-more');
  let usersNext = null;

  async function loadUsers(reset) {
    if (reset) usersList.innerHTML = '<div class="skeleton-row"></div><div class="skeleton-row"></div>';
    else setLoading(usersMore, true);
    try {
      const data = await API.get(usersNext);
      if (reset) usersList.innerHTML = '';
      usersNext = data.next ? API.toPath(data.next) : null;
      usersList.insertAdjacentHTML('beforeend', data.results.map((u) => userRowHTML(u, { compact: true })).join(''));
      if (reset && !data.results.length) usersList.innerHTML = '<p class="muted center-text">Nobody here yet.</p>';
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(usersMore, false);
      usersMore.hidden = !usersNext;
    }
  }
  usersMore.addEventListener('click', () => loadUsers(false));

  header.addEventListener('click', (e) => {
    const stat = e.target.closest('[data-list]');
    if (stat) {
      const which = stat.dataset.list;
      $('#users-title').textContent = which === 'followers' ? 'Followers' : 'Following';
      usersNext = `/api/users/${encodeURIComponent(username)}/${which}/`;
      openModal('#users-modal');
      loadUsers(true);
    }
    if (e.target.closest('#edit-profile-btn')) openEditProfile();
  });

  // ----- edit profile -----
  const form = $('#edit-profile-form');
  if (!form) return;
  const state = { removeImage: false, previewUrl: null };
  const avatarBox = $('#ep-avatar');

  function openEditProfile() {
    state.removeImage = false;
    state.previewUrl = null;
    $('#ep-name').value = user.raw_full_name;
    $('#ep-bio').value = user.bio;
    $('#ep-counter').textContent = `${user.bio.length}/300`;
    $('#ep-image').value = '';
    avatarBox.innerHTML = avatarHTML(user, 72);
    openModal('#edit-profile-modal');
  }

  $('#ep-bio').addEventListener('input', (e) => { $('#ep-counter').textContent = `${e.target.value.length}/300`; });
  $('#ep-image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast('Image must be under 3 MB.', 'error'); e.target.value = ''; return; }
    state.removeImage = false;
    state.previewUrl = URL.createObjectURL(file);
    avatarBox.innerHTML = `<img class="avatar" src="${state.previewUrl}" alt="" style="width:72px;height:72px">`;
  });
  $('#ep-remove-image').addEventListener('click', () => {
    state.removeImage = true;
    $('#ep-image').value = '';
    avatarBox.innerHTML = avatarHTML({ ...user, profile_image: null }, 72);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('full_name', $('#ep-name').value);
    data.append('bio', $('#ep-bio').value);
    const file = $('#ep-image').files[0];
    if (file) data.append('profile_image', file);
    if (state.removeImage) data.append('remove_image', 'true');

    const button = $('#ep-save');
    setLoading(button, true);
    try {
      await API.patch('/api/me/', data);
      toast('Profile updated', 'success');
      setTimeout(() => window.location.reload(), 500);   // refresh navbar avatar too
    } catch (err) {
      toast(err.message, 'error');
      setLoading(button, false);
    }
  });
});
