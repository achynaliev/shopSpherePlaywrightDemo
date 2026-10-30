export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  put: (path, body) => request('PUT', path, body ?? {}),
  del: (path) => request('DELETE', path),
};

export const formatPrice = (cents) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents ?? 0) / 100);

export const formatDate = (iso, opts = { year: 'numeric', month: 'long', day: 'numeric' }) =>
  new Date(iso.includes('T') ? iso : `${iso.replace(' ', 'T')}Z`).toLocaleDateString('en-US', opts);

// Mirrors the server's pricing rules so guest carts show the same totals.
export function computeTotals(subtotal) {
  const freeShippingThreshold = 3500;
  const shipping = subtotal === 0 || subtotal >= freeShippingThreshold ? 0 : 599;
  const tax = Math.round(subtotal * 0.08);
  return { subtotal, shipping, tax, total: subtotal + shipping + tax, freeShippingThreshold };
}
