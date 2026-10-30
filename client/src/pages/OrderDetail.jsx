import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api, formatDate, formatPrice } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import { ProductImage, Spinner } from '../components/ui.jsx';
import { STATUS_LABEL } from './Orders.jsx';

export default function OrderDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`).then((d) => setOrder(d.order)).catch((e) => setError(e.message));
  }, [id]);

  const cancel = async () => {
    if (!window.confirm('Cancel this order? Items will be returned to stock.')) return;
    setBusy(true);
    try {
      setOrder((await api.post(`/orders/${id}/cancel`)).order);
      toast('Order cancelled');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="page narrow"><div className="alert alert-error">{error}</div><Link to="/orders">Back to orders</Link></div>;
  if (!order) return <Spinner />;

  const a = order.shippingAddress;
  return (
    <div className="page narrow">
      {params.get('placed') && order.status === 'placed' && (
        <div className="card success-banner">
          <h2>✅ Order placed, thank you!</h2>
          <p>Confirmation will be sent to your email. Estimated delivery: <b>{formatDate(order.estimatedDelivery, { weekday: 'long', month: 'long', day: 'numeric' })}</b>.</p>
        </div>
      )}
      <nav className="breadcrumbs small"><Link to="/orders">Your Orders</Link> › Order details</nav>
      <h1>Order details</h1>
      <p className="muted">Ordered on {formatDate(order.createdAt)} · Order # {order.orderNumber}</p>

      <div className="card order-detail-grid">
        <div>
          <h4>Shipping address</h4>
          <p>{a.fullName}<br />{a.line1}{a.line2 && <><br />{a.line2}</>}<br />{a.city}, {a.state} {a.postalCode}<br />{a.country}</p>
        </div>
        <div>
          <h4>Payment method</h4>
          <p>{order.payment.brand} ending in {order.payment.last4}</p>
        </div>
        <div>
          <h4>Order summary</h4>
          <dl className="summary-lines">
            <dt>Items:</dt><dd>{formatPrice(order.subtotal)}</dd>
            <dt>Shipping:</dt><dd>{order.shipping ? formatPrice(order.shipping) : 'FREE'}</dd>
            <dt>Tax:</dt><dd>{formatPrice(order.tax)}</dd>
            <dt className="summary-total">Grand total:</dt><dd className="summary-total">{formatPrice(order.total)}</dd>
          </dl>
        </div>
      </div>

      <div className="card">
        <div className="section-head">
          <h3 className={`status status-${order.status}`}>{STATUS_LABEL[order.status]}</h3>
          {order.status === 'placed' && (
            <button className="btn btn-secondary btn-sm" onClick={cancel} disabled={busy}>Cancel order</button>
          )}
        </div>
        {order.items.map((i) => (
          <div key={i.id} className="checkout-item">
            <ProductImage product={i} size="xs" />
            <div>
              {i.slug ? <Link to={`/product/${i.slug}`}>{i.title}</Link> : i.title}
              <div className="small muted">Qty {i.quantity} · {formatPrice(i.price)} each</div>
            </div>
            {i.slug && order.status !== 'cancelled' && (
              <Link className="btn btn-secondary btn-sm" to={`/product/${i.slug}#reviews`}>Write a review</Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
