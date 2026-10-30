import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { openDb } from '../src/db.js';
import { createApp } from '../src/app.js';
import { seedIfEmpty, DEMO_USER } from '../src/seed.js';
import { loadConfig } from '../src/config.js';

const config = loadConfig({ databasePath: ':memory:', clientDist: '/nonexistent', logRequests: false, seedDemoUser: true });
let db;
let app;

const SHIPPING = {
  fullName: 'Test Buyer', line1: '1 Main St', city: 'Springfield', state: 'IL', postalCode: '62701', country: 'United States',
};
const PAYMENT = { nameOnCard: 'Test Buyer', cardNumber: '4242 4242 4242 4242', expMonth: 12, expYear: new Date().getFullYear() + 2, cvc: '123' };

async function signUp(email = `user${Math.random().toString(36).slice(2)}@test.dev`) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send({ name: 'Tester', email, password: 'password123' });
  assert.equal(res.status, 201);
  return agent;
}

before(() => {
  db = openDb(':memory:');
  seedIfEmpty(db, config);
  app = createApp(db, config);
});

test('catalog is seeded with 30 products and rated reviews', async () => {
  const res = await request(app).get('/api/products?limit=48');
  assert.equal(res.status, 200);
  assert.equal(res.body.total, 30);
  assert.ok(res.body.products.every((p) => p.ratingCount >= 2 && p.rating > 0));
});

test('search matches every term and filters by category and price', async () => {
  const res = await request(app).get('/api/products').query({ q: 'cast iron' });
  assert.equal(res.body.total, 1);
  assert.match(res.body.products[0].title, /Cast Iron/);

  const cat = await request(app).get('/api/products').query({ category: 'Books', sort: 'price-asc' });
  assert.equal(cat.body.total, 4);
  const prices = cat.body.products.map((p) => p.price);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));

  const cheap = await request(app).get('/api/products').query({ maxPrice: 25 });
  assert.ok(cheap.body.products.every((p) => p.price <= 2500));

  // "%" is matched literally (e.g. "99% sRGB"), not as a LIKE wildcard.
  const wildcard = await request(app).get('/api/products').query({ q: '%' });
  assert.ok(wildcard.body.total > 0 && wildcard.body.total < 30);
  assert.ok(wildcard.body.products.every((p) => `${p.title} ${p.description}`.includes('%')));
});

test('product detail by slug includes rating breakdown', async () => {
  const list = await request(app).get('/api/products?limit=1');
  const { slug, ratingCount } = list.body.products[0];
  const res = await request(app).get(`/api/products/${slug}`);
  assert.equal(res.status, 200);
  const total = Object.values(res.body.product.ratingBreakdown).reduce((a, b) => a + b, 0);
  assert.equal(total, ratingCount);
  assert.equal((await request(app).get('/api/products/does-not-exist')).status, 404);
});

test('auth: register, duplicate email, login, me, logout', async () => {
  const agent = await signUp('Alice@Test.dev');
  assert.equal((await agent.get('/api/auth/me')).body.user.email, 'alice@test.dev');

  const dup = await request(app).post('/api/auth/register').send({ name: 'A', email: 'alice@test.dev', password: 'password123' });
  assert.equal(dup.status, 409);

  const bad = await request(app).post('/api/auth/login').send({ email: 'alice@test.dev', password: 'wrongpass' });
  assert.equal(bad.status, 401);

  const short = await request(app).post('/api/auth/register').send({ name: 'B', email: 'b@test.dev', password: 'short' });
  assert.equal(short.status, 400);

  await agent.post('/api/auth/logout');
  assert.equal((await agent.get('/api/auth/me')).body.user, null);

  const demo = request.agent(app);
  assert.equal((await demo.post('/api/auth/login').send({ email: DEMO_USER.email, password: DEMO_USER.password })).status, 200);
});

test('protected routes reject anonymous requests', async () => {
  assert.equal((await request(app).get('/api/cart')).status, 401);
  assert.equal((await request(app).get('/api/orders')).status, 401);
  assert.equal((await request(app).post('/api/products/1/reviews').send({ rating: 5, title: 'x', body: 'long enough body' })).status, 401);
});

test('cart: add, merge, clamp to stock, update, remove', async () => {
  const agent = await signUp();
  let res = await agent.post('/api/cart').send({ productId: 1, quantity: 2 });
  assert.equal(res.status, 201);
  assert.equal(res.body.count, 2);

  const outOfStock = db.prepare('SELECT id FROM products WHERE stock = 0').get();
  assert.equal((await agent.post('/api/cart').send({ productId: outOfStock.id })).status, 409);

  res = await agent.post('/api/cart/merge').send({ items: [{ productId: 1, quantity: 1 }, { productId: 2, quantity: 3 }, { productId: outOfStock.id, quantity: 1 }] });
  assert.equal(res.body.items.length, 2);
  assert.equal(res.body.count, 6);

  res = await agent.put('/api/cart/2').send({ quantity: 1 });
  assert.equal(res.body.count, 4);
  assert.equal((await agent.put('/api/cart/2').send({ quantity: 11 })).status, 400);

  res = await agent.delete('/api/cart/1');
  assert.equal(res.body.count, 1);
  assert.equal(res.body.subtotal, res.body.items[0].product.price);
});

test('checkout creates an order, decrements stock, clears cart; cancel restocks', async () => {
  const agent = await signUp();
  const before = db.prepare('SELECT stock, price_cents FROM products WHERE id = 3').get();
  await agent.post('/api/cart').send({ productId: 3, quantity: 2 });

  const res = await agent.post('/api/orders').send({ shipping: SHIPPING, payment: PAYMENT });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  const { order } = res.body;
  assert.equal(order.subtotal, before.price_cents * 2);
  assert.equal(order.total, order.subtotal + order.shipping + order.tax);
  assert.equal(order.payment.last4, '4242');
  assert.equal(order.payment.brand, 'Visa');
  assert.equal(db.prepare('SELECT stock FROM products WHERE id = 3').get().stock, before.stock - 2);
  assert.equal((await agent.get('/api/cart')).body.count, 0);

  assert.equal((await agent.get('/api/orders')).body.orders.length, 1);
  const other = await signUp();
  assert.equal((await other.get(`/api/orders/${order.id}`)).status, 404);

  const cancelled = await agent.post(`/api/orders/${order.id}/cancel`);
  assert.equal(cancelled.body.order.status, 'cancelled');
  assert.equal(db.prepare('SELECT stock FROM products WHERE id = 3').get().stock, before.stock);
  assert.equal((await agent.post(`/api/orders/${order.id}/cancel`)).status, 409);
});

test('checkout validation: empty cart, bad card, declined card, expired card', async () => {
  const agent = await signUp();
  assert.equal((await agent.post('/api/orders').send({ shipping: SHIPPING, payment: PAYMENT })).status, 400);

  await agent.post('/api/cart').send({ productId: 5 });
  const luhn = await agent.post('/api/orders').send({ shipping: SHIPPING, payment: { ...PAYMENT, cardNumber: '4242424242424241' } });
  assert.equal(luhn.status, 400);
  const declined = await agent.post('/api/orders').send({ shipping: SHIPPING, payment: { ...PAYMENT, cardNumber: '4000 0000 0000 0002' } });
  assert.equal(declined.status, 402);
  const expired = await agent.post('/api/orders').send({ shipping: SHIPPING, payment: { ...PAYMENT, expYear: 2020 } });
  assert.equal(expired.status, 400);
  assert.equal((await agent.get('/api/cart')).body.count, 1, 'failed payments keep the cart');
});

test('reviews: create, update in place, verified purchase, delete', async () => {
  const agent = await signUp();
  const productId = 10;
  const before = (await request(app).get(`/api/products/${productId}`)).body.product;

  let res = await agent.post(`/api/products/${productId}/reviews`).send({ rating: 1, title: 'Meh', body: 'Not what I hoped for.' });
  assert.equal(res.status, 201);
  assert.equal(res.body.product.ratingCount, before.ratingCount + 1);

  res = await agent.post(`/api/products/${productId}/reviews`).send({ rating: 5, title: 'Changed my mind', body: 'Grew on me after a week.' });
  assert.equal(res.body.product.ratingCount, before.ratingCount + 1);

  let reviews = (await agent.get(`/api/products/${productId}/reviews`)).body.reviews;
  const mine = reviews.find((r) => r.isMine);
  assert.equal(mine.rating, 5);
  assert.equal(mine.verifiedPurchase, false);

  await agent.post('/api/cart').send({ productId });
  await agent.post('/api/orders').send({ shipping: SHIPPING, payment: PAYMENT });
  reviews = (await agent.get(`/api/products/${productId}/reviews`)).body.reviews;
  assert.equal(reviews.find((r) => r.isMine).verifiedPurchase, true);

  res = await agent.delete(`/api/products/${productId}/reviews/mine`);
  assert.equal(res.body.product.ratingCount, before.ratingCount);
  assert.equal(res.body.product.rating, before.rating);
  assert.equal((await agent.post(`/api/products/${productId}/reviews`).send({ rating: 6, title: 'x', body: 'too many stars here' })).status, 400);
});
