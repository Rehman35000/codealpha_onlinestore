// js/checkout.js — logic for checkout.html and order-success.html.

document.addEventListener('DOMContentLoaded', async () => {
  // ===================== ORDER SUCCESS PAGE =====================
  const successBox = document.getElementById('orderSuccess');
  if (successBox) {
    await showOrderSuccess();
    return;
  }

  // ===================== CHECKOUT PAGE =========================
  const checkoutContent = document.getElementById('checkoutContent');

  try {
    // Requires login (the cart routes already make sure of this).
    const [me, cart] = await Promise.all([
      api('/api/auth/me'),
      api('/api/cart')
    ]);

    // Empty cart -> nothing to check out.
    if (cart.items.length === 0) {
      checkoutContent.innerHTML = `
        <div class="empty-cart">
          <p style="font-size:1.1rem">Your cart is empty.</p>
          <a href="/index.html" class="btn btn-primary">Start shopping</a>
        </div>
      `;
      return;
    }

    // Pre-fill the customer info with the account details.
    checkoutContent.innerHTML = `
      <div class="checkout-layout">
        <form id="checkoutForm" class="checkout-card" novalidate>
          <h2 style="margin-bottom:1rem">Shipping details</h2>
          <div id="message"></div>

          <div class="form-group">
            <label for="name">Full name</label>
            <input type="text" id="name" name="name" value="${escapeHtml(me.user.name)}" required>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" value="${escapeHtml(me.user.email)}" required>
          </div>
          <div class="form-group">
            <label for="phone">Phone</label>
            <input type="tel" id="phone" name="phone" placeholder="e.g. +1 555 000 1234" required>
          </div>
          <div class="form-group">
            <label for="address">Address</label>
            <textarea id="address" name="address" rows="3" placeholder="Street, city, postal code..." required></textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-block" id="placeBtn">Place order</button>
        </form>

        <aside class="checkout-card">
          <h2 style="margin-bottom:0.8rem">Your order</h2>
          <div class="checkout-items">
            ${cart.items.map((i) => `
              <div class="checkout-item-row">
                <span>${escapeHtml(i.name)} &times; ${i.quantity}</span>
                <span>${formatPrice(i.lineTotal)}</span>
              </div>
            `).join('')}
          </div>
          <div class="summary-row total">
            <span>Total</span>
            <span>${formatPrice(cart.total)}</span>
          </div>
        </aside>
      </div>
    `;

    // ---- submit the order ----
    document.getElementById('checkoutForm').addEventListener('submit', async (event) => {
      event.preventDefault();

      const btn = document.getElementById('placeBtn');
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const address = document.getElementById('address').value.trim();

      if (!name || !email || !phone || !address) {
        showAlert('message', 'Please fill in all fields.', 'error');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Placing order&hellip;';

      try {
        // The server recalculates the total and clears the cart on success.
        const result = await api('/api/orders', {
          method: 'POST',
          body: { name, email, phone, address }
        });
        window.location.href = '/order-success.html?orderId=' + result.order.id;
      } catch (err) {
        showAlert('message', err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Place order';
      }
    });
  } catch (err) {
    if (err.status === 401) {
      window.location.href = '/login.html';
    } else {
      checkoutContent.innerHTML = `<p class="muted">Could not load checkout.</p>`;
    }
  }
});

// ===================== ORDER SUCCESS PAGE ========================
async function showOrderSuccess() {
  const info = document.getElementById('orderInfo');
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId');

  if (!orderId) {
    info.textContent = 'No order reference found.';
    return;
  }

  try {
    // Fetch the order to show the ID + server-computed total.
    const data = await api('/api/orders/' + orderId);
    info.innerHTML = `
      Your order <strong>#${data.order.id}</strong> was placed successfully.
      <br>Total charged: <strong>${formatPrice(data.order.total)}</strong>
      <br><span class="muted">Shipping details and order items are saved in the database.</span>
    `;
    document.getElementById('orderSuccess').hidden = false;
  } catch (err) {
    if (err.status === 401) {
      window.location.href = '/login.html';
    } else {
      info.textContent = 'Could not load the order details.';
    }
  }
}