# ShopSphere: Playwright UI + API Test Framework

A demo **Playwright test automation framework** built around ShopSphere, a full-stack e-commerce app that's included in this repo. A single Playwright setup holds two kinds of tests:

- **UI end-to-end tests:** browser tests written with the Page Object Model.
- **API tests:** browserless tests against the REST API.

Both run locally or on **Azure Playwright Workspaces** cloud browsers from GitHub Actions.

| | |
| --- | --- |
| **Tests** | 118 tests in 29 spec files: 43 UI (Chromium) + 75 API |
| **Stack** | `@playwright/test`, JavaScript (ES modules), `dotenv`, `@azure/playwright` |
| **Patterns** | Page Object Model, custom fixtures, per-worker test accounts, tag-based suites, an OpenAPI contract, self-cleaning test data |
| **CI** | GitHub Actions: server unit tests, then the full Playwright suite on Azure cloud browsers, with the HTML report uploaded as an artifact |

## Framework highlights

- **Two projects, one config.** The `chromium` project runs the UI specs in `tests/e2e/`. The `api` project runs the browserless specs in `tests/api/`, with JSON headers set by default. Run either one on its own with `--project`.
- **The app starts itself.** Playwright's `webServer` builds the React client and starts the production server on `http://localhost:4173`. Set `E2E_BASE_URL` (UI) or `API_BASE_URL` (API) to point the tests at an app that's already deployed, such as staging.
- **Parallel-safe test data.** Every account a test changes is **per-worker**. Each Playwright worker registers its own copy (`user+w0@…` for UI, `user+api-w0@…` for API), so parallel workers never share a cart or order history. Shared accounts are only read, never changed.
- **Fast authentication.** Each worker logs in once through the API and reuses the session cookie (`storageState`). Tests then start already logged in, with no UI login and no repeated password hashing.
- **Self-cleaning.** Specs that change a cart reset it in `beforeEach`/`afterEach`. Specs that place orders cancel them afterwards (`fixtures/orderCleanup.js`), which puts the items back in stock, so repeated runs don't drain product stock.
- **A fresh database just works.** `global-setup.js` registers the test accounts before the run, so the suite also works against an empty CI database.
- **The API contract is documented.** `tests/api/openapi.yaml` describes every endpoint, status code and error message that the API tests check.
- **Debugging artifacts.** A trace on the first retry, plus a screenshot and video whenever a test fails. CI retries a failed test twice.

## Framework layout

```
tests/                          Playwright package (its own package.json)
  playwright.config.js            local config: chromium + api projects, webServer, retries, artifacts
  playwright.service.config.js    Azure Playwright Workspaces config (cloud browsers, 10 workers)
  global-setup.js                 registers the test accounts before the run
  fixtures/
    auth.fixture.js               UI: per-worker accounts, saved sessions, authenticatedPage / 2 / 3
    api.fixture.js                API: api (guest) and authApi / 2 / 3 / 4 request clients
    orderCleanup.js               cancelPlacedOrders(): restocks what a test ordered
  page-objects/                   Page Object Model, built through POManager
    POManager.js  NavBar.js  Authentication.js  ProductListAndFilters.js  CartAndCheckout.js  Orders.js
  test-data/                      request bodies and expected values (cart, orders, navigation)
  e2e/                            UI specs
    authTests/  cartTests/  checkoutTests/  headerAndNavTests/  ordersTest/  products/  searchAndResults/
  api/                            API specs + openapi.yaml
    authAPIs/  cartAPIs/  orderAPIs/  productAPIs/  health.api.spec.js
TEST_PLAN.md                    test plan: scope, environments, data strategy, test cases
.github/workflows/
  e2e-azure-playwright.yml      CI pipeline
```

## Fixtures

**UI (`fixtures/auth.fixture.js`)**: import `authenticatedTest` instead of `test`.

| Fixture | What you get |
| --- | --- |
| `authenticatedPage` | A page already logged in as this worker's copy of `REGULAR_USER3` |
| `authenticatedPage2` | The same, as `REGULAR_USER4` |
| `authenticatedPage3` | The same, as `REGULAR_USER6` (used for empty-history checks) |
| `workerUsers` | This worker's email for each test account |

**API (`fixtures/api.fixture.js`)**: import `test` from here instead of from `@playwright/test`.

| Fixture | Account | Use for |
| --- | --- | --- |
| `api` | Guest (no cookie) | Public endpoints and 401 checks |
| `authApi` | Per-worker copy of `REGULAR_USER` | Orders, checkout, authenticated reads |
| `authApi2` | The real, shared `REGULAR_USER3` | **Read-only** checks, such as "user B can't see user A's order" |
| `authApi3` | Per-worker copy of `REGULAR_USER4` | Cart and merge specs |
| `authApi4` | Per-worker copy of `REGULAR_USER6` | Cart item (PUT/DELETE) specs |

Example API test:

```js
import { test, expect } from '../../fixtures/api.fixture.js';

test('POST /api/cart - add item to cart', { tag: ['@api', '@p0', '@regression'] }, async ({ authApi3 }) => {
    const res = await authApi3.post('/api/cart', { data: { productId: 8, quantity: 1 } });
    expect(res.status()).toBe(201);
    expect((await res.json()).count).toBe(1);
});
```

## Getting started

Requires **Node 20+**.

```bash
npm install
```

```bash
cd tests && npm install && npm run install-browsers
```

Then create a `.env` file in the **repo root** (it's git-ignored). The tests read these values:

| Variable | Purpose |
| --- | --- |
| `PASSWORD` | Password for all test accounts |
| `WRONG_PASSWORD` | For the failed-login tests |
| `REGISTRATION_EMAIL` | Email the registration tests sign up with (the spec deletes it first, so it can be reused) |
| `REGULAR_USER`, `REGULAR_USER2`, `REGULAR_USER3`, `REGULAR_USER4`, `REGULAR_USER6` | Test account emails. Per-worker copies are made from these automatically |
| `E2E_BASE_URL` / `API_BASE_URL` | Optional. Run against an app that's already running instead of starting one |
| `PW_WORKERS` | Optional. Number of workers on Azure (default 10) |

The accounts are registered automatically on the first run.

## Running tests

Run these from `tests/`:

| Command | What it runs |
| --- | --- |
| `npm test` | Everything (UI + API) |
| `npm run test:api` | API tests only |
| `npx playwright test --project=chromium` | UI tests only |
| `npm run test:smoke` | Tests tagged `@smoke` |
| `npm run test:regression` | Tests tagged `@regression` |
| `npm run test:p0` / `test:p1` / `test:p2` | Tests by priority |
| `npm run test:headed` | Run with a visible browser |
| `npx playwright test --ui` | Playwright's interactive UI mode |
| `npm run report` | Open the last HTML report |
| `npm run test:azure` | The full suite on Azure cloud browsers (needs `az login` and `PLAYWRIGHT_SERVICE_URL`) |
| `npm run test:azure:smoke` / `test:azure:regression` | Tagged suites on Azure |

**Tags:**
- **Suites:** `@smoke`, `@regression`.
- **Priority:** `@p0` (critical), `@p1`, `@p2`.
- **Layer:** `@api`.

**Notes:**
- **Run Playwright from `tests/`, not the repo root.** Running `npx playwright` from the root picks up a second copy of Playwright and fails with `test.describe() ... not expected here`.
- **Local runs use the app's normal database** (`server/data/shop.db`, the same one `npm run dev` uses), so data stays between runs.

## CI: GitHub Actions + Azure Playwright Workspaces

`.github/workflows/e2e-azure-playwright.yml` runs on every push and pull request to `main`, and can also be started manually:

1. Install the app's dependencies and run the server unit tests (`node:test` + supertest).
2. Build the React client.
3. Install the test package and sign in to Azure with **OIDC**, so no stored Azure password is needed.
4. Run `npm run test:azure`. The app runs on the GitHub runner, and the Azure cloud browsers reach it through `exposeNetwork: '<loopback>'`. Tests run fully parallel with 10 workers, which is safe because every worker has its own accounts.
5. Upload the HTML report as a build artifact (kept for 14 days). Results are also published to the Azure Playwright portal.

**Required repository secrets:**
- `PLAYWRIGHT_SERVICE_URL`
- `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`
- `E2E_PASSWORD`, `E2E_WRONG_PASSWORD`, `E2E_REGISTRATION_EMAIL`
- `E2E_REGULAR_USER`, `E2E_REGULAR_USER2`, `E2E_REGULAR_USER3`, `E2E_REGULAR_USER4`, `E2E_REGULAR_USER6`

---

# The application under test: ShopSphere

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

The SQLite database is created and seeded the first time the app starts, at `server/data/shop.db`. To reset it, run `npm run seed`. **This deletes every table**, including users, orders and test accounts, and seeds the catalog again.

`npm test` at the root runs the server's own unit and integration tests (`node:test` + supertest, in-memory database). The Playwright tests are covered at the top of this README.

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
  test/              server unit/integration tests (node:test + supertest)
client/            React app (Vite, React Router)
  src/pages/         Home, Search, Product, Cart, Checkout, Orders, Account, Auth
  src/context/       auth, cart (guest + account), toasts
tests/             Playwright UI + API test framework (see the top of this README)
```

SQLite suits a single-instance deployment. To run several instances, move to Postgres. The SQL is plain and lives in the route files.
