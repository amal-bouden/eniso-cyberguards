const { createClient } = require('@libsql/client');
const crypto = require('crypto');

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

const CHALLENGES = [
  { title: 'Welcome Byte', flag: 'ECCC{welcome_to_cyberguard}' },
  { title: 'Broken Auth', flag: 'ECCC{sql_injection_master}' },
  { title: "Vigenère's Ghost", flag: 'ECCC{vigenere_key_recovery}' },
  { title: "Metadata Doesn't Lie", flag: 'ECCC{follow_the_metadata}' },
  { title: 'Pixels Never Lie', flag: 'ECCC{least_significant_secrets}' },
  { title: "The Intern's Trail", flag: 'ECCC{nimbus_2022}' },
  { title: 'Whispers on the Wire', flag: 'ECCC{plaintext_protocols_leak}' },
  { title: 'Crack Me If You Can', flag: 'ECCC{reverse_the_bytes}' },
  { title: 'Stack Warmup', flag: 'ECCC{mind_the_buffer}' }
];

async function main() {
  for (const ch of CHALLENGES) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256').update(ch.flag.trim() + salt).digest('hex');
    await db.execute({
      sql: 'UPDATE Challenge SET flagSalt = ?, flagHash = ? WHERE title = ?',
      args: [salt, hash, ch.title]
    });
    console.log(`✅ Updated flag hash for: "${ch.title}"`);
  }
  console.log('\n🎉 All 9 challenge flag hashes synchronized with lib/crypto.ts algorithm!');
}

main().catch(console.error).finally(() => db.close());
