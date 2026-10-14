import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSameOrigin, getSessionUser } from '@/lib/auth';
import { generateSalt, hashFlag } from '@/lib/crypto';
import { getChallengeEnhancements } from '@/lib/challenge-files';
import { ensureDatabaseInitialized } from '@/lib/db-auto-init';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    const user = await getSessionUser();
    const isAdmin = user?.role === 'ADMIN';

    // Filter out drafts for non-admins
    const whereCondition = isAdmin ? {} : { isDraft: false };

    const challenges = await prisma.challenge.findMany({
      where: whereCondition,
      orderBy: { points: 'asc' },
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        points: true,
        hint: true,
        instanceUrl: true,
        isPerUserInstance: true,
        isDraft: true,
        createdAt: true,
        solves: {
          orderBy: { solvedAt: 'asc' },
          select: {
            solvedAt: true,
            user: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Process solve counts, first blood badge, downloadable files, and per-user unique target instance links
    const formattedChallenges = challenges.map((ch) => {
      const validSolves = ch.solves.filter((s) => s.user.role !== 'ADMIN');
      const solveCount = validSolves.length;
      const firstBlood = validSolves[0] ? validSolves[0].user.username : null;
      const isSolvedByCurrentUser = user ? validSolves.some((s) => s.user.id === user.userId) : false;

      // Check enhanced metadata from challenge folder files registry
      const enhancement = getChallengeEnhancements(ch.title);
      const effectiveDescription = enhancement?.fullDescription || ch.description;
      const effectiveFiles = enhancement?.files || [];

      // Compute per-user target instance link
      let userInstanceUrl = enhancement != null
        ? enhancement.targetUrl
        : (ch.instanceUrl || null);
      if (userInstanceUrl && ch.isPerUserInstance && user?.username) {
        if (userInstanceUrl.startsWith('http://') || userInstanceUrl.startsWith('https://')) {
          try {
            const urlObj = new URL(userInstanceUrl);
            urlObj.searchParams.set('operative', user.username);
            userInstanceUrl = urlObj.toString();
          } catch {
            userInstanceUrl = `${userInstanceUrl}?operative=${user.username}`;
          }
        } else if (userInstanceUrl.startsWith('nc ')) {
          userInstanceUrl = `${userInstanceUrl} (User ID: ${user.username})`;
        }
      }

      return {
        id: ch.id,
        title: ch.title,
        category: enhancement?.category || ch.category,
        description: effectiveDescription,
        points: ch.points,
        hint: ch.hint,
        instanceUrl: userInstanceUrl,
        isPerUserInstance: ch.isPerUserInstance,
        isDraft: ch.isDraft,
        createdAt: ch.createdAt,
        solveCount,
        firstBlood,
        isSolved: isSolvedByCurrentUser,
        files: effectiveFiles,
      };
    });

    return NextResponse.json({ challenges: formattedChallenges });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch challenges' }, { status: 500 });
  }
}

// ADMIN ONLY - Create new challenge
export async function POST(req: NextRequest) {
  if (!checkSameOrigin(req)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const user = await getSessionUser();
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, category, description, points, flag, hint, instanceUrl, isPerUserInstance, isDraft } = body;

    if (!title || !category || !description || !points || !flag) {
      return NextResponse.json({ error: 'Missing required fields (title, category, description, points, flag).' }, { status: 400 });
    }

    const salt = generateSalt();
    const flagHash = hashFlag(flag, salt);

    const newChallenge = await prisma.challenge.create({
      data: {
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        points: parseInt(points, 10),
        flagSalt: salt,
        flagHash: flagHash,
        hint: hint ? hint.trim() : null,
        instanceUrl: instanceUrl ? instanceUrl.trim() : null,
        isPerUserInstance: isPerUserInstance !== undefined ? Boolean(isPerUserInstance) : true,
        isDraft: Boolean(isDraft),
      },
    });

    return NextResponse.json({ success: true, challenge: newChallenge });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create challenge' }, { status: 500 });
  }
}

// ADMIN ONLY - Update challenge
export async function PATCH(req: NextRequest) {
  if (!checkSameOrigin(req)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const user = await getSessionUser();
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, title, category, description, points, flag, hint, instanceUrl, isPerUserInstance, isDraft } = body;

    if (!id) {
      return NextResponse.json({ error: 'Challenge ID is required.' }, { status: 400 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (points !== undefined) updateData.points = parseInt(points, 10);
    if (hint !== undefined) updateData.hint = hint ? hint.trim() : null;
    if (instanceUrl !== undefined) updateData.instanceUrl = instanceUrl ? instanceUrl.trim() : null;
    if (isPerUserInstance !== undefined) updateData.isPerUserInstance = Boolean(isPerUserInstance);
    if (isDraft !== undefined) updateData.isDraft = Boolean(isDraft);

    if (flag && flag.trim().length > 0) {
      const salt = generateSalt();
      updateData.flagSalt = salt;
      updateData.flagHash = hashFlag(flag, salt);
    }

    const updated = await prisma.challenge.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, challenge: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update challenge' }, { status: 500 });
  }
}

// ADMIN ONLY - Delete challenge
export async function DELETE(req: NextRequest) {
  if (!checkSameOrigin(req)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const user = await getSessionUser();
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    await prisma.challenge.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Challenge deleted successfully' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete challenge' }, { status: 500 });
  }
}
