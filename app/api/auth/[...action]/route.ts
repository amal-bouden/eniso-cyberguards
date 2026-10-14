import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, signSession } from '@/lib/crypto';
import { COOKIE_NAME, checkSameOrigin, getSessionUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { ensureDatabaseInitialized } from '@/lib/db-auto-init';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ action: string[] }> }
) {
  await ensureDatabaseInitialized();
  const resolvedParams = await params;
  const action = resolvedParams.action?.[0];

  if (action === 'me') {
    const user = await getSessionUser();
    return NextResponse.json({ user });
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string[] }> }
) {
  await ensureDatabaseInitialized();
  if (!checkSameOrigin(req)) {
    return NextResponse.json({ error: 'Invalid origin request header' }, { status: 403 });
  }

  const resolvedParams = await params;
  const action = resolvedParams.action?.[0];
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  // 1. LOGIN
  if (action === 'login') {
    const rl = checkRateLimit(`login:${ip}`, 10, 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please wait ${Math.ceil(rl.resetMs / 1000)} seconds.` },
        { status: 429 }
      );
    }

    try {
      const body = await req.json();
      const { identifier, password } = body; // identifier can be username or email

      if (!identifier || !password) {
        return NextResponse.json({ error: 'Username/Email and password are required.' }, { status: 400 });
      }

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: identifier.trim() },
            { email: identifier.trim().toLowerCase() },
          ],
        },
      });

      if (!user || !verifyPassword(password, user.passwordHash)) {
        return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
      }

      const token = signSession({
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role as 'MEMBER' | 'ADMIN',
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });

      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 14 * 24 * 60 * 60,
      });

      return response;
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
    }
  }

  // 2. REGISTER
  if (action === 'register') {
    const rl = checkRateLimit(`register:${ip}`, 10, 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many registration attempts. Please wait ${Math.ceil(rl.resetMs / 1000)} seconds.` },
        { status: 429 }
      );
    }

    try {
      const body = await req.json();
      const { username, email, password, inviteCode } = body;

      if (!username || !email || !password || !inviteCode) {
        return NextResponse.json({ error: 'All fields including Invite Code are required.' }, { status: 400 });
      }

      if (username.length < 3 || username.length > 25) {
        return NextResponse.json({ error: 'Username must be between 3 and 25 characters.' }, { status: 400 });
      }

      // Check Invite Code validity
      const codeRecord = await prisma.inviteCode.findUnique({
        where: { code: inviteCode.trim().toUpperCase() },
      });

      if (!codeRecord) {
        return NextResponse.json({ error: 'Invalid Invite Code.' }, { status: 400 });
      }

      if (codeRecord.maxUses > 0 && codeRecord.uses >= codeRecord.maxUses) {
        return NextResponse.json({ error: 'Invite Code usage limit reached.' }, { status: 400 });
      }

      if (codeRecord.expiresAt && new Date(codeRecord.expiresAt) < new Date()) {
        return NextResponse.json({ error: 'Invite Code has expired.' }, { status: 400 });
      }

      // Check unique username & email
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: username.trim() },
            { email: email.trim().toLowerCase() },
          ],
        },
      });

      if (existingUser) {
        return NextResponse.json({ error: 'Username or Email is already registered.' }, { status: 400 });
      }

      // Create user & increment invite code usage
      const passwordHash = hashPassword(password);
      const newUser = await prisma.user.create({
        data: {
          username: username.trim(),
          email: email.trim().toLowerCase(),
          passwordHash,
          role: 'MEMBER',
          inviteCodeId: codeRecord.id,
        },
      });

      await prisma.inviteCode.update({
        where: { id: codeRecord.id },
        data: { uses: { increment: 1 } },
      });

      const token = signSession({
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role as 'MEMBER' | 'ADMIN',
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
        },
      });

      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 14 * 24 * 60 * 60,
      });

      return response;
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
    }
  }

  // 3. LOGOUT
  if (action === 'logout') {
    const response = NextResponse.json({ success: true });
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // 4. SETUP ADMIN (One-time setup code)
  if (action === 'setup-admin') {
    try {
      const body = await req.json();
      const { setupCode, username, email, password } = body;
      const expectedCode = process.env.SETUP_CODE || 'CYBERGUARDS-ADMIN-SETUP-2026';

      if (setupCode !== expectedCode) {
        return NextResponse.json({ error: 'Invalid Setup Code.' }, { status: 403 });
      }

      if (!username || !email || !password) {
        return NextResponse.json({ error: 'Username, email, and password required.' }, { status: 400 });
      }

      const passwordHash = hashPassword(password);
      const admin = await prisma.user.upsert({
        where: { username: username.trim() },
        update: { role: 'ADMIN', passwordHash },
        create: {
          username: username.trim(),
          email: email.trim().toLowerCase(),
          passwordHash,
          role: 'ADMIN',
        },
      });

      return NextResponse.json({ success: true, message: `Admin account '${admin.username}' created/promoted!` });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Setup failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Action not supported' }, { status: 404 });
}
