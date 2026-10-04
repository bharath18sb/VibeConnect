/* postcard.js — everything about a post card:
 *   PostUI : build a card, like / save / comment / edit / delete / share
 *   Feed   : a paginated list of cards with a "Load more" button
 * Loaded on every logged-in page.
 */

const PostUI = (() => {
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

  /** Escape, then turn @mentions into profile links and #tags into coloured text. */
  function linkify(text) {
    return esc(text)
      .replace(/(^|[\s(])@([A-Za-z0-9_]{1,150})/g, '$1<a class="mention" href="/u/$2/">@$2</a>')
      .replace(/(^|[\s(])#([A-Za-z0-9_]+)/g, '$1<span class="hashtag">#$2</span>');
  }

  function commentHTML(c) {
    return `<div class="comment" data-comment="${c.id}">
      ${avatarHTML(c.author, 32)}
      <div class="comment-bubble">
        <div class="comment-head">
          <a href="/u/${encodeURIComponent(c.author.username)}/"><strong>${esc(c.author.full_name)}</strong></a>
          <span class="muted">${timeAgo(c.created_at)}</span>
          ${c.is_owner ? `<button class="icon-btn tiny" data-action="delete-comment" data-id="${c.id}" aria-label="Delete comment">${icon('trash')}</button>` : ''}
        </div>
        <p>${linkify(c.content)}</p>
      </div>
    </div>`;
  }

  function cardHTML(p) {
    const a = p.author;
    return `<article class="post-card card" data-id="${p.id}">
      <header class="post-head">
        <a class="post-author" href="/u/${encodeURIComponent(a.username)}/">
          ${avatarHTML(a, 44)}
          <div>
            <strong>${esc(a.full_name)}</strong>
            <span class="muted">@${esc(a.username)} &middot; <a class="time-link" href="/post/${p.id}/">${timeAgo(p.created_at)}</a>${p.is_edited ? ' &middot; edited' : ''}</span>
          </div>
        </a>
        ${p.is_owner ? `<div class="post-menu">
          <button class="icon-btn" data-action="edit" aria-label="Edit post">${icon('edit')}</button>
          <button class="icon-btn danger" data-action="delete" aria-label="Delete post">${icon('trash')}</button>
        </div>` : ''}
      </header>
      <div class="post-body">
        ${p.content ? `<p class="post-text">${linkify(p.content)}</p>` : ''}
        ${p.image ? `<div class="post-image"><img src="${esc(p.image)}" alt="Image posted by ${esc(a.username)}" loading="lazy"></div>` : ''}
      </div>
      <div class="burst" aria-hidden="true">${icon('heart')}</div>
      <footer class="post-actions">
        <button class="act act-like" data-action="like" aria-label="Like">${icon('heart')}<span class="like-count"></span></button>
        <button class="act" data-action="comment" aria-label="Comments">${icon('comment')}<span class="comment-count"></span></button>
        <button class="act" data-action="share" aria-label="Copy link">${icon('share')}</button>
        <button class="act act-bookmark" data-action="bookmark" aria-label="Save">${icon('bookmark')}</button>
      </footer>
      <section class="comments" hidden>
        <div class="comment-list"></div>
        <div class="comment-form">
          <input class="input comment-input" maxlength="300" placeholder="Write a comment…" aria-label="Write a comment">
          <button class="btn btn-primary btn-sm" data-action="send-comment" aria-label="Send comment">${icon('send')}</button>
        </div>
      </section>
    </article>`;
  }

  /** Update the like / comment / save buttons from the card's data. */
  function sync(card) {
    const p = card._post;
    const like = $('.act-like', card);
    like.classList.toggle('active', p.is_liked);
    $('.like-count', like).textContent = p.like_count || '';
    $('.comment-count', card).textContent = p.comment_count || '';
    $('.act-bookmark', card).classList.toggle('active', p.is_bookmarked);
  }

  function create(post) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = cardHTML(post).trim();
    const card = wrapper.firstElementChild;
    card._post = post;
    sync(card);
    return card;
  }

  // ---------- actions ----------
  function showBurst(card) {
    const burst = $('.burst', card);
    burst.classList.remove('show');
    void burst.offsetWidth;
    burst.classList.add('show');
  }

  async function toggleLike(card, button) {
    const p = card._post;
    if (button) button.disabled = true;
    try {
      const url = `/api/posts/${p.id}/like/`;
      const data = p.is_liked ? await API.del(url) : await API.post(url);
      p.is_liked = data.liked;
      p.like_count = data.like_count;
      sync(card);
      if (data.liked) {
        const heart = $('.act-like', card);
        heart.classList.remove('pop');
        void heart.offsetWidth;
        heart.classList.add('pop');
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function toggleBookmark(card, button) {
    const p = card._post;
    button.disabled = true;
    try {
      const url = `/api/posts/${p.id}/bookmark/`;
      const data = p.is_bookmarked ? await API.del(url) : await API.post(url);
      p.is_bookmarked = data.bookmarked;
      sync(card);
      toast(data.bookmarked ? 'Saved to your bookmarks' : 'Removed from bookmarks', 'success');
      document.dispatchEvent(new CustomEvent('bookmark:changed', { detail: { card, bookmarked: data.bookmarked } }));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      button.disabled = false;
    }
  }

  async function openComments(card) {
    const section = $('.comments', card);
    section.hidden = false;
    if (card._commentsLoaded) return;
    const list = $('.comment-list', card);
    list.innerHTML = '<div class="skeleton-row"></div>';
    try {
      const comments = await API.get(`/api/posts/${card._post.id}/comments/`);
      list.innerHTML = comments.length
        ? comments.map(commentHTML).join('')
        : '<p class="muted small empty-comments">No comments yet — be the first.</p>';
      card._commentsLoaded = true;
    } catch (err) {
      list.innerHTML = '';
      toast(err.message, 'error');
    }
  }

  function toggleComments(card) {
    const section = $('.comments', card);
    if (section.hidden) {
      openComments(card).then(() => $('.comment-input', card).focus());
    } else {
      section.hidden = true;
    }
  }

  async function sendComment(card, button) {
    const input = $('.comment-input', card);
    const content = input.value.trim();
    if (!content) { toast('Write something first.', 'error'); return; }
    setLoading(button, true);
    try {
      const data = await API.post(`/api/posts/${card._post.id}/comments/`, { content });
      const list = $('.comment-list', card);
      const empty = $('.empty-comments', list);
      if (empty) empty.remove();
      list.insertAdjacentHTML('beforeend', commentHTML(data.comment));
      card._post.comment_count = data.comment_count;
      sync(card);
      input.value = '';
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(button, false);
    }
  }

  async function deleteComment(card, button) {
    const ok = await confirmDialog({ title: 'Delete comment?', message: 'This cannot be undone.' });
    if (!ok) return;
    const row = button.closest('.comment');
    try {
      const data = await API.del(`/api/comments/${button.dataset.id}/`);
      card._post.comment_count = data.comment_count;
      sync(card);
      row.classList.add('removing');
      setTimeout(() => row.remove(), 250);
      toast('Comment deleted', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function deletePost(card) {
    const ok = await confirmDialog({ title: 'Delete this post?', message: 'The post, its likes and its comments will be removed permanently.' });
    if (!ok) return;
    try {
      await API.del(`/api/posts/${card._post.id}/`);
      card.classList.add('removing');
      setTimeout(() => {
        card.remove();
        document.dispatchEvent(new CustomEvent('post:deleted'));
      }, 300);
      toast('Post deleted', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function share(card) {
    const url = `${location.origin}/post/${card._post.id}/`;
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied to clipboard', 'success');
    } catch (e) {
      window.prompt('Copy this link:', url);
    }
  }

  // ---------- edit-post modal ----------
  const edit = { card: null, removeImage: false };

  function openEdit(card) {
    edit.card = card;
    edit.removeImage = false;
    const p = card._post;
    $('#edit-content').value = p.content;
    $('#edit-image').value = '';
    $('#edit-counter').textContent = `${p.content.length}/500`;
    const preview = $('#edit-preview');
    preview.hidden = !p.image;
    if (p.image) $('img', preview).src = p.image;
    openModal('#edit-post-modal');
  }

  function wireEditModal() {
    const form = $('#edit-post-form');
    if (!form) return;
    $('#edit-content').addEventListener('input', (e) => {
      $('#edit-counter').textContent = `${e.target.value.length}/500`;
    });
    $('#edit-image').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > MAX_IMAGE_BYTES) { toast('Image must be under 5 MB.', 'error'); e.target.value = ''; return; }
      edit.removeImage = false;
      const preview = $('#edit-preview');
      $('img', preview).src = URL.createObjectURL(file);
      preview.hidden = false;
    });
    $('#edit-remove-img').addEventListener('click', () => {
      edit.removeImage = true;
      $('#edit-image').value = '';
      $('#edit-preview').hidden = true;
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const button = $('#edit-save');
      const data = new FormData();
      data.append('content', $('#edit-content').value);
      const file = $('#edit-image').files[0];
      if (file) data.append('image', file);
      if (edit.removeImage) data.append('remove_image', 'true');
      setLoading(button, true);
      try {
        const updated = await API.patch(`/api/posts/${edit.card._post.id}/`, data);
        const fresh = create(updated);
        fresh.classList.add('flash');
        edit.card.replaceWith(fresh);
        closeModal('#edit-post-modal');
        toast('Post updated', 'success');
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        setLoading(button, false);
      }
    });
  }

  // ---------- one set of listeners for all cards (event delegation) ----------
  document.addEventListener('click', (e) => {
    const button = e.target.closest('[data-action]');
    if (!button) return;
    const card = button.closest('.post-card');
    if (!card) return;
    const actions = {
      like: toggleLike, bookmark: toggleBookmark, comment: toggleComments, share,
      edit: openEdit, delete: deletePost, 'send-comment': sendComment, 'delete-comment': deleteComment,
    };
    const handler = actions[button.dataset.action];
    if (handler) handler(card, button);
  });

  // Double-click a post to like it (like Instagram).
  document.addEventListener('dblclick', (e) => {
    const body = e.target.closest('.post-body');
    if (!body) return;
    const card = body.closest('.post-card');
    showBurst(card);
    if (!card._post.is_liked) toggleLike(card, null);
  });

  // Press Enter in the comment box to send.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('.comment-input')) {
      e.preventDefault();
      $('[data-action="send-comment"]', e.target.closest('.post-card')).click();
    }
  });

  document.addEventListener('DOMContentLoaded', wireEditModal);

  return { create, openComments, sync };
})();


/** Loading placeholders shown while a request is in flight. */
function postSkeletons(count = 3) {
  const one = `<div class="card post-skeleton">
    <div class="skeleton-row"><span class="skeleton circle"></span><span class="skeleton line" style="width:40%"></span></div>
    <span class="skeleton line" style="width:90%"></span><span class="skeleton line" style="width:65%"></span>
    <span class="skeleton block"></span></div>`;
  return one.repeat(count);
}


/** A paginated list of post cards with a "Load more" button. */
class Feed {
  constructor({ list, moreButton, url, emptyHTML }) {
    this.list = list;
    this.moreButton = moreButton;
    this.url = url;
    this.nextUrl = null;
    this.loading = false;
    this.emptyHTML = emptyHTML || '<div class="empty-state card"><h3>Nothing here yet</h3></div>';
    if (this.moreButton) this.moreButton.addEventListener('click', () => this.load(false));
    document.addEventListener('post:deleted', () => this.showEmptyIfNeeded());
  }

  setUrl(url) { this.url = url; }

  async load(reset = true) {
    if (this.loading) return;
    this.loading = true;
    if (reset) {
      this.nextUrl = this.url;
      this.list.innerHTML = postSkeletons(3);
      if (this.moreButton) this.moreButton.hidden = true;
    } else {
      setLoading(this.moreButton, true);
    }
    try {
      const data = await API.get(this.nextUrl);
      if (reset) this.list.innerHTML = '';
      this.nextUrl = data.next ? API.toPath(data.next) : null;
      data.results.forEach((post, i) => {
        const card = PostUI.create(post);
        card.style.setProperty('--i', i);   // used for the staggered entrance animation
        this.list.appendChild(card);
      });
      if (reset && data.results.length === 0) this.list.innerHTML = this.emptyHTML;
    } catch (err) {
      if (reset) this.list.innerHTML = '<div class="empty-state card"><h3>Could not load posts</h3><p class="muted">Please try again.</p></div>';
      toast(err.message, 'error');
    } finally {
      this.loading = false;
      if (this.moreButton) {
        setLoading(this.moreButton, false);
        this.moreButton.hidden = !this.nextUrl;
      }
    }
  }

  prepend(post) {
    const empty = $('.empty-state', this.list);
    if (empty) empty.remove();
    const card = PostUI.create(post);
    card.style.setProperty('--i', 0);
    this.list.prepend(card);
  }

  showEmptyIfNeeded() {
    if (!$('.post-card', this.list) && !this.nextUrl) this.list.innerHTML = this.emptyHTML;
  }
}
