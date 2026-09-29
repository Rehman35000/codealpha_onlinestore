// controllers/authController.js
// Handles registration, login, logout and "who am I" checks.

const bcrypt = require('bcryptjs'); // hashing library for passwords
const db = require('../database/database');

// Helper that builds the public "user" object.
// We NEVER send the password hash back to the browser.
function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

// POST /api/auth/register
exports.register = (req, res) => {
  const name = req.body.name?.trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = req.body.password;

  // --- input validation ---------------------------------------
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  // --- duplicate email check -----------------------------------
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  // --- create the user ------------------------------------------
  // bcrypt hashSync scrambles the password with 10 "salt rounds".
  // Only the hash (never the real password) is stored.
  const passwordHash = bcrypt.hashSync(password, 10);

  const info = db
    .prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)')
    .run(name, email, passwordHash);

  const user = { id: info.lastInsertRowid, name, email };

  // Log the new user in straight away by storing their id in the session.
  req.session.userId = user.id;

  res.status(201).json({ message: 'Registration successful.', user });
};

// POST /api/auth/login
exports.login = (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  // Same message for "user not found" and "wrong password" so attackers
  // can't guess which emails are registered.
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  // Start a session for this user.
  req.session.userId = user.id;

  res.json({ message: 'Login successful.', user: publicUser(user) });
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  // Destroy the session (both the cookie and the stored data).
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: 'Could not log out.' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out.' });
  });
};

// GET /api/auth/me -> the currently logged-in user (or 401)
exports.me = (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not logged in.' });
  }

  const user = db
    .prepare('SELECT id, name, email FROM users WHERE id = ?')
    .get(req.session.userId);

  if (!user) {
    return res.status(401).json({ message: 'User not found.' });
  }

  res.json({ user: publicUser(user) });
};