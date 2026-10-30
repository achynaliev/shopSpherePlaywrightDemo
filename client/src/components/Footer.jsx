import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <button className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top</button>
      <div className="footer-cols">
        <div>
          <h4>Get to Know Us</h4>
          <Link to="/">About ShopSphere</Link>
          <Link to="/">Careers</Link>
          <Link to="/">Sustainability</Link>
        </div>
        <div>
          <h4>Shop With Us</h4>
          <Link to="/search?featured=true">Today&apos;s Deals</Link>
          <Link to="/search?sort=newest">New Arrivals</Link>
          <Link to="/search?sort=rating">Top Rated</Link>
        </div>
        <div>
          <h4>Let Us Help You</h4>
          <Link to="/account">Your Account</Link>
          <Link to="/orders">Your Orders</Link>
          <Link to="/cart">Your Cart</Link>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} ShopSphere. Demo store — no real payments are processed.</div>
    </footer>
  );
}
