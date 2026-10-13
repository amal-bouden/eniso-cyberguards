import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSameOrigin, getSessionUser } from '@/lib/auth';
import { hashPassword } from '@/lib/crypto';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized. Executive Board access required.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const resource = searchParams.get('resource');

  try {
    if (resource === 'invite-codes') {
      const codes = await prisma.inviteCode.findMany({
        orderBy: { id: 'desc' },
        include: {
          _count: { select: { users: true } },
        },
      });
      return NextResponse.json({ inviteCodes: codes });
    }

    if (resource === 'users') {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
          inviteCode: {
            select: { code: true },
          },
          _count: {
            select: { solves: true },
          },
        },
      });
      return NextResponse.json({ users });
    }

    return NextResponse.json({ error: 'Unknown resource' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Admin GET operation failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkSameOrigin(req)) {
    return NextResponse.json({ error: 'Invalid origin header' }, { status: 403 });
  }

  const user = await getSessionUser();
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized. Executive Board access required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, code, maxUses, expiresAt } = body;

    // Generate Invite Code
    if (action === 'create-invite') {
      let finalCode = code ? code.trim().toUpperCase() : `SPARTAN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const existing = await prisma.inviteCode.findUnique({
        where: { code: finalCode },
      });

      if (existing) {
        return NextResponse.json({ error: 'Invite code already exists' }, { status: 400 });
      }

      const inviteCode = await prisma.inviteCode.create({
        data: {
          code: finalCode,
          maxUses: maxUses ? parseInt(maxUses, 10) : 1,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });

      return NextResponse.json({ success: true, inviteCode });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Admin POST operation failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!checkSameOrigin(req)) {
    return NextResponse.json({ error: 'Invalid origin header' }, { status: 403 });
  }

  const user = await getSessionUser();
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized. Executive Board access required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, role, newPassword } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (role && (role === 'MEMBER' || role === 'ADMIN')) {
      updateData.role = role;
    }
    if (newPassword && newPassword.trim().length > 0) {
      updateData.passwordHash = hashPassword(newPassword.trim());
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, username: true, role: true },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Admin PATCH operation failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkSameOrigin(req)) {
    return NextResponse.json({ error: 'Invalid origin header' }, { status: 403 });
  }

  const user = await getSessionUser();
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized. Executive Board access required.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id || !type) {
      return NextResponse.json({ error: 'Type and ID required' }, { status: 400 });
    }

    if (type === 'user') {
      // Prevent admin self-deletion
      if (id === user.userId) {
        return NextResponse.json({ error: 'You cannot delete your own admin account.' }, { status: 400 });
      }

      await prisma.user.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, message: 'User deleted successfully' });
    }

    if (type === 'invite') {
      await prisma.inviteCode.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, message: 'Invite Code deleted successfully' });
    }

    return NextResponse.json({ error: 'Invalid delete type' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Admin DELETE operation failed' }, { status: 500 });
  }
}
