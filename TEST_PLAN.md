# ShopSphere: Test Plan

| | |
| --- | --- |
| **Application** | ShopSphere: React (Vite) client + Node/Express + SQLite API, served as one service |
| **Scope** | Every user-facing feature, the REST API, data integrity, security, accessibility, responsiveness and deployment config |
| **Test levels** | API/integration (`server/test/api.test.js`, `node:test` + in-memory DB) and end-to-end UI (`tests/e2e/`, Playwright) |
| **Reference data** | 30 seeded products in 7 departments; demo user `demo@shopsphere.dev` / `demo1234`; test cards `4242 4242 4242 4242` (success) and `4000 0000 0000 0002` (decline) |

---

## 1. Objectives

1. Confirm that every feature listed in the README works end to end: accounts, catalog, search, product pages, reviews, cart, checkout, orders.
2. Confirm that the business rules are applied the same way on the server and in the client. These are: free shipping at $35 or more, a $5.99 shipping fee otherwise, 8% tax rounded to the cent, a cap of 10 per cart line, and quantities capped by stock.
3. Confirm data integrity: checkout reduces stock inside a single transaction, cancelling restocks it, and there is one review per user per product.
4. Confirm security controls: bcrypt hashing, an httpOnly JWT cookie, rate limiting, ownership checks, input validation, open-redirect protection, and no stored card data.
5. Confirm the app is usable at phone width and with a keyboard or screen reader.

## 2. Scope

**In scope:** every route in `server/src/routes/*`, the client pages in `client/src/pages/*`, the shared components, guest-cart behaviour in `localStorage`, the production static hosting and SPA fallback, configuration through environment variables, and the Docker image.

**Out of scope:** real payment processing (the processor is simulated), email delivery (the "confirmation will be sent" text is only copy), load and stress testing beyond the light checks in §11, and third-party hosting platforms other than smoke-testing one deploy.

## 3. Test environments

| Env | How | DB | Notes |
| --- | --- | --- | --- |
| API unit/integration | `npm test` (root) | `:memory:`, fresh per run | Fast, isolated; `NODE_ENV=test`. |
| Local dev | `npm run dev` → :5173 (proxies `/api` to :4000) | `server/data/shop.db` | For exploratory and manual testing. |
| E2E | `cd tests && npm test` → builds the client and runs the prod server on :4173 | `server/data/shop.db` (**persistent and shared with dev**) | Runs with `NODE_ENV=production`, so the **auth rate limit is 20 requests per 15 minutes per IP**. See §13. |
| Staging | `E2E_BASE_URL=https://… npm test` | Deployed volume `/data` | Smoke tests only. Don't run the full suite against real data. |

**Browsers:** Chromium is the default. Before a release, also run Firefox, WebKit and the `Pixel 7` mobile profile (they are commented out in `tests/playwright.config.js`).

## 4. Test data strategy

- **Users:** create a unique user for each test (`e2e+<timestamp>-<rand>@test.dev`) so parallel workers never share a cart. Use the demo user only for read-only checks.
- **Stock-sensitive tests:** only use products with plenty of stock, or reset the DB first with `npm run seed`. The seeded catalog includes two products with `stock: 0`: one Electronics item (a smartwatch from the brand "Stride") and one Books item (by "Daniel Reyes"). Products with stock ≤ 10 show the "Only N left" badge.
- **Shipped/delivered orders:** the UI has no way to create these. Set `orders.status` directly in SQLite in a fixture or test helper.
- **Order items whose product was deleted:** delete a product row in the DB to exercise `product_id = NULL` (shown as plain text with no "Buy it again" link).
- **Reset:** run `npm run seed` before a full regression run. CI should use its own `DATABASE_PATH`.

## 5. Entry and exit criteria

**Entry:** the root `npm install` succeeds, `npm run build` succeeds, and `/api/health` returns `{ ok: true }`.

**Exit (release):** 100% of P1 cases pass and at least 95% of P2 cases pass. Every failing P2 has a known issue with a workaround. There are no open Critical or High security findings, and `npm test` and the Playwright Chromium suite are green in CI.

Priority key: **P1** blocks a release · **P2** important · **P3** nice to have.

---

## 6. Functional test cases: API

> Unless stated otherwise, these run as `node:test` cases against `createApp(openDb(':memory:'), config)`. ✅ marks a case that `server/test/api.test.js` already covers, at least in part.

### 6.1 Health and routing

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| API-H-01 | `GET /api/health` | 200 `{ ok: true }` | P1 |
| API-H-02 | `GET /api/does-not-exist` | 404 JSON `{ error: 'Not found' }` (not the SPA HTML) | P2 |
| API-H-03 | POST with malformed JSON body | 400 `Malformed JSON body` | P2 |
| API-H-04 | JSON body > 100 kb | 413, no crash | P3 |
| API-H-05 | Unhandled exception path | 500 generic message, stack not leaked | P2 |
| API-H-06 | Response headers | Helmet headers present (CSP, X-Content-Type-Options, …); no `X-Powered-By` | P2 |

### 6.2 Auth (`/api/auth`)

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| API-A-01 ✅ | Register with valid name/email/password | 201, `user` without `password_hash`, `ss_token` cookie set (httpOnly, SameSite=Lax, Path=/, 7-day Max-Age) | P1 |
| API-A-02 ✅ | Register with an existing email | 409 `An account with this email already exists.` | P1 |
| API-A-03 | Register with the existing email in different case or with spaces (`  DEMO@ShopSphere.dev `) | 409 (email is trimmed and lower-cased; the column is NOCASE) | P1 |
| API-A-04 | Register with an invalid email, password < 8 or > 128 chars, empty or > 80-char name | 400 with field-prefixed message (e.g. `password: Password must be at least 8 characters`) | P1 |
| API-A-05 | Register with missing body fields / extra fields | 400 for missing; extras ignored | P3 |
| API-A-06 ✅ | Login with correct credentials | 200, cookie set | P1 |
| API-A-07 | Login with a wrong password **and** with an unknown email | Both 401 with the identical message `Incorrect email or password.` | P1 |
| API-A-08 | Login timing: unknown email vs wrong password | Comparable response times (dummy bcrypt hash) | P3 |
| API-A-09 ✅ | `GET /me` with and without a session | `{ user }` / `{ user: null }` (always 200) | P1 |
| API-A-10 | `GET /me` with an expired, tampered, or wrongly signed JWT | `{ user: null }`, no 500 | P1 |
| API-A-11 | `GET /me` with a valid JWT for a deleted user | `{ user: null }` | P2 |
| API-A-12 ✅ | `POST /logout` | Cookie cleared; next `/me` returns null | P1 |
| API-A-13 | `PUT /me` update name (trimmed) | 200 updated user; empty name → 400 | P2 |
| API-A-14 | `PUT /me/password` with correct current + valid new password | 200; old password no longer logs in, new one does | P1 |
| API-A-15 | `PUT /me/password` with wrong current password | 400 `Current password is incorrect.` | P1 |
| API-A-16 | `PUT /me/password` with new password < 8 | 400 | P2 |
| API-A-17 | `PUT /me`, `/me/password` anonymous | 401 `Please sign in to continue.` | P1 |
| API-A-18 | Rate limit in prod config (`isProd: true`): 21 register/login/password calls in 15 min | 21st → 429 `Too many attempts…`; `RateLimit` draft-7 headers present | P1 |
| API-A-19 | Rate limit in dev config | Limit 1000; normal use unaffected | P3 |
| API-A-20 | Stored password | `password_hash` is a bcrypt hash (`$2…$12$`), never plaintext | P1 |

### 6.3 Products and search (`/api/products`)

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| API-P-01 ✅ | `GET /products` defaults | 12 products, `page=1`, `limit=12`, `total=30`, `totalPages=3`, sorted `featured` | P1 |
| API-P-02 ✅ | `q` with multiple words | Every word must match somewhere in the title, brand, category or description (AND across words, OR across fields) | P1 |
| API-P-03 | `q` is case-insensitive; leading/trailing whitespace trimmed | Same results | P2 |
| API-P-04 | `q` containing `%`, `_`, `\` | Treated literally (escaped LIKE), no wildcard explosion | P2 |
| API-P-05 | `q` with > 8 words | Only the first 8 terms are applied, no error | P3 |
| API-P-06 | `q` > 100 chars | 400 | P3 |
| API-P-07 | `q` with SQL-injection payload (`' OR 1=1 --`) | Treated as a literal string (bound parameters); 0 results; no error | P1 |
| API-P-08 ✅ | `category` filter (exact match) | Only that department; unknown category → 0 results | P1 |
| API-P-09 ✅ | `minPrice` / `maxPrice` in dollars (e.g. 25, 49.99) | Converted to cents and applied inclusively | P1 |
| API-P-10 | `minPrice > maxPrice` | 0 results, 200 | P3 |
| API-P-11 | Negative price, non-numeric price | 400 | P2 |
| API-P-12 | `minRating` 0–5 inclusive; 6 → 400 | Filters on `rating_avg >=` | P2 |
| API-P-13 | `inStock=true` | Excludes the 2 zero-stock items; `inStock=false` → no filter | P1 |
| API-P-14 | `featured=true` | Only `is_featured` items | P2 |
| API-P-15 | Each sort: `featured`, `price-asc`, `price-desc`, `rating`, `newest` | Correct ordering, ties broken by id stably | P1 |
| API-P-16 | Invalid sort | 400 | P2 |
| API-P-17 | Pagination: `page=3` | Items 25–30; `page=99` → empty `products`, `totalPages` still correct | P1 |
| API-P-18 | `limit` 1 and 48 valid; 0, 49, `abc` → 400 | | P2 |
| API-P-19 | Filters combined (q + category + price + rating + inStock + sort + page) | Total and items match the intersection | P1 |
| API-P-20 | `GET /products/categories` | 7 categories alphabetical with counts summing to 30 | P1 |
| API-P-21 ✅ | `GET /products/:slug` and `/:id` | Same product; includes `ratingBreakdown` with keys 1–5 | P1 |
| API-P-22 | Unknown slug / id | 404 `Product not found.` | P1 |
| API-P-23 | `GET /:slug/related` | ≤4 products, same category, excludes self, sorted by rating desc | P2 |
| API-P-24 | Product shape | `price`/`listPrice` in cents, `features` is an array, `isFeatured` boolean | P2 |

### 6.4 Reviews (`/api/products/:idOrSlug/reviews`)

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| API-R-01 | `GET` reviews anonymous | 200; `isMine` false for all | P1 |
| API-R-02 | `GET` default sort vs `sort=top` | Most-recent-first vs rating-desc | P2 |
| API-R-03 ✅ | `POST` review signed in | 201; product `rating`/`ratingCount` recomputed | P1 |
| API-R-04 ✅ | `POST` second review by same user | Replaces the first (upsert), count unchanged, `updated_at` bumped | P1 |
| API-R-05 | Validation: rating 0/6/non-int, empty title, title >120, body <10 or >4000 | 400 with the schema message | P1 |
| API-R-06 | `POST` anonymous | 401 | P1 |
| API-R-07 ✅ | `verifiedPurchase` | True only if the user has a non-cancelled order with that product; becomes false once that order is cancelled | P1 |
| API-R-08 ✅ | `DELETE /reviews/mine` | Removes review, recomputes rating (0 with no reviews) | P1 |
| API-R-09 | `DELETE /reviews/mine` with no review | 404 `You haven't reviewed this product.` | P2 |
| API-R-10 | `ratingBreakdown` after mixed reviews | Counts per star correct; avg rounded to 2 decimals | P2 |
| API-R-11 | `isMine` | True only for the caller's own review | P2 |
| API-R-12 | Review on unknown product | 404 | P3 |
| API-R-13 | HTML/script in title/body | Stored as-is, returned as text (rendered escaped by React; see SEC-07) | P1 |

### 6.5 Cart (`/api/cart`)

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| API-C-01 ✅ | All cart routes anonymous | 401 | P1 |
| API-C-02 | `GET` empty cart | `items: []`, count 0, subtotal/shipping/tax/total 0 | P1 |
| API-C-03 ✅ | `POST` add (default qty 1) | 201; line created | P1 |
| API-C-04 | `POST` same product again | Quantity accumulates | P1 |
| API-C-05 ✅ | `POST` exceeding `min(10, stock)` | 409 `Only N available for this item.`; line unchanged | P1 |
| API-C-06 | `POST` out-of-stock product | 409 `This item is out of stock.` | P1 |
| API-C-07 | `POST` unknown product | 404 | P2 |
| API-C-08 | `POST` qty 0, 11, negative, `"abc"` | 400 | P2 |
| API-C-09 ✅ | `PUT /:productId` set qty | Updated; above cap → 409 | P1 |
| API-C-10 | `PUT` for product not in cart | 404 `Item is not in your cart.` | P2 |
| API-C-11 ✅ | `DELETE /:productId` | Line removed; deleting a missing line is a no-op 200 | P1 |
| API-C-12 | `DELETE /` | Cart emptied | P2 |
| API-C-13 ✅ | `POST /merge` | Adds guest quantities to existing lines, clamped to cap/stock; unknown or out-of-stock items silently skipped | P1 |
| API-C-14 | `POST /merge` with >100 items | 400 | P3 |
| API-C-15 | Totals | subtotal $34.99 → shipping 599; subtotal $35.00 → shipping 0; tax = round(subtotal × 0.08) | P1 |
| API-C-16 | Cart isolation | User B never sees User A's lines | P1 |
| API-C-17 | Ordering | Lines ordered by `added_at` then product id | P3 |

### 6.6 Orders and checkout (`/api/orders`)

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| API-O-01 ✅ | Checkout with valid address + `4242…` | 201; order with number `NNN-NNNNNNN-NNNNNNN`, status `placed`, brand `Visa`, last4 `4242`; cart cleared; stock decremented | P1 |
| API-O-02 ✅ | Checkout with empty cart | 400 `Your cart is empty.` | P1 |
| API-O-03 ✅ | Decline card `4000 0000 0000 0002` | 402 `Your card was declined…`; no order; cart and stock unchanged | P1 |
| API-O-04 ✅ | Luhn-invalid number | 400 `Card number is invalid` | P1 |
| API-O-05 | Card number with spaces/dashes | Accepted (normalised) | P2 |
| API-O-06 | Card length 12 / 20 digits | 400 `Enter a valid card number` | P2 |
| API-O-07 ✅ | Expired card (past year; current year + past month) | 400 `…Your card has expired` | P1 |
| API-O-08 | Expiry = current month/year | Accepted | P2 |
| API-O-09 | Month 0/13, year < 2000 / > 2100 | 400 | P3 |
| API-O-10 | CVC 2 / 5 digits / letters | 400 | P2 |
| API-O-11 | Card brand detection: Visa `4…`, Mastercard `51–55`/`22–27`, Amex `34/37`, Discover `6011/65`, other → `Card` | Correct `payment.brand` | P2 |
| API-O-12 | Address validation: each required field too short; postal code regex (`^[A-Za-z0-9 -]{3,10}$`) | 400 with the field message; `line2`/`phone` optional | P1 |
| API-O-13 | Stock dropped below cart qty before checkout | 409 `Only N of "<title>" left…`; nothing written | P1 |
| API-O-14 | Product went to 0 stock before checkout | 409 `"<title>" is now out of stock…` | P1 |
| API-O-15 | Atomicity: failure mid-transaction | No partial order, items, stock change or cart clear | P1 |
| API-O-16 | Totals stored | Match `computeTotals` at the moment of purchase; item price snapshot unaffected by later price edits | P1 |
| API-O-17 | No raw card data stored | `orders` table contains only brand and last4; no PAN/CVC anywhere in DB or logs | P1 |
| API-O-18 | `GET /orders` | Only caller's orders, newest first, each with items | P1 |
| API-O-19 | `GET /orders/:id` own vs another user's vs nonexistent | 200 / **404** / 404 (no existence leak) | P1 |
| API-O-20 | `estimatedDelivery` | `createdAt + 4 days`, valid ISO | P3 |
| API-O-21 ✅ | `POST /:id/cancel` on `placed` | Status `cancelled`; each item's stock restored | P1 |
| API-O-22 | Cancel twice / cancel `shipped`/`delivered` | 409 `This order is <status> and can no longer be cancelled.` | P1 |
| API-O-23 | Cancel someone else's order | 404 | P1 |
| API-O-24 | Cancel order whose product was deleted | Succeeds; deleted product skipped in restock | P3 |
| API-O-25 | Concurrency: two simultaneous checkouts for the last unit (two users) | Exactly one 201, the other 409; stock never negative | P2 |

---

## 7. Functional test cases: UI (E2E)

> These are Playwright specs in `tests/e2e/`. Use `page.goto('/…')`. Suggested files: `home`, `search`, `product`, `reviews`, `cart-guest`, `cart-user`, `auth`, `checkout`, `orders`, `account`, `navigation`, `a11y`, `mobile`.

### 7.1 Header and navigation

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| UI-N-01 | Logo click | Goes to `/` | P2 |
| UI-N-02 | Header search: type term, submit (Enter and button) | `/search?q=term` | P1 |
| UI-N-03 | Header category dropdown + term | `/search?q=term&category=…` | P2 |
| UI-N-04 | Empty search submit | `/search` (all products) | P3 |
| UI-N-05 | Header search box stays in sync with URL when on `/search` (back/forward, links) | Input and dropdown reflect `q`/`category` | P3 |
| UI-N-06 | Sub-nav links: All, New Arrivals, Today's Deals, each department | Correct `/search` params and heading | P2 |
| UI-N-07 | Cart badge count | Reflects total quantity for guest and user; aria-label `Cart, N items` | P1 |
| UI-N-08 | Signed-out account link | `/login?next=<current path+query>` | P2 |
| UI-N-09 | Signed-in "Hello, <first name>" menu | Opens; has Your Account / Your Orders / Sign Out; closes on outside click and on route change | P2 |
| UI-N-10 | Sign Out | Toast "Signed out", redirected to `/`, header shows "Hello, sign in", cart badge shows guest cart | P1 |
| UI-N-11 | Unknown route `/nope` | "Sorry, we couldn't find that page" with home link | P2 |
| UI-N-12 | Direct load / refresh of deep link (`/product/<slug>`, `/orders/1`) in prod build | SPA fallback serves app; no 404 | P1 |

### 7.2 Home

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| UI-H-01 | Page loads | Hero, 7 category tiles with counts, New arrivals and Top rated shelves (4 each), featured deals grid (≤8) | P1 |
| UI-H-02 | Hero CTAs | "Shop today's deals" → `/search?featured=true`; "Browse everything" → `/search` | P2 |
| UI-H-03 | Category tile / shelf item / "See more" / "See all deals" links | Correct destinations | P2 |
| UI-H-04 | API failure on load (mock 500) | Error alert shown instead of spinner forever | P3 |

### 7.3 Search and results

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| UI-S-01 | Results bar | "1-12 of 30 results"; `for "q"` / `in <category>` when applicable | P1 |
| UI-S-02 | Heading precedence | `Results for "q"` > category > "Today's deals" > "All products" | P3 |
| UI-S-03 | Department filter (with counts) | Applies; "Any department" clears; active state highlighted | P1 |
| UI-S-04 | Customer review filter 4/3/2 & Up | Applies `minRating`; clicking again toggles off | P2 |
| UI-S-05 | Price ranges (Under $25 … $200 & Above) | Applies min/max; clicking active range clears it | P1 |
| UI-S-06 | "Include in-stock only" checkbox | Out-of-stock items disappear | P1 |
| UI-S-07 | "Deals only" checkbox | Only featured items | P2 |
| UI-S-08 | Sort dropdown, all 5 options | Order changes; URL `sort=` updated | P1 |
| UI-S-09 | Changing any filter/sort resets to page 1 | `page` removed from URL | P2 |
| UI-S-10 | Pagination: Previous/Next disabled at ends, numbered buttons, `aria-current="page"` | Correct page; scrolls to top | P1 |
| UI-S-11 | "Clear all filters" | Visible only when filters active; keeps `q` | P2 |
| UI-S-12 | No results | "No results found" card + "Browse all products" | P1 |
| UI-S-13 | URL is the source of truth | Reload / share URL restores identical state; browser back/forward works | P2 |
| UI-S-14 | Product card | Image/emoji, title, stars, price, list price + discount where applicable; click opens product | P1 |
| UI-S-15 | Mobile: "Filters" toggle | Shows/hides filter panel below 768px | P2 |

### 7.4 Product page

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| UI-P-01 | Load by slug | Title, brand store link, rating + count, price, list price/discount, features list, description, buy box | P1 |
| UI-P-02 | Breadcrumbs | "All" → `/search`; category → `/search?category=…` | P3 |
| UI-P-03 | "Visit the <brand> Store" | `/search?q=<brand>` | P3 |
| UI-P-04 | Delivery copy | ≥ $35: "FREE delivery in 4 days"; else "$5.99 delivery · FREE over $35" | P2 |
| UI-P-05 | Stock badge | 0: "Currently unavailable" (no qty/buttons); 1–10: "Only N left in stock — order soon."; >10: "In Stock" | P1 |
| UI-P-06 | Qty selector options | 1…min(10, stock) | P1 |
| UI-P-07 | Add to Cart | Toast "Added N to cart"; badge increments | P1 |
| UI-P-08 | Add beyond cap (guest and user) | Error toast `Only N available for this item.` | P1 |
| UI-P-09 | Buy Now signed in | Adds and goes to `/checkout` | P1 |
| UI-P-10 | Buy Now guest | Adds to guest cart, goes to `/login?next=/checkout` | P1 |
| UI-P-11 | Related products | ≤4 same-category items, excludes current; clicking one reloads page state (qty resets to 1, scrolls top) | P2 |
| UI-P-12 | Unknown slug | "Product not found." with "Back to home" | P2 |
| UI-P-13 | Ratings link `#reviews` | Scrolls to reviews section | P3 |

### 7.5 Reviews (UI)

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| UI-R-01 | Rating summary | "X.X out of 5", "N global ratings", 5→1 bars with percentages | P2 |
| UI-R-02 | Guest | "Sign in to write a review" → `/login?next=/product/<slug>`; returns there after sign-in | P1 |
| UI-R-03 | Write review happy path | Star input (hover labels "Hated it"…"Loved it"), headline, body → toast "Thanks for your review!"; review appears tagged as mine; summary updates | P1 |
| UI-R-04 | Submit without stars | "Please select a star rating." | P1 |
| UI-R-05 | Body < 10 chars | Browser `minLength` blocks or server error shown | P2 |
| UI-R-06 | Edit own review | Form pre-filled; save → toast "Review updated"; still one review | P1 |
| UI-R-07 | Cancel edit | Form closes, no change | P3 |
| UI-R-08 | Delete own review | Confirm dialog; accept → toast "Review deleted", summary updates; dismiss → nothing | P1 |
| UI-R-09 | "Write a customer review" button hidden once user has a review | Edit/Delete shown instead | P2 |
| UI-R-10 | Sort reviews (Most recent / Top rated) | Shown only when >1 review; reorders | P3 |
| UI-R-11 | Verified Purchase badge | Appears after buying the product; disappears after cancelling that order | P1 |
| UI-R-12 | No reviews | "No reviews yet" | P3 |
| UI-R-13 | Sign in/out while on product page | `isMine` / Edit controls update without reload | P3 |

### 7.6 Cart: guest

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| UI-CG-01 | Add items as guest | Stored in `localStorage['ss_guest_cart']`; survives reload | P1 |
| UI-CG-02 | Change qty / delete line | Updates storage, totals and badge; toast "Removed from cart" | P1 |
| UI-CG-03 | Totals match server rules | Subtotal, "Add $X of eligible items to get FREE delivery" vs "✓ Your order qualifies…", shipping, tax, total | P1 |
| UI-CG-04 | Proceed to checkout as guest | `/login?next=/checkout`; note "You'll sign in or create an account next." | P1 |
| UI-CG-05 | **Merge on sign-in** | Guest lines added to account cart (quantities summed, clamped); `localStorage` key removed | P1 |
| UI-CG-06 | Merge on register | Same as above for a new account | P1 |
| UI-CG-07 | Corrupt `ss_guest_cart` JSON / non-array | Treated as empty; no crash | P2 |
| UI-CG-08 | `localStorage` unavailable (blocked/private) | Cart works for the page view; no crash | P3 |
| UI-CG-09 | Stale guest data (product now out of stock or price changed) | Merge skips OOS items; account cart shows current price | P2 |

### 7.7 Cart: signed in

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| UI-CU-01 | Empty cart | "Your ShopSphere cart is empty." + Continue shopping | P1 |
| UI-CU-02 | Line display | Image, title link, stock badge, qty select, Delete, line price, subtotal "(N items)" with correct plural | P1 |
| UI-CU-03 | Change qty | Server updated; totals re-render | P1 |
| UI-CU-04 | Over-stock line (stock reduced after adding) | "Only N available — lower the quantity." and checkout button disabled | P1 |
| UI-CU-05 | Cart persists across devices/sessions | Sign in elsewhere → same cart | P2 |
| UI-CU-06 | Free-shipping boundary | Cart at $34.99 shows $5.99 shipping; adding to ≥ $35.00 shows FREE | P1 |

### 7.8 Auth (UI)

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| UI-A-01 | Register happy path | Toast "Account created — welcome to ShopSphere!"; signed in; redirected to `next` or `/` | P1 |
| UI-A-02 | Passwords don't match | "Passwords must match." (no request sent) | P1 |
| UI-A-03 | Duplicate email | Server error shown in alert | P1 |
| UI-A-04 | Login happy path (demo user) | Toast "Welcome back, Demo!"-style first-name greeting; redirect to `next` | P1 |
| UI-A-05 | Login wrong credentials | "Incorrect email or password."; button re-enabled | P1 |
| UI-A-06 | Busy states | Buttons show "Signing in…" / "Creating account…" and are disabled | P3 |
| UI-A-07 | Already signed in visiting `/login` or `/register` | Redirected to `next` | P2 |
| UI-A-08 | `next` propagation between Login ↔ Register links | Preserved | P2 |
| UI-A-09 | **Open-redirect protection**: `next=https://evil.com`, `//evil.com`, `/\evil.com`, `\\evil.com`, `javascript:alert(1)` | Falls back to `/` | P1 |
| UI-A-10 | Protected routes (`/checkout`, `/orders`, `/orders/:id`, `/account`) when signed out | Redirect to `/login?next=<path+query>`; after login, land on original page | P1 |
| UI-A-11 | Session persists across reload and new tab | Still signed in (cookie) | P1 |
| UI-A-12 | Session cookie deleted/expired mid-session | Next protected action → 401 handled (error shown / redirected) without blank screen | P2 |

### 7.9 Checkout

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| UI-CO-01 | Visit `/checkout` with empty cart | Redirect to `/cart` | P1 |
| UI-CO-02 | Defaults | Full name and name-on-card prefilled with user name; country "United States"; heading "Checkout (N items)" | P2 |
| UI-CO-03 | Saved address | After a successful order, next checkout pre-fills address from `ss_last_address_<userId>` (per user, per device) | P2 |
| UI-CO-04 | Card input formatting | Non-digits stripped, grouped in 4s, max 19 digits; expiry auto-formats `MMYY` → `MM/YY`; CVC digits only, max 4 | P2 |
| UI-CO-05 | Expiry missing `/YY` | "Enter the card expiry as MM/YY." (no request) | P2 |
| UI-CO-06 | **Happy path** with `4242…`, future expiry | "Placing order…"; toast "Order placed!"; lands on `/orders/:id?placed=1` with success banner and estimated delivery; cart badge 0 | P1 |
| UI-CO-07 | Declined card | Error "Your card was declined…" at top (scrolls up); cart intact; can retry with good card | P1 |
| UI-CO-08 | Invalid card / expired / bad CVC / bad postal code | Server message shown in alert | P1 |
| UI-CO-09 | Required-field HTML validation | Submit blocked on empty required inputs | P2 |
| UI-CO-10 | Stock conflict at checkout (409) | Error shown and cart refreshed | P1 |
| UI-CO-11 | Double-click "Place your order" | Only one order created | P1 |
| UI-CO-12 | Review items section | Lines, per-item price, "Change quantities" → `/cart` | P3 |
| UI-CO-13 | Order summary in checkout | Matches cart totals exactly | P1 |

### 7.10 Orders

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| UI-O-01 | No orders | "You haven't placed any orders yet." + Start shopping | P2 |
| UI-O-02 | Orders list | Newest first; date, total, ship-to name, order #, "View order details" | P1 |
| UI-O-03 | Status line | `placed` → "Arriving <weekday, month day>"; others → "Shipped"/"Delivered"/"Cancelled" | P2 |
| UI-O-04 | "Buy it again" | Goes to product page; hidden when product deleted (title as plain text) | P2 |
| UI-O-05 | Order detail | Address (line2 only if present), "<Brand> ending in <last4>", items/shipping (FREE or amount)/tax/grand total, item list | P1 |
| UI-O-06 | Success banner | Only with `?placed=1` and status `placed` | P3 |
| UI-O-07 | Cancel order | Confirm dialog; accept → toast "Order cancelled", status "Cancelled", Cancel button gone, "Write a review" links gone; stock restored on product page | P1 |
| UI-O-08 | Cancel button hidden for shipped/delivered | Not rendered | P2 |
| UI-O-09 | Another user's order id in URL | "Order not found." + Back to orders | P1 |
| UI-O-10 | "Write a review" link | `/product/<slug>#reviews` | P3 |
| UI-O-11 | Header "Returns & Orders" | `/orders` (or login redirect) | P3 |

### 7.11 Account

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| UI-AC-01 | Page content | Email, "member since <Month Year>", tiles to Orders / Cart / #security | P2 |
| UI-AC-02 | Update name | Toast "Name updated"; header greeting updates immediately | P1 |
| UI-AC-03 | Change password success | Toast "Password changed"; fields cleared; new password works after sign out | P1 |
| UI-AC-04 | Wrong current password | "Current password is incorrect." | P1 |
| UI-AC-05 | New password < 8 | Blocked by `minLength` / server message | P2 |

---

## 8. Cross-cutting business-rule matrix

Verify each row in **both** the server (`server/src/util.js`) and the client mirror (`client/src/api.js → computeTotals`):

| Subtotal | Shipping | Tax (8%, rounded) | Total |
| --- | --- | --- | --- |
| $0.00 | $0.00 | $0.00 | $0.00 |
| $0.01 | $5.99 | $0.00 | $6.00 |
| $34.99 | $5.99 | $2.80 | $43.78 |
| $35.00 | FREE | $2.80 | $37.80 |
| $35.01 | FREE | $2.80 | $37.81 |
| $199.99 | FREE | $16.00 | $215.99 |

Also check: cents formatting with `Intl` USD (e.g. `$1,299.00`), discount % = `round((1 − price/list) × 100)` shown only when list > price, and dates parsed from SQLite `YYYY-MM-DD HH:MM:SS` as UTC.

A unit test should assert that the server and client `computeTotals` give the same result for a range of subtotals (for example 0–10,000 cents), so the two copies don't drift apart.

---

## 9. Security tests

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| SEC-01 | Auth cookie flags in prod | `HttpOnly`, `Secure` (unless `COOKIE_SECURE=false`), `SameSite=Lax`, 7-day expiry | P1 |
| SEC-02 | JWT tampering (alter `sub`, `alg: none`, wrong secret) | Treated as signed out | P1 |
| SEC-03 | Prod boot without `JWT_SECRET` | Process refuses to start with clear error | P1 |
| SEC-04 | IDOR: orders, cancel, cart lines, reviews of other users | 404/no effect | P1 |
| SEC-05 | SQL injection via `q`, `category`, slug, ids | No error/leak; bound params | P1 |
| SEC-06 | Sort parameter injection (`sort=id;DROP`) | 400 (enum) | P1 |
| SEC-07 | Stored XSS in review title/body, user name, address fields | Rendered as text everywhere (product page, orders, header greeting) | P1 |
| SEC-08 | Open redirect via `next` | See UI-A-09 | P1 |
| SEC-09 | CSRF: cross-site POST to `/api/orders` / `/api/cart` with cookie | SameSite=Lax blocks cookie on cross-site POST; JSON content-type required | P2 |
| SEC-10 | Brute force | Rate-limit 429 after 20 attempts in 15 min (prod); behind proxy uses real client IP (`trust proxy` = 1) | P1 |
| SEC-11 | User enumeration | Same login error for unknown email vs wrong password; registration 409 is an accepted disclosure | P2 |
| SEC-12 | Sensitive data exposure | No `password_hash` in any response; no PAN/CVC stored/logged; generic 500 message | P1 |
| SEC-13 | Security headers | CSP from Helmet doesn't block the app's own assets; HSTS etc. present | P2 |
| SEC-14 | Mass assignment | Extra fields (`id`, `email`, `status`, `price`) in bodies ignored (e.g. `PUT /me` can't change email; cart can't set price) | P1 |
| SEC-15 | Demo user in prod | Not created unless `SEED_DEMO_USER=true` | P2 |
| SEC-16 | Dependency audit | `npm audit` at root/client/server/tests — no High/Critical | P2 |

## 10. Accessibility tests

Run `@axe-core/playwright` on every page, and check the following by hand with a keyboard and VoiceOver or NVDA.

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| A11Y-01 | Axe scan: home, search, product, cart, checkout, orders, order detail, account, login, register, 404 | No serious/critical violations | P1 |
| A11Y-02 | Keyboard-only full purchase flow | Every control reachable and operable; visible focus | P1 |
| A11Y-03 | Landmarks | `header`, `main`, `footer`, `role="search"`, pagination `nav[aria-label]` | P2 |
| A11Y-04 | Images | Product images have `alt` / `role="img"` + `aria-label`; star ratings announced "X.X out of 5 stars" | P2 |
| A11Y-05 | Form labels | All inputs labelled (checkout, auth, account, review) | P1 |
| A11Y-06 | Star input | Buttons with `aria-label` "N stars" and `aria-pressed` | P2 |
| A11Y-07 | Account menu | `aria-expanded` toggles; reachable by keyboard | P2 |
| A11Y-08 | Toasts and error alerts | Announced to screen readers (check for a live region) | P2 |
| A11Y-09 | Colour contrast | WCAG AA for text, prices, stock badges, disabled buttons | P2 |
| A11Y-10 | 200% zoom | No loss of content or function | P3 |

## 11. Responsive, compatibility and performance

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| RWD-01 | 375×812 (Pixel 7 / iPhone) on every page | No horizontal scroll; header search usable; `hide-sm` items hidden; filters toggle | P1 |
| RWD-02 | 768 and 1280+ widths | Layouts (grid, buy box, checkout columns) adapt | P2 |
| RWD-03 | Touch interactions on mobile profile | Menus, selects, star input usable | P2 |
| COMP-01 | Chromium, Firefox, WebKit | Full P1 E2E suite passes | P1 |
| PERF-01 | Static asset caching | Hashed assets `Cache-Control: max-age=31536000, immutable`; `index.html` `no-cache` | P2 |
| PERF-02 | Compression | Responses gzip/brotli-encoded | P3 |
| PERF-03 | Lighthouse (mobile) on home & product | Perf ≥ 80, A11y ≥ 90, Best practices ≥ 90 | P3 |
| PERF-04 | Light load: 50 concurrent users browsing + 5 checking out (k6/autocannon) | p95 < 500 ms, no 5xx, no `SQLITE_BUSY` errors | P3 |

## 12. Deployment and configuration

| ID | Case | Expected | Pri |
| --- | --- | --- | --- |
| DEP-01 | `docker build` + run with `JWT_SECRET` and `/data` volume | App serves on :4000; DB created/seeded on first boot | P1 |
| DEP-02 | Restart container with same volume | Users/orders persist; no reseed | P1 |
| DEP-03 | `render.yaml` | Docker service, disk at `/data`, generated `JWT_SECRET` | P2 |
| DEP-04 | Env vars `PORT`, `DATABASE_PATH`, `CLIENT_DIST`, `SEED_DEMO_USER`, `COOKIE_SECURE` | Each honoured | P2 |
| DEP-05 | `npm run seed` (reseed) | Wipes and re-creates 30 products + demo user | P2 |
| DEP-06 | Production over plain HTTP without `COOKIE_SECURE=false` | Login appears to succeed but session not kept (documented behaviour) | P3 |
| DEP-07 | Staging smoke (via `E2E_BASE_URL`) | Health, home, search, product, login, add to cart | P1 |

---

## 13. Known risks and notes for test design

1. **E2E rate limit.** Playwright runs the server with `NODE_ENV=production`, so the auth limiter allows only **20 auth requests per 15 minutes**. A suite that registers a user in each test will start getting 429s. Mitigations: sign in once per worker and reuse `storageState`, or create users through a test-only seeding helper.
2. **Shared persistent DB.** E2E runs use `server/data/shop.db`, the same file as `npm run dev`. Stock, reviews and ratings drift from run to run. Avoid asserting exact stock or rating values unless you reseed first, and give CI its own `DATABASE_PATH`.
3. **Guest cart quantity changes skip the stock check.** On the Cart page, a guest's qty change goes through `updateGuest` without checking stock (only `add` validates it). The server clamps it when the cart is merged. Test that the displayed totals and the post-merge quantities match.
4. **Stale guest prices.** Guest cart lines store the whole product snapshot in `localStorage`, so a guest can see an old price until they sign in. Confirm that checkout always uses the server price.
5. **Shipped and delivered statuses** have no UI or API to set them, so they can only be tested through DB fixtures.
6. **Rule duplication.** `computeTotals` exists on both the server and the client. Keep the parity test from §8.
7. **Time-dependent logic.** Card-expiry checks use server local time. Run those tests with a controlled clock or with dates far from a month boundary.

## 14. Automation mapping and execution

| Layer | Location | Command | When |
| --- | --- | --- | --- |
| API/integration (§6, §8 server side, most of §9) | `server/test/*.test.js` | `npm test` (root) | Every commit / PR |
| E2E UI (§7, A11Y-01/02, RWD-01, COMP-01) | `tests/e2e/*.spec.js` | `cd tests && npm test` | Every PR (Chromium); nightly (all browsers + mobile) |
| Security scans (SEC-16) | n/a | `npm audit --omit=dev` | Weekly / before release |
| Performance (PERF-03/04) | Lighthouse CI / k6 script | manual | Before release |
| Manual exploratory | Local dev | `npm run dev` | Each release: 1-hour session on checkout, cart merge and reviews |

**Suggested E2E helpers:** a `createUser()` API fixture that returns `storageState`, `addToCartViaApi(productId, qty)`, a `resetDb()` wrapper around `npm run seed` for serial suites, and `setOrderStatus(id, status)` that writes directly to SQLite.

**Order of a regression run:** health → auth → catalog/search → product → cart (guest → merge → user) → checkout (happy path, decline, validation, stock conflict) → orders (view, cancel, restock) → reviews (including verified purchase) → account → security → accessibility → mobile.

## 15. Defect reporting

Each defect report should include: the test case ID, environment and browser, steps, expected and actual results, a screenshot, the Playwright trace or video (failures keep them automatically), any API response body, and a severity:

- **Critical:** data loss, payment or stock corruption, or a security breach.
- **High:** a P1 flow is blocked.
- **Medium:** a P2 failure, or a P1 failure that has a workaround.
- **Low:** cosmetic, or a P3 failure.
