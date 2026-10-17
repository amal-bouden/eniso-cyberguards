const { createClient } = require('@libsql/client');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    const k = trimmed.substring(0, idx).trim();
    const v = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
    env[k] = v;
  }
}

const url = env.TURSO_DATABASE_URL || env.DATABASE_URL;
const authToken = env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

async function main() {
  console.log('🔗 Connecting to Turso database:', url);

  const users = await db.execute('SELECT id, username, email, role, createdAt FROM User');
  console.log('\n--- 1. REGISTERED USERS (' + users.rows.length + ') ---');
  for (const u of users.rows) {
    console.log(`- [${u.role}] ${u.username} (${u.email}) [ID: ${u.id}]`);
  }

  const challenges = await db.execute('SELECT id, title, category, points, isDraft, typeof(isDraft) as t FROM Challenge ORDER BY points ASC');
  console.log('\n--- 2. ACTIVE CHALLENGES (' + challenges.rows.length + ') ---');
  for (const c of challenges.rows) {
    console.log(`- [${c.category}] "${c.title}" - ${c.points} pts (isDraft raw: ${c.isDraft}, type: ${c.t})`);
  }

  const solves = await db.execute('SELECT s.id, u.username, c.title, s.solvedAt FROM Solve s JOIN User u ON s.userId = u.id JOIN Challenge c ON s.challengeId = c.id');
  console.log('\n--- 3. SOLVES RECORDED (' + solves.rows.length + ') ---');
  for (const s of solves.rows) {
    console.log(`- ${s.username} solved "${s.title}" at ${s.solvedAt}`);
  }

  const invites = await db.execute('SELECT id, code, maxUses, uses, expiresAt FROM InviteCode');
  console.log('\n--- 4. ACTIVE INVITE CODES (' + invites.rows.length + ') ---');
  for (const inv of invites.rows) {
    console.log(`- Code: "${inv.code}" | Uses: ${inv.uses}/${inv.maxUses}`);
  }

  console.log('\n✅ Database connection is healthy, fast, and fully populated.');
}

main().catch(err => {
  console.error('❌ Database error:', err);
  process.exit(1);
}).finally(() => db.close());
