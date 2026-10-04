/* search.js — live user search with a debounce and "Load more" */
document.addEventListener('DOMContentLoaded', () => {
  const input = $('#search-input');
  const results = $('#results');
  const empty = $('#search-empty');
  const more = $('#load-more');
  let nextUrl = null;
  let timer = null;
  let requestId = 0;   // ignore answers that arrive after a newer search started

  const hint = '<div class="empty-state"><h3>Start typing to find people</h3><p class="muted">Search by username, first name or last name.</p></div>';

  async function run(reset) {
    const q = input.value.trim();
    if (reset) {
      nextUrl = `/api/search/?q=${encodeURIComponent(q)}`;
      history.replaceState(null, '', q ? `?q=${encodeURIComponent(q)}` : location.pathname);
    }
    if (!q) { results.hidden = true; more.hidden = true; empty.innerHTML = hint; return; }

    const myRequest = ++requestId;
    if (reset) {
      empty.innerHTML = '';
      results.hidden = false;
      results.innerHTML = '<div class="skeleton-row"></div><div class="skeleton-row"></div><div class="skeleton-row"></div>';
    } else {
      setLoading(more, true);
    }
    try {
      const data = await API.get(nextUrl);
      if (myRequest !== requestId) return;
      if (reset) results.innerHTML = '';
      nextUrl = data.next ? API.toPath(data.next) : null;
      results.insertAdjacentHTML('beforeend', data.results.map((u) => userRowHTML(u)).join(''));
      if (reset && data.results.length === 0) {
        results.hidden = true;
        empty.innerHTML = `<h3>No one found for “${esc(q)}”</h3><p class="muted">Check the spelling or try another name.</p>`;
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(more, false);
      more.hidden = !nextUrl;
    }
  }

  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => run(true), 300);
  });
  more.addEventListener('click', () => run(false));
  run(true);
});
