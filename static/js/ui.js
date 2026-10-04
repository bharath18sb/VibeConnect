/* ui.js — small shared helpers: toasts, modals, theme, avatars, time, follow buttons.
 * Loaded on every page (including login/register). Everything is a plain global
 * function so it is easy to read and explain.
 */

// ---------- tiny DOM helpers ----------
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** Escape user text before putting it in innerHTML (prevents XSS). */
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESC_MAP[c]);
}

function icon(name) {
  return `<svg class="icon"><use href="#i-${name}"/></svg>`;
}

/** "5m ago", "3h ago", "2d ago", or a normal date. */
function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

// ---------- toasts ----------
function toast(message, type = 'info', timeout = 3200) {
  const stack = $('#toast-stack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  const symbol = type === 'success' ? 'check' : type === 'error' ? 'alert' : 'bell';
  el.innerHTML = `${icon(symbol)}<span>${esc(message)}</span>`;
  stack.appendChild(el);
  setTimeout(() => {
    el.classList.add('leaving');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, timeout);
}

// ---------- loading state for buttons ----------
function setLoading(button, on) {
  if (!button) return;
  button.classList.toggle('loading', on);
  button.disabled = on;
}

// ---------- modals ----------
function openModal(modal) {
  if (typeof modal === 'string') modal = $(modal);
  modal.classList.add('open');
  document.body.classList.add('modal-open');
}
function closeModal(modal) {
  if (typeof modal === 'string') modal = $(modal);
  modal.classList.remove('open');
  if (!$('.modal-backdrop.open')) document.body.classList.remove('modal-open');
}
document.addEventListener('click', (e) => {
  const backdrop = e.target.classList && e.target.classList.contains('modal-backdrop') ? e.target : null;
  const closer = e.target.closest('[data-close]');
  if (backdrop) closeModal(backdrop);
  else if (closer) closeModal(closer.closest('.modal-backdrop'));
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') $$('.modal-backdrop.open').forEach(closeModal);
});

/** Delete-confirmation dialog. Usage: if (await confirmDialog({...})) { ... } */
function confirmDialog({ title = 'Are you sure?', message = '', confirmText = 'Delete' } = {}) {
  return new Promise((resolve) => {
    const modal = $('#confirm-modal');
    $('#confirm-title').textContent = title;
    $('#confirm-message').textContent = message;
    const ok = $('#confirm-ok');
    ok.textContent = confirmText;
    openModal(modal);
    ok.focus();

    const finish = (result) => {
      ok.removeEventListener('click', onOk);
      modal.removeEventListener('click', onDismiss);
      document.removeEventListener('keydown', onKey);
      closeModal(modal);
      resolve(result);
    };
    const onOk = () => finish(true);
    const onDismiss = (e) => { if (e.target === modal || e.target.closest('[data-close]')) finish(false); };
    const onKey = (e) => { if (e.key === 'Escape') finish(false); };
    ok.addEventListener('click', onOk);
    modal.addEventListener('click', onDismiss);
    document.addEventListener('keydown', onKey);
  });
}

// ---------- light / dark theme (saved in localStorage) ----------
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('vc-theme', theme); } catch (e) { /* private mode */ }
}
document.addEventListener('click', (e) => {
  if (e.target.closest('#theme-toggle')) {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  }
});

// ---------- avatars ----------
function hueFor(text) {
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return hash;
}
/** Profile picture, or a coloured circle with the first letter if there is none. */
function avatarHTML(user, size = 40) {
  const style = `width:${size}px;height:${size}px;font-size:${Math.round(size * 0.4)}px`;
  if (user.profile_image) {
    return `<img class="avatar" src="${esc(user.profile_image)}" alt="" style="${style}" loading="lazy">`;
  }
  const hue = hueFor(user.username || '');
  const letter = esc((user.full_name || user.username || '?').trim().charAt(0).toUpperCase());
  return `<span class="avatar avatar-initials" style="${style};background:linear-gradient(135deg,hsl(${hue} 70% 58%),hsl(${(hue + 50) % 360} 75% 48%))">${letter}</span>`;
}

// ---------- follow buttons (work everywhere via event delegation) ----------
function followButtonHTML(user) {
  const following = !!user.is_following;
  return `<button class="btn ${following ? 'btn-ghost' : 'btn-primary'} btn-sm" data-follow="${esc(user.username)}" data-following="${following}">${following ? 'Unfollow' : 'Follow'}</button>`;
}
function updateFollowButtons(username, isFollowing) {
  $$('[data-follow]').filter((b) => b.dataset.follow === username).forEach((b) => {
    b.dataset.following = String(isFollowing);
    b.textContent = isFollowing ? 'Unfollow' : 'Follow';
    b.classList.toggle('btn-ghost', isFollowing);
    b.classList.toggle('btn-primary', !isFollowing);
  });
}
document.addEventListener('click', async (e) => {
  const button = e.target.closest('[data-follow]');
  if (!button) return;
  e.preventDefault();
  const username = button.dataset.follow;
  const currentlyFollowing = button.dataset.following === 'true';
  setLoading(button, true);
  try {
    const url = `/api/users/${encodeURIComponent(username)}/follow/`;
    const data = currentlyFollowing ? await API.del(url) : await API.post(url);
    updateFollowButtons(username, data.is_following);
    document.dispatchEvent(new CustomEvent('follow:changed', { detail: { username, ...data } }));
    toast(data.is_following ? `You are now following @${username}` : `Unfollowed @${username}`, 'success');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setLoading(button, false);
  }
});

// ---------- user rows (search results, followers lists, suggestions) ----------
function userRowHTML(user, { compact = false } = {}) {
  return `<div class="user-row">
    <a class="user-row-main" href="/u/${encodeURIComponent(user.username)}/">
      ${avatarHTML(user, compact ? 40 : 48)}
      <div class="user-row-text">
        <strong>${esc(user.full_name)}</strong>
        <span class="muted">@${esc(user.username)}</span>
        ${!compact && user.bio ? `<p class="bio-snip">${esc(user.bio)}</p>` : ''}
      </div>
    </a>
    ${user.is_me ? '<span class="pill">You</span>' : followButtonHTML(user)}
  </div>`;
}

// ---------- notification badge (polls every 30 s) ----------
let lastUnread = 0;
function setBadge(count) {
  $$('.notif-badge').forEach((badge) => {
    badge.textContent = count > 99 ? '99+' : count;
    badge.hidden = count === 0;
    if (count > lastUnread) {
      badge.classList.remove('bump');
      void badge.offsetWidth; // restart the animation
      badge.classList.add('bump');
    }
  });
  lastUnread = count;
}
async function refreshBadge() {
  if (!$('.notif-badge')) return;
  try {
    const data = await API.get('/api/notifications/unread-count/');
    setBadge(data.unread_count);
  } catch (e) { /* ignore: badge just stays as it is */ }
}

// ---------- "Who to follow" sidebar widget ----------
async function loadSuggestions() {
  const box = $('#suggestions');
  if (!box) return;
  try {
    const users = await API.get('/api/suggestions/');
    box.innerHTML = users.length
      ? users.map((u) => userRowHTML(u, { compact: true })).join('')
      : '<p class="muted small">No suggestions right now — you follow everyone!</p>';
  } catch (e) {
    box.innerHTML = '<p class="muted small">Could not load suggestions.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  refreshBadge();
  setInterval(refreshBadge, 30000);
  loadSuggestions();
});
