// Signed-in shopper working with the cart: add -> view -> change quantity -> remove.
// Each VU registers its own account on its first iteration, so carts don't collide.
//   k6 run tests/load/scenarios/cart.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL, JSON_HEADERS, buildOptions } from '../config.js';
import { registerVuUser } from '../lib/auth.js';

export const options = buildOptions('load', {
  // k6 clears each VU's cookies between iterations by default. Keep them so the session
  // from the first iteration's sign-in carries over.
  noCookiesReset: true,
  thresholds: {
    // Custom metric: the full add-to-cart round trip, as the user feels it.
    cart_add_duration: ['p(95)<400'],
    // Registration runs bcrypt (cost 12) and is slow by design, so the cart requests get their
    // own budget (tagged flow:cart below) and registration gets a looser one.
    'http_req_duration{flow:cart}': ['p(95)<500', 'p(99)<1000'],
    'http_req_duration{name:POST /api/auth/register}': ['p(95)<2000'],
    http_req_duration: ['p(95)<1000'],
  },
});

const cartTags = (name) => ({ tags: { name, flow: 'cart' } });

const cartAddDuration = new Trend('cart_add_duration', true);

// setup() runs once before the VUs start. Its return value is passed to every iteration.
export function setup() {
  const res = http.get(`${BASE_URL}/api/products?inStock=true&limit=20`);
  check(res, { 'setup: products loaded': (r) => r.status === 200 });
  const productIds = (res.json('products') || []).map((p) => p.id);
  if (!productIds.length) throw new Error('No in-stock products found; is the database seeded?');
  return { runId: Date.now(), productIds };
}

// Module-level variables are per VU, so this flag tracks whether *this* VU has signed in.
let loggedIn = false;

export default function (data) {
  if (!loggedIn) {
    registerVuUser(data.runId);
    loggedIn = true;
  }

  const productId = data.productIds[Math.floor(Math.random() * data.productIds.length)];

  const add = http.post(
    `${BASE_URL}/api/cart`,
    JSON.stringify({ productId, quantity: 1 }),
    { ...JSON_HEADERS, ...cartTags('POST /api/cart') },
  );
  cartAddDuration.add(add.timings.duration);
  check(add, {
    'add: status 201': (r) => r.status === 201,
    'add: item in cart': (r) => (r.json('items') || []).some((i) => i.product.id === productId),
  });
  sleep(1);

  const view = http.get(`${BASE_URL}/api/cart`, cartTags('GET /api/cart'));
  check(view, { 'view: status 200': (r) => r.status === 200 });
  sleep(1);

  const update = http.put(
    `${BASE_URL}/api/cart/${productId}`,
    JSON.stringify({ quantity: 2 }),
    { ...JSON_HEADERS, ...cartTags('PUT /api/cart/:id') },
  );
  check(update, { 'update: status 200': (r) => r.status === 200 });
  sleep(1);

  // Leave the cart empty so the next iteration starts clean.
  const remove = http.del(`${BASE_URL}/api/cart`, null, cartTags('DELETE /api/cart'));
  check(remove, {
    'clear: status 200': (r) => r.status === 200,
    'clear: cart is empty': (r) => r.json('count') === 0,
  });
  sleep(1);
}
