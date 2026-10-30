import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, formatDate, formatPrice } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { Price, ProductImage, QtySelect, Spinner, StarInput, Stars, StockBadge } from '../components/ui.jsx';

function RatingSummary({ product }) {
  const total = product.ratingCount || 1;
  return (
    <div className="rating-summary">
      <h2>Customer reviews</h2>
      <div className="rating-row">
        <Stars value={product.rating} size="md" />
        <b>{product.rating.toFixed(1)} out of 5</b>
      </div>
      <p className="muted small">{product.ratingCount} global ratings</p>
      <table className="rating-bars">
        <tbody>
          {[5, 4, 3, 2, 1].map((n) => {
            const pct = Math.round(((product.ratingBreakdown?.[n] ?? 0) / total) * 100);
            return (
              <tr key={n}>
                <td>{n} star</td>
                <td className="bar-cell"><div className="bar"><div style={{ width: `${pct}%` }} /></div></td>
                <td className="muted">{pct}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReviewForm({ slug, existing, onSaved, onCancel }) {
  const toast = useToast();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setError('Please select a star rating.');
    setBusy(true);
    setError('');
    try {
      await api.post(`/products/${slug}/reviews`, { rating, title, body });
      toast(existing ? 'Review updated' : 'Thanks for your review!');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card review-form" onSubmit={submit}>
      <h3>{existing ? 'Edit your review' : 'Write a customer review'}</h3>
      {error && <div className="alert alert-error">{error}</div>}
      <label>Overall rating</label>
      <StarInput value={rating} onChange={setRating} />
      <label htmlFor="rv-title">Headline</label>
      <input id="rv-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="What's most important to know?" required />
      <label htmlFor="rv-body">Written review</label>
      <textarea id="rv-body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={4000} minLength={10}
        placeholder="What did you like or dislike? How did you use this product?" required />
      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit'}</button>
        {onCancel && <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

export default function Product() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { add } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reviewSort, setReviewSort] = useState('recent');

  const loadProduct = useCallback(() => api.get(`/products/${slug}`).then((d) => setProduct(d.product)), [slug]);
  const loadReviews = useCallback(
    () => api.get(`/products/${slug}/reviews?sort=${reviewSort}`).then((d) => setReviews(d.reviews)),
    [slug, reviewSort],
  );

  useEffect(() => {
    setProduct(null);
    setError('');
    setQty(1);
    setEditing(false);
    loadProduct().catch((e) => setError(e.message));
    api.get(`/products/${slug}/related`).then((d) => setRelated(d.products)).catch(() => {});
    window.scrollTo(0, 0);
  }, [slug, loadProduct]);

  useEffect(() => {
    loadReviews().catch(() => {});
  }, [loadReviews, user]);

  const addToCart = async (buyNow = false) => {
    setBusy(true);
    try {
      await add(product, qty);
      if (buyNow) navigate(user ? '/checkout' : '/login?next=/checkout');
      else toast(`Added ${qty} to cart`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const deleteReview = async () => {
    if (!window.confirm('Delete your review?')) return;
    try {
      await api.del(`/products/${slug}/reviews/mine`);
      toast('Review deleted');
      loadProduct();
      loadReviews();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (error) {
    return (
      <div className="page">
        <div className="card empty">
          <h2>{error}</h2>
          <Link to="/" className="btn btn-secondary">Back to home</Link>
        </div>
      </div>
    );
  }
  if (!product) return <Spinner />;

  const mine = reviews.find((r) => r.isMine);
  const onSaved = () => { setEditing(false); loadProduct(); loadReviews(); };

  return (
    <div className="page product-page">
      <nav className="breadcrumbs small">
        <Link to="/search">All</Link> › <Link to={`/search?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
      </nav>

      <div className="product-layout">
        <div className="product-gallery">
          <ProductImage product={product} size="lg" />
        </div>

        <div className="product-info">
          <h1>{product.title}</h1>
          <Link className="small" to={`/search?q=${encodeURIComponent(product.brand)}`}>Visit the {product.brand} Store</Link>
          <a href="#reviews" className="rating-row">
            <b>{product.rating.toFixed(1)}</b>
            <Stars value={product.rating} size="md" />
            <span className="small">{product.ratingCount} ratings</span>
          </a>
          <hr />
          <Price cents={product.price} listCents={product.listPrice} size="lg" />
          <hr />
          <h3>About this item</h3>
          <ul className="features">
            {product.features.map((f) => <li key={f}>{f}</li>)}
          </ul>
          <p>{product.description}</p>
        </div>

        <aside className="card buy-box">
          <Price cents={product.price} size="md" />
          <p className="small">
            {product.price >= 3500 ? <><b>FREE delivery</b> in 4 days</> : <>{formatPrice(599)} delivery · FREE over $35</>}
          </p>
          <StockBadge stock={product.stock} />
          {product.stock > 0 && (
            <>
              <QtySelect value={qty} max={product.stock} onChange={setQty} />
              <button className="btn btn-primary btn-block" onClick={() => addToCart(false)} disabled={busy}>Add to Cart</button>
              <button className="btn btn-buy btn-block" onClick={() => addToCart(true)} disabled={busy}>Buy Now</button>
            </>
          )}
          <dl className="buy-meta small">
            <dt>Ships from</dt><dd>ShopSphere</dd>
            <dt>Sold by</dt><dd>{product.brand}</dd>
            <dt>Returns</dt><dd>30-day refund / replacement</dd>
            <dt>Payment</dt><dd>Secure transaction</dd>
          </dl>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="related">
          <h2>Related products</h2>
          <div className="product-grid">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      <section className="reviews-section" id="reviews">
        <div>
          <RatingSummary product={product} />
          <hr />
          <h3>Review this product</h3>
          <p className="small">Share your thoughts with other customers</p>
          {!user && (
            <Link className="btn btn-secondary btn-block" to={`/login?next=${encodeURIComponent(location.pathname)}`}>
              Sign in to write a review
            </Link>
          )}
          {user && !mine && !editing && (
            <button className="btn btn-secondary btn-block" onClick={() => setEditing(true)}>Write a customer review</button>
          )}
        </div>

        <div className="reviews-list">
          {user && editing && (
            <ReviewForm slug={slug} existing={mine} onSaved={onSaved} onCancel={() => setEditing(false)} />
          )}
          <div className="section-head">
            <h3>{reviews.length ? 'Customer reviews' : 'No reviews yet'}</h3>
            {reviews.length > 1 && (
              <select value={reviewSort} onChange={(e) => setReviewSort(e.target.value)} aria-label="Sort reviews">
                <option value="recent">Most recent</option>
                <option value="top">Top rated</option>
              </select>
            )}
          </div>
          {reviews.map((r) => (
            <article key={r.id} className={`review ${r.isMine ? 'review-mine' : ''}`}>
              <div className="review-author">
                <span className="avatar">{r.author[0]}</span>
                <span>{r.author}{r.isMine && <span className="muted"> (you)</span>}</span>
              </div>
              <div className="rating-row">
                <Stars value={r.rating} />
                <b>{r.title}</b>
              </div>
              <div className="muted small">
                Reviewed on {formatDate(r.createdAt)}
                {r.updatedAt !== r.createdAt && ' · edited'}
              </div>
              {r.verifiedPurchase && <div className="verified small">Verified Purchase</div>}
              <p>{r.body}</p>
              {r.isMine && !editing && (
                <div className="review-actions">
                  <button className="link-btn" onClick={() => setEditing(true)}>Edit</button>
                  <button className="link-btn danger" onClick={deleteReview}>Delete</button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
