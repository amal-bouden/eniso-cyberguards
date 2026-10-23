// Script to add the 3 new CTF challenges to the production Turso database
// Run with: node scripts/add-new-challenges.cjs
const { createClient } = require('@libsql/client');
const crypto = require('crypto');

const fs = require('fs');
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.substring(0, idx).trim();
      const v = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function hashFlag(flag, salt) {
  return crypto.createHash('sha256').update(flag.trim() + salt).digest('hex');
}

function cuid() {
  return 'c' + crypto.randomBytes(11).toString('hex');
}

const NEW_CHALLENGES = [
  {
    title: 'Broken Encryption',
    category: 'CRYPTO',
    points: 250,
    flag: 'ECCC{cube_root_wins}',
    description: 'Our intelligence team intercepted an RSA-encrypted message. The operator used e=3 with no padding — a fatal mistake.\n\nn = 6703903964971298549787012499102923063739682910296196688861780721860882022282058200113667471029423602316131355334125870933005494200893502724353217013532393\ne = 3\nc = 61826850384659721577859736105244483165562021725302999700764313218009851150541821392479405118525206272868597541284474900721253391231896171048549\n\nRecover the plaintext flag using integer cube root.',
    hint: 'from sympy import integer_nthroot; m, exact = integer_nthroot(c, 3); flag = m.to_bytes((m.bit_length() + 7) // 8, "big").decode()',
    instanceUrl: '/workshop/10-crypto-rsa/index.html',
    isDraft: false,
    isPerUserInstance: false
  },
  {
    title: 'The Secure Portal',
    category: 'WEB',
    points: 250,
    flag: 'ECCC{alg_n0ne_byp4ss}',
    description: 'A JWT-protected admin portal has a critical verification flaw. You have a guest token — forge an admin token using the alg:none attack and access the protected resource.',
    hint: 'JWT alg:none attack — set alg to "none" in the header, set role to "admin" in the payload, and use an empty signature (trailing dot with nothing after it).',
    instanceUrl: '/workshop/11-web-jwt/index.html',
    isDraft: false,
    isPerUserInstance: false
  },
  {
    title: 'The Locked Vault',
    category: 'MISC',
    points: 250,
    flag: 'ECCC{z1p_p4ssw0rd_crack3d}',
    description: "A password-protected ZIP (vault.zip) was recovered from a suspect's laptop. Two leftover text files contain all the clues needed to derive the password.\n\nThe flag inside flag.txt is base64-encoded — decode it after extraction.",
    hint: 'club_notes.txt gives the format: [ABBREVIATION]@[YEAR]. membership_card_scan.txt gives CyberGuards (CG) and year 2024. Password: CG@2024',
    instanceUrl: '/workshop/12-forensics-zip/index.html',
    isDraft: false,
    isPerUserInstance: false
  }
];

async function main() {
  console.log('🚩 Adding 3 new CTF challenges to production database...\n');

  for (const ch of NEW_CHALLENGES) {
    // Check if challenge already exists
    const existing = await db.execute({
      sql: 'SELECT id FROM Challenge WHERE title = ?',
      args: [ch.title]
    });

    if (existing.rows.length > 0) {
      console.log(`  ⏭️  "${ch.title}" already exists, skipping`);
      continue;
    }

    const salt = generateSalt();
    const flagHash = hashFlag(ch.flag, salt);
    const id = cuid();

    await db.execute({
      sql: `INSERT INTO "Challenge" (id, title, category, description, points, "flagHash", "flagSalt", hint, "instanceUrl", "isPerUserInstance", "isDraft") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, ch.title, ch.category, ch.description, ch.points, flagHash, salt, ch.hint || null, ch.instanceUrl || null, ch.isPerUserInstance ? 1 : 0, ch.isDraft ? 1 : 0]
    });
    console.log(`  ✅ Added: "${ch.title}" (${ch.points} pts)`);
  }

  const total = await db.execute('SELECT COUNT(*) as cnt FROM Challenge');
  console.log(`\n📊 Total challenges in database: ${total.rows[0].cnt}`);
  console.log('✅ Done!');
}

main().catch(console.error).finally(() => db.close());
