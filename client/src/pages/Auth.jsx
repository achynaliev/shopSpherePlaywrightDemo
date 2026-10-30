import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

// Only allow same-site relative redirects after sign-in.
function safeNext(params) {
  const next = params.get('next') || '/';
  return /^\/(?![\/\\])/.test(next) && !next.includes('\\') ? next : '/';
}

function AuthShell({ title, children, footer }) {
  return (
    <div className="auth-page">
      <Link to="/" className="logo logo-dark"><span className="logo-mark">◎</span><span>shop<b>sphere</b></span></Link>
      <div className="card auth-card">
        <h1>{title}</h1>
        {children}
      </div>
      {footer}
    </div>
  );
}

export function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user && !busy) return <Navigate to={next} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(form.email, form.password);
      toast(`Welcome back, ${u.name.split(' ')[0]}!`);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      footer={(
        <div className="auth-footer">
          <div className="divider-text"><span>New to ShopSphere?</span></div>
          <Link className="btn btn-secondary btn-block" to={`/register?next=${encodeURIComponent(next)}`}>Create your ShopSphere account</Link>
        </div>
      )}
    >
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={submit} className="stack">
        <label>Email
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" autoFocus />
        </label>
        <label>Password
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required autoComplete="current-password" />
        </label>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="small muted">By continuing, you agree to ShopSphere&apos;s Conditions of Use and Privacy Notice.</p>
    </AuthShell>
  );
}

export function Register() {
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user && !busy) return <Navigate to={next} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords must match.');
    setBusy(true);
    setError('');
    try {
      await register(form.name, form.email, form.password);
      toast('Account created — welcome to ShopSphere!');
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      footer={<p className="auth-footer small">Already have an account? <Link to={`/login?next=${encodeURIComponent(next)}`}>Sign in ›</Link></p>}
    >
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={submit} className="stack">
        <label>Your name
          <input value={form.name} onChange={set('name')} required autoComplete="name" placeholder="First and last name" autoFocus />
        </label>
        <label>Email
          <input type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
        </label>
        <label>Password
          <input type="password" value={form.password} onChange={set('password')} required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" />
        </label>
        <label>Re-enter password
          <input type="password" value={form.confirm} onChange={set('confirm')} required minLength={8} autoComplete="new-password" />
        </label>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Create your account'}</button>
      </form>
    </AuthShell>
  );
}
