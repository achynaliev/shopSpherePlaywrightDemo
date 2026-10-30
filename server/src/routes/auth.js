import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { HttpError, asyncHandler, toUser } from '../util.js';
import { clearSession, issueSession, requireAuth } from '../middleware/auth.js';

const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);
const password = z.string().min(8, 'Password must be at least 8 characters').max(128);
const name = z.string().trim().min(1, 'Name is required').max(80);

const registerSchema = z.object({ name, email, password });
const loginSchema = z.object({ email, password: z.string().min(1, 'Password is required').max(128) });
const profileSchema = z.object({ name });
const passwordSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: password });

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

export function authRouter(db, config) {
  const router = Router();

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.isProd ? 20 : 1000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
  });

  const findByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
  const findById = db.prepare('SELECT * FROM users WHERE id = ?');

  router.post('/register', limiter, asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    if (findByEmail.get(data.email)) throw new HttpError(409, 'An account with this email already exists.');
    const hash = await bcrypt.hash(data.password, 12);
    const { lastInsertRowid } = db
      .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run(data.name, data.email, hash);
    issueSession(res, config, Number(lastInsertRowid));
    res.status(201).json({ user: toUser(findById.get(lastInsertRowid)) });
  }));

  router.post('/login', limiter, asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = findByEmail.get(data.email);
    // Compare against a dummy hash when the user is missing so timing doesn't reveal which emails exist.
    const ok = await bcrypt.compare(data.password, user?.password_hash ?? DUMMY_HASH);
    if (!user || !ok) throw new HttpError(401, 'Incorrect email or password.');
    issueSession(res, config, user.id);
    res.json({ user: toUser(user) });
  }));

  router.post('/logout', (req, res) => {
    clearSession(res, config);
    res.json({ ok: true });
  });

  router.get('/me', (req, res) => {
    res.json({ user: req.user ? toUser(req.user) : null });
  });

  router.put('/me', requireAuth, (req, res) => {
    const data = profileSchema.parse(req.body);
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(data.name, req.user.id);
    res.json({ user: toUser(findById.get(req.user.id)) });
  });

  router.put('/me/password', requireAuth, limiter, asyncHandler(async (req, res) => {
    const data = passwordSchema.parse(req.body);
    const user = findById.get(req.user.id);
    if (!(await bcrypt.compare(data.currentPassword, user.password_hash))) {
      throw new HttpError(400, 'Current password is incorrect.');
    }
    const hash = await bcrypt.hash(data.newPassword, 12);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
    res.json({ ok: true });
  }));

  return router;
}
