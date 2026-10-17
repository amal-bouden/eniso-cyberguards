const { createClient } = require('@libsql/client');
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

async function clean() {
  await db.execute("DELETE FROM Solve");
  await db.execute("DELETE FROM User WHERE username != 'FLUTTERSHY'");
  await db.execute("UPDATE InviteCode SET uses = 1 WHERE code = 'SPARTAN-2026-CTF'");
  await db.execute("UPDATE InviteCode SET uses = 0 WHERE code = 'ENISO-JOIN-2026'");
  console.log('✅ Wiped all demo/test users and test solves. Only admin FLUTTERSHY remains.');
}

clean().catch(console.error).finally(() => db.close());
