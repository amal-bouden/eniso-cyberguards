import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword, signSession, verifySession } from '../lib/crypto';

async function runE2ETests() {
  console.log('🧪 ==========================================');
  console.log('   STARTING END-TO-END VALIDATION SUITE');
  console.log('==========================================\n');

  const testUsername = `cadet_${Date.now().toString().slice(-4)}`;
  const testEmail = `${testUsername}@eniso.tn`;
  const testPassword = 'SpartanPassword2026!';
  const inviteCode = 'SPARTAN-2026-CTF';

  // -------------------------------------------------------------
  // TEST 1: REGISTRATION / SIGN UP
  // -------------------------------------------------------------
  console.log(`[TEST 1] Testing Sign Up for: ${testUsername}...`);
  const codeRecord = await prisma.inviteCode.findUnique({
    where: { code: inviteCode },
  });
  if (!codeRecord) throw new Error('Invite code not found in DB!');

  const passwordHash = hashPassword(testPassword);
  const user = await prisma.user.create({
    data: {
      username: testUsername,
      email: testEmail,
      passwordHash,
      role: 'MEMBER',
      inviteCodeId: codeRecord.id,
    },
  });
  console.log(`✅ [TEST 1 PASSED] User successfully registered: ID=${user.id}, Username=${user.username}`);

  // -------------------------------------------------------------
  // TEST 2: LOGIN & PASSWORD VERIFICATION
  // -------------------------------------------------------------
  console.log('\n[TEST 2] Testing Password Verification & Login Authentication...');
  const foundUser = await prisma.user.findUnique({ where: { username: testUsername } });
  if (!foundUser) throw new Error('User not found in DB after registration!');

  const isPasswordValid = verifyPassword(testPassword, foundUser.passwordHash);
  if (!isPasswordValid) throw new Error('Password verification failed for registered credentials!');

  const isWrongPasswordRejected = !verifyPassword('WrongPassword123!', foundUser.passwordHash);
  if (!isWrongPasswordRejected) throw new Error('Wrong password was incorrectly accepted!');

  console.log('✅ [TEST 2 PASSED] Password hashing and verification functional (valid password accepted, invalid rejected).');

  // -------------------------------------------------------------
  // TEST 3: ACCOUNT RECOGNITION & SESSION JWT TOKEN
  // -------------------------------------------------------------
  console.log('\n[TEST 3] Testing JWT Session Generation & Recognition...');
  const token = signSession({
    userId: foundUser.id,
    username: foundUser.username,
    email: foundUser.email,
    role: foundUser.role as 'MEMBER' | 'ADMIN',
  });
  if (!token) throw new Error('Failed to generate session JWT token!');

  const decoded = verifySession(token);
  if (!decoded || decoded.userId !== foundUser.id || decoded.username !== testUsername) {
    throw new Error('Decoded session token does not match user account!');
  }
  console.log(`✅ [TEST 3 PASSED] Account recognized properly from session token: @${decoded.username} (${decoded.role})`);

  // -------------------------------------------------------------
  // TEST 4: FLAG SUBMISSION (VALID & INVALID)
  // -------------------------------------------------------------
  console.log('\n[TEST 4] Testing Flag Submission Flow...');
  const challenge = await prisma.challenge.findFirst({
    where: { title: 'Welcome Byte' },
  });
  if (!challenge) throw new Error('Welcome Byte challenge not found in DB!');

  // A: Test Invalid Flag
  const { hashFlag } = await import('../lib/crypto');
  const wrongHash = hashFlag('ECCC{completely_wrong_flag}', challenge.flagSalt);
  const isWrongFlagRejected = wrongHash !== challenge.flagHash;
  if (!isWrongFlagRejected) throw new Error('Wrong flag hash was incorrectly matched!');
  console.log('  -> Invalid flag submission correctly rejected.');

  // B: Test Correct Flag
  const correctHash = hashFlag('ECCC{welcome_to_cyberguard}', challenge.flagSalt);
  if (correctHash !== challenge.flagHash) throw new Error('Valid flag hash did not match challenge hash!');

  // Record solve
  const solve = await prisma.solve.create({
    data: {
      userId: foundUser.id,
      challengeId: challenge.id,
    },
  });
  console.log(`  -> Correct flag accepted! Solve recorded: ID=${solve.id}`);

  // C: Test Duplicate Submission Prevention (unique constraint on userId_challengeId)
  let duplicateRejected = false;
  try {
    await prisma.solve.create({
      data: {
        userId: foundUser.id,
        challengeId: challenge.id,
      },
    });
  } catch {
    duplicateRejected = true;
  }
  if (!duplicateRejected) throw new Error('Duplicate solve was allowed!');
  console.log('  -> Duplicate flag submission correctly prevented by database constraint.');
  console.log('✅ [TEST 4 PASSED] Flag submission & verification functional.');

  // -------------------------------------------------------------
  // TEST 5: SCOREBOARD / LEADERBOARD COMPUTATION
  // -------------------------------------------------------------
  console.log('\n[TEST 5] Testing Scoreboard Points Calculation...');
  const userSolves = await prisma.solve.findMany({
    where: { userId: foundUser.id },
    include: { challenge: true },
  });
  const totalScore = userSolves.reduce((sum, s) => sum + s.challenge.points, 0);
  if (totalScore !== 50) throw new Error(`Expected score 50, but got ${totalScore}`);
  console.log(`✅ [TEST 5 PASSED] Scoreboard calculated score: ${totalScore} points for @${foundUser.username}`);

  // -------------------------------------------------------------
  // CLEANUP TEST CADET
  // -------------------------------------------------------------
  console.log('\n[CLEANUP] Cleaning up test cadet and solve record...');
  await prisma.solve.deleteMany({ where: { userId: foundUser.id } });
  await prisma.user.delete({ where: { id: foundUser.id } });
  console.log('✅ Cleanup completed cleanly.');

  console.log('\n==========================================');
  console.log('🎉 ALL 5 E2E TESTS PASSED SUCCESSFULLY!');
  console.log('==========================================');
}

runE2ETests().catch((err) => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
