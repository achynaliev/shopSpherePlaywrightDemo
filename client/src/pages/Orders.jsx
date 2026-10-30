import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate, formatPrice } from '../api.js';
import { ProductImage, Spinner } from '../components/ui.jsx';

export const STATUS_LABEL = { placed: 'Order placed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/orders').then((d) => setOrders(d.orders)).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!orders) return <Spinner />;

  return (
    <div className="page narrow">
      <h1>Your Orders</h1>
      {orders.length === 0 && (
        <div className="card empty">
          <p>You haven&apos;t placed any orders yet.</p>
          <Link to="/search" className="btn btn-primary">Start shopping</Link>
        </div>
      )}
      {orders.map((o) => (
        <div key={o.id} className="order-card">
          <div className="order-card-head">
            <div><span className="label">Order placed</span>{formatDate(o.createdAt)}</div>
            <div><span className="label">Total</span>{formatPrice(o.total)}</div>
            <div className="hide-sm"><span className="label">Ship to</span>{o.shippingAddress.fullName}</div>
            <div className="order-card-num">
              <span className="label">Order # {o.orderNumber}</span>
              <Link to={`/orders/${o.id}`}>View order details</Link>
            </div>
          </div>
          <div className="order-card-body">
            <h3 className={`status status-${o.status}`}>
              {o.status === 'placed' ? `Arriving ${formatDate(o.estimatedDelivery, { weekday: 'long', month: 'long', day: 'numeric' })}` : STATUS_LABEL[o.status]}
            </h3>
            {o.items.map((i) => (
              <div key={i.id} className="checkout-item">
                <ProductImage product={i} size="xs" />
                <div>
                  {i.slug ? <Link to={`/product/${i.slug}`}>{i.title}</Link> : i.title}
                  <div className="small muted">Qty {i.quantity} · {formatPrice(i.price)}</div>
                </div>
                {i.slug && <Link className="btn btn-secondary btn-sm" to={`/product/${i.slug}`}>Buy it again</Link>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
