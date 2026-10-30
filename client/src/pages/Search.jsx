import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import { Spinner, Stars } from '../components/ui.jsx';

const SORTS = [
  ['featured', 'Featured'],
  ['price-asc', 'Price: Low to High'],
  ['price-desc', 'Price: High to Low'],
  ['rating', 'Avg. Customer Review'],
  ['newest', 'Newest Arrivals'],
];

const PRICE_RANGES = [
  ['', '25', 'Under $25'],
  ['25', '50', '$25 to $50'],
  ['50', '100', '$50 to $100'],
  ['100', '200', '$100 to $200'],
  ['200', '', '$200 & Above'],
];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const sort = params.get('sort') ?? 'featured';
  const page = Number(params.get('page') ?? 1);

  useEffect(() => {
    api.get('/products/categories').then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError('');
    const query = new URLSearchParams(params);
    if (!query.get('limit')) query.set('limit', '12');
    api.get(`/products?${query}`)
      .then((d) => !cancelled && setResult(d))
      .catch((e) => !cancelled && setError(e.message));
    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [params]);

  const setParam = (changes) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === '' || v == null) next.delete(k);
      else next.set(k, v);
    }
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const activePrice = `${params.get('minPrice') ?? ''}-${params.get('maxPrice') ?? ''}`;
  const hasFilters = ['category', 'minPrice', 'maxPrice', 'minRating', 'inStock', 'featured'].some((k) => params.get(k));

  let heading = 'All products';
  if (params.get('featured') === 'true') heading = "Today's deals";
  if (category) heading = category;
  if (q) heading = `Results for "${q}"`;

  return (
    <div className="page search-page">
      <div className="results-bar">
        <div>
          {result && (
            <span>
              {result.total === 0 ? 'No results' : `${(result.page - 1) * result.limit + 1}-${Math.min(result.page * result.limit, result.total)} of ${result.total} results`}
              {q && <> for <b className="accent">&quot;{q}&quot;</b></>}
              {category && <> in <b>{category}</b></>}
            </span>
          )}
        </div>
        <div className="results-controls">
          <button className="btn btn-secondary show-sm" onClick={() => setFiltersOpen((o) => !o)}>Filters</button>
          <label className="sort-select">
            Sort by:
            <select value={sort} onChange={(e) => setParam({ sort: e.target.value })}>
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="search-layout">
        <aside className={`filters ${filtersOpen ? 'open' : ''}`}>
          {hasFilters && (
            <button className="link-btn" onClick={() => setParams(q ? { q } : {})}>‹ Clear all filters</button>
          )}
          <div className="filter-group">
            <h4>Department</h4>
            <button className={`filter-link ${!category ? 'active' : ''}`} onClick={() => setParam({ category: '' })}>Any department</button>
            {categories.map((c) => (
              <button key={c.name} className={`filter-link ${category === c.name ? 'active' : ''}`} onClick={() => setParam({ category: c.name })}>
                {c.name} <span className="muted">({c.count})</span>
              </button>
            ))}
          </div>
          <div className="filter-group">
            <h4>Customer Reviews</h4>
            {[4, 3, 2].map((r) => (
              <button key={r} className={`filter-link ${params.get('minRating') === String(r) ? 'active' : ''}`}
                onClick={() => setParam({ minRating: params.get('minRating') === String(r) ? '' : r })}>
                <Stars value={r} /> &amp; Up
              </button>
            ))}
          </div>
          <div className="filter-group">
            <h4>Price</h4>
            {PRICE_RANGES.map(([min, max, label]) => (
              <button key={label} className={`filter-link ${activePrice === `${min}-${max}` ? 'active' : ''}`}
                onClick={() => (activePrice === `${min}-${max}` ? setParam({ minPrice: '', maxPrice: '' }) : setParam({ minPrice: min, maxPrice: max }))}>
                {label}
              </button>
            ))}
          </div>
          <div className="filter-group">
            <h4>Availability</h4>
            <label className="check">
              <input type="checkbox" checked={params.get('inStock') === 'true'} onChange={(e) => setParam({ inStock: e.target.checked ? 'true' : '' })} />
              Include in-stock only
            </label>
            <label className="check">
              <input type="checkbox" checked={params.get('featured') === 'true'} onChange={(e) => setParam({ featured: e.target.checked ? 'true' : '' })} />
              Deals only
            </label>
          </div>
        </aside>

        <section className="results">
          <h1 className="results-heading">{heading}</h1>
          {error && <div className="alert alert-error">{error}</div>}
          {!result && !error && <Spinner />}
          {result && result.products.length === 0 && (
            <div className="card empty">
              <h3>No results found</h3>
              <p className="muted">Try checking your spelling or use more general terms.</p>
              <Link to="/search" className="btn btn-secondary">Browse all products</Link>
            </div>
          )}
          {result && result.products.length > 0 && (
            <>
              <div className="product-grid">
                {result.products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {result.totalPages > 1 && (
                <nav className="pagination" aria-label="Pagination">
                  <button disabled={page <= 1} onClick={() => setParam({ page: page - 1 })}>‹ Previous</button>
                  {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((n) => (
                    <button key={n} className={n === page ? 'active' : ''} onClick={() => setParam({ page: n })} aria-current={n === page ? 'page' : undefined}>{n}</button>
                  ))}
                  <button disabled={page >= result.totalPages} onClick={() => setParam({ page: page + 1 })}>Next ›</button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
