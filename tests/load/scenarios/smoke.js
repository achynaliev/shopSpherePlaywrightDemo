// Smoke test: 1 VU for 30s against the cheapest public endpoints.
// Run this first to check the script and the target are working before anything heavier.
//   k6 run tests/load/scenarios/smoke.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, buildOptions } from '../config.js';

export const options = buildOptions('smoke', {
  thresholds: {
    // Smoke runs are tiny, so be strict: nothing should fail.
    http_req_failed: ['rate==0'],
  },
});

export default function () {
  const health = http.get(`${BASE_URL}/api/health`, { tags: { name: 'GET /api/health' } });
  check(health, {
    'health: status 200': (r) => r.status === 200,
    'health: ok is true': (r) => r.json('ok') === true,
  });

  const products = http.get(`${BASE_URL}/api/products`, { tags: { name: 'GET /api/products' } });
  check(products, {
    'products: status 200': (r) => r.status === 200,
    'products: returns a list': (r) => Array.isArray(r.json('products')),
  });

  sleep(1);
}
