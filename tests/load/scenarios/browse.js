// Guest shopper browsing the catalog: home page -> search -> filter -> product page.
// Default profile is "load"; try -e PROFILE=stress or -e PROFILE=spike too.
//   k6 run tests/load/scenarios/browse.js
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, buildOptions } from '../config.js';

export const options = buildOptions('load', {
  thresholds: {
    // Per-group thresholds show which step is slow, not just the overall p95.
    'http_req_duration{group:::Search}': ['p(95)<600'],
    'http_req_duration{group:::Product page}': ['p(95)<400'],
  },
});

const SEARCH_TERMS = ['headphones', 'coffee', 'usb-c', 'yoga mat', 'water bottle', 'novel', 'wireless'];
const SORTS = ['featured', 'price-asc', 'price-desc', 'rating', 'newest'];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

export default function () {
  let slugs = [];
  let categories = [];

  group('Home page', () => {
    const featured = http.get(`${BASE_URL}/api/products?featured=true`, {
      tags: { name: 'GET /api/products?featured' },
    });
    check(featured, { 'featured: status 200': (r) => r.status === 200 });

    const cats = http.get(`${BASE_URL}/api/products/categories`, {
      tags: { name: 'GET /api/products/categories' },
    });
    check(cats, { 'categories: status 200': (r) => r.status === 200 });
    categories = (cats.json('categories') || []).map((c) => c.name);
  });
  sleep(1);

  group('Search', () => {
    const term = encodeURIComponent(pick(SEARCH_TERMS));
    const res = http.get(`${BASE_URL}/api/products?q=${term}&sort=${pick(SORTS)}`, {
      tags: { name: 'GET /api/products?q' }, // group the many URLs under one name in the results
    });
    check(res, { 'search: status 200': (r) => r.status === 200 });

    if (categories.length) {
      const cat = encodeURIComponent(pick(categories));
      const filtered = http.get(`${BASE_URL}/api/products?category=${cat}&inStock=true&minRating=3`, {
        tags: { name: 'GET /api/products?category' },
      });
      check(filtered, { 'filter: status 200': (r) => r.status === 200 });
      slugs = (filtered.json('products') || []).map((p) => p.slug);
    }

    if (!slugs.length) {
      slugs = (res.json('products') || []).map((p) => p.slug);
    }
  });
  sleep(1);

  if (!slugs.length) return;

  group('Product page', () => {
    const slug = pick(slugs);
    // The product page loads these three in parallel, so batch them the same way.
    const [product, related, reviews] = http.batch([
      ['GET', `${BASE_URL}/api/products/${slug}`, null, { tags: { name: 'GET /api/products/:slug' } }],
      ['GET', `${BASE_URL}/api/products/${slug}/related`, null, { tags: { name: 'GET /api/products/:slug/related' } }],
      ['GET', `${BASE_URL}/api/products/${slug}/reviews`, null, { tags: { name: 'GET /api/products/:slug/reviews' } }],
    ]);
    check(product, {
      'product: status 200': (r) => r.status === 200,
      'product: slug matches': (r) => r.json('product.slug') === slug,
    });
    check(related, { 'related: status 200': (r) => r.status === 200 });
    check(reviews, { 'reviews: status 200': (r) => r.status === 200 });
  });
  sleep(2);
}
