import { Router } from 'express';
import { z } from 'zod';
import { HttpError, computeTotals, toProduct } from '../util.js';
import { requireAuth } from '../middleware/auth.js';

const MAX_QTY = 10;

const addSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(MAX_QTY).default(1),
});
const updateSchema = z.object({ quantity: z.coerce.number().int().min(1).max(MAX_QTY) });
const mergeSchema = z.object({ items: z.array(addSchema).max(100) });

export function getCart(db, userId) {
  const rows = db
    .prepare(
      `SELECT c.quantity, p.* FROM cart_items c JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ? ORDER BY c.added_at, p.id`,
    )
    .all(userId);
  const items = rows.map((row) => ({ quantity: row.quantity, product: toProduct(row) }));
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  return { items, count, ...computeTotals(subtotal) };
}

export function cartRouter(db) {
  const router = Router();
  router.use(requireAuth);

  const getProduct = db.prepare('SELECT id, stock FROM products WHERE id = ?');
  const getLine = db.prepare('SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?');
  const upsert = db.prepare(
    `INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)
     ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = excluded.quantity`,
  );

  // Clamp to stock and the per-line cap; returns the quantity actually stored.
  const setQuantity = (userId, productId, wanted, { strict }) => {
    const product = getProduct.get(productId);
    if (!product) {
      if (strict) throw new HttpError(404, 'Product not found.');
      return 0;
    }
    if (product.stock === 0) {
      if (strict) throw new HttpError(409, 'This item is out of stock.');
      return 0;
    }
    const cap = Math.min(MAX_QTY, product.stock);
    if (strict && wanted > cap) throw new HttpError(409, `Only ${cap} available for this item.`);
    const qty = Math.min(wanted, cap);
    upsert.run(userId, productId, qty);
    return qty;
  };

  router.get('/', (req, res) => res.json(getCart(db, req.user.id)));

  router.post('/', (req, res) => {
    const { productId, quantity } = addSchema.parse(req.body);
    const current = getLine.get(req.user.id, productId)?.quantity ?? 0;
    setQuantity(req.user.id, productId, current + quantity, { strict: true });
    res.status(201).json(getCart(db, req.user.id));
  });

  router.put('/:productId', (req, res) => {
    const productId = Number(req.params.productId);
    const { quantity } = updateSchema.parse(req.body);
    if (!getLine.get(req.user.id, productId)) throw new HttpError(404, 'Item is not in your cart.');
    setQuantity(req.user.id, productId, quantity, { strict: true });
    res.json(getCart(db, req.user.id));
  });

  router.delete('/:productId', (req, res) => {
    db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(req.user.id, Number(req.params.productId));
    res.json(getCart(db, req.user.id));
  });

  router.delete('/', (req, res) => {
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    res.json(getCart(db, req.user.id));
  });

  // Folds a guest (localStorage) cart into the account cart after sign-in.
  router.post('/merge', (req, res) => {
    const { items } = mergeSchema.parse(req.body);
    db.transaction(() => {
      for (const item of items) {
        const current = getLine.get(req.user.id, item.productId)?.quantity ?? 0;
        setQuantity(req.user.id, item.productId, current + item.quantity, { strict: false });
      }
    })();
    res.json(getCart(db, req.user.id));
  });

  return router;
}
