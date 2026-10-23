// One-off: update Crack Me hint in Turso DB to CYBERGUARD_UNLOCK
const { createClient } = require('@libsql/client');
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

async function main() {
  const result = await db.execute({
    sql: `UPDATE "Challenge" SET hint = ? WHERE title = ?`,
    args: ['CYBERGUARD_UNLOCK', 'Crack Me If You Can']
  });
  console.log(`✅ Updated ${result.rowsAffected} row(s) — Crack Me hint is now: CYBERGUARD_UNLOCK`);
}

main().catch(console.error).finally(() => db.close());
