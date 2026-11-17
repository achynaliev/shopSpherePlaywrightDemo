// Shared settings for every k6 script in this folder.
//
// Override at run time with env vars, e.g.:
//   k6 run -e BASE_URL=https://staging.example.com -e PROFILE=load scenarios/browse.js

export const BASE_URL = (__ENV.BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

// Load shapes. Pick one with -e PROFILE=<name>; each script sets its own default.
export const PROFILES = {
  // Sanity check: does the script work and the system respond at all?
  smoke: {
    vus: 1,
    duration: '30s',
  },
  // Typical expected traffic.
  load: {
    stages: [
      { duration: '30s', target: 10 }, // ramp up
      { duration: '1m', target: 10 }, // hold
      { duration: '15s', target: 0 }, // ramp down
    ],
  },
  // Push past normal traffic to find where things start to degrade.
  stress: {
    stages: [
      { duration: '30s', target: 20 },
      { duration: '1m', target: 50 },
      { duration: '1m', target: 100 },
      { duration: '30s', target: 0 },
    ],
  },
  // Sudden burst of traffic, then back to nothing.
  spike: {
    stages: [
      { duration: '10s', target: 5 },
      { duration: '10s', target: 100 },
      { duration: '30s', target: 100 },
      { duration: '10s', target: 5 },
      { duration: '10s', target: 0 },
    ],
  },
};

// Pass/fail criteria shared by all scripts. A breached threshold makes k6 exit non-zero (useful in CI).
export const BASE_THRESHOLDS = {
  http_req_failed: ['rate<0.01'], // under 1% of requests fail
  http_req_duration: ['p(95)<500', 'p(99)<1000'], // ms
  checks: ['rate>0.99'],
};

export function buildOptions(defaultProfile, extra = {}) {
  const name = __ENV.PROFILE || defaultProfile;
  const profile = PROFILES[name];
  if (!profile) {
    throw new Error(`Unknown PROFILE "${name}". Use one of: ${Object.keys(PROFILES).join(', ')}`);
  }
  return {
    ...profile,
    ...extra,
    thresholds: { ...BASE_THRESHOLDS, ...(extra.thresholds || {}) },
    tags: { profile: name, ...(extra.tags || {}) },
  };
}

export const JSON_HEADERS = { headers: { 'Content-Type': 'application/json' } };
