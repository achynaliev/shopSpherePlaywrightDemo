import http from 'k6/http';
import { check, fail } from 'k6';
import { BASE_URL, JSON_HEADERS } from '../config.js';

export const LOAD_TEST_PASSWORD = __ENV.LOAD_TEST_PASSWORD || 'k6-load-test-pass';

// Gives the current VU its own account so VUs never fight over one cart.
// k6 keeps a cookie jar per VU, so the session cookie set here is sent on every later request
// from this VU. Call it once per VU (see the `loggedIn` flag in cart.js).
//
// Note: this creates a new user per VU per run. Run `npm run seed` locally to wipe them.
export function registerVuUser(runId) {
  const email = `k6-${runId}-vu${__VU}@loadtest.dev`;
  const res = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify({ name: `k6 VU ${__VU}`, email, password: LOAD_TEST_PASSWORD }),
    { ...JSON_HEADERS, tags: { name: 'POST /api/auth/register' } },
  );

  const ok = check(res, { 'register: status 201': (r) => r.status === 201 });
  if (!ok) fail(`Could not register ${email}: ${res.status} ${res.body}`);
  return email;
}

// Signs in an existing user. Useful when you point the tests at a shared account.
export function login(email, password = LOAD_TEST_PASSWORD) {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    { ...JSON_HEADERS, tags: { name: 'POST /api/auth/login' } },
  );
  const ok = check(res, { 'login: status 200': (r) => r.status === 200 });
  if (!ok) fail(`Login failed for ${email}: ${res.status} ${res.body}`);
  return res;
}
