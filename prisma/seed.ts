/**
 * ENISO CyberGuards — Production Seed
 *
 * Creates the admin account and starter invite codes ONLY.
 * Challenges are managed through:
 *   - npx tsx prisma/seed-workshop.ts   (import workshop challenges)
 *   - Admin panel > Import Challenges tab (drag & drop JSON)
 *
 * WARNING: This wipes all existing users, solves, and invite codes.
 * Run only on a fresh database or when resetting the platform.
 */
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password: string): string {
  const salt = generateSalt();
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('Shield  Seeding ENISO CyberGuards CTF Database...');

  // Reset users, solves and invite codes (challenges are left intact)
  await prisma.solve.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.inviteCode.deleteMany({});

  // 1. Create Invite Codes
  const invite1 = await prisma.inviteCode.create({
    data: {
      code: 'SPARTAN-2026-CTF',
      maxUses: 100,
      uses: 0,
    },
  });

  await prisma.inviteCode.create({
    data: {
      code: 'ENISO-JOIN-2026',
      maxUses: 50,
      uses: 0,
    },
  });

  // 2. Create Admin User
  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@cyberguards.tn',
      passwordHash: hashPassword('CyberGuards2026!'),
      role: 'ADMIN',
      inviteCodeId: invite1.id,
    },
  });

  console.log('Done!');
  console.log('Admin account  : admin / CyberGuards2026!');
  console.log('Invite codes   : SPARTAN-2026-CTF, ENISO-JOIN-2026');
  console.log('');
  console.log('To load workshop challenges run:');
  console.log('  npx tsx prisma/seed-workshop.ts');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
