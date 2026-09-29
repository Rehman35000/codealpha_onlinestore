// config.js — store-wide settings shared by the backend and the frontend copy.
// Prices are always integers in CENTS (3450 means $34.50).

module.exports = {
  // Brand shown in page titles, emails and the order summary.
  brand: 'ATLAS SUPPLY CO.',

  // Shipping rules. Orders at or above the threshold ship free.
  freeShippingThreshold: 15000, // $150.00
  shippingStandard: 900, // $9.00
  shippingExpress: 1900, // $19.00

  currency: 'USD'
};
