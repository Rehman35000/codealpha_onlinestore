// server.js — the entry point of the application.
// It creates the Express app, wires up middleware, routes and starts listening.

const path = require('path');
const express = require('express');
const session = require('express-session');
require('dotenv').config(); // loads secret values from the .env file

// --- import route modules (each one handles a group of /api URLs) ---
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// --- top-level middleware -------------------------------------------
// Lets Express read JSON + form data sent by the frontend.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions: keep the user logged in between requests via a signed cookie.
// req.session.userId is set on login and checked by requireAuth.
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 } // 1 day
  })
);

// API routes first so they always match (before static files).
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Any other /api/... path that was not matched above -> 404.
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

// Serve the public folder (HTML, CSS, JS, images) for the browser.
app.use(express.static(path.join(__dirname, 'public')));

// Central error handler — catches errors thrown by any route above.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

// --- start the server ------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});