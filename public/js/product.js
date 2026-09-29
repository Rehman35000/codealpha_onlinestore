// js/product.js — logic for the product details page (product.html).
// Reads the ?id=... from the URL, asks the API for that product and renders it.

document.addEventListener('DOMContentLoaded', async () => {
  // ---- 1. get the product id from the URL (?id=3) ----
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  const container = document.getElementById('productDetail');
  const message = document.getElementById('message');

  if (!productId) {
    showAlert('message', 'No product selected. <a href="/index.html">Go shopping.</a>', 'error');
    return;
  }

  try {
    // ---- 2. fetch the product from the API ----
    const data = await api('/api/products/' + productId);
    const product = data.product;

    // ---- 3. decide the stock badge style ----
    let stockBadge;
    if (product.stock <= 0) {
      stockBadge = '<span class="stock-badge stock-out">Out of stock</span>';
    } else if (product.stock <= 5) {
      stockBadge = `<span class="stock-badge stock-low">Low stock — only ${product.stock} left</span>`;
    } else {
      stockBadge = `<span class="stock-badge stock-ok">In stock (${product.stock} available)</span>`;
    }

    // ---- 4. render the page ----
    container.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <div class="detail-info">
        <h1>${product.name}</h1>
        <div class="detail-price">${formatPrice(product.price)}</div>
        ${stockBadge}
        <p class="detail-desc">${product.description}</p>

        <div class="qty-row">
          <label for="qty" class="muted">Quantity</label>
          <input type="number" id="qty" class="qty-input" value="1" min="1" max="${product.stock}">
        </div>

        <button id="addBtn" class="btn btn-primary" ${product.stock <= 0 ? 'disabled' : ''}>
          Add to Cart
        </button>
      </div>
    `;

    // ---- 5. "Add to Cart" button behaviour ----
    const addBtn = document.getElementById('addBtn');
    addBtn.addEventListener('click', async () => {
      const qty = Number(document.getElementById('qty').value) || 1;

      // Quick check on the client too (the server double-checks anyway).
      if (qty < 1) {
        showAlert('message', 'Quantity must be at least 1.', 'error');
        return;
      }

      addBtn.disabled = true;
      const result = await addToCart(product.id, qty);
      if (result.ok) {
        showAlert('message', 'Product added to cart.', 'success');
      } else if (result.message) {
        showAlert('message', result.message, 'error');
        addBtn.disabled = false;
      }
      // If not logged in, addToCart already redirected us to login.
    });
  } catch (err) {
    if (err.status === 404) {
      showAlert('message', 'Product not found. <a href="/index.html">Back to shop.</a>', 'error');
    } else {
      showAlert('message', err.message, 'error');
    }
  }
});