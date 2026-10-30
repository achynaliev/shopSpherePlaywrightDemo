import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { HttpError, computeTotals } from '../util.js';
import { requireAuth } from '../middleware/auth.js';
import { getCart } from './cart.js';

// Simulated payment processor: real card data never leaves this request and is never stored.
// Card 4000 0000 0000 0002 always declines so the failure path can be exercised.
const DECLINE_CARD = '4000000000000002';

const digits = (s) => s.replace(/[\s-]/g, '');

function luhnValid(number) {
  let sum = 0;
  let double = false;
  for (let i = number.length - 1; i >= 0; i--) {
    let d = Number(number[i]);
    if (double) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function cardBrand(number) {
  if (/^4/.test(number)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(number)) return 'Mastercard';
  if (/^3[47]/.test(number)) return 'American Express';
  if (/^6(011|5)/.test(number)) return 'Discover';
  return 'Card';
}

const checkoutSchema = z.object({
  shipping: z.object({
    fullName: z.string().trim().min(2, 'Full name is required').max(100),
    line1: z.string().trim().min(3, 'Street address is required').max(200),
    line2: z.string().trim().max(200).optional().default(''),
    city: z.string().trim().min(2, 'City is required').max(100),
    state: z.string().trim().min(2, 'State / region is required').max(100),
    postalCode: z.string().trim().regex(/^[A-Za-z0-9 -]{3,10}$/, 'Enter a valid postal code'),
    country: z.string().trim().min(2, 'Country is required').max(60),
    phone: z.string().trim().max(30).optional().default(''),
  }),
  payment: z.object({
    nameOnCard: z.string().trim().min(2, 'Name on card is required').max(100),
    cardNumber: z.string().transform(digits).pipe(
      z.string().regex(/^\d{13,19}$/, 'Enter a valid card number').refine(luhnValid, 'Card number is invalid'),
    ),
    expMonth: z.coerce.number().int().min(1, 'Invalid expiry month').max(12, 'Invalid expiry month'),
    expYear: z.coerce.number().int().min(2000).max(2100),
    cvc: z.string().regex(/^\d{3,4}$/, 'Enter a valid security code'),
  }),
});

function newOrderNumber() {
  const n = (len) => crypto.randomInt(0, 10 ** len).toString().padStart(len, '0');
  return `${n(3)}-${n(7)}-${n(7)}`;
}

function serializeOrder(order, items) {
  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    subtotal: order.subtotal_cents,
    shipping: order.shipping_cents,
    tax: order.tax_cents,
    total: order.total_cents,
    shippingAddress: {
      fullName: order.ship_name,
      line1: order.ship_line1,
      line2: order.ship_line2,
      city: order.ship_city,
      state: order.ship_state,
      postalCode: order.ship_postal,
      country: order.ship_country,
      phone: order.ship_phone,
    },
    payment: { brand: order.payment_brand, last4: order.payment_last4 },
    createdAt: order.created_at,
    estimatedDelivery: new Date(Date.parse(`${order.created_at.replace(' ', 'T')}Z`) + 4 * 86400000).toISOString(),
    items: items.map((i) => ({
      id: i.id,
      productId: i.product_id,
      slug: i.slug,
      title: i.title,
      emoji: i.emoji,
      colorFrom: i.color_from,
      colorTo: i.color_to,
      price: i.price_cents,
      quantity: i.quantity,
    })),
  };
}

export function ordersRouter(db) {
  const router = Router();
  router.use(requireAuth);

  const itemsFor = db.prepare(
    `SELECT oi.*, p.slug, p.color_from, p.color_to FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ? ORDER BY oi.id`,
  );
  const ownOrder = (req) => {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(Number(req.params.id), req.user.id);
    if (!order) throw new HttpError(404, 'Order not found.');
    return order;
  };

  router.get('/', (req, res) => {
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC').all(req.user.id);
    res.json({ orders: orders.map((o) => serializeOrder(o, itemsFor.all(o.id))) });
  });

  router.get('/:id', (req, res) => {
    const order = ownOrder(req);
    res.json({ order: serializeOrder(order, itemsFor.all(order.id)) });
  });

  router.post('/', (req, res) => {
    const { shipping, payment } = checkoutSchema.parse(req.body);

    const now = new Date();
    const expired = payment.expYear < now.getFullYear()
      || (payment.expYear === now.getFullYear() && payment.expMonth < now.getMonth() + 1);
    if (expired) throw new HttpError(400, 'payment.expYear: Your card has expired');
    if (payment.cardNumber === DECLINE_CARD) throw new HttpError(402, 'Your card was declined. Try a different card.');

    const orderId = db.transaction(() => {
      const cart = getCart(db, req.user.id);
      if (cart.items.length === 0) throw new HttpError(400, 'Your cart is empty.');
      for (const { product, quantity } of cart.items) {
        if (product.stock < quantity) {
          throw new HttpError(409, product.stock === 0
            ? `"${product.title}" is now out of stock. Remove it to continue.`
            : `Only ${product.stock} of "${product.title}" left. Update the quantity to continue.`);
        }
      }

      const totals = computeTotals(cart.subtotal);
      const { lastInsertRowid } = db.prepare(
        `INSERT INTO orders (order_number, user_id, subtotal_cents, shipping_cents, tax_cents, total_cents,
           ship_name, ship_line1, ship_line2, ship_city, ship_state, ship_postal, ship_country, ship_phone,
           payment_brand, payment_last4)
         VALUES (@orderNumber, @userId, @subtotal, @shipping, @tax, @total,
           @fullName, @line1, @line2, @city, @state, @postalCode, @country, @phone, @brand, @last4)`,
      ).run({
        orderNumber: newOrderNumber(),
        userId: req.user.id,
        ...totals,
        ...shipping,
        brand: cardBrand(payment.cardNumber),
        last4: payment.cardNumber.slice(-4),
      });

      const insertItem = db.prepare(
        'INSERT INTO order_items (order_id, product_id, title, emoji, price_cents, quantity) VALUES (?, ?, ?, ?, ?, ?)',
      );
      const decrement = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
      for (const { product, quantity } of cart.items) {
        insertItem.run(lastInsertRowid, product.id, product.title, product.emoji, product.price, quantity);
        decrement.run(quantity, product.id);
      }
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
      return lastInsertRowid;
    })();

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    res.status(201).json({ order: serializeOrder(order, itemsFor.all(orderId)) });
  });

  router.post('/:id/cancel', (req, res) => {
    const order = ownOrder(req);
    if (order.status !== 'placed') throw new HttpError(409, `This order is ${order.status} and can no longer be cancelled.`);
    db.transaction(() => {
      db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(order.id);
      const restock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
      for (const item of itemsFor.all(order.id)) {
        if (item.product_id) restock.run(item.quantity, item.product_id);
      }
    })();
    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
    res.json({ order: serializeOrder(updated, itemsFor.all(order.id)) });
  });

  return router;
}
