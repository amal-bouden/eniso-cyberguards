// Plain JS seed script - runs directly with node against Turso
const { createClient } = require('@libsql/client');
const crypto = require('crypto');

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password) {
  const salt = generateSalt();
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function hashFlag(flag, salt) {
  return crypto.createHash('sha256').update(flag.trim() + salt).digest('hex');
}

function cuid() {
  return 'c' + crypto.randomBytes(11).toString('hex');
}

const DDL = [
  `CREATE TABLE IF NOT EXISTS "InviteCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "InviteCode_code_key" ON "InviteCode"("code")`,
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inviteCodeId" TEXT,
    FOREIGN KEY ("inviteCodeId") REFERENCES "InviteCode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
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
    "isPerUserInstance" INTEGER NOT NULL DEFAULT 1,
    "isDraft" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Solve" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "solvedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Solve_userId_challengeId_key" ON "Solve"("userId", "challengeId")`
];

const CHALLENGES = [
  { title: 'Welcome Byte', category: 'MISC', points: 50, flag: 'ECCC{welcome_to_cyberguard}', description: 'Your first step into the ENISO CyberGuards War Room. Decode the base64 string to find the flag: `RUNDQXt3ZWxjb21lX3RvX2N5YmVyZ3VhcmR9`', hint: 'echo "RUNDQXt3ZWxjb21lX3RvX2N5YmVyZ3VhcmR9" | base64 -d', isDraft: false, isPerUserInstance: false },
  { title: 'Broken Auth', category: 'WEB', points: 150, flag: 'ECCC{sql_injection_master}', description: 'A login portal has a classic vulnerability. Can you bypass authentication and retrieve the admin flag?\n\nTarget: Analyze the login form at the challenge URL.', hint: "Try: ' OR '1'='1", isDraft: false, isPerUserInstance: false },
  { title: "Vigenère's Ghost", category: 'CRYPTO', points: 150, flag: 'ECCC{vigenere_key_recovery}', description: 'Intercepted ciphertext: `WMPEQ{lzxirvi_pис_vinszivб}`. The key is hidden in the challenge name.', hint: 'The key is ENISO. Use a Vigenère decoder.', isDraft: false, isPerUserInstance: false },
  { title: "Metadata Doesn't Lie", category: 'FORENSICS', points: 200, flag: 'ECCC{follow_the_metadata}', description: 'A suspicious image was uploaded to an internal server. The flag is hidden — not in the pixels, but in what the camera recorded alongside them.\n\nDownload: challenge.jpg (attached at instance URL)', hint: 'Run: exiftool challenge.jpg', isDraft: false, isPerUserInstance: false },
  { title: 'Pixels Never Lie', category: 'STEGANOGRAPHY', points: 250, flag: 'ECCC{least_significant_secrets}', description: 'A team member claims they hid a message inside this PNG using LSB steganography. Extract the hidden flag.\n\nDownload: stego.png (attached at instance URL)', hint: 'Use zsteg or stegsolve. Try: zsteg stego.png', isDraft: false, isPerUserInstance: false },
  { title: "The Intern's Trail", category: 'OSINT', points: 150, flag: 'ECCC{nimbus_2022}', description: "An intern accidentally committed sensitive data to a public GitHub repo before it was force-pushed. The commit contained a password. The repo is `github.com/cyberguards-demo/intern-leak` — find what was left behind.", hint: 'Use: git log --all --full-history or check GitHub\'s commit history', isDraft: false, isPerUserInstance: false },
  { title: 'Whispers on the Wire', category: 'NETWORK', points: 250, flag: 'ECCC{plaintext_protocols_leak}', description: "Analyze the provided PCAP file. A user logged into an unencrypted service and transmitted credentials in cleartext. Find the password — it's the flag.\n\nDownload: capture.pcap (attached at instance URL)", hint: 'Filter by: ftp || telnet || http.authbasic in Wireshark', isDraft: false, isPerUserInstance: false },
  { title: 'Crack Me If You Can', category: 'REVERSE', points: 300, flag: 'ECCC{reverse_the_bytes}', description: 'A compiled binary checks a secret passphrase before printing the flag. Reverse engineer it to discover what input produces the correct output.\n\nDownload: crackme (attached at instance URL)', hint: 'Use: strings crackme | grep ECCC or use Ghidra/radare2', isDraft: false, isPerUserInstance: false },
  { title: 'Stack Warmup', category: 'PWN', points: 400, flag: 'ECCC{mind_the_buffer}', description: "A vulnerable server is running at the instance URL. It reads your input without bounds checking. Overflow the buffer and redirect execution to the win() function.\n\nnc <instance_host> <instance_port>", hint: 'Find the offset with: python3 -c "print(\'A\'*offset + p32(win_addr))" | nc host port', isDraft: false, isPerUserInstance: true }
];

async function main() {
  console.log('🔄 Creating tables...');
  for (const sql of DDL) {
    try { await db.execute(sql); } catch (e) { console.warn('DDL warn:', e.message); }
  }

  // Delete all demo/test users except FLUTTERSHY
  console.log('\n🧹 Cleaning demo accounts...');
  await db.execute(`DELETE FROM "Solve"`);
  await db.execute(`DELETE FROM "User" WHERE username != 'FLUTTERSHY'`);
  console.log('✅ Deleted all users except FLUTTERSHY (if it exists)');

  // Upsert FLUTTERSHY admin
  console.log('\n👤 Seeding FLUTTERSHY admin...');
  const existingAdmin = await db.execute(`SELECT id FROM "User" WHERE username = 'FLUTTERSHY'`);
  if (existingAdmin.rows.length === 0) {
    // Need invite code first
    const invId = cuid();
    await db.execute({
      sql: `INSERT OR IGNORE INTO "InviteCode" (id, code, "maxUses", uses) VALUES (?, ?, 100, 0)`,
      args: [invId, 'SPARTAN-2026-CTF']
    });
    const inv = await db.execute(`SELECT id FROM "InviteCode" WHERE code = 'SPARTAN-2026-CTF'`);
    const inviteId = inv.rows[0].id;

    const adminId = cuid();
    const passwordHash = hashPassword('SpartanAdmin2026!');
    await db.execute({
      sql: `INSERT INTO "User" (id, username, email, "passwordHash", role, "inviteCodeId") VALUES (?, 'FLUTTERSHY', 'boudenammal02@gmail.com', ?, 'ADMIN', ?)`,
      args: [adminId, passwordHash, inviteId]
    });
    console.log('✅ FLUTTERSHY admin created');
  } else {
    console.log('✅ FLUTTERSHY already exists, skipping');
  }

  // Ensure invite codes exist
  await db.execute({
    sql: `INSERT OR IGNORE INTO "InviteCode" (id, code, "maxUses", uses) VALUES (?, 'SPARTAN-2026-CTF', 100, 0)`,
    args: [cuid()]
  });
  await db.execute({
    sql: `INSERT OR IGNORE INTO "InviteCode" (id, code, "maxUses", uses) VALUES (?, 'ENISO-JOIN-2026', 50, 0)`,
    args: [cuid()]
  });

  // Seed challenges
  console.log('\n🚩 Seeding challenges...');
  const existing = await db.execute(`SELECT COUNT(*) as cnt FROM "Challenge"`);
  const count = Number(existing.rows[0].cnt);
  if (count === 0) {
    for (const ch of CHALLENGES) {
      const salt = generateSalt();
      const flagHash = hashFlag(ch.flag, salt);
      const id = cuid();
      await db.execute({
        sql: `INSERT INTO "Challenge" (id, title, category, description, points, "flagHash", "flagSalt", hint, "isPerUserInstance", "isDraft") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, ch.title, ch.category, ch.description, ch.points, flagHash, salt, ch.hint || null, ch.isPerUserInstance ? 1 : 0, ch.isDraft ? 1 : 0]
      });
      console.log(`  ✅ ${ch.title} (${ch.points} pts)`);
    }
  } else {
    console.log(`  ℹ️  ${count} challenges already exist, skipping`);
  }

  // Final count
  const users = await db.execute(`SELECT username, role FROM "User"`);
  const challs = await db.execute(`SELECT COUNT(*) as cnt FROM "Challenge"`);
  const solves = await db.execute(`SELECT COUNT(*) as cnt FROM "Solve"`);
  
  console.log('\n📊 Production database state:');
  console.log(`  Users: ${users.rows.map(u => u.username + ' (' + u.role + ')').join(', ')}`);
  console.log(`  Challenges: ${challs.rows[0].cnt}`);
  console.log(`  Solves: ${solves.rows[0].cnt}`);
  console.log('\n✅ Production database is ready!');
}

main().catch(console.error).finally(() => db.close());
