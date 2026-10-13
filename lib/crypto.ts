import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'eniso_cyberguards_spartan_secret_jwt_2026_key_987654';

/**
 * Generate salt for flag or password hashing
 */
export function generateSalt(length = 16): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash flag using SHA-256 with salt
 * Hash = SHA256(flag.trim() + salt)
 */
export function hashFlag(flag: string, salt: string): string {
  const normalized = flag.trim();
  return crypto.createHash('sha256').update(normalized + salt).digest('hex');
}

/**
 * Hash password with scrypt
 */
export function hashPassword(password: string): string {
  const salt = generateSalt(16);
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against stored scrypt hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
  } catch {
    return false;
  }
}

export interface SessionPayload {
  userId: string;
  username: string;
  email: string;
  role: 'MEMBER' | 'ADMIN';
  exp: number;
}

/**
 * Create a signed session token
 */
export function signSession(payload: Omit<SessionPayload, 'exp'>, expiresInDays = 14): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;
  const fullPayload: SessionPayload = { ...payload, exp };
  
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Verify and decode session token
 */
export function verifySession(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
