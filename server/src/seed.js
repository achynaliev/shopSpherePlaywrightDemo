import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { products, reviewers, reviewTemplates } from './data/products.js';
import { refreshProductRating } from './util.js';

export const DEMO_USER = { name: 'Demo Shopper', email: 'demo@shopsphere.dev', password: 'demo1234' };

// Small deterministic PRNG so every fresh database gets the same reviews.
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const slugify = (s) => s.toLowerCase().replace(/['’"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

export function seedIfEmpty(db, config, { force = false } = {}) {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM products').get();
  if (n > 0 && !force) return false;

  const rand = mulberry32(20261030);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];

  db.transaction(() => {
    if (force) {
      for (const table of ['order_items', 'orders', 'cart_items', 'reviews', 'products', 'users']) {
        db.prepare(`DELETE FROM ${table}`).run();
      }
      db.prepare("DELETE FROM sqlite_sequence").run();
    }

    const insertProduct = db.prepare(
      `INSERT INTO products (slug, title, brand, category, description, features, price_cents, list_price_cents,
         stock, emoji, color_from, color_to, is_featured, created_at)
       VALUES (@slug, @title, @brand, @category, @description, @features, @price, @listPrice,
         @stock, @emoji, @colorFrom, @colorTo, @featured, datetime('now', @age))`,
    );
    const productIds = products.map((p) => Number(insertProduct.run({
      slug: slugify(p.title),
      title: p.title,
      brand: p.brand,
      category: p.category,
      description: p.description,
      features: JSON.stringify(p.features),
      price: Math.round(p.price * 100),
      listPrice: p.listPrice ? Math.round(p.listPrice * 100) : null,
      stock: p.stock,
      emoji: p.emoji,
      colorFrom: p.colors[0],
      colorTo: p.colors[1],
      featured: p.featured ? 1 : 0,
      age: `-${p.daysAgo} days`,
    }).lastInsertRowid));

    // Reviewer accounts get random passwords nobody knows; they exist only to author seed reviews.
    const insertUser = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
    const reviewerIds = reviewers.map((name) => {
      const email = `${slugify(name).replace('-', '.')}@reviewers.shopsphere.invalid`;
      const hash = bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 4);
      return Number(insertUser.run(name, email, hash).lastInsertRowid);
    });

    const insertReview = db.prepare(
      `INSERT INTO reviews (product_id, user_id, rating, title, body, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))`,
    );
    for (const productId of productIds) {
      const quality = 3.4 + rand() * 1.6; // each product leans somewhere between "okay" and "loved"
      const count = 2 + Math.floor(rand() * 6);
      const authors = [...reviewerIds].sort(() => rand() - 0.5).slice(0, count);
      for (const userId of authors) {
        const rating = Math.max(1, Math.min(5, Math.round(quality + (rand() - 0.5) * 2.2)));
        const [title, body] = pick(reviewTemplates[rating]);
        const age = `-${1 + Math.floor(rand() * 120)} days`;
        insertReview.run(productId, userId, rating, title, body, age, age);
      }
      refreshProductRating(db, productId);
    }

    if (config.seedDemoUser) {
      insertUser.run(DEMO_USER.name, DEMO_USER.email, bcrypt.hashSync(DEMO_USER.password, 10));
    }
  })();

  if (config.logRequests) {
    console.log(`Seeded ${products.length} products, ${reviewers.length} reviewers${config.seedDemoUser ? `, demo user ${DEMO_USER.email}` : ''}.`);
  }
  return true;
}
