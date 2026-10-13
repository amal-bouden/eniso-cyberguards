/**
 * Setup Production Database (Turso or Remote DB)
 * 
 * Safely applies the initial seed:
 * 1. Admin account (@admin and @FLUTTERSHY)
 * 2. Active invite codes (SPARTAN-2026-CTF, ENISO-JOIN-2026)
 * 3. All 9 CTF Challenges with descriptions, files, and flags
 * 
 * Usage:
 *   npx tsx scripts/setup-production-db.ts
 */
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/crypto';
import { WORKSHOP_CHALLENGES } from '../prisma/seed-workshop';
import crypto from 'crypto';

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function hashFlag(flag: string, salt: string): string {
  return crypto.createHash('sha256').update(flag.trim() + salt).digest('hex');
}

async function main() {
  console.log('🚀 Setting up Production Database...');
  console.log(`Database target: ${process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'local'}\n`);

  // 1. Create or ensure Invite Codes
  const inviteCodes = [
    { code: 'SPARTAN-2026-CTF', maxUses: 100 },
    { code: 'ENISO-JOIN-2026', maxUses: 50 },
  ];

  for (const inv of inviteCodes) {
    const existing = await prisma.inviteCode.findUnique({ where: { code: inv.code } });
    if (!existing) {
      await prisma.inviteCode.create({
        data: {
          code: inv.code,
          maxUses: inv.maxUses,
          uses: 0,
        },
      });
      console.log(`✅ Created Invite Code: ${inv.code}`);
    } else {
      console.log(`ℹ️ Invite Code exists: ${inv.code}`);
    }
  }

  const primaryInvite = await prisma.inviteCode.findUnique({ where: { code: 'SPARTAN-2026-CTF' } });

  // 2. Create or ensure Admin Accounts
  const admins = [
    {
      username: 'admin',
      email: 'admin@cyberguards.tn',
      password: 'CyberGuards2026!',
    },
    {
      username: 'FLUTTERSHY',
      email: 'boudenammal02@gmail.com',
      password: 'SpartanAdmin2026!',
    },
  ];

  for (const admin of admins) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username: admin.username }, { email: admin.email }] },
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          username: admin.username,
          email: admin.email,
          passwordHash: hashPassword(admin.password),
          role: 'ADMIN',
          inviteCodeId: primaryInvite?.id,
        },
      });
      console.log(`✅ Created Admin: @${admin.username} (${admin.email})`);
    } else {
      console.log(`ℹ️ Admin exists: @${existing.username}`);
    }
  }

  // 3. Seed/Sync all 9 CTF Challenges
  console.log('\n--- Syncing CTF Challenges ---');
  let challengeCount = 0;
  for (const c of WORKSHOP_CHALLENGES) {
    const salt = generateSalt();
    const flagHash = hashFlag(c.flag, salt);

    const existing = await prisma.challenge.findFirst({
      where: {
        OR: [
          { title: c.title },
          ...(c.title.includes('Vigen')
            ? [{ title: "Vigenere's Ghost" }, { title: "Vigenère's Ghost" }]
            : []),
        ],
      },
    });

    if (existing) {
      await prisma.challenge.update({
        where: { id: existing.id },
        data: {
          title: c.title,
          category: c.category,
          description: c.description,
          points: c.points,
          flagSalt: salt,
          flagHash: flagHash,
          hint: c.hint,
          instanceUrl: c.instanceUrl,
          isPerUserInstance: c.isPerUserInstance,
          isDraft: c.isDraft,
        },
      });
      console.log(`  🔄 Updated: "${c.title}" (${c.points} pts)`);
    } else {
      await prisma.challenge.create({
        data: {
          title: c.title,
          category: c.category,
          description: c.description,
          points: c.points,
          flagSalt: salt,
          flagHash,
          hint: c.hint,
          instanceUrl: c.instanceUrl,
          isPerUserInstance: c.isPerUserInstance,
          isDraft: c.isDraft,
        },
      });
      console.log(`  ✨ Created: "${c.title}" (${c.points} pts)`);
    }
    challengeCount++;
  }

  console.log(`\n🎉 Production Database Setup Complete! (${challengeCount} challenges ready)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
