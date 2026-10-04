/* api.js — a tiny wrapper around fetch() for talking to the Django REST API.
 *
 * Every call:
 *   - sends the browser's session cookie (we are logged in with Django auth)
 *   - sends the CSRF token Django requires for POST / PATCH / DELETE
 *   - throws an ApiError with a readable message when the server says no
 */
(function () {
  function csrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.content : '';
  }

  // Turn DRF error JSON ({"content": ["too long"]} or {"detail": "..."}) into one sentence.
  function extractMessage(data) {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) return data.map(extractMessage).join(' ');
    if (data.detail) return data.detail;
    return Object.entries(data)
      .map(([key, value]) => {
        const msg = extractMessage(value);
        return key === 'non_field_errors' ? msg : `${key.replace(/_/g, ' ')}: ${msg}`;
      })
      .join(' ');
  }

  class ApiError extends Error {
    constructor(status, data) {
      super(extractMessage(data) || `Something went wrong (${status}).`);
      this.status = status;
      this.data = data;
    }
  }

  async function request(url, { method = 'GET', body = null } = {}) {
    const headers = { Accept: 'application/json', 'X-CSRFToken': csrfToken() };
    let payload = body;
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(url, { method, headers, body: payload, credentials: 'same-origin' });
    } catch (networkError) {
      throw new ApiError(0, 'Network error — is the server running?');
    }

    let data = null;
    if (response.status !== 204) {
      try { data = await response.json(); } catch (e) { /* not JSON */ }
    }

    if (!response.ok) {
      // Session expired -> send the user back to the login page.
      if (response.status === 403 && data && /credentials were not provided/i.test(data.detail || '')) {
        window.location.href = '/login/?next=' + encodeURIComponent(location.pathname);
      }
      throw new ApiError(response.status, data);
    }
    return data;
  }

  // The API returns absolute "next" URLs; keep just the path so it works behind any host.
  function toPath(url) {
    const u = new URL(url, window.location.origin);
    return u.pathname + u.search;
  }

  window.API = {
    get: (url) => request(url),
    post: (url, body) => request(url, { method: 'POST', body }),
    patch: (url, body) => request(url, { method: 'PATCH', body }),
    del: (url) => request(url, { method: 'DELETE' }),
    toPath,
    ApiError,
  };
})();
