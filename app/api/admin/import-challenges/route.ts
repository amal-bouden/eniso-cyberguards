import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { generateSalt, hashFlag } from '@/lib/crypto';

export const runtime = 'nodejs';

interface ChallengeInput {
  title: string;
  category: string;
  description: string;
  points: number;
  flag: string;
  hint?: string | null;
  instanceUrl?: string | null;
  isPerUserInstance?: boolean;
  isDraft?: boolean;
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized. Executive Board access required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { challenges } = body as { challenges: ChallengeInput[] };

    if (!Array.isArray(challenges) || challenges.length === 0) {
      return NextResponse.json({ error: 'No challenges provided.' }, { status: 400 });
    }

    // Validate required fields
    for (const c of challenges) {
      if (!c.title || !c.category || !c.description || !c.flag || typeof c.points !== 'number') {
        return NextResponse.json(
          { error: `Challenge "${c.title ?? '(unnamed)'}" is missing required fields (title, category, description, flag, points).` },
          { status: 400 }
        );
      }
    }

    let created = 0;
    let updated = 0;
    const results: { title: string; action: 'created' | 'updated' }[] = [];

    for (const c of challenges) {
      const existing = await prisma.challenge.findFirst({ where: { title: c.title } });

      if (existing) {
        // Update metadata but keep the existing flag hash unless a new flag is provided
        const updateData: Record<string, unknown> = {
          category: c.category,
          description: c.description,
          points: c.points,
          hint: c.hint ?? null,
          instanceUrl: c.instanceUrl ?? null,
          isPerUserInstance: c.isPerUserInstance ?? true,
          isDraft: c.isDraft ?? false,
        };

        if (c.flag && c.flag.trim().length > 0) {
          const salt = generateSalt();
          updateData.flagSalt = salt;
          updateData.flagHash = hashFlag(c.flag, salt);
        }

        await prisma.challenge.update({ where: { id: existing.id }, data: updateData });
        updated++;
        results.push({ title: c.title, action: 'updated' });
      } else {
        const salt = generateSalt();
        const flagHash = hashFlag(c.flag, salt);
        await prisma.challenge.create({
          data: {
            title: c.title,
            category: c.category,
            description: c.description,
            points: c.points,
            flagSalt: salt,
            flagHash,
            hint: c.hint ?? null,
            instanceUrl: c.instanceUrl ?? null,
            isPerUserInstance: c.isPerUserInstance ?? true,
            isDraft: c.isDraft ?? false,
          },
        });
        created++;
        results.push({ title: c.title, action: 'created' });
      }
    }

    return NextResponse.json({ success: true, created, updated, results });
  } catch (e: any) {
    console.error('[import-challenges]', e);
    return NextResponse.json({ error: e.message || 'Import failed' }, { status: 500 });
  }
}
