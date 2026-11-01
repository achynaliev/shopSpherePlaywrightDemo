import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Price, ProductImage, Stars } from './ui.jsx';

export default function ProductCard({ product }) {
  const { add } = useCart();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const onAdd = async () => {
    setBusy(true);
    try {
      await add(product, 1);
      toast('Added to cart');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="card product-card" data-category={product.category}>
      <Link to={`/product/${product.slug}`} className="product-card-link">
        <ProductImage product={product} />
        <h3 className="product-card-title">{product.title}</h3>
      </Link>
      <div className="rating-row">
        <Stars value={product.rating} />
        <span className="muted small">{product.ratingCount.toLocaleString()}</span>
      </div>
      <Price cents={product.price} listCents={product.listPrice} />
      {product.price >= 3500 && <div className="small muted">FREE delivery</div>}
      <div className="product-card-actions">
        {product.stock > 0 ? (
          <button className="btn btn-primary btn-block" onClick={onAdd} disabled={busy}>
            {busy ? 'Adding…' : 'Add to Cart'}
          </button>
        ) : (
          <span className="stock out">Currently unavailable</span>
        )}
      </div>
    </article>
  );
}
