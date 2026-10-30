import { useState } from 'react';
import { formatPrice } from '../api.js';

export function Stars({ value, size = 'sm' }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span className={`stars stars-${size}`} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      <span className="stars-bg">★★★★★</span>
      <span className="stars-fg" style={{ width: `${pct}%` }}>★★★★★</span>
    </span>
  );
}

export function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const labels = ['', 'Hated it', "Didn't like it", 'It was okay', 'Liked it', 'Loved it'];
  return (
    <div className="star-input" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={n <= (hover || value) ? 'on' : ''}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          aria-pressed={value === n}
        >★</button>
      ))}
      <span className="muted">{labels[hover || value]}</span>
    </div>
  );
}

export function Price({ cents, listCents, size = 'md' }) {
  const [dollars, fraction] = formatPrice(cents).replace('$', '').split('.');
  const discount = listCents && listCents > cents ? Math.round((1 - cents / listCents) * 100) : 0;
  return (
    <div className={`price price-${size}`}>
      {discount > 0 && <span className="price-discount">-{discount}%</span>}
      <span className="price-now">
        <sup>$</sup>{dollars}<sup>{fraction}</sup>
      </span>
      {discount > 0 && <span className="price-list">List: <s>{formatPrice(listCents)}</s></span>}
    </div>
  );
}

export function ProductImage({ product, size = 'md' }) {
  if (product.imageUrl) {
    return <img className={`product-image product-image-${size}`} src={product.imageUrl} alt={product.title} loading="lazy" />;
  }
  return (
    <div
      className={`product-image product-image-${size}`}
      style={{ background: `linear-gradient(135deg, ${product.colorFrom}, ${product.colorTo})` }}
      role="img"
      aria-label={product.title}
    >
      <span>{product.emoji}</span>
    </div>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <span className="muted">{label}</span>
    </div>
  );
}

export function QtySelect({ value, max, onChange, disabled }) {
  const options = Array.from({ length: Math.max(1, Math.min(10, max)) }, (_, i) => i + 1);
  return (
    <label className="qty-select">
      Qty:
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} disabled={disabled}>
        {options.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </label>
  );
}

export function StockBadge({ stock }) {
  if (stock === 0) return <span className="stock out">Currently unavailable</span>;
  if (stock <= 10) return <span className="stock low">Only {stock} left in stock — order soon.</span>;
  return <span className="stock in">In Stock</span>;
}
