// database/seed.js
// Fills the database with the ATLAS SUPPLY CO. clothing catalog.
// Run it with:  npm run seed   (or: node database/seed.js)

const db = require('./database');

// Sizes reused across the catalog.
const TOPS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const WAIST = ['28', '30', '32', '34', '36'];
const SHOE = ['39', '40', '41', '42', '43', '44'];
const ONE = ['One size'];

// Colourways: [name, hex] — the hex drives the swatch in the UI.
const BLACK = ['Black', '#1c1b19'];
const BONE = ['Bone', '#e8e2d6'];
const OAT = ['Oat', '#d6c7ab'];
const CLAY = ['Clay', '#b26a4c'];
const SAGE = ['Sage', '#8c9a84'];
const STONE = ['Stone', '#9c988f'];
const INDIGO = ['Indigo', '#3a4a6b'];
const ESPRESSO = ['Espresso', '#3b2a21'];
const NAVY = ['Navy', '#22304a'];
const FOREST = ['Forest', '#2e3d33'];

// The catalog: [name, description, price, originalPrice|null, image, stock,
//               category, material, badge|null, sizes, colors, daysAgo]
const products = [
  [
    'Heavyweight Cotton Tee',
    'A 240gsm organic cotton tee with a clean shoulder line and a boxy-but-not-oversized cut. It keeps its shape after every wash, which is exactly the point.',
    3500,
    null,
    '/images/products/1-heavyweight-tee.svg',
    64,
    'Tops',
    '240gsm organic cotton',
    'Bestseller',
    TOPS,
    [BLACK, BONE, SAGE],
    12
  ],
  [
    'Boxy Pocket Tee',
    'Slightly cropped, slightly wider, with a single chest pocket. Woven from 220gsm combed cotton so it stays opaque and soft from the very first wear.',
    3800,
    null,
    '/images/products/2-pocket-tee.svg',
    46,
    'Tops',
    '220gsm combed cotton',
    null,
    TOPS,
    [BONE, CLAY, BLACK],
    30
  ],
  [
    'Ribbed Long Sleeve',
    'A second-skin rib in a cotton-modal blend. Long enough to push up, good enough to wear alone. The neckline holds its shape thanks to a reinforced collar.',
    5200,
    null,
    '/images/products/3-long-sleeve.svg',
    38,
    'Tops',
    'Cotton-modal rib',
    'New',
    TOPS,
    [ESPRESSO, BONE],
    4
  ],
  [
    'Boxy Hoodie',
    '400gsm brushed-back fleece with a double-layer hood, ribbed cuffs and a hidden phone pocket. Cut wide through the body so it layers over everything.',
    12800,
    14800,
    '/images/products/4-boxy-hoodie.svg',
    30,
    'Sweats',
    '400gsm brushed fleece',
    'Bestseller',
    TOPS,
    [BONE, BLACK, FOREST],
    20
  ],
  [
    'Zip-Through Sweatshirt',
    'A quarter-zip layer with a funnel neck and a brushed interior. The zip is a real YKK reverse coil, not a plastic novelty.',
    14200,
    null,
    '/images/products/5-zip-sweatshirt.svg',
    26,
    'Sweats',
    '360gsm loopback cotton',
    null,
    TOPS,
    [STONE, FOREST, BLACK],
    16
  ],
  [
    'Lambswool Crewneck',
    'Spun from 100% lambswool with a fully-fashioned shoulder, so there are no knitted-in side seams to twist in the wash. Warm, never scratchy.',
    16500,
    19500,
    '/images/products/6-lambswool-crewneck.svg',
    18,
    'Knitwear',
    '100% lambswool',
    null,
    TOPS,
    [OAT, BLACK],
    26
  ],
  [
    'Shaker Cardigan',
    'The classic 5-gauge shaker knit, reworked with a clean placket and corozo buttons. Wear it buttoned as a layer or open over a tee.',
    18900,
    null,
    '/images/products/7-shaker-cardigan.svg',
    14,
    'Knitwear',
    'Merino blend, 5-gauge',
    null,
    TOPS,
    [BONE, ESPRESSO],
    22
  ],
  [
    'Oversized Denim Jacket',
    '13oz rigid Japanese denim that starts stiff and fades to your own shape. Boxy cut with a dropped shoulder and a chest pocket that actually fits a phone.',
    21000,
    null,
    '/images/products/8-denim-jacket.svg',
    22,
    'Outerwear',
    '13oz rigid Japanese denim',
    null,
    TOPS,
    [INDIGO, BONE],
    34
  ],
  [
    'Utility Chore Coat',
    'A workwear classic in dry-waxed cotton: three patch pockets, bar-tacked stress points and corozo buttons. Built to be worn hard.',
    24500,
    null,
    '/images/products/9-chore-coat.svg',
    12,
    'Outerwear',
    'Dry-waxed cotton canvas',
    'Limited',
    TOPS,
    [ESPRESSO, SAGE],
    8
  ],
  [
    'Belted Trench',
    'Water-repellent cotton gabardine with a storm flap, epaulettes and a removable belt. The kind of coat that makes the rest of the outfit quieter.',
    32000,
    null,
    '/images/products/10-belted-trench.svg',
    10,
    'Outerwear',
    'Cotton gabardine, waxed finish',
    'New',
    ['XS', 'S', 'M', 'L', 'XL'],
    [STONE, BLACK],
    2
  ],
  [
    'Wide Pleat Trouser',
    'Double forward pleats, a high rise and a full-length wide leg. Cut from a dry-touch Tencel blend that resists creasing on long days.',
    15800,
    null,
    '/images/products/11-wide-pleat-trouser.svg',
    32,
    'Trousers',
    'Tencel blend suiting',
    null,
    WAIST,
    [BLACK, STONE, ESPRESSO],
    18
  ],
  [
    'Straight Selvedge Jean',
    '14.5oz selvedge denim in a straight leg with a mid rise. Chain-stitched hem, hidden rivets at the back pockets, copper hardware.',
    16800,
    18800,
    '/images/products/12-straight-jean.svg',
    40,
    'Trousers',
    '14.5oz selvedge denim',
    'Bestseller',
    WAIST,
    [INDIGO, BLACK],
    40
  ],
  [
    'Stretch Chino',
    'A 2% stretch chino that moves with you, finished with a garment-dyed colour and slash pockets. Works with sneakers or boots.',
    11800,
    null,
    '/images/products/13-stretch-chino.svg',
    48,
    'Trousers',
    'Cotton twill, 2% stretch',
    null,
    WAIST,
    [STONE, NAVY, SAGE],
    28
  ],
  [
    'Court Sneaker',
    'A low-profile court shoe on a vulcanised rubber sole, with a perforated toe box and a cork-blend footbed. Quiet enough for the office.',
    14500,
    null,
    '/images/products/14-court-sneaker.svg',
    35,
    'Shoes',
    'Full-grain leather upper',
    null,
    SHOE,
    [BONE, BLACK, SAGE],
    14
  ],
  [
    'Everyday Canvas Tote',
    '18oz canvas with reinforced webbing handles and an internal zip pocket. Flat-folds into itself when you are done with it.',
    6500,
    null,
    '/images/products/15-canvas-tote.svg',
    60,
    'Accessories',
    '18oz cotton canvas',
    null,
    ONE,
    [BONE, BLACK],
    24
  ],
  [
    'Ribbed Beanie',
    'A fine-gauge rib beanie with a deep fold-up cuff. Merino blend, so it keeps working when the temperature drops below zero.',
    2800,
    null,
    '/images/products/16-ribbed-beanie.svg',
    50,
    'Accessories',
    'Merino blend rib',
    'New',
    ONE,
    [BLACK, OAT, FOREST],
    3
  ],
  [
    'Wool Blend Cap',
    'A six-panel unstructured cap in a wool-nylon blend with a soft brim you can fold into a pocket. Brass slider, no plastic.',
    4500,
    null,
    '/images/products/17-wool-cap.svg',
    45,
    'Accessories',
    'Wool-nylon blend',
    null,
    ONE,
    [STONE, ESPRESSO, NAVY],
    19
  ]
];

// --- start from a clean demo state ----------------------------------
// Carts and past orders point at products, so they are cleared first
// (the catalog is rebuilt from scratch on every seed run).
db.exec(`
  DELETE FROM cart;
  DELETE FROM order_items;
  DELETE FROM orders;
  DELETE FROM products;
`);

// Insert every product, stamping created_at so "newest" sorting means something.
const insert = db.prepare(
  `INSERT INTO products
     (name, description, price, original_price, image, stock, category,
      material, badge, sizes, colors, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))`
);

const seedAll = db.transaction(() => {
  for (const p of products) {
    const [name, description, price, originalPrice, image, stock, category, material, badge, sizes, colors, daysAgo] =
      p;

    insert.run(
      name,
      description,
      price,
      originalPrice,
      image,
      stock,
      category,
      material,
      badge,
      JSON.stringify(sizes),
      JSON.stringify(colors.map(([name, hex]) => ({ name, hex }))),
      `-${daysAgo} days`
    );
  }
});

seedAll();

const count = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
const categories = db
  .prepare('SELECT category, COUNT(*) AS n FROM products GROUP BY category ORDER BY category')
  .all()
  .map((c) => `${c.category} (${c.n})`)
  .join(', ');

console.log(`Seeded ${count} garments — ${categories}`);
