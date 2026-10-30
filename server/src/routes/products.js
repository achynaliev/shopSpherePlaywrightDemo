import { Router } from 'express';
import { z } from 'zod';
import { HttpError, refreshProductRating, toProduct } from '../util.js';
import { requireAuth } from '../middleware/auth.js';

const SORTS = {
  featured: 'is_featured DESC, rating_count DESC, id ASC',
  'price-asc': 'price_cents ASC, id ASC',
  'price-desc': 'price_cents DESC, id ASC',
  rating: 'rating_avg DESC, rating_count DESC, id ASC',
  newest: 'created_at DESC, id DESC',
};

const listSchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  inStock: z.enum(['true', 'false']).optional(),
  featured: z.enum(['true', 'false']).optional(),
  sort: z.enum(Object.keys(SORTS)).default('featured'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Choose a star rating').max(5),
  title: z.string().trim().min(1, 'Add a headline').max(120),
  body: z.string().trim().min(10, 'Review must be at least 10 characters').max(4000),
});

const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export function productsRouter(db) {
  const router = Router();

  const findProduct = (idOrSlug) => {
    const row = /^\d+$/.test(idOrSlug)
      ? db.prepare('SELECT * FROM products WHERE id = ?').get(Number(idOrSlug))
      : db.prepare('SELECT * FROM products WHERE slug = ?').get(idOrSlug);
    if (!row) throw new HttpError(404, 'Product not found.');
    return row;
  };

  router.get('/', (req, res) => {
    const p = listSchema.parse(req.query);
    const where = [];
    const params = {};

    if (p.q) {
      // Every word must appear somewhere in the title, brand, category or description.
      p.q.split(/\s+/).slice(0, 8).forEach((term, i) => {
        params[`t${i}`] = `%${escapeLike(term)}%`;
        where.push(`(title LIKE @t${i} ESCAPE '\\' OR brand LIKE @t${i} ESCAPE '\\' OR category LIKE @t${i} ESCAPE '\\' OR description LIKE @t${i} ESCAPE '\\')`);
      });
    }
    if (p.category) { where.push('category = @category'); params.category = p.category; }
    if (p.minPrice != null) { where.push('price_cents >= @minPrice'); params.minPrice = Math.round(p.minPrice * 100); }
    if (p.maxPrice != null) { where.push('price_cents <= @maxPrice'); params.maxPrice = Math.round(p.maxPrice * 100); }
    if (p.minRating != null) { where.push('rating_avg >= @minRating'); params.minRating = p.minRating; }
    if (p.inStock === 'true') where.push('stock > 0');
    if (p.featured === 'true') where.push('is_featured = 1');

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const { total } = db.prepare(`SELECT COUNT(*) AS total FROM products ${whereSql}`).get(params);
    const rows = db
      .prepare(`SELECT * FROM products ${whereSql} ORDER BY ${SORTS[p.sort]} LIMIT @limit OFFSET @offset`)
      .all({ ...params, limit: p.limit, offset: (p.page - 1) * p.limit });

    res.json({
      products: rows.map(toProduct),
      page: p.page,
      limit: p.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / p.limit)),
    });
  });

  router.get('/categories', (req, res) => {
    const rows = db.prepare('SELECT category AS name, COUNT(*) AS count FROM products GROUP BY category ORDER BY category').all();
    res.json({ categories: rows });
  });

  router.get('/:idOrSlug', (req, res) => {
    const row = findProduct(req.params.idOrSlug);
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of db.prepare('SELECT rating, COUNT(*) AS n FROM reviews WHERE product_id = ? GROUP BY rating').all(row.id)) {
      breakdown[r.rating] = r.n;
    }
    res.json({ product: { ...toProduct(row), ratingBreakdown: breakdown } });
  });

  router.get('/:idOrSlug/related', (req, res) => {
    const row = findProduct(req.params.idOrSlug);
    const rows = db
      .prepare('SELECT * FROM products WHERE category = ? AND id != ? ORDER BY rating_avg DESC LIMIT 4')
      .all(row.category, row.id);
    res.json({ products: rows.map(toProduct) });
  });

  router.get('/:idOrSlug/reviews', (req, res) => {
    const row = findProduct(req.params.idOrSlug);
    const sort = req.query.sort === 'top' ? 'r.rating DESC, r.created_at DESC' : 'r.created_at DESC, r.id DESC';
    const reviews = db
      .prepare(
        `SELECT r.id, r.rating, r.title, r.body, r.created_at, r.updated_at, r.user_id, u.name AS author,
           EXISTS (
             SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
             WHERE o.user_id = r.user_id AND oi.product_id = r.product_id AND o.status != 'cancelled'
           ) AS verified
         FROM reviews r JOIN users u ON u.id = r.user_id
         WHERE r.product_id = ? ORDER BY ${sort}`,
      )
      .all(row.id)
      .map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        author: r.author,
        verifiedPurchase: Boolean(r.verified),
        isMine: req.user ? r.user_id === req.user.id : false,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    res.json({ reviews });
  });

  // Create or replace the signed-in user's review (one per product).
  router.post('/:idOrSlug/reviews', requireAuth, (req, res) => {
    const row = findProduct(req.params.idOrSlug);
    const data = reviewSchema.parse(req.body);
    db.transaction(() => {
      db.prepare(
        `INSERT INTO reviews (product_id, user_id, rating, title, body) VALUES (@pid, @uid, @rating, @title, @body)
         ON CONFLICT (product_id, user_id) DO UPDATE SET
           rating = excluded.rating, title = excluded.title, body = excluded.body, updated_at = datetime('now')`,
      ).run({ pid: row.id, uid: req.user.id, ...data });
      refreshProductRating(db, row.id);
    })();
    res.status(201).json({ product: toProduct(findProduct(String(row.id))) });
  });

  router.delete('/:idOrSlug/reviews/mine', requireAuth, (req, res) => {
    const row = findProduct(req.params.idOrSlug);
    const { changes } = db.transaction(() => {
      const result = db.prepare('DELETE FROM reviews WHERE product_id = ? AND user_id = ?').run(row.id, req.user.id);
      refreshProductRating(db, row.id);
      return result;
    })();
    if (!changes) throw new HttpError(404, "You haven't reviewed this product.");
    res.json({ product: toProduct(findProduct(String(row.id))) });
  });

  return router;
}
