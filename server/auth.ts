import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, UserRecord } from './db';

const ENCRYPTION_SECRET = process.env.ENCRYPTION_KEY?.trim();
const SESSION_TTL_MS = 60 * 60 * 1000;
const SESSION_SECRET = process.env.SESSION_SECRET?.trim();
const SESSION_COOKIE = 'as_session';

if (process.env.NODE_ENV === 'production' && (!ENCRYPTION_SECRET || !SESSION_SECRET)) {
  throw new Error('ENCRYPTION_KEY and SESSION_SECRET are required in production');
}

const encryptionSecret = ENCRYPTION_SECRET || crypto.randomBytes(32).toString('hex');
const sessionSecret = SESSION_SECRET || crypto.randomBytes(32).toString('hex');

export function encryptSecret(text: string): string {
  const key = crypto.createHash('sha256').update(encryptionSecret).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSecret(encryptedText: string): string {
  try {
    const [ivHex, tagHex, contentHex] = encryptedText.split(':');
    if (!ivHex || !tagHex || !contentHex) throw new Error('Invalid encrypted secret');
    const key = crypto.createHash('sha256').update(encryptionSecret).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(contentHex, 'hex')), decipher.final()]).toString('utf8');
  } catch {
    throw new Error('Secret decryption failed');
  }
}

function sign(value: string): string {
  return crypto.createHmac('sha256', sessionSecret).update(value).digest('base64url');
}

export function issueSessionToken(userId: string): string {
  const user = db.getUserById(userId);
  if (!user) throw new Error('Unknown user');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const nonce = crypto.randomBytes(16).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp: expiresAt, n: nonce })).toString('base64url');
  return `as_sess_${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string): UserRecord | null {
  if (!token.startsWith('as_sess_')) return null;
  const raw = token.slice('as_sess_'.length);
  const dot = raw.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  const expected = sign(payload);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { sub?: string; exp?: number; n?: string };
    if (!parsed.sub || !parsed.exp || !parsed.n || parsed.exp <= Date.now()) return null;
    return db.getUserById(parsed.sub) || null;
  } catch {
    return null;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: UserRecord;
    }
  }
}

export interface AuthenticatedRequest extends Request { user?: UserRecord; }

/**
 * Wait for the backing store before resolving a session. In Vercel serverless
 * instances the app can receive an authenticated request while Neon state is
 * still loading; checking the in-memory user list first falsely rejects valid
 * sessions. A storage failure is a service error, not an invalid credential.
 */
export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await db.ready();
  } catch {
    return res.status(503).json({
      success: false,
      error: 'Authentication service is temporarily unavailable. Please try again shortly.',
    });
  }

  const authHeader = String(req.headers.authorization || '');
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cookieHeader = String(req.headers.cookie || '');
  const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  let cookieToken = '';
  try {
    cookieToken = cookie ? decodeURIComponent(cookie.slice(SESSION_COOKIE.length + 1)) : '';
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired session' });
  }
  const user = verifySessionToken(bearer || cookieToken);
  if (!user) return res.status(401).json({ success: false, error: 'Invalid or expired session' });
  req.user = user;
  return next();
}

export function requireRole(allowedRoles: Array<'admin' | 'engineer' | 'reviewer'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' });
    if (!allowedRoles.includes(user.role)) return res.status(403).json({ success: false, error: 'Forbidden' });
    next();
  };
}

export function verifyBootstrapToken(supplied: string): boolean {
  const configured = process.env.AUTH_BOOTSTRAP_TOKEN?.trim();
  if (!configured || !supplied) return false;
  return supplied.length === configured.length && crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(configured));
}

export function verifyWebhookSignature(payload: Buffer | string, signature: string | undefined): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET?.trim();
  if (!secret || !signature?.startsWith('sha256=')) return false;
  const digest = `sha256=${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`;
  return digest.length === signature.length && crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}
