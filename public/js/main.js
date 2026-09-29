// js/main.js — shared helpers used on every page.
// It is loaded by every HTML page (must come first among the scripts).

/* ------------------------------------------------------------------
   api() — small wrapper around fetch for talking to our backend.
   It automatically handles JSON body, errors and redirects to the
   login page when the request needs a logged-in user (401).
------------------------------------------------------------------- */
async function api(path, options = {}) {
  const config = {
    method: options.method || 'GET',
    credentials: 'same-origin', // send the session cookie
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined
  };

  const res = await fetch(path, config);

  // Parse the JSON response (might be empty on rare errors).
  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    /* no JSON body — ignore */
  }

  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    throw err;
  }

  return data;
}

/* Helper: turn cents into a readable price like "$24.99". */
function formatPrice(cents) {
  return '$' + (cents / 100).toFixed(2);
}

/* Helper: show an alert message (error or success) on a page. */
function showAlert(containerId, message, type) {
  const box = document.getElementById(containerId);
  if (!box) return;
  box.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

function clearAlerts(containerId) {
  const box = document.getElementById(containerId);
  if (box) box.innerHTML = '';
}

/* ------------------------------------------------------------------
   Adding to cart (used on the home page and the product page).
   If the user is not logged in we send them to the login page.
------------------------------------------------------------------- */
async function addToCart(productId, quantity = 1) {
  try {
    await api('/api/cart', { method: 'POST', body: { productId, quantity } });
    await refreshCartBadge();
    return { ok: true };
  } catch (err) {
    if (err.status === 401) {
      // Not logged in -> ask them to log in first.
      window.location.href = '/login.html';
      return { ok: false };
    }
    return { ok: false, message: err.message };
  }
}

/* Update the little number next to "Cart" in the navbar. */
async function refreshCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  try {
    const data = await api('/api/cart');
    badge.hidden = false;
    badge.textContent = data.count;
  } catch (err) {
    badge.hidden = true; // not logged in / no cart
  }
}

/* ------------------------------------------------------------------
   The shop page keeps its filters in the URL (?category=, ?q=, ?sort=),
   so every link in the menu and the browser back button keep working.
------------------------------------------------------------------- */
const SORT_OPTIONS = [
  ['featured', 'Featured'],
  ['newest', 'Newest'],
  ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'],
  ['name', 'Name A-Z']
];

/* Builds a link back to the shop page with some filters added or removed. */
function shopUrl(changes) {
  const params = new URLSearchParams(window.location.search);

  Object.keys(changes).forEach((key) => {
    if (changes[key] === null || changes[key] === '') params.delete(key);
    else params.set(key, changes[key]);
  });

  const query = params.toString();
  return '/index.html' + (query ? '?' + query : '') + '#products';
}

/* Same, but safe to drop inside an href="..." attribute. */
function shopHref(changes) {
  return shopUrl(changes).replace(/&/g, '&amp;');
}

/* The bar above the grid: how many products matched, chips to remove a
   filter and a sort dropdown. */
function renderShopBar(data) {
  const bar = document.getElementById('shopBar');
  if (!bar) return;

  const params = new URLSearchParams(window.location.search);
  const query = params.get('q');
  const category = params.get('category');

  const chips = [];
  if (category) {
    chips.push(`<a class="chip" href="${shopHref({ category: null })}">${escapeHtml(category)} &times;</a>`);
  }
  if (query) {
    chips.push(`<a class="chip" href="${shopHref({ q: null })}">&ldquo;${escapeHtml(query)}&rdquo; &times;</a>`);
  }
  if (chips.length > 0) {
    chips.push(`<a class="chip" href="${shopHref({ category: null, q: null, sort: null })}">Clear all</a>`);
  }

  const title = document.getElementById('products');
  if (title) {
    // textContent, so plain quotes instead of HTML entities.
    title.textContent = query ? `Results for "${query}"` : category || 'All products';
  }

  bar.hidden = false;
  bar.innerHTML = `
    <div class="shop-bar-info">
      <span><strong>${data.total}</strong> product${data.total === 1 ? '' : 's'}</span>
      ${chips.join('')}
    </div>
    <label class="shop-bar-sort" for="sortSelect">Sort
      <select id="sortSelect">
        ${SORT_OPTIONS.map(
          ([value, label]) =>
            `<option value="${value}"${value === data.sort ? ' selected' : ''}>${label}</option>`
        ).join('')}
      </select>
    </label>
  `;

  document.getElementById('sortSelect').addEventListener('change', (event) => {
    const value = event.target.value;
    window.location.href = shopUrl({ sort: value === 'featured' ? null : value });
  });
}

/* ------------------------------------------------------------------
   Loading the product grid on the home page.
------------------------------------------------------------------- */
async function loadProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  // Forward whatever the menu / search box put in the URL to the API.
  const filters = new URLSearchParams(window.location.search).toString();

  try {
    const data = await api('/api/products' + (filters ? '?' + filters : ''));

    renderShopBar(data);

    if (data.products.length === 0) {
      grid.innerHTML = filters
        ? '<p class="muted">No products match those filters. <a href="/index.html#products">Clear them</a>.</p>'
        : '<p class="muted">No products yet. Run <code>npm run seed</code>.</p>';
      return;
    }

    grid.innerHTML = data.products
      .map(
        (p) => `
        <div class="product-card">
          <img src="${p.image}" alt="${p.name}">
          <div class="product-card-body">
            <div class="product-name">${p.name}</div>
            <div class="product-desc">${p.description}</div>
            <div class="product-price">${formatPrice(p.price)}</div>
            <div class="product-actions">
              <a class="btn btn-outline btn-sm" href="/product.html?id=${p.id}">View Details</a>
              <button class="btn btn-primary btn-sm add-btn" data-id="${p.id}">Add to Cart</button>
            </div>
          </div>
        </div>`
      )
      .join('');

    // Wire up the "Add to Cart" buttons.
    grid.querySelectorAll('.add-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        const result = await addToCart(Number(btn.dataset.id));
        btn.disabled = false;
        if (result.ok) {
          showAlert('pageMessage', 'Added to cart.', 'success');
          setTimeout(() => clearAlerts('pageMessage'), 2000);
        } else if (result.message) {
          showAlert('pageMessage', result.message, 'error');
        }
      });
    });
  } catch (err) {
    if (err.status === 401) {
      window.location.href = '/login.html';
    } else {
      grid.innerHTML = '<p class="muted">Could not load products. Is the server running?</p>';
    }
  }
}

/* Small helper to avoid breaking the page if a name contains special chars. */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- start everything when the page is ready ---
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
});