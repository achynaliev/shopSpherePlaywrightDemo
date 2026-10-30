import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Lets async route handlers throw instead of calling next(err) by hand.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    const field = first.path.join('.');
    return res.status(400).json({ error: field ? `${field}: ${first.message}` : first.message });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

const FREE_SHIPPING_THRESHOLD = 3500;
const STANDARD_SHIPPING = 599;
const TAX_RATE = 0.08;

export function computeTotals(subtotal) {
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
  const tax = Math.round(subtotal * TAX_RATE);
  return { subtotal, shipping, tax, total: subtotal + shipping + tax, freeShippingThreshold: FREE_SHIPPING_THRESHOLD };
}

export function toProduct(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    brand: row.brand,
    category: row.category,
    description: row.description,
    features: JSON.parse(row.features),
    price: row.price_cents,
    listPrice: row.list_price_cents,
    stock: row.stock,
    emoji: row.emoji,
    colorFrom: row.color_from,
    colorTo: row.color_to,
    imageUrl: row.image_url,
    rating: row.rating_avg,
    ratingCount: row.rating_count,
    isFeatured: Boolean(row.is_featured),
    createdAt: row.created_at,
  };
}

export function toUser(row) {
  return { id: row.id, name: row.name, email: row.email, createdAt: row.created_at };
}

export function refreshProductRating(db, productId) {
  db.prepare(
    `UPDATE products SET
       rating_avg   = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE product_id = @id), 0),
       rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = @id)
     WHERE id = @id`,
  ).run({ id: productId });
}
