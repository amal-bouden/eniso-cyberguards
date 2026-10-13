import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSameOrigin, getSessionUser } from '@/lib/auth';
import { hashFlag } from '@/lib/crypto';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  if (!checkSameOrigin(req)) {
    return NextResponse.json({ error: 'Invalid origin header' }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required to submit flags.' }, { status: 401 });
  }

  // Rate Limiting: 12 attempts per minute per member
  const rlKey = `submit-flag:${user.userId}`;
  const rl = checkRateLimit(rlKey, 12, 60000);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        status: 'rate_limited',
        message: `Rate limit exceeded! Max 12 submissions per minute. Retry in ${Math.ceil(rl.resetMs / 1000)}s.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { challengeId, flag } = body;

    if (!challengeId || !flag) {
      return NextResponse.json({ error: 'Challenge ID and Flag are required.' }, { status: 400 });
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        solves: {
          include: {
            user: {
              select: { role: true },
            },
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found.' }, { status: 404 });
    }

    // Draft mode check: Non-admins cannot submit flags to draft challenges
    if (challenge.isDraft && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Challenge is in draft mode.' }, { status: 403 });
    }

    // Hash check
    const submittedHash = hashFlag(flag, challenge.flagSalt);
    const isCorrect = submittedHash === challenge.flagHash;

    if (!isCorrect) {
      return NextResponse.json({
        status: 'incorrect',
        message: 'ACCESS DENIED: Flag submission invalid.',
      });
    }

    // Admin test submission check
    if (user.role === 'ADMIN') {
      return NextResponse.json({
        status: 'admin_test',
        message: 'FLAG VERIFIED (ADMIN TEST): Test submission successful. 0 points awarded.',
        points: 0,
        isFirstBlood: false,
      });
    }

    // Member submission: Check if already solved
    const existingSolve = challenge.solves.find((s) => s.userId === user.userId);
    if (existingSolve) {
      return NextResponse.json({
        status: 'already_solved',
        message: 'ALREADY SOLVED: You have already captured this flag!',
        points: challenge.points,
      });
    }

    // Check if First Blood (excluding admin solves)
    const validSolves = challenge.solves.filter((s) => s.user.role !== 'ADMIN');
    const isFirstBlood = validSolves.length === 0;

    // Create solve entry
    await prisma.solve.create({
      data: {
        userId: user.userId,
        challengeId: challenge.id,
      },
    });

    return NextResponse.json({
      status: 'correct',
      message: isFirstBlood
        ? 'FIRST BLOOD! 🔥 Flag Accepted! Outstanding performance, Operative.'
        : 'SUCCESS! 🎉 Flag Accepted! Points added to team score.',
      points: challenge.points,
      isFirstBlood,
      challengeTitle: challenge.title,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Submission processing error' }, { status: 500 });
  }
}
