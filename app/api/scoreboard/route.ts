import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch non-admin members with their solves & linked challenges
    const members = await prisma.user.findMany({
      where: { role: 'MEMBER' },
      select: {
        id: true,
        username: true,
        createdAt: true,
        solves: {
          select: {
            solvedAt: true,
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

    // 2. Compute total points, solve count, and latest solve timestamp per member
    const leaderboardData = members.map((member) => {
      // Exclude solves on draft challenges
      const validSolves = member.solves.filter((s) => !s.challenge.isDraft);
      
      const totalPoints = validSolves.reduce((sum, s) => sum + s.challenge.points, 0);
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
        lastSolveTime: lastSolveTime.toISOString(),
      };
    });

    // 3. Sort leaderboard:
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

    // 4. Fetch recent global solves for live solve feed ticker
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
        user: {
          select: { username: true },
        },
        challenge: {
          select: { id: true, title: true, points: true, category: true },
        },
      },
    });

    // Compute if each recent solve was First Blood
    // A solve is First Blood if no earlier non-admin solve exists for that challenge
    const allSolves = await prisma.solve.findMany({
      where: { user: { role: 'MEMBER' } },
      select: { challengeId: true, solvedAt: true },
      orderBy: { solvedAt: 'asc' },
    });

    const firstSolveMap = new Map<string, string>();
    for (const s of allSolves) {
      if (!firstSolveMap.has(s.challengeId)) {
        firstSolveMap.set(s.challengeId, s.solvedAt.toISOString());
      }
    }

    const formattedFeed = recentSolves.map((s) => {
      const earliestSolve = firstSolveMap.get(s.challenge.id);
      const isFirstBlood = earliestSolve === s.solvedAt.toISOString();

      return {
        id: s.id,
        username: s.user.username,
        challengeTitle: s.challenge.title,
        category: s.challenge.category,
        points: s.challenge.points,
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
