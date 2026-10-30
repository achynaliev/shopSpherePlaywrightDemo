import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import { ProductImage, Spinner } from '../components/ui.jsx';

const CATEGORY_ICONS = {
  Electronics: '🎧', 'Home & Kitchen': '☕', Books: '📚', Fashion: '👟',
  'Sports & Outdoors': '⛺', 'Beauty & Personal Care': '✨', 'Toys & Games': '🧱',
};

function Shelf({ title, link, products }) {
  return (
    <section className="card shelf">
      <div className="shelf-head">
        <h2>{title}</h2>
        <Link to={link}>See more</Link>
      </div>
      <div className="shelf-row">
        {products.map((p) => (
          <Link key={p.id} to={`/product/${p.slug}`} className="shelf-item" title={p.title}>
            <ProductImage product={p} size="sm" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/products/categories'),
      api.get('/products?featured=true&limit=8'),
      api.get('/products?sort=newest&limit=8'),
      api.get('/products?sort=rating&limit=8'),
    ])
      .then(([c, featured, newest, top]) => setData({ categories: c.categories, featured: featured.products, newest: newest.products, top: top.products }))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!data) return <Spinner />;

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-inner">
          <p className="hero-kicker">Fall Deals Week</p>
          <h1>Great finds, delivered fast.</h1>
          <p>Free delivery on orders over $35. Up to 30% off headphones, kitchen gear and outdoor favorites.</p>
          <div className="hero-actions">
            <Link className="btn btn-primary btn-lg" to="/search?featured=true">Shop today&apos;s deals</Link>
            <Link className="btn btn-ghost btn-lg" to="/search">Browse everything</Link>
          </div>
        </div>
      </section>

      <div className="page home-body">
        <div className="category-grid">
          {data.categories.map((c) => (
            <Link key={c.name} to={`/search?category=${encodeURIComponent(c.name)}`} className="card category-tile">
              <span className="category-icon">{CATEGORY_ICONS[c.name] ?? '🛍️'}</span>
              <span className="category-name">{c.name}</span>
              <span className="muted small">{c.count} items</span>
            </Link>
          ))}
        </div>

        <div className="shelves">
          <Shelf title="New arrivals" link="/search?sort=newest" products={data.newest.slice(0, 4)} />
          <Shelf title="Top rated" link="/search?sort=rating" products={data.top.slice(0, 4)} />
        </div>

        <section>
          <div className="section-head">
            <h2>Today&apos;s featured deals</h2>
            <Link to="/search?featured=true">See all deals</Link>
          </div>
          <div className="product-grid">
            {data.featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
