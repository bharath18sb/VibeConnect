/* notifications.js — list, open (marks as read) and "mark all as read" */
document.addEventListener('DOMContentLoaded', () => {
  const list = $('#notif-list');
  const more = $('#load-more');
  let nextUrl = '/api/notifications/';
  const TYPE_ICON = { follow: 'user-plus', like: 'heart', comment: 'comment' };

  function itemHTML(n) {
    return `<a class="notif ${n.is_read ? '' : 'unread'}" href="${esc(n.url)}" data-id="${n.id}">
      <span class="notif-avatar">${avatarHTML(n.sender, 44)}<span class="notif-type t-${n.type}">${icon(TYPE_ICON[n.type])}</span></span>
      <span class="notif-text">
        <span><strong>${esc(n.sender.full_name)}</strong> ${esc(n.message)}</span>
        ${n.post_excerpt ? `<span class="muted notif-excerpt">“${esc(n.post_excerpt)}”</span>` : ''}
        <span class="muted small">${timeAgo(n.created_at)}</span>
      </span>
      ${n.is_read ? '' : '<span class="unread-dot" aria-label="Unread"></span>'}
    </a>`;
  }

  async function load(reset) {
    if (reset) list.innerHTML = '<div class="skeleton-row"></div><div class="skeleton-row"></div><div class="skeleton-row"></div>';
    else setLoading(more, true);
    try {
      const data = await API.get(nextUrl);
      if (reset) list.innerHTML = '';
      nextUrl = data.next ? API.toPath(data.next) : null;
      list.insertAdjacentHTML('beforeend', data.results.map(itemHTML).join(''));
      if (reset && !data.results.length) {
        list.innerHTML = '<div class="empty-state"><h3>No notifications yet</h3><p class="muted">When someone follows, likes or comments, you will see it here.</p></div>';
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(more, false);
      more.hidden = !nextUrl;
    }
  }

  // Click: mark as read first, then go to the post / profile.
  list.addEventListener('click', async (e) => {
    const item = e.target.closest('.notif');
    if (!item) return;
    e.preventDefault();
    try {
      if (item.classList.contains('unread')) await API.post(`/api/notifications/${item.dataset.id}/read/`);
    } catch (err) { /* still navigate */ }
    window.location.href = item.getAttribute('href');
  });

  $('#mark-all').addEventListener('click', async (e) => {
    const button = e.currentTarget;
    setLoading(button, true);
    try {
      await API.post('/api/notifications/mark-all-read/');
      $$('.notif.unread', list).forEach((n) => { n.classList.remove('unread'); const dot = $('.unread-dot', n); if (dot) dot.remove(); });
      setBadge(0);
      toast('All notifications marked as read', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(button, false);
    }
  });

  more.addEventListener('click', () => load(false));
  load(true);
});
