import jwt from 'jsonwebtoken';

export const AUTH_COOKIE = 'ss_token';
const SESSION_DAYS = 7;

export function issueSession(res, config, userId) {
  const token = jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: `${SESSION_DAYS}d` });
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSession(res, config) {
  res.clearCookie(AUTH_COOKIE, { httpOnly: true, sameSite: 'lax', secure: config.cookieSecure, path: '/' });
}

// Attaches req.user when a valid session cookie belongs to an existing user; never rejects.
export function loadUser(db, config) {
  const findUser = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?');
  return (req, _res, next) => {
    const token = req.cookies?.[AUTH_COOKIE];
    if (token) {
      try {
        const payload = jwt.verify(token, config.jwtSecret);
        const user = findUser.get(payload.sub);
        if (user) req.user = user;
      } catch {
        // Expired or tampered token: treat as signed out.
      }
    }
    next();
  };
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please sign in to continue.' });
  next();
}
