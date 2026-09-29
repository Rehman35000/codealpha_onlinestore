// js/cart.js — logic for the shopping cart page (cart.html).

document.addEventListener('DOMContentLoaded', () => {
  loadCart();
});

// Fetches the cart and renders the items + totals.
async function loadCart() {
  const content = document.getElementById('cartContent');

  try {
    const data = await api('/api/cart');

    // Empty cart?
    if (data.items.length === 0) {
      content.innerHTML = `
        <div class="empty-cart">
          <p style="font-size:1.1rem">Your cart is empty.</p>
          <p class="muted">Browse the catalog and add something you like.</p>
          <a href="/index.html" class="btn btn-primary">Start shopping</a>
        </div>
      `;
      return;
    }

    // Render each product row plus a summary box.
    content.innerHTML = `
      <div class="cart-layout">
        <div class="cart-items">${data.items.map(renderItem).join('')}</div>
        <aside class="cart-summary">
          <h2>Summary</h2>
          <div class="summary-row">
            <span>Subtotal</span>
            <span>${formatPrice(data.total)}</span>
          </div>
          <div class="summary-row">
            <span>Items</span>
            <span>${data.count}</span>
          </div>
          <div class="summary-row total">
            <span>Total</span>
            <span>${formatPrice(data.total)}</span>
          </div>
          <a href="/checkout.html" class="btn btn-primary btn-block" style="margin-top:1rem">Proceed to checkout</a>
        </aside>
      </div>
    `;

    // Wire up the +/- and remove buttons.
    document.querySelectorAll('.cart-item').forEach((row) => {
      const productId = Number(row.dataset.productId);
      const qtyEl = row.querySelector('.qty-num');

      row.querySelector('.qty-minus').addEventListener('click', () => {
        updateQuantity(productId, Number(qtyEl.textContent) - 1, row);
      });
      row.querySelector('.qty-plus').addEventListener('click', () => {
        updateQuantity(productId, Number(qtyEl.textContent) + 1, row);
      });
      row.querySelector('.remove-btn').addEventListener('click', async () => {
        try {
          await api('/api/cart/' + productId, { method: 'DELETE' });
          showAlert('message', 'Product removed from cart.', 'success');
          loadCart(); // reload the whole page
        } catch (err) {
          showAlert('message', err.message, 'error');
        }
      });
    });
  } catch (err) {
    // Not logged in (401) -> send them to login.
    if (err.status === 401) {
      window.location.href = '/login.html';
    } else {
      content.innerHTML = `<p class="muted">Could not load your cart.</p>`;
    }
  }
}

// One table row for a single cart item.
function renderItem(item) {
  // Disable the minus button if quantity is 1 (can't go below 1).
  const minusDisabled = item.quantity <= 1 ? 'disabled' : '';

  return `
    <div class="cart-item" data-product-id="${item.productId}">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-info">
        <div class="product-name">${item.name}</div>
        <div class="product-price">${formatPrice(item.price)} each</div>
      </div>
      <div class="qty-control">
        <button class="qty-minus btn-sm" ${minusDisabled} aria-label="Decrease">&minus;</button>
        <span class="qty-num" style="min-width:24px; text-align:center; font-weight:600">${item.quantity}</span>
        <button class="qty-plus btn-sm" aria-label="Increase">&plus;</button>
      </div>
      <div class="cart-line-total">${formatPrice(item.lineTotal)}</div>
      <button class="btn btn-danger btn-sm remove-btn">Remove</button>
    </div>
  `;
}

// Change the quantity of a product in the cart (PUT /api/cart/:productId).
async function updateQuantity(productId, newQty, row) {
  // Reject a quantity below 1 on the client side too.
  if (newQty < 1) return;

  showAlert('message', 'Updating&hellip;', 'success');
  try {
    await api('/api/cart/' + productId, { method: 'PUT', body: { quantity: newQty } });
    loadCart(); // reload to show the new totals
  } catch (err) {
    showAlert('message', err.message, 'error');
    loadCart();
  }
}