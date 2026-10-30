# ShopSphere

A full-stack e-commerce store: **React (Vite)** front-end and a **Node/Express + SQLite** API, deployed as a single service.

**Features**
- Accounts: sign up, sign in/out, profile and password change. Passwords are hashed with bcrypt; sessions use a JWT in an httpOnly cookie. Auth endpoints are rate-limited.
- Catalog: 30 seeded products across 7 departments, with a featured/deals view.
- Search: multi-word search, plus department, price range, star rating and in-stock filters, 5 sort orders and pagination.
- Product pages: feature list, stock status, quantity picker, Add to Cart / Buy Now and related items.
- Reviews and ratings: one review per user per product, which they can edit or delete. Reviews from buyers get a "Verified Purchase" badge. Each product shows its average rating and a 5→1 star breakdown.
- Cart: guests keep a cart in the browser, and it merges into their account cart when they sign in. Quantities are capped by stock. Shipping is free over $35 and tax is 8%.
- Checkout: shipping address and card payment (simulated, see below). Stock is checked and reduced inside a single transaction.
- Orders: order history and order details, cancellation (which puts the items back in stock) and "Buy it again".
- Works at phone width and has an accessible markup structure.

## Quick start (local)

```bash
npm install
npm run dev
```

- Web: http://localhost:5173 (Vite proxies `/api` to the API)
- API: http://localhost:4000
- Demo login: `demo@shopsphere.dev` / `demo1234`

The SQLite database is created and seeded the first time the app starts, at `server/data/shop.db`. To wipe it and seed again, run `npm run seed`.

Run the API tests with `npm test`.

### End-to-end tests (Playwright)

Everything Playwright-related lives in `tests/`, a separate package with its own dependencies. Put specs in `tests/e2e/` (e.g. `tests/e2e/checkout.spec.js`). The app's dependencies must be installed at the root first (`npm install`). One-time setup:

```bash
cd tests
npm install
npm run install-browsers
```

Run these commands from `tests/`:

| Command | What it does |
| --- | --- |
| `npm test` | Run all specs headless |
| `npm run test:ui` | Open Playwright's interactive UI mode |
| `npm run test:headed` | Run with a visible browser |
| `npm run report` | Open the last HTML report |

Playwright builds the client and starts the production server on http://localhost:4173. It uses the app's normal persistent database (`server/data/shop.db`, shared with `npm run dev`), so accounts, carts, orders and reviews created by tests stay between runs. The 30 products and the demo login (`demo@shopsphere.dev` / `demo1234`) are seeded when the database is first created; run `npm run seed` at the root to reset it. Tests can use relative URLs such as `page.goto('/cart')`. To test an app that is already running (for example a staging deploy), set `E2E_BASE_URL=https://…`; no local server is started then.

## Payments

Checkout uses a **simulated** payment processor. No card data is stored; only the card brand and last 4 digits are kept. Test cards:

| Card | Result |
| --- | --- |
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Declined |

Use any future expiry date and any CVC. To take real money, replace the payment block in `server/src/routes/orders.js` with a Stripe PaymentIntent or Checkout Session.

## Deploy

In production, the Express server serves the built React app and the API from one port.

### Render (one click)
Push this repo to GitHub, then in Render choose **New → Blueprint** and select the repo. `render.yaml` sets up the Docker service, a persistent disk at `/data` and a generated `JWT_SECRET`.

### Any Docker host (Fly.io, Railway, a VPS, …)
```bash
docker build -t shopsphere .
docker run -p 4000:4000 -e JWT_SECRET="$(openssl rand -hex 48)" -v shopsphere-data:/data shopsphere
```

Always mount a persistent volume at `/data`, or the database is lost on each redeploy.

### Without Docker
```bash
npm ci && npm run build
NODE_ENV=production JWT_SECRET=... DATABASE_PATH=/var/lib/shopsphere/shop.db npm start
```

### Environment variables

| Variable | Default | Notes |
| --- | --- | --- |
| `JWT_SECRET` | — | **Required** in production. |
| `PORT` | `4000` | |
| `DATABASE_PATH` | `server/data/shop.db` | Put this on persistent storage. |
| `SEED_DEMO_USER` | `true` in dev, `false` in prod | Creates the demo login on first seed. |
| `COOKIE_SECURE` | `true` in prod | Session cookies are HTTPS-only. Set to `false` only to try a production build over plain http. |

## Project layout

```
server/            Express API
  src/app.js         middleware + routes + static hosting
  src/routes/        auth, products (search, reviews), cart, orders (checkout)
  src/data/          seed catalog
  test/              API tests (node:test + supertest)
client/            React app (Vite, React Router)
  src/pages/         Home, Search, Product, Cart, Checkout, Orders, Account, Auth
  src/context/       auth, cart (guest + account), toasts
tests/             Playwright end-to-end tests (separate package)
  playwright.config.js
  e2e/               your specs
```

SQLite suits a single-instance deployment. To run several instances, move to Postgres. The SQL is plain and lives in the route files.
