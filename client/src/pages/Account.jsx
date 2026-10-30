import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Account() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState({ profile: '', password: '' });

  const saveProfile = async (e) => {
    e.preventDefault();
    setError((x) => ({ ...x, profile: '' }));
    try {
      setUser((await api.put('/auth/me', { name })).user);
      toast('Name updated');
    } catch (err) {
      setError((x) => ({ ...x, profile: err.message }));
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setError((x) => ({ ...x, password: '' }));
    try {
      await api.put('/auth/me/password', pw);
      setPw({ currentPassword: '', newPassword: '' });
      toast('Password changed');
    } catch (err) {
      setError((x) => ({ ...x, password: err.message }));
    }
  };

  return (
    <div className="page narrow">
      <h1>Your Account</h1>
      <div className="account-tiles">
        <Link to="/orders" className="card account-tile"><span>📦</span><div><b>Your Orders</b><p className="small muted">Track, cancel or buy things again</p></div></Link>
        <Link to="/cart" className="card account-tile"><span>🛒</span><div><b>Your Cart</b><p className="small muted">Review items and check out</p></div></Link>
        <a href="#security" className="card account-tile"><span>🔐</span><div><b>Login &amp; security</b><p className="small muted">Edit name and password</p></div></a>
      </div>

      <div className="account-forms" id="security">
        <form className="card stack" onSubmit={saveProfile}>
          <h3>Profile</h3>
          <p className="small muted">{user.email} · member since {formatDate(user.createdAt, { year: 'numeric', month: 'long' })}</p>
          {error.profile && <div className="alert alert-error">{error.profile}</div>}
          <label>Name<input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} /></label>
          <button className="btn btn-primary">Save</button>
        </form>

        <form className="card stack" onSubmit={savePassword}>
          <h3>Change password</h3>
          {error.password && <div className="alert alert-error">{error.password}</div>}
          <label>Current password
            <input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required autoComplete="current-password" />
          </label>
          <label>New password
            <input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required minLength={8} autoComplete="new-password" />
          </label>
          <button className="btn btn-primary">Update password</button>
        </form>
      </div>
    </div>
  );
}
