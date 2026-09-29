// database/database.js
// Creates the database connection and all the tables (if they don't already exist).
// Uses better-sqlite3, which is a simple, synchronous SQLite driver — easy to follow.

const path = require('path');
const Database = require('better-sqlite3');

// The database file (store.db) lives in the project root.
const dbPath = path.join(__dirname, '..', 'store.db');
const db = new Database(dbPath);

// Good defaults for SQLite.
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables if they do not exist yet.
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL UNIQUE,
  password   TEXT    NOT NULL,                 -- bcrypt hash (never plain text!)
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT    NOT NULL,
  description    TEXT    NOT NULL,
  price          INTEGER NOT NULL,             -- price in CENTS (3499 means $34.99)
  original_price INTEGER,                      -- "was" price in cents, NULL when not on sale
  image          TEXT    NOT NULL,             -- relative path to an image file
  stock          INTEGER NOT NULL DEFAULT 0,
  category       TEXT    NOT NULL DEFAULT 'Essentials',
  material       TEXT    NOT NULL DEFAULT '',
  badge          TEXT,                         -- 'New' | 'Bestseller' | 'Limited' | NULL
  sizes          TEXT    NOT NULL DEFAULT '[]',-- JSON array of size labels, e.g. ["S","M","L"]
  colors         TEXT    NOT NULL DEFAULT '[]',-- JSON array of { name, hex } colourways
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL,
  subtotal      INTEGER NOT NULL DEFAULT 0,    -- items only, in cents
  shipping      INTEGER NOT NULL DEFAULT 0,    -- shipping cost in cents
  total         INTEGER NOT NULL,              -- subtotal + shipping, computed on the server
  status        TEXT    NOT NULL DEFAULT 'placed',
  payment       TEXT    NOT NULL DEFAULT 'card',
  customer_name TEXT    NOT NULL,
  email         TEXT    NOT NULL,
  phone         TEXT    NOT NULL,
  address       TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  size       TEXT    NOT NULL DEFAULT '',      -- size chosen at the time of purchase
  color      TEXT    NOT NULL DEFAULT '',      -- colourway name chosen at the time of purchase
  quantity   INTEGER NOT NULL,
  price      INTEGER NOT NULL,                 -- price of one unit at the time of purchase
  FOREIGN KEY (order_id)   REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS cart (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  size       TEXT    NOT NULL DEFAULT '',      -- one cart row per product + size + colour
  color      TEXT    NOT NULL DEFAULT '',
  quantity   INTEGER NOT NULL DEFAULT 1,
  UNIQUE (user_id, product_id, size, color),  -- one row per variant
  FOREIGN KEY (user_id)    REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
`);

/* ------------------------------------------------------------------
   Small migrations.
   SQLite cannot add UNIQUE constraints to an existing table, so the
   cart is simply rebuilt when it still has the old shape (a cart is
   throw-away data, nothing valuable is lost). Everything else is
   added column by column, which keeps existing orders intact.
------------------------------------------------------------------- */
function columnsOf(table) {
  return db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
}

function addColumnIfMissing(table, column, definition) {
  if (!columnsOf(table).includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// products gained the clothing attributes
addColumnIfMissing('products', 'original_price', 'INTEGER');
addColumnIfMissing('products', 'category', "TEXT NOT NULL DEFAULT 'Essentials'");
addColumnIfMissing('products', 'material', "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('products', 'badge', 'TEXT');
addColumnIfMissing('products', 'sizes', "TEXT NOT NULL DEFAULT '[]'");
addColumnIfMissing('products', 'colors', "TEXT NOT NULL DEFAULT '[]'");

// orders gained a split subtotal / shipping
addColumnIfMissing('orders', 'subtotal', 'INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('orders', 'shipping', 'INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('orders', 'payment', "TEXT NOT NULL DEFAULT 'card'");

// order items remember the chosen size + colour
addColumnIfMissing('order_items', 'size', "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('order_items', 'color', "TEXT NOT NULL DEFAULT ''");

// the cart only has to be rebuilt when it is missing the variant columns
if (!columnsOf('cart').includes('size')) {
  db.exec(`
    DROP TABLE IF EXISTS cart_lines_old;
    CREATE TABLE cart_lines_old (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      size       TEXT    NOT NULL DEFAULT '',
      color      TEXT    NOT NULL DEFAULT '',
      quantity   INTEGER NOT NULL DEFAULT 1,
      UNIQUE (user_id, product_id, size, color),
      FOREIGN KEY (user_id)    REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
    INSERT INTO cart_lines_old (id, user_id, product_id, quantity)
      SELECT id, user_id, product_id, quantity FROM cart;
    DROP TABLE cart;
    ALTER TABLE cart_lines_old RENAME TO cart;
  `);
}

module.exports = db;
