const { test } = require('node:test');
const assert = require('node:assert/strict');

const pricing = require('../lib/pricing');
const invoice = require('../lib/invoice');

function order(items, coupon = '') {
  return { items, coupon };
}

test('invoice uses checkout HSN rate', () => {
  const items = [{ id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 1000, qty: 1 }];

  const checkout = pricing.computeTotals(items, '');
  const printedInvoice = invoice.computeInvoiceFigures(order(items));

  assert.equal(checkout.tax, 50);
  assert.equal(checkout.total, 1050);
  assert.equal(printedInvoice.rows[0].gstPercent, 5);
  assert.equal(printedInvoice.tax, checkout.tax);
  assert.equal(printedInvoice.total, checkout.total);
});

test('invoice applies percentage coupon to subtotal before HSN tax', () => {
  const items = [{ id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 3000, qty: 1 }];

  const checkout = pricing.computeTotals(items, 'WHOLESALE15');
  const printedInvoice = invoice.computeInvoiceFigures(order(items, 'WHOLESALE15'));

  assert.deepEqual(
    { discount: checkout.discount, tax: checkout.tax, total: checkout.total },
    { discount: 400, tax: 130, total: 2730 }
  );
  assert.deepEqual(
    { discount: printedInvoice.discount, tax: printedInvoice.tax, total: printedInvoice.total },
    { discount: checkout.discount, tax: checkout.tax, total: checkout.total }
  );
});

test('invoice respects flat coupon minimum subtotal', () => {
  const items = [{ id: 2, name: 'Poha', sku: 'POHA-1', hsn: '1104', price: 100, qty: 1 }];

  const checkout = pricing.computeTotals(items, 'FLAT50');
  const printedInvoice = invoice.computeInvoiceFigures(order(items, 'FLAT50'));

  assert.equal(checkout.discount, 0);
  assert.equal(printedInvoice.discount, checkout.discount);
  assert.equal(printedInvoice.total, checkout.total);
});
