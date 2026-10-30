import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, computeTotals } from '../api.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);
const GUEST_KEY = 'ss_guest_cart';
const MAX_QTY = 10;

// Guests keep their cart in localStorage; it is merged into the account cart on sign-in.
function readGuest() {
  try {
    const items = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
    return Array.isArray(items) ? items.filter((i) => i?.product?.id && i.quantity > 0) : [];
  } catch {
    return [];
  }
}

function writeGuest(items) {
  try {
    if (items.length) localStorage.setItem(GUEST_KEY, JSON.stringify(items));
    else localStorage.removeItem(GUEST_KEY);
  } catch {
    // Storage unavailable (private mode); the cart still works for this page view.
  }
}

function guestCart(items) {
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  return { items, count: items.reduce((s, i) => s + i.quantity, 0), ...computeTotals(subtotal) };
}

export function CartProvider({ children }) {
  const { user, ready } = useAuth();
  const [cart, setCart] = useState(() => guestCart(readGuest()));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      if (!user) return guestCart(readGuest());
      const guest = readGuest();
      if (guest.length) {
        const merged = await api.post('/cart/merge', {
          items: guest.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        });
        writeGuest([]);
        return merged;
      }
      return api.get('/cart');
    };
    load()
      .then((c) => !cancelled && setCart(c))
      .catch(() => !cancelled && setCart(guestCart([])))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [user, ready]);

  const updateGuest = useCallback((fn) => {
    const items = fn(readGuest());
    writeGuest(items);
    setCart(guestCart(items));
  }, []);

  const add = useCallback(async (product, quantity = 1) => {
    if (user) {
      setCart(await api.post('/cart', { productId: product.id, quantity }));
      return;
    }
    const cap = Math.min(MAX_QTY, product.stock);
    const existing = readGuest().find((i) => i.product.id === product.id);
    if ((existing?.quantity ?? 0) + quantity > cap) throw new Error(`Only ${cap} available for this item.`);
    updateGuest((items) => existing
      ? items.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i))
      : [...items, { product, quantity }]);
  }, [user, updateGuest]);

  const update = useCallback(async (productId, quantity) => {
    if (user) {
      setCart(await api.put(`/cart/${productId}`, { quantity }));
      return;
    }
    updateGuest((items) => items.map((i) => (i.product.id === productId ? { ...i, quantity } : i)));
  }, [user, updateGuest]);

  const remove = useCallback(async (productId) => {
    if (user) {
      setCart(await api.del(`/cart/${productId}`));
      return;
    }
    updateGuest((items) => items.filter((i) => i.product.id !== productId));
  }, [user, updateGuest]);

  const refresh = useCallback(async () => {
    if (user) setCart(await api.get('/cart'));
  }, [user]);

  const value = useMemo(() => ({ cart, loading, add, update, remove, refresh, maxQty: MAX_QTY }), [cart, loading, add, update, remove, refresh]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
