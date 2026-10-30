import { Link, useNavigate } from 'react-router-dom';
import { formatPrice } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ProductImage, QtySelect, Spinner, StockBadge } from '../components/ui.jsx';

export function OrderSummary({ totals, children }) {
  const remaining = totals.freeShippingThreshold - totals.subtotal;
  return (
    <div className="card summary">
      {totals.subtotal > 0 && (remaining > 0
        ? <p className="small ship-note">Add <b>{formatPrice(remaining)}</b> of eligible items to get FREE delivery.</p>
        : <p className="small ship-note ok">✓ Your order qualifies for FREE delivery.</p>)}
      <dl className="summary-lines">
        <dt>Items:</dt><dd>{formatPrice(totals.subtotal)}</dd>
        <dt>Shipping &amp; handling:</dt><dd>{totals.shipping ? formatPrice(totals.shipping) : 'FREE'}</dd>
        <dt>Estimated tax:</dt><dd>{formatPrice(totals.tax)}</dd>
        <dt className="summary-total">Order total:</dt><dd className="summary-total">{formatPrice(totals.total)}</dd>
      </dl>
      {children}
    </div>
  );
}

export default function Cart() {
  const { cart, loading, update, remove } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const run = async (fn, msg) => {
    try {
      await fn();
      if (msg) toast(msg);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (loading) return <Spinner />;

  const blocked = cart.items.some((i) => i.product.stock < i.quantity);

  return (
    <div className="page cart-page">
      <div className="card cart-list">
        <h1>Shopping Cart</h1>
        {cart.items.length === 0 ? (
          <div className="empty">
            <p>Your ShopSphere cart is empty.</p>
            <Link to="/search" className="btn btn-primary">Continue shopping</Link>
          </div>
        ) : (
          <>
            <div className="cart-price-head muted small">Price</div>
            {cart.items.map(({ product, quantity }) => (
              <div className="cart-item" key={product.id}>
                <Link to={`/product/${product.slug}`}><ProductImage product={product} size="sm" /></Link>
                <div className="cart-item-info">
                  <Link to={`/product/${product.slug}`} className="cart-item-title">{product.title}</Link>
                  <StockBadge stock={product.stock} />
                  {product.stock > 0 && product.stock < quantity && (
                    <div className="alert alert-error small">Only {product.stock} available — lower the quantity.</div>
                  )}
                  <div className="cart-item-actions">
                    <QtySelect value={Math.min(quantity, 10)} max={Math.max(product.stock, quantity)} onChange={(n) => run(() => update(product.id, n))} />
                    <span className="divider" />
                    <button className="link-btn" onClick={() => run(() => remove(product.id), 'Removed from cart')}>Delete</button>
                  </div>
                </div>
                <div className="cart-item-price">{formatPrice(product.price * quantity)}</div>
              </div>
            ))}
            <div className="cart-subtotal">
              Subtotal ({cart.count} item{cart.count === 1 ? '' : 's'}): <b>{formatPrice(cart.subtotal)}</b>
            </div>
          </>
        )}
      </div>

      {cart.items.length > 0 && (
        <OrderSummary totals={cart}>
          <button
            className="btn btn-primary btn-block"
            disabled={blocked}
            onClick={() => navigate(user ? '/checkout' : '/login?next=/checkout')}
          >
            Proceed to checkout
          </button>
          {!user && <p className="small muted center">You&apos;ll sign in or create an account next.</p>}
        </OrderSummary>
      )}
    </div>
  );
}
