import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveSolveScore } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch all solves to determine First Blood timestamps accurately
    const allSolves = await prisma.solve.findMany({
      where: { user: { role: 'MEMBER' } },
      select: { id: true, challengeId: true, solvedAt: true },
      orderBy: { solvedAt: 'asc' },
    });

    const firstSolveMap = new Map<string, string>();
    for (const s of allSolves) {
      if (!firstSolveMap.has(s.challengeId)) {
        firstSolveMap.set(s.challengeId, s.solvedAt.toISOString());
      }
    }

    // 2. Fetch non-admin members with their solves & linked challenges
    const members = await prisma.user.findMany({
      where: { role: 'MEMBER' },
      select: {
        id: true,
        username: true,
        createdAt: true,
        solves: {
          select: {
            id: true,
            solvedAt: true,
            points: true,
            basePoints: true,
            speedBonus: true,
            firstBloodBonus: true,
            timeTakenSeconds: true,
            isFirstBlood: true,
            challenge: {
              select: {
                id: true,
                title: true,
                points: true,
                isDraft: true,
              },
            },
          },
        },
      },
    });

    // 3. Compute total points, score breakdown, solve count, and latest solve timestamp per member
    const leaderboardData = members.map((member) => {
      // Exclude solves on draft challenges
      const validSolves = member.solves.filter((s) => !s.challenge.isDraft);

      let totalPoints = 0;
      let totalBasePoints = 0;
      let totalSpeedBonus = 0;
      let totalFirstBloodBonus = 0;
      let firstBloodCount = 0;

      for (const s of validSolves) {
        const isFb = s.isFirstBlood || firstSolveMap.get(s.challenge.id) === s.solvedAt.toISOString();
        const score = resolveSolveScore({ ...s, isFirstBlood: isFb });

        totalPoints += score.totalPoints;
        totalBasePoints += score.basePoints;
        totalSpeedBonus += score.speedBonus;
        totalFirstBloodBonus += score.firstBloodBonus;
        if (score.isFirstBlood) {
          firstBloodCount++;
        }
      }

      const solvedCount = validSolves.length;

      // Latest solve timestamp (fallback to user creation date if 0 solves)
      let lastSolveTime: Date = member.createdAt;
      if (validSolves.length > 0) {
        const sortedSolves = [...validSolves].sort(
          (a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime()
        );
        lastSolveTime = sortedSolves[0].solvedAt;
      }

      return {
        id: member.id,
        username: member.username,
        solvedCount,
        totalPoints,
        basePoints: totalBasePoints,
        speedBonus: totalSpeedBonus,
        firstBloodBonus: totalFirstBloodBonus,
        firstBloodCount,
        lastSolveTime: lastSolveTime.toISOString(),
      };
    });

    // 4. Sort leaderboard:
    // Primary: Total Points (DESC)
    // Secondary: Last Solve Time (ASC) -> reached score earlier
    leaderboardData.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return new Date(a.lastSolveTime).getTime() - new Date(b.lastSolveTime).getTime();
    });

    // Assign rank
    const rankedLeaderboard = leaderboardData.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    // 5. Fetch recent global solves for live solve feed ticker
    const recentSolves = await prisma.solve.findMany({
      where: {
        user: { role: 'MEMBER' },
        challenge: { isDraft: false },
      },
      orderBy: { solvedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        solvedAt: true,
        points: true,
        basePoints: true,
        speedBonus: true,
        firstBloodBonus: true,
        timeTakenSeconds: true,
        isFirstBlood: true,
        user: {
          select: { username: true },
        },
        challenge: {
          select: { id: true, title: true, points: true, category: true },
        },
      },
    });

    const formattedFeed = recentSolves.map((s) => {
      const isFirstBlood = s.isFirstBlood || firstSolveMap.get(s.challenge.id) === s.solvedAt.toISOString();
      const score = resolveSolveScore({ ...s, isFirstBlood });

      return {
        id: s.id,
        username: s.user.username,
        challengeTitle: s.challenge.title,
        category: s.challenge.category,
        points: score.totalPoints,
        basePoints: score.basePoints,
        speedBonus: score.speedBonus,
        firstBloodBonus: score.firstBloodBonus,
        timeTakenSeconds: score.timeTakenSeconds,
        solvedAt: s.solvedAt.toISOString(),
        isFirstBlood,
      };
    });

    const totalOperatives = await prisma.user.count();

    return NextResponse.json({
      leaderboard: rankedLeaderboard,
      feed: formattedFeed,
      totalOperatives,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Scoreboard fetch failed' }, { status: 500 });
  }
}
