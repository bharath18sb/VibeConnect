/* bookmarks.js — the "Saved" page */
document.addEventListener('DOMContentLoaded', () => {
  const feed = new Feed({
    list: $('#feed'),
    moreButton: $('#load-more'),
    url: '/api/bookmarks/',
    emptyHTML: `<div class="empty-state card"><h3>Nothing saved yet</h3>
      <p class="muted">Tap the bookmark icon on any post to keep it here.</p></div>`,
  });
  feed.load();

  // When a post is un-saved on this page, fade it out of the list.
  document.addEventListener('bookmark:changed', (e) => {
    if (e.detail.bookmarked) return;
    const card = e.detail.card;
    card.classList.add('removing');
    setTimeout(() => { card.remove(); feed.showEmptyIfNeeded(); }, 300);
  });
});
