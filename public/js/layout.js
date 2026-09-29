// js/layout.js — the shared header (menu bar) and footer.
// Loaded on every page, BEFORE main.js. Each page only ships two empty
// placeholders:
//
//   <div id="site-header"></div>
//   <div id="site-footer"></div>
//
// so the menu and the footer are written exactly once, here.

(function () {
  const BRAND = 'ShopEasy';

  // Keep these copy bits in sync with config.js on the server.
  const FREE_SHIPPING = '$150'; // config.freeShippingThreshold (15000 cents)
  const SHIPPING_STANDARD = '$9'; // config.shippingStandard
  const SHIPPING_EXPRESS = '$19'; // config.shippingExpress

  const ICON = {
    chevron:
      '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">' +
      '<path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>',
    search:
      '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">' +
      '<circle cx="9" cy="9" r="5.25" fill="none" stroke="currentColor" stroke-width="1.7"/>' +
      '<path d="m13 13 4 4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    up:
      '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">' +
      '<path d="M10 15V5m0 0-4.5 4.5M10 5l4.5 4.5" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  /* ------------------------------------------------------------------
     markup
  ------------------------------------------------------------------- */

  function headerTemplate() {
    return `
    <a class="skip-link" href="#main">Skip to main content</a>

    <div class="announce">
      <div class="container announce-inner">
        <span>Free shipping on orders over ${FREE_SHIPPING}</span>
        <span class="announce-sep" aria-hidden="true">&middot;</span>
        <span>30-day returns on everything</span>
      </div>
    </div>

    <header class="navbar">
      <div class="container nav-inner">
        <a href="/index.html" class="brand">${BRAND}</a>

        <button class="nav-toggle" id="navToggle" type="button"
                aria-label="Menu" aria-expanded="false" aria-controls="navLinks">
          <span class="nav-toggle-icon" aria-hidden="true"></span>
        </button>

        <div class="nav-links" id="navLinks">
          <a class="nav-link" href="/index.html" data-page="/index.html">Home</a>

          <div class="nav-item">
            <button class="nav-link nav-link-btn" id="shopToggle" type="button"
                    aria-expanded="false" aria-controls="shopMenu">
              Shop ${ICON.chevron}
            </button>
            <div class="nav-menu" id="shopMenu">
              <a href="/index.html#products">All products</a>
              <a href="/index.html?sort=newest">New arrivals</a>
              <div class="nav-menu-divider" role="separator"></div>
              <p class="nav-menu-label" id="categoryMenuLabel">Categories</p>
              <div class="nav-menu-list" data-category-menu aria-labelledby="categoryMenuLabel"></div>
            </div>
          </div>

          <a class="nav-link" href="/cart.html" data-page="/cart.html">
            Cart <span class="cart-badge" id="cartBadge" hidden>0</span>
          </a>

          <form class="nav-search" action="/index.html" method="get" role="search">
            <label class="sr-only" for="navSearch">Search products</label>
            <input type="search" id="navSearch" name="q" placeholder="Search products" autocomplete="off">
            <button type="submit" aria-label="Search products">${ICON.search}</button>
          </form>

          <span class="nav-auth" id="authArea"></span>
        </div>
      </div>
    </header>`;
  }

  function footerTemplate() {
    const year = new Date().getFullYear();

    return `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a class="brand footer-logo" href="/index.html">${BRAND}</a>
            <p class="footer-text">
              A small shop for considered basics. Everything is picked to last, packed by hand
              and shipped the day you order it.
            </p>

            <form class="footer-newsletter" id="newsletterForm" novalidate>
              <label class="footer-label" for="newsletterEmail">Get 10% off your first order</label>
              <div class="newsletter-row">
                <input type="email" id="newsletterEmail" name="email"
                       placeholder="you@example.com" autocomplete="email">
                <button class="btn btn-primary" type="submit">Subscribe</button>
              </div>
              <p class="newsletter-msg" id="newsletterMsg" role="status"></p>
            </form>
          </div>

          <nav class="footer-col" aria-labelledby="footerShopTitle">
            <h2 class="footer-title" id="footerShopTitle">Shop</h2>
            <ul>
              <li><a href="/index.html#products">All products</a></li>
              <li><a href="/index.html?sort=newest">New arrivals</a></li>
              <li><a href="/index.html?sort=price-asc">Price: low to high</a></li>
              <li><a href="/index.html?sort=price-desc">Price: high to low</a></li>
            </ul>
          </nav>

          <nav class="footer-col" aria-labelledby="footerCategoryTitle">
            <h2 class="footer-title" id="footerCategoryTitle">Categories</h2>
            <ul data-category-menu></ul>
          </nav>

          <nav class="footer-col" aria-labelledby="footerAccountTitle">
            <h2 class="footer-title" id="footerAccountTitle">Account</h2>
            <ul>
              <li><a href="/cart.html">Your cart</a></li>
              <li><a href="/checkout.html">Checkout</a></li>
              <li><a href="/login.html">Log in</a></li>
              <li><a href="/register.html">Create an account</a></li>
              <li><a href="/order-success.html">Order confirmation</a></li>
            </ul>
          </nav>
        </div>

        <div class="footer-help">
          <h2 class="footer-title">Need help?</h2>
          <div class="footer-accordions">
            <details class="footer-accordion">
              <summary>Shipping</summary>
              <p>
                Standard shipping is ${SHIPPING_STANDARD} and free on orders over ${FREE_SHIPPING}.
                Express shipping is ${SHIPPING_EXPRESS} and arrives in 1&ndash;2 working days.
                Everything is dispatched from our warehouse the same day you order.
              </p>
            </details>
            <details class="footer-accordion">
              <summary>Returns &amp; exchanges</summary>
              <p>
                You have 30 days to send anything back, unworn and with the tags still on.
                Exchanges are free, refunds land on the original payment method within 5 days.
              </p>
            </details>
            <details class="footer-accordion">
              <summary>Sizes &amp; fit</summary>
              <p>
                Our pieces fit true to size. Between two sizes? Take the larger one for a relaxed
                fit, the smaller one for a close one. Every product page lists the exact sizes offered.
              </p>
            </details>
            <details class="footer-accordion">
              <summary>About this demo</summary>
              <p>
                ${BRAND} is a university project. No real payment is taken and no order is
                shipped &mdash; the whole shop runs locally against a SQLite database.
              </p>
            </details>
          </div>
        </div>

        <div class="footer-bottom">
          <p>&copy; ${year} ${BRAND} &mdash; university project demo</p>
          <ul class="pay-chips" aria-label="Accepted payment methods">
            <li>Visa</li>
            <li>Mastercard</li>
            <li>Amex</li>
            <li>PayPal</li>
          </ul>
        </div>
      </div>

      <button class="to-top" id="toTop" type="button" aria-label="Back to top" hidden>
        ${ICON.up}
      </button>
    </footer>`;
  }

  /* ------------------------------------------------------------------
     menu behaviour
  ------------------------------------------------------------------- */

  const isDesktop = () => window.matchMedia('(min-width: 901px)').matches;

  function openShopMenu(open) {
    const menu = document.getElementById('shopMenu');
    const button = document.getElementById('shopToggle');
    if (!menu || !button) return;
    menu.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
  }

  function closeDrawer() {
    const links = document.getElementById('navLinks');
    const toggle = document.getElementById('navToggle');
    if (!links || !toggle) return;
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  }

  function setupMenu() {
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    const shopItem = document.getElementById('shopToggle');

    // --- hamburger (mobile) ---
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        const open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('nav-open', open);
        if (!open) openShopMenu(false);
      });

      // Following any link should close the drawer again.
      links.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeDrawer));
    }

    if (!shopItem) return;
    const item = shopItem.closest('.nav-item');
    if (!item) return;

    // --- the Shop dropdown: click works everywhere, hover on desktop ---
    shopItem.addEventListener('click', () => {
      openShopMenu(!document.getElementById('shopMenu').classList.contains('open'));
    });

    item.addEventListener('mouseenter', () => isDesktop() && openShopMenu(true));
    item.addEventListener('mouseleave', () => isDesktop() && openShopMenu(false));

    // Clicking anywhere else closes it.
    document.addEventListener('click', (event) => {
      if (!item.contains(event.target)) openShopMenu(false);
    });

    // Escape closes the dropdown and the drawer.
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      openShopMenu(false);
      closeDrawer();
    });
  }

  /* ------------------------------------------------------------------
     active link + logged-in state
  ------------------------------------------------------------------- */

  function markActiveLinks() {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    document.querySelectorAll('[data-page]').forEach((link) => {
      if (link.dataset.page === path) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });

    // A filtered catalog still counts as being inside the Shop menu.
    const shop = document.getElementById('shopToggle');
    if (shop && path === '/index.html' && (params.has('category') || params.has('q') || params.has('sort'))) {
      shop.classList.add('active');
    }

    // Keep the typed search term in the box when coming back from a search.
    const search = document.getElementById('navSearch');
    if (search && params.get('q')) search.value = params.get('q');
  }

  async function renderAuthArea() {
    const area = document.getElementById('authArea');
    if (!area) return;

    try {
      const data = await api('/api/auth/me');
      const firstName = String(data.user.name).split(' ')[0];

      area.innerHTML = `
        <a class="nav-link" href="/cart.html">${escapeHtml(firstName)}</a>
        <button class="nav-logout" id="logoutBtn" type="button">Log out</button>
      `;

      document.getElementById('logoutBtn').addEventListener('click', async () => {
        await api('/api/auth/logout', { method: 'POST' });
        window.location.href = '/index.html';
      });
    } catch (err) {
      area.innerHTML = `
        <a class="nav-link" href="/login.html" data-page="/login.html">Log in</a>
        <a class="nav-link nav-cta" href="/register.html" data-page="/register.html">Sign up</a>
      `;
    }

    markActiveLinks();
    refreshCartBadge();
  }

  /* ------------------------------------------------------------------
     category lists (nav dropdown + footer column)
  ------------------------------------------------------------------- */

  let categoriesRequested = false;

  async function loadCategories() {
    if (categoriesRequested) return;
    categoriesRequested = true;

    const targets = document.querySelectorAll('[data-category-menu]');
    if (targets.length === 0) return;

    try {
      const data = await api('/api/products');

      // One <a> per category — wrapped in <li> when it goes into a <ul>.
      const items = data.facets.categories.map(
        (c) =>
          `<a href="/index.html?category=${encodeURIComponent(c.name)}">${escapeHtml(c.name)}` +
          `<span class="nav-menu-count">${c.count}</span></a>`
      );

      targets.forEach((target) => {
        target.innerHTML =
          target.tagName === 'UL' ? items.map((a) => `<li>${a}</li>`).join('') : items.join('');
      });
    } catch (err) {
      // The menu still works without the category list, so just stop trying.
    }
  }

  /* ------------------------------------------------------------------
     newsletter + back to top
  ------------------------------------------------------------------- */

  function setupNewsletter() {
    const form = document.getElementById('newsletterForm');
    const message = document.getElementById('newsletterMsg');
    if (!form || !message) return;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = form.elements.email.value.trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        message.textContent = 'Please enter a valid email address.';
        message.className = 'newsletter-msg is-error';
        return;
      }

      message.textContent = 'Thanks! Your 10% code is on its way.';
      message.className = 'newsletter-msg is-success';
      form.reset();
    });
  }

  function setupToTop() {
    const button = document.getElementById('toTop');
    if (!button) return;

    window.addEventListener(
      'scroll',
      () => {
        button.hidden = window.scrollY < 400;
      },
      { passive: true }
    );

    button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ------------------------------------------------------------------
     boot
  ------------------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('site-header');
    const footer = document.getElementById('site-footer');

    if (header) header.innerHTML = headerTemplate();
    if (footer) footer.innerHTML = footerTemplate();

    setupMenu();
    markActiveLinks();
    renderAuthArea();
    setupNewsletter();
    setupToTop();
    loadCategories();
  });
})();
