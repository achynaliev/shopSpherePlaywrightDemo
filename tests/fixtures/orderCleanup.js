// Placing an order takes its items out of stock; only cancelling puts them back. Tests that
// place orders call this when they're done so repeated runs don't drain product stock.
//
// `request` is any signed-in request client: an API fixture (authApi, ...) or page.request in E2E.
// It cancels every still-"placed" order of that account, so only use it with per-worker test
// accounts (authApi*, authenticatedPage*), never with a shared one.
export async function cancelPlacedOrders(request) {
    const res = await request.get('/api/orders');
    if (!res.ok()) return; // e.g. signed out by the test: nothing we can clean up
    const { orders } = await res.json();
    for (const order of orders) {
        if (order.status === 'placed') {
            await request.post(`/api/orders/${order.id}/cancel`);
        }
    }
}
