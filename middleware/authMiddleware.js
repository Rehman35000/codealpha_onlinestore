// middleware/authMiddleware.js
// Used to protect routes that need a logged-in user.
// If the visitor is not logged in we return 401 instead of allowing the request.

const db = require('../database/database');

function requireAuth(req, res, next) {
  const userId = req.session.userId;

  // Not logged in -> 401 Unauthorized
  if (!userId) {
    return res.status(401).json({ message: 'You must be logged in to do this.' });
  }

  // Load the user from the database (without the password hash).
  const user = db
    .prepare('SELECT id, name, email FROM users WHERE id = ?')
    .get(userId);

  if (!user) {
    return res.status(401).json({ message: 'User not found. Please log in again.' });
  }

  // Attach the user to the request so controllers can use req.user.
  req.user = user;
  next();
}

module.exports = requireAuth;