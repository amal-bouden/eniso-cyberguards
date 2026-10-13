import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { verifySession, SessionPayload } from './crypto';

export const COOKIE_NAME = 'cyberguards_session';

export async function getSessionUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifySession(token);
  if (!payload) return null;

  // Verify DB user still exists
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true, email: true, role: true },
  });

  if (!user) return null;

  return {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role as 'MEMBER' | 'ADMIN',
    exp: payload.exp,
  };
}

export function checkSameOrigin(req: NextRequest): boolean {
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');

  if (!origin || !host) return true; // Fallback for local testing tools/curl if needed
  
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}
