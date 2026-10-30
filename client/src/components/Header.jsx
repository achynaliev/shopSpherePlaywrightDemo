import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState(params.get('q') ?? '');
  const [category, setCategory] = useState(params.get('category') ?? '');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    api.get('/products/categories').then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  // Keep the search box in sync when navigating between result pages.
  useEffect(() => {
    if (location.pathname === '/search') {
      setQ(params.get('q') ?? '');
      setCategory(params.get('category') ?? '');
    }
  }, [location.pathname, params]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (q.trim()) next.set('q', q.trim());
    if (category) next.set('category', category);
    navigate(`/search?${next}`);
  };

  const onLogout = async () => {
    await logout();
    toast('Signed out');
    navigate('/');
  };

  const signInLink = `/login?next=${encodeURIComponent(location.pathname + location.search)}`;

  return (
    <header className="site-header">
      <div className="header-main">
        <Link to="/" className="logo" aria-label="ShopSphere home">
          <span className="logo-mark">◎</span>
          <span>shop<b>sphere</b></span>
        </Link>

        <form className="search" onSubmit={onSearch} role="search">
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="">All</option>
            {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          <input
            type="search"
            placeholder="Search ShopSphere"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search products"
          />
          <button type="submit" aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          </button>
        </form>

        <nav className="header-nav">
          <div className="account" ref={menuRef}>
            {user ? (
              <button className="nav-item" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen}>
                <span className="nav-line1">Hello, {user.name.split(' ')[0]}</span>
                <span className="nav-line2">Account ▾</span>
              </button>
            ) : (
              <Link className="nav-item" to={signInLink}>
                <span className="nav-line1">Hello, sign in</span>
                <span className="nav-line2">Account</span>
              </Link>
            )}
            {menuOpen && user && (
              <div className="account-menu">
                <Link to="/account">Your Account</Link>
                <Link to="/orders">Your Orders</Link>
                <button onClick={onLogout}>Sign Out</button>
              </div>
            )}
          </div>
          <Link className="nav-item hide-sm" to="/orders">
            <span className="nav-line1">Returns</span>
            <span className="nav-line2">&amp; Orders</span>
          </Link>
          <Link className="nav-item cart-link" to="/cart" aria-label={`Cart, ${cart.count} items`}>
            <span className="cart-icon">
              <svg width="34" height="30" viewBox="0 0 34 30" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><path d="M1 3h5l4 17h18l3-12H8" /><circle cx="12" cy="26" r="2" /><circle cx="26" cy="26" r="2" /></svg>
              <span className="cart-count">{cart.count}</span>
            </span>
            <span className="nav-line2 hide-sm">Cart</span>
          </Link>
        </nav>
      </div>
      <div className="header-sub">
        <Link to="/search">All</Link>
        <Link to="/search?sort=newest">New Arrivals</Link>
        <Link to="/search?featured=true">Today&apos;s Deals</Link>
        {categories.map((c) => (
          <Link key={c.name} to={`/search?category=${encodeURIComponent(c.name)}`}>{c.name}</Link>
        ))}
      </div>
    </header>
  );
}
