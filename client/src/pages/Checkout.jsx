import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api, formatPrice } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ProductImage, Spinner } from '../components/ui.jsx';
import { OrderSummary } from './Cart.jsx';

// Remembers the last shipping address per user on this device as a convenience.
const addressKey = (userId) => `ss_last_address_${userId}`;

function loadSavedAddress(userId) {
  try {
    return JSON.parse(localStorage.getItem(addressKey(userId)));
  } catch {
    return null;
  }
}

const formatCard = (v) => v.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
const formatExpiry = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export default function Checkout() {
  const { user } = useAuth();
  const { cart, loading, refresh } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [address, setAddress] = useState(() => loadSavedAddress(user.id) ?? {
    fullName: user.name, line1: '', line2: '', city: '', state: '', postalCode: '', country: 'United States', phone: '',
  });
  const [card, setCard] = useState({ nameOnCard: user.name, cardNumber: '', expiry: '', cvc: '' });
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  if (loading) return <Spinner />;
  if (cart.items.length === 0 && !placing) return <Navigate to="/cart" replace />;

  const setA = (k) => (e) => setAddress((a) => ({ ...a, [k]: e.target.value }));

  const placeOrder = async (e) => {
    e.preventDefault();
    setError('');
    const [mm, yy] = card.expiry.split('/');
    if (!mm || !yy || yy.length !== 2) return setError('Enter the card expiry as MM/YY.');
    setPlacing(true);
    try {
      const { order } = await api.post('/orders', {
        shipping: address,
        payment: {
          nameOnCard: card.nameOnCard,
          cardNumber: card.cardNumber,
          expMonth: Number(mm),
          expYear: 2000 + Number(yy),
          cvc: card.cvc,
        },
      });
      try { localStorage.setItem(addressKey(user.id), JSON.stringify(address)); } catch { /* optional convenience */ }
      await refresh();
      toast('Order placed!');
      navigate(`/orders/${order.id}?placed=1`, { replace: true });
    } catch (err) {
      setError(err.message);
      setPlacing(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (err.status === 409) refresh();
    }
  };

  return (
    <div className="page checkout-page">
      <h1>Checkout <span className="muted">({cart.count} item{cart.count === 1 ? '' : 's'})</span></h1>
      {error && <div className="alert alert-error">{error}</div>}

      <form className="checkout-layout" onSubmit={placeOrder}>
        <div className="checkout-steps">
          <section className="card checkout-step">
            <h2><span className="step-num">1</span> Shipping address</h2>
            <div className="form-grid">
              <label className="span-2">Full name
                <input value={address.fullName} onChange={setA('fullName')} required autoComplete="name" />
              </label>
              <label className="span-2">Street address
                <input value={address.line1} onChange={setA('line1')} required placeholder="Street address or P.O. Box" autoComplete="address-line1" />
              </label>
              <label className="span-2">Apt, suite, unit (optional)
                <input value={address.line2} onChange={setA('line2')} autoComplete="address-line2" />
              </label>
              <label>City
                <input value={address.city} onChange={setA('city')} required autoComplete="address-level2" />
              </label>
              <label>State / Region
                <input value={address.state} onChange={setA('state')} required autoComplete="address-level1" />
              </label>
              <label>ZIP / Postal code
                <input value={address.postalCode} onChange={setA('postalCode')} required autoComplete="postal-code" />
              </label>
              <label>Country
                <input value={address.country} onChange={setA('country')} required autoComplete="country-name" />
              </label>
              <label className="span-2">Phone (optional)
                <input value={address.phone} onChange={setA('phone')} type="tel" autoComplete="tel" />
              </label>
            </div>
          </section>

          <section className="card checkout-step">
            <h2><span className="step-num">2</span> Payment method</h2>
            <div className="test-card-note small">
              🔒 Demo checkout — no real charge is made. Use test card <code>4242 4242 4242 4242</code>, any future
              expiry and any CVC. <code>4000 0000 0000 0002</code> simulates a decline.
            </div>
            <div className="form-grid">
              <label className="span-2">Name on card
                <input value={card.nameOnCard} onChange={(e) => setCard({ ...card, nameOnCard: e.target.value })} required autoComplete="cc-name" />
              </label>
              <label className="span-2">Card number
                <input value={card.cardNumber} onChange={(e) => setCard({ ...card, cardNumber: formatCard(e.target.value) })}
                  required inputMode="numeric" placeholder="1234 5678 9012 3456" autoComplete="cc-number" />
              </label>
              <label>Expiry (MM/YY)
                <input value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                  required inputMode="numeric" placeholder="MM/YY" autoComplete="cc-exp" />
              </label>
              <label>Security code
                <input value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  required inputMode="numeric" placeholder="CVC" autoComplete="cc-csc" />
              </label>
            </div>
          </section>

          <section className="card checkout-step">
            <h2><span className="step-num">3</span> Review items</h2>
            {cart.items.map(({ product, quantity }) => (
              <div className="checkout-item" key={product.id}>
                <ProductImage product={product} size="xs" />
                <div>
                  <Link to={`/product/${product.slug}`}>{product.title}</Link>
                  <div className="small muted">Qty {quantity} · {formatPrice(product.price)} each</div>
                </div>
                <b>{formatPrice(product.price * quantity)}</b>
              </div>
            ))}
            <Link to="/cart" className="small">Change quantities</Link>
          </section>
        </div>

        <OrderSummary totals={cart}>
          <button className="btn btn-primary btn-block" disabled={placing}>
            {placing ? 'Placing order…' : 'Place your order'}
          </button>
          <p className="small muted center">By placing your order you agree to ShopSphere&apos;s demo terms.</p>
        </OrderSummary>
      </form>
    </div>
  );
}
