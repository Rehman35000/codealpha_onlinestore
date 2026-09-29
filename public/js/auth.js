// js/auth.js — logic for login.html and register.html.

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  // ---- LOGIN ----
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault(); // stop the browser from submitting normally

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      // Tiny bit of client-side validation (the server checks again).
      if (!email || !password) {
        showAlert('message', 'Please fill in both fields.', 'error');
        return;
      }

      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.textContent = 'Logging in&hellip;';

      try {
        await api('/api/auth/login', { method: 'POST', body: { email, password } });
        // Success: go to the home page (the navbar will now show the user).
        window.location.href = '/index.html';
      } catch (err) {
        showAlert('message', err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Log in';
      }
    });
  }

  // ---- REGISTER ----
  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      if (!name || !email || !password) {
        showAlert('message', 'Please fill in all fields.', 'error');
        return;
      }
      if (password.length < 6) {
        showAlert('message', 'Password must be at least 6 characters long.', 'error');
        return;
      }

      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.textContent = 'Creating account&hellip;';

      try {
        await api('/api/auth/register', { method: 'POST', body: { name, email, password } });
        window.location.href = '/index.html';
      } catch (err) {
        // Shows messages like "An account with this email already exists."
        showAlert('message', err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Create account';
      }
    });
  }
});