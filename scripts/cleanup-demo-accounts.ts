import { prisma } from '../lib/prisma';

async function cleanup() {
  console.log('🧹 Cleaning up demo accounts and sample solves...');

  const demoUsernames = ['matrix_hacker', 'cyber_spartan', 'null_pointer'];

  // Delete solves from demo accounts
  const demoUsers = await prisma.user.findMany({
    where: { username: { in: demoUsernames } },
    select: { id: true, username: true }
  });

  const demoUserIds = demoUsers.map(u => u.id);

  if (demoUserIds.length > 0) {
    const deletedSolves = await prisma.solve.deleteMany({
      where: { userId: { in: demoUserIds } }
    });
    console.log(`✅ Deleted ${deletedSolves.count} demo solve records.`);

    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: demoUserIds } }
    });
    console.log(`✅ Deleted ${deletedUsers.count} demo accounts (${demoUsernames.join(', ')}).`);
  } else {
    console.log('ℹ️ No demo accounts found to delete.');
  }

  // Reset invite code uses
  await prisma.inviteCode.updateMany({
    data: { uses: 0 }
  });
  console.log('✅ Reset invite codes uses counter to 0.');

  // List remaining accounts
  const remaining = await prisma.user.findMany({
    select: { username: true, email: true, role: true }
  });
  console.log('\n👥 ACTIVE REMAINING ACCOUNTS (ORGANIZERS/ADMINS):');
  remaining.forEach(u => console.log(`- @${u.username} (${u.email}) [${u.role}]`));

  const totalSolves = await prisma.solve.count();
  console.log(`\n🏆 LEADERBOARD STATUS: ${totalSolves} solves (Fresh start for event participants)`);
}

cleanup().catch(console.error).finally(() => prisma.$disconnect());
