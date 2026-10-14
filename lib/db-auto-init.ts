import { createClient } from '@libsql/client';
import { prisma } from './prisma';
import { hashPassword, generateSalt, hashFlag } from './crypto';
import { WORKSHOP_CHALLENGES } from '@/prisma/seed-workshop';

let initPromise: Promise<void> | null = null;
let isInitialized = false;

const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "InviteCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "InviteCode_code_key" ON "InviteCode"("code");`,

  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inviteCodeId" TEXT,
    CONSTRAINT "User_inviteCodeId_fkey" FOREIGN KEY ("inviteCodeId") REFERENCES "InviteCode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`,

  `CREATE TABLE IF NOT EXISTS "Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "flagHash" TEXT NOT NULL,
    "flagSalt" TEXT NOT NULL,
    "hint" TEXT,
    "instanceUrl" TEXT,
    "isPerUserInstance" BOOLEAN NOT NULL DEFAULT true,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS "Solve" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "solvedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Solve_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Solve_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Solve_userId_challengeId_key" ON "Solve"("userId", "challengeId");`
];

async function runAutoInit() {
  if (isInitialized) return;

  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || '';
  const authToken = process.env.TURSO_AUTH_TOKEN;

  console.log('🔄 Checking / initializing database tables...');

  // 1. Create tables via LibSQL client if connecting to Turso or SQLite
  if (url.startsWith('libsql://') || authToken) {
    const libsql = createClient({ url, authToken });
    for (const sql of DDL_STATEMENTS) {
      try {
        await libsql.execute(sql);
      } catch (e: any) {
        console.warn(`DDL warning: ${e.message}`);
      }
    }
  }

  // 2. Check if challenges exist; if not, seed them
  try {
    const existingCount = await prisma.challenge.count();
    if (existingCount === 0) {
      console.log('🌱 Database is empty. Seeding challenges, invite codes, and admins...');

      // A: Invite codes
      const inv1 = await prisma.inviteCode.upsert({
        where: { code: 'SPARTAN-2026-CTF' },
        update: {},
        create: { code: 'SPARTAN-2026-CTF', maxUses: 100, uses: 0 }
      });
      await prisma.inviteCode.upsert({
        where: { code: 'ENISO-JOIN-2026' },
        update: {},
        create: { code: 'ENISO-JOIN-2026', maxUses: 50, uses: 0 }
      });

      // B: Admin user (FLUTTERSHY only)
      await prisma.user.upsert({
        where: { username: 'FLUTTERSHY' },
        update: {},
        create: {
          username: 'FLUTTERSHY',
          email: 'boudenammal02@gmail.com',
          passwordHash: hashPassword('SpartanAdmin2026!'),
          role: 'ADMIN',
          inviteCodeId: inv1.id
        }
      });

      // C: Seed all 9 challenges
      for (const ch of WORKSHOP_CHALLENGES) {
        const salt = generateSalt();
        const flagHash = hashFlag(ch.flag, salt);
        await prisma.challenge.create({
          data: {
            title: ch.title,
            category: ch.category,
            description: ch.description,
            points: ch.points,
            flagSalt: salt,
            flagHash,
            hint: ch.hint,
            instanceUrl: ch.instanceUrl,
            isPerUserInstance: ch.isPerUserInstance,
            isDraft: ch.isDraft
          }
        });
      }
      console.log('✅ Auto-seed completed successfully!');
    }
    isInitialized = true;
  } catch (err) {
    console.error('Error during auto-seed verification:', err);
  }
}

export async function ensureDatabaseInitialized(): Promise<void> {
  if (isInitialized) return;
  if (!initPromise) {
    initPromise = runAutoInit().finally(() => {
      initPromise = null;
    });
  }
  return initPromise;
}
