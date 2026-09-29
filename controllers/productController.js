// controllers/productController.js
// Handles "products" requests: reading the catalog from the database and
// returning it as JSON. Products are NEVER hardcoded in the HTML — they
// come from here, together with the filter options the shop page needs.

const db = require('../database/database');
const config = require('../config');

// Whitelisted sort options -> the SQL used to order the result.
const SORT_OPTIONS = {
  featured: "CASE badge WHEN 'Bestseller' THEN 0 WHEN 'New' THEN 1 ELSE 2 END, created_at DESC",
  newest: 'created_at DESC, id DESC',
  'price-asc': 'price ASC',
  'price-desc': 'price DESC',
  name: 'name ASC'
};

const COLUMNS = `id, name, description, price, original_price, image, stock,
                 category, material, badge, sizes, colors`;

// The sizes/colors columns hold JSON, so they are turned into real
// arrays before being sent to the browser.
function decorate(row) {
  const onSale = row.original_price != null && row.original_price > row.price;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    originalPrice: row.original_price,
    onSale,
    discount: onSale ? Math.round((1 - row.price / row.original_price) * 100) : 0,
    image: row.image,
    stock: row.stock,
    category: row.category,
    material: row.material,
    badge: row.badge,
    sizes: JSON.parse(row.sizes || '[]'),
    colors: JSON.parse(row.colors || '[]')
  };
}

// Turns the query string into a SQL WHERE clause (+ its parameters).
// Supported filters: ?category=Tops,Sweats  ?size=L  ?color=Black  ?q=linen
function buildFilters(filters) {
  const clauses = [];
  const params = [];

  if (filters.category) {
    const list = String(filters.category)
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    if (list.length > 0) {
      clauses.push(`category IN (${list.map(() => '?').join(', ')})`);
      params.push(...list);
    }
  }

  // Sizes and colors are JSON arrays of exact labels, so matching the
  // quoted label ("L", "Black") is enough — no JSON extension needed.
  if (filters.size) {
    clauses.push('sizes LIKE ?');
    params.push(`%"${filters.size}"%`);
  }

  if (filters.color) {
    clauses.push('colors LIKE ?');
    params.push(`%"${filters.color}"%`);
  }

  if (filters.q) {
    clauses.push(
      '(name LIKE ? OR description LIKE ? OR category LIKE ? OR material LIKE ? OR colors LIKE ?)'
    );
    const like = `%${filters.q}%`;
    params.push(like, like, like, like, like);
  }

  return { where: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

// Counts a JSON column's values across a set of products.
function countJsonValues(rows, key) {
  const counts = new Map();

  for (const row of rows) {
    for (const value of JSON.parse(row[key] || '[]')) {
      const name = typeof value === 'string' ? value : value.name;
      const existing = counts.get(name);
      counts.set(name, {
        name,
        hex: existing ? existing.hex : value.hex,
        count: (existing ? existing.count : 0) + 1
      });
    }
  }

  return [...counts.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// GET /api/products -> the catalog, filtered / sorted, plus the filter options
exports.getAllProducts = (req, res) => {
  const { category, size, color, q, sort } = req.query;

  // The order string comes from the whitelist above, never from the client.
  const orderBy = SORT_OPTIONS[sort] || SORT_OPTIONS.featured;
  const filters = buildFilters({ category, size, color, q });

  const rows = db
    .prepare(`SELECT ${COLUMNS} FROM products ${filters.where} ORDER BY ${orderBy}`)
    .all(...filters.params);

  // Each filter group counts its options without applying its own filter,
  // so choosing one colour never hides the other sizes.
  const categoryFilters = buildFilters({ size, color, q });
  const sizeFilters = buildFilters({ category, color, q });
  const colorFilters = buildFilters({ category, size, q });

  const facets = {
    categories: db
      .prepare(
        `SELECT category AS name, COUNT(*) AS count FROM products ${categoryFilters.where} GROUP BY category ORDER BY category`
      )
      .all(...categoryFilters.params),
    sizes: countJsonValues(
      db.prepare(`SELECT sizes FROM products ${sizeFilters.where}`).all(...sizeFilters.params),
      'sizes'
    ),
    colors: countJsonValues(
      db.prepare(`SELECT colors FROM products ${colorFilters.where}`).all(...colorFilters.params),
      'colors'
    )
  };

  res.json({
    products: rows.map(decorate),
    total: rows.length,
    facets,
    sort: sort && SORT_OPTIONS[sort] ? sort : 'featured',
    store: {
      brand: config.brand,
      freeShippingThreshold: config.freeShippingThreshold
    }
  });
};

// GET /api/products/:id -> one product plus a few pieces to pair it with
exports.getProductById = (req, res) => {
  const id = Number(req.params.id);

  // Validate the ID to avoid nasty SQL / bad input.
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid product ID.' });
  }

  const row = db.prepare(`SELECT ${COLUMNS} FROM products WHERE id = ?`).get(id);

  if (!row) {
    return res.status(404).json({ message: 'Product not found.' });
  }

  const product = decorate(row);

  // "Wear it with" — same category first, then anything else.
  const related = db
    .prepare(
      `SELECT ${COLUMNS} FROM products
       WHERE id != ?
       ORDER BY CASE WHEN category = ? THEN 0 ELSE 1 END, created_at DESC
       LIMIT 4`
    )
    .all(id, product.category)
    .map(decorate);

  res.json({ product, related });
};
