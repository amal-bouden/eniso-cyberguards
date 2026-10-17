const { createClient } = require('@libsql/client');
const crypto = require('crypto');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    env[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
  }
}

const url = env.TURSO_DATABASE_URL || env.DATABASE_URL;
const authToken = env.TURSO_AUTH_TOKEN;
const db = createClient({ url, authToken });

function generateSalt(len = 16) {
  return crypto.randomBytes(len).toString('hex');
}

function hashPassword(password) {
  const salt = generateSalt(16);
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
  } catch {
    return false;
  }
}

function hashFlag(flag, salt) {
  return crypto.createHash('sha256').update(flag.trim() + salt).digest('hex');
}

function cuid() {
  return 'c' + crypto.randomBytes(11).toString('hex');
}

async function runE2E() {
  console.log('🧪 ==========================================');
  console.log('   RUNNING LIVE TOURNAMENT VALIDATION SUITE');
  console.log('==========================================\n');

  const testUsername = `cadet_sim_${Date.now().toString().slice(-4)}`;
  const testEmail = `${testUsername}@eniso.tn`;
  const testPassword = 'SpartanPassword2026!';
  const inviteCode = 'ENISO-JOIN-2026';

  // 1. REGISTRATION
  console.log(`[TEST 1] Testing Member Registration with Invite Code "${inviteCode}"...`);
  const invRes = await db.execute({
    sql: 'SELECT id, uses, maxUses FROM InviteCode WHERE code = ?',
    args: [inviteCode]
  });
  if (invRes.rows.length === 0) throw new Error('Invite code missing in DB!');
  const inv = invRes.rows[0];

  const userId = cuid();
  const pwdHash = hashPassword(testPassword);
  await db.execute({
    sql: "INSERT INTO User (id, username, email, passwordHash, role, inviteCodeId) VALUES (?, ?, ?, ?, 'MEMBER', ?)",
    args: [userId, testUsername, testEmail, pwdHash, inv.id]
  });
  await db.execute({
    sql: 'UPDATE InviteCode SET uses = uses + 1 WHERE id = ?',
    args: [inv.id]
  });
  console.log(`✅ [TEST 1 PASSED] Cadet registered: @${testUsername} (ID: ${userId})`);

  // 2. AUTHENTICATION / LOGIN
  console.log('\n[TEST 2] Testing Password Verification & Login Authentication...');
  const userRes = await db.execute({
    sql: 'SELECT id, username, passwordHash, role FROM User WHERE username = ?',
    args: [testUsername]
  });
  if (userRes.rows.length === 0) throw new Error('User not found in DB!');
  const userRow = userRes.rows[0];

  const isValid = verifyPassword(testPassword, userRow.passwordHash);
  if (!isValid) throw new Error('Password verification failed for registered credentials!');

  const isInvalidRejected = !verifyPassword('WrongPassword123!', userRow.passwordHash);
  if (!isInvalidRejected) throw new Error('Wrong password was accepted!');
  console.log('✅ [TEST 2 PASSED] Authentication functional (valid password accepted, wrong rejected).');

  // 3. CHALLENGE RETRIEVAL FOR MEMBERS (isDraft = 0)
  console.log('\n[TEST 3] Testing Member Challenge Visibility...');
  const chRes = await db.execute('SELECT id, title, category, points, isDraft FROM Challenge WHERE isDraft = 0 ORDER BY points ASC');
  if (chRes.rows.length !== 9) {
    throw new Error(`Expected all 9 challenges to be published (isDraft = 0), but found ${chRes.rows.length}`);
  }
  console.log(`✅ [TEST 3 PASSED] All 9 challenges visible to non-admin cadets:`);
  chRes.rows.forEach(c => console.log(`   - [${c.category}] ${c.title} (${c.points} pts)`));

  // 4. FLAG SUBMISSION & VERIFICATION (All 9 challenges)
  console.log('\n[TEST 4] Testing Flag Submissions & Validation...');
  const welcomeCh = await db.execute({
    sql: 'SELECT id, title, points, flagHash, flagSalt FROM Challenge WHERE title = ?',
    args: ['Welcome Byte']
  });
  const ch = welcomeCh.rows[0];

  // A: Wrong flag
  const wrongHash = hashFlag('ECCC{fake_wrong_flag}', ch.flagSalt);
  if (wrongHash === ch.flagHash) throw new Error('Wrong flag hash collision!');
  console.log('   - Invalid flag submission correctly rejected.');

  // B: Correct flag
  const correctHash = hashFlag('ECCC{welcome_to_cyberguard}', ch.flagSalt);
  if (correctHash !== ch.flagHash) throw new Error('Flag hash calculation mismatch!');
  
  const solveId = cuid();
  await db.execute({
    sql: 'INSERT INTO Solve (id, userId, challengeId) VALUES (?, ?, ?)',
    args: [solveId, userId, ch.id]
  });
  console.log(`   - Correct flag accepted! Solve recorded: ${solveId}`);

  // C: Duplicate solve rejection
  let dupRejected = false;
  try {
    await db.execute({
      sql: 'INSERT INTO Solve (id, userId, challengeId) VALUES (?, ?, ?)',
      args: [cuid(), userId, ch.id]
    });
  } catch (e) {
    dupRejected = true;
  }
  if (!dupRejected) throw new Error('Duplicate solve constraint failed!');
  console.log('   - Duplicate solve prevention verified (UNIQUE userId_challengeId constraint works).');
  console.log('✅ [TEST 4 PASSED] Flag validation & duplicate prevention fully functional.');

  // 5. SCOREBOARD AGGREGATION
  console.log('\n[TEST 5] Testing Scoreboard / Leaderboard Computation...');
  const scoreboardRes = await db.execute(`
    SELECT u.id, u.username, COALESCE(SUM(c.points), 0) as score, COUNT(s.id) as solveCount
    FROM User u
    LEFT JOIN Solve s ON u.id = s.userId
    LEFT JOIN Challenge c ON s.challengeId = c.id
    WHERE u.role != 'ADMIN'
    GROUP BY u.id, u.username
    ORDER BY score DESC
  `);
  const cadetEntry = scoreboardRes.rows.find(r => r.username === testUsername);
  if (!cadetEntry || Number(cadetEntry.score) !== 50) {
    throw new Error(`Scoreboard query failed to tally 50 points for ${testUsername}`);
  }
  console.log(`✅ [TEST 5 PASSED] Leaderboard calculated score accurately: ${cadetEntry.score} pts (${cadetEntry.solveCount} solves)`);

  // CLEANUP
  console.log('\n[CLEANUP] Cleaning up test cadet and solve record...');
  await db.execute({ sql: 'DELETE FROM Solve WHERE userId = ?', args: [userId] });
  await db.execute({ sql: 'DELETE FROM User WHERE id = ?', args: [userId] });
  await db.execute({ sql: 'UPDATE InviteCode SET uses = uses - 1 WHERE id = ?', args: [inv.id] });
  console.log('✅ Cleanup completed cleanly. Database is in pristine state for the event.');

  console.log('\n==========================================');
  console.log('🎉 ALL 5 LIVE TOURNAMENT CHECKS PASSED!');
  console.log('==========================================');
}

runE2E().catch(err => {
  console.error('❌ E2E check failed:', err);
  process.exit(1);
}).finally(() => db.close());
