/* home.js — composer (create post) + Following / Explore feed tabs */
document.addEventListener('DOMContentLoaded', () => {
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

  const emptyFollowing = `<div class="empty-state card">
    <h3>Your feed is quiet</h3>
    <p class="muted">Write your first post above, or follow people to see their posts here.</p>
    <a class="btn btn-primary btn-sm" href="/search/">Find people</a></div>`;
  const emptyExplore = '<div class="empty-state card"><h3>No posts yet</h3><p class="muted">Be the first to share something.</p></div>';

  const feed = new Feed({
    list: $('#feed'),
    moreButton: $('#load-more'),
    url: '/api/posts/?feed=home',
    emptyHTML: emptyFollowing,
  });
  feed.load();

  // ---------- tabs ----------
  const tabs = $$('.tab');
  const indicator = $('.tab-indicator');
  function moveIndicator() {
    const active = $('.tab.active');
    indicator.style.width = active.offsetWidth + 'px';
    indicator.style.transform = `translateX(${active.offsetLeft}px)`;
  }
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    if (tab.classList.contains('active')) return;
    tabs.forEach((t) => t.classList.toggle('active', t === tab));
    moveIndicator();
    const name = tab.dataset.feed;
    feed.emptyHTML = name === 'home' ? emptyFollowing : emptyExplore;
    feed.setUrl(`/api/posts/?feed=${name}`);
    feed.load();
  }));
  moveIndicator();
  window.addEventListener('resize', moveIndicator);

  // ---------- composer ----------
  const form = $('#composer-form');
  const text = $('#composer-text');
  const fileInput = $('#composer-image');
  const preview = $('#composer-preview');
  const counter = $('#composer-counter');
  const submit = $('#composer-submit');

  function autoGrow() {
    text.style.height = 'auto';
    text.style.height = Math.min(text.scrollHeight, 240) + 'px';
  }
  text.addEventListener('input', () => {
    counter.textContent = `${text.value.length}/500`;
    counter.classList.toggle('warn', text.value.length > 450);
    autoGrow();
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      toast('Image must be under 5 MB.', 'error');
      fileInput.value = '';
      return;
    }
    $('img', preview).src = URL.createObjectURL(file);
    preview.hidden = false;
  });
  $('#composer-remove-img').addEventListener('click', () => {
    fileInput.value = '';
    preview.hidden = true;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = text.value.trim();
    const file = fileInput.files[0];
    if (!content && !file) { toast('Write something or add a photo first.', 'error'); return; }

    const data = new FormData();
    data.append('content', content);
    if (file) data.append('image', file);

    setLoading(submit, true);
    try {
      const post = await API.post('/api/posts/', data);
      feed.prepend(post);
      form.reset();
      preview.hidden = true;
      counter.textContent = '0/500';
      autoGrow();
      toast('Posted! Your vibe is live.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(submit, false);
    }
  });
});
