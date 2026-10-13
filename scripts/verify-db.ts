import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword, hashFlag, generateSalt } from '../lib/crypto';

async function main() {
  console.log('--- 1. CURRENT DATABASE USERS ---');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { solves: true } }
    }
  });
  console.log(JSON.stringify(users, null, 2));

  console.log('\n--- 2. CURRENT CHALLENGES ---');
  const challenges = await prisma.challenge.findMany({
    select: {
      id: true,
      title: true,
      points: true,
      category: true,
      isDraft: true,
      _count: { select: { solves: true } }
    }
  });
  console.log(`Total challenges: ${challenges.length}`);
  challenges.forEach(c => console.log(`- [${c.category}] ${c.title} (${c.points} pts, isDraft: ${c.isDraft}, solves: ${c._count.solves})`));

  console.log('\n--- 3. SOLVES RECORDED ---');
  const solves = await prisma.solve.findMany({
    include: {
      user: { select: { username: true } },
      challenge: { select: { title: true, points: true } }
    }
  });
  console.log(JSON.stringify(solves, null, 2));

  console.log('\n--- 4. INVITE CODES ---');
  const inviteCodes = await prisma.inviteCode.findMany();
  console.log(JSON.stringify(inviteCodes, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
