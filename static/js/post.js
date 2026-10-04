/* post.js — single post page (opened from a notification or a shared link) */
document.addEventListener('DOMContentLoaded', async () => {
  const box = $('#feed');
  const id = box.dataset.postId;
  box.innerHTML = postSkeletons(1);
  try {
    const post = await API.get(`/api/posts/${id}/`);
    box.innerHTML = '';
    const card = PostUI.create(post);
    box.appendChild(card);
    PostUI.openComments(card);
  } catch (err) {
    box.innerHTML = '<div class="empty-state card"><h3>Post not found</h3><p class="muted">It may have been deleted.</p></div>';
  }
  document.addEventListener('post:deleted', () => { window.location.href = '/'; });
});
