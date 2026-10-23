/**
 * CyberGuard Workshop — Sept 2026 Challenge Importer (Upgraded Edition)
 *
 * Adapted to match the ENISO CyberGuards platform Prisma schema.
 * (no Category relation, uses flagSalt + flagHash, isDraft boolean)
 *
 * Usage:
 *   npx tsx prisma/seed-workshop.ts
 *
 * Safe to re-run: existing challenges are updated in-place (updating descriptions,
 * hints, flags, and points) without duplicating records or breaking existing solves.
 */
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function hashFlag(flag: string, salt: string): string {
  return crypto.createHash('sha256').update(flag.trim() + salt).digest('hex');
}

export const WORKSHOP_CHALLENGES = [
  {
    title: 'Welcome Byte',
    category: 'Misc',
    description:
      'A warmup challenge to make sure your reconnaissance habits are dialed in.\n\n' +
      "Every good hacker's first reflex: always check what the server actually transmitted to you, not just what renders on the screen. Developers frequently leave developer comments, staging endpoints, and sensitive configuration instructions behind.\n\n" +
      '### Objectives & Recon Steps:\n' +
      '1. Open and inspect the challenge HTML source (`index.html`).\n' +
      '2. Press `Ctrl+U` (or View Page Source) to uncover hidden developer comments.\n' +
      '3. Locate and inspect the standard `robots.txt` crawler directive file.\n' +
      '4. Access the unlinked internal notice page to capture the flag.',
    points: 50,
    flag: 'ECCC{welcome_to_cyberguard}',
    hint:
      '1. Right-click the page and choose "View Page Source", or press Ctrl+U.\n' +
      '2. A comment on the page mentions a file every website has by convention, meant for search engine crawlers (/robots.txt). Check it.\n' +
      '3. Access the disallowed page to extract the flag.',
    instanceUrl: '/workshop/01-warmup/index.html' as string | null,
    isPerUserInstance: false,
    isDraft: false,
  },
  {
    title: 'Broken Auth',
    category: 'Web',
    description:
      'The club intranet has a login portal. The developer swears the query is "just a simple check" — famous last words in application security. Your objective: get into the admin account without knowing the admin password.\n\n' +
      'Getting in is only step one. The flag used to be shown right on the welcome screen, but after a security review it was moved to an isolated database table — the admin area now features an internal notes search interface instead.\n\n' +
      '### Two-Stage Exploitation Path:\n' +
      "1. **Authentication Bypass (SQLi)**: Inject into the login form's unsanitized SQL query (e.g. `admin' -- `) to bypass authentication as `admin` without needing the admin password.\n" +
      '2. **UNION-Based Data Extraction**: Once authenticated, inspect the internal notes search feature. It queries the database with the same vulnerability. The real flag lives in a separate `secrets` table. Construct a `UNION SELECT` query matching column schemas to extract rows from `secrets`!\n\n' +
      'Click "Launch Target" to attack the live web portal!',
    points: 150,
    flag: 'ECCC{sql_injection_master}',
    hint:
      "1. What happens to the login query if your username contains a single quote ( ' )?\n" +
      "2. Try making the WHERE clause always true, or commenting out the rest of the query with -- .\n" +
      "3. Once you're in, the search feature queries a `notes` table directly from your input. The real flag lives in the `secrets` table. A UNION SELECT can combine rows from a second table into the same result (e.g. zzz' UNION SELECT id, title FROM secrets --).",
    instanceUrl: '/ctf-targets/broken-auth' as string | null,
    isPerUserInstance: false,
    isDraft: false,
  },
  {
    title: "Vigenère's Ghost",
    category: 'Crypto',
    description:
      "An old member's intercepted letter was found in the club archives, encrypted with a classical polyalphabetic cipher popular before modern cryptography existed.\n\n" +
      "Recover the plaintext — it won't contain the flag directly, but it provides specific instructions for what to do next to decrypt a second encrypted file in the same archive.\n\n" +
      '### Objectives & Decryption Steps:\n' +
      '1. Download `intercepted_message.txt` and decrypt using the Vigenère cipher with the club\'s engineering school acronym (`ENISO`).\n' +
      '2. Read the recovered message instructions carefully regarding key modification.\n' +
      '3. Download `archive_footer.txt` and decrypt using the modified key (the original key in reverse: `OSINE`) to reveal the flag.',
    points: 150,
    flag: 'ECCC{vigenere_key_recovery}',
    hint:
      '1. The key for the first file is the name of the school the club belongs to (ENISO), repeated as needed (a standard Vigenère key).\n' +
      '2. Read what the first message tells you to do for the second file carefully — it instructs you to spell the key backwards (OSINE).',
    instanceUrl: '/workshop/03-crypto-vigenere/index.html' as string | null,
    isPerUserInstance: false,
    isDraft: false,
  },
  {
    title: "Metadata Doesn't Lie",
    category: 'Forensics',
    description:
      "A photo from last year's workshop looks completely ordinary at first glance. Image files often carry a lot more information than what is visible on the pixels — camera settings, timestamps, software used, and leftover comments that were never stripped out.\n\n" +
      'One metadata field tells you to look deeper; another holds the actual answer in an encoded format you will need to recognize and convert.\n\n' +
      '### Objectives & Forensic Workflow:\n' +
      '1. Download the raw uncompressed photo `event_photo.jpg` below.\n' +
      '2. Inspect the metadata tags using `exiftool` or `strings`.\n' +
      '3. Locate the encoded string in the `Artist` metadata tag (`RUNDQ3tmb2xsb3dfdGhlX21ldGFkYXRhfQ==`).\n' +
      '4. Base64-decode the payload to retrieve the flag.',
    points: 200,
    flag: 'ECCC{follow_the_metadata}',
    hint:
      '1. Try exiftool, or even just the plain `strings` command, on the downloaded file.\n' +
      '2. Check every metadata field, not just the obvious one. The Artist field contains a base64-encoded string ending with ==. Decode it.',
    instanceUrl: '/workshop/04-forensics-exif/index.html' as string | null,
    isPerUserInstance: false,
    isDraft: false,
  },
  {
    title: 'Pixels Never Lie',
    category: 'Steganography',
    description:
      'An image shared as "just a wallpaper" is a few KB heavier than it should be. In steganography, data is hidden not in metadata, but inside the pixels themselves.\n\n' +
      "What you extract won't look like a flag at first — one more small step turns it into one, and everything you need for that step is visible right there in the image!\n\n" +
      '### Steganographic Resolution Steps:\n' +
      '1. Download the uncompressed `digital_noise.png` file below.\n' +
      '2. The payload is hidden in the Least Significant Bit (LSB) of each red pixel in raster scan order (left to right, top to bottom).\n' +
      '3. The first 32 bits represent a big-endian integer indicating payload length.\n' +
      '4. The extracted bytes are obfuscated with a single-byte XOR key printed directly in the bottom-left corner of the image (`frame id: 42`). XOR each byte with decimal `42` to uncover the flag!',
    points: 250,
    flag: 'ECCC{least_significant_secrets}',
    hint:
      '1. Research "least significant bit steganography". Read the LSB of the red channel across all pixels.\n' +
      '2. The first 32 bits (in pixel order) tell you how many bytes of hidden data follow.\n' +
      '3. What you extract from the pixels looks like noise because it is combined with a number using XOR. Look closely at the image: the number 42 is printed in the corner.',
    instanceUrl: '/workshop/05-stego-lsb/index.html' as string | null,
    isPerUserInstance: false,
    isDraft: false,
  },
  {
    title: "The Intern's Trail",
    category: 'OSINT',
    description:
      'A (fictional) resume, a forum screenshot, and an HR sticky note were all left on a shared printer. Piece together personal details across all three documents to reconstruct a password pattern the candidate openly admits to reusing.\n\n' +
      'Crucial OSINT Rule: Never trust the first document you read at face value without cross-referencing; one document corrects a crucial fact from another!\n\n' +
      '### Objectives & Correlation:\n' +
      '1. Download all three documents: `leaked_resume.txt`, `forum_screenshot.png`, and `hr_followup_note.txt`.\n' +
      '2. Discover the candidate\'s confessed password convention: `petname_gradyear` (all lowercase).\n' +
      "3. Identify the candidate's pet cat name (`nimbus`) from the resume.\n" +
      '4. Notice that the resume states graduation year 2021, but the HR memo specifically verifies the actual graduation year was **2022**.\n' +
      '5. Formulate the verified flag: `ECCC{nimbus_2022}`.',
    points: 150,
    flag: 'ECCC{nimbus_2022}',
    hint:
      '1. The flag content matches the exact pattern described in the forum post: petname_gradyear, lowercase.\n' +
      '2. The resume states graduation year 2021, but the HR follow-up note specifically corrects this to 2022. Use the corrected year!',
    instanceUrl: '/workshop/06-osint-intern/index.html' as string | null,
    isPerUserInstance: false,
    isDraft: false,
  },
  {
    title: 'Whispers on the Wire',
    category: 'Networking',
    description:
      'A packet capture from a decommissioned lab switch shows someone logging into an obsolete service that really should not exist anymore in 2026.\n\n' +
      'Reconstruct the network conversation to see exactly what was typed — and exactly what was returned by the remote server.\n\n' +
      '### Packet Analysis Workflow:\n' +
      '1. Download `lab_capture.pcap`.\n' +
      '2. Open the file in Wireshark and apply the filter `tcp.port == 23` (unencrypted Telnet).\n' +
      '3. Right-click any packet in the stream and select **Follow > TCP Stream** to view the full interactive dialogue.\n' +
      '4. Locate the administrative execution of `cat capture_the_flag.txt`.\n' +
      '5. Recognize the base64 output (`RUNDQ3twbGFpbnRleHRfcHJvdG9jb2xzX2xlYWt9`) and decode it to reveal the flag.',
    points: 250,
    flag: 'ECCC{plaintext_protocols_leak}',
    hint:
      '1. Open the pcap in Wireshark, filter for `tcp.port == 23`, then Follow > TCP Stream.\n' +
      '2. The output of the `cat capture_the_flag.txt` command is base64 encoded. Decode it to get the flag.',
    instanceUrl: '/workshop/07-network-pcap/index.html' as string | null,
    isPerUserInstance: false,
    isDraft: false,
  },
  {
    title: 'Crack Me If You Can',
    category: 'Reverse',
    description:
      'A small Linux access-terminal binary asks for an "unlock code" and tells you if you\'re right — but running `strings` on it will not hand you anything useful.\n\n' +
      "The correct unlock code is transformed before comparison; you will need to read the disassembly to recover the transform, then invert it. The unlock code itself isn't the flag — typing it in correctly triggers one more step inside the program!\n\n" +
      '### Reverse Engineering Guide:\n' +
      '1. Download `crackme.zip` (contains the compiled x86_64 ELF binary).\n' +
      '2. Disassemble with `objdump -d ./crackme` or open in Ghidra / IDA.\n' +
      '3. Locate the `check_unlock_code` routine: each input character at index `i` is transformed via `((input[i] + i) % 256) ^ 0x5A` and compared against a fixed byte array.\n' +
      '4. Invert the algorithm to recover the unlock string (`CYBERGUARD_UNLOCK`).\n' +
      '5. Execute the binary with the recovered unlock code: `./crackme "CYBERGUARD_UNLOCK"` to decrypt and print the flag!',
    points: 300,
    flag: 'ECCC{reverse_the_bytes}',
    hint: 'CYBERGUARD_UNLOCK',
    instanceUrl: '/workshop/08-reverse-crackme/index.html' as string | null,
    isPerUserInstance: false,
    isDraft: false,
  },
  {
    title: 'Stack Warmup',
    category: 'Pwn',
    description:
      'A practice terminal is listening on the network (connect with `nc <host> 9002`). It logs your name into a fixed-size buffer using a read that is larger than the buffer itself. There is a `win()` function in the binary that is never called during normal execution... or is it?\n\n' +
      "This is a classic ret2win stack buffer overflow: no stack canary, no PIE, on purpose, so you can find `win()`'s address with objdump and overwrite the saved return address to jump there.\n\n" +
      '### Binary Exploitation Guide:\n' +
      '1. Download `vuln.zip` containing the precompiled binary and C source code.\n' +
      "2. Disassemble with `objdump -d ./vuln | grep '<win>:'` to find `win()`'s fixed address (e.g. `0x4019a5`).\n" +
      '3. Calculate the buffer offset: 64-byte buffer + 8-byte saved RBP = 72 bytes before the return address.\n' +
      '4. Construct a pwntools payload: `b\'A\' * 72 + p64(win_addr)`.\n' +
      '5. Send to `nc <host> 9002` and base64-decode the returned flag!',
    points: 400,
    flag: 'ECCC{mind_the_buffer}',
    hint:
      '1. The vulnerable buffer is 64 bytes, plus 8 bytes of saved base pointer (72 bytes total before return address).\n' +
      "2. Disassemble `./vuln` to find `win()`'s address. Use pwntools' `p64()` to pack the address.\n" +
      "3. What win() prints is base64 encoded. Decode it to reveal the flag.",
    instanceUrl: 'nc <host> 9002' as string | null,
    isPerUserInstance: false,
    isDraft: false,
  },
  {
    title: 'Broken Encryption',
    category: 'Crypto',
    description:
      'Our intelligence team intercepted an RSA-encrypted message from a suspicious network node. Something about the public key parameters looks very wrong — the kind of mistake that makes a cryptographer cringe.\n\n' +
      'Download `challenge.txt`, study the key parameters carefully, and recover the hidden flag.',
    points: 250,
    flag: 'ECCC{cube_root_wins}',
    hint:
      'Look closely at the value of `e`. Is there a relationship between `e`, the message, and the ciphertext that doesn\'t require factoring `n`? Think about what modular exponentiation actually does when the result fits entirely within the modulus.',
    instanceUrl: '/workshop/10-crypto-rsa/index.html' as string | null,
    isPerUserInstance: false,
    isDraft: false,
  },
  {
    title: 'The Secure Portal',
    category: 'Web',
    description:
      'A developer built an internal admin portal protected by JSON Web Tokens (JWTs). You\'ve been issued a **guest token** — but the admin area is off limits. Or is it?\n\n' +
      'Open the challenge page, inspect your token carefully, and find a way to convince the portal that you\'re an admin.',
    points: 250,
    flag: 'ECCC{alg_n0ne_byp4ss}',
    hint:
      'A JWT has three parts: header, payload, and signature. The header tells the server *how* to verify the token. What happens if the server blindly trusts whatever the token\'s header says about the algorithm?',
    instanceUrl: '/workshop/11-web-jwt/index.html' as string | null,
    isPerUserInstance: false,
    isDraft: false,
  },
  {
    title: 'The Locked Vault',
    category: 'Misc',
    description:
      'During a forensics investigation, you recovered a **password-protected ZIP archive** from a suspect\'s laptop alongside two seemingly unrelated text files left behind in the same folder.\n\n' +
      'The archive contains the flag — but it\'s locked. Everything you need to crack it is hidden in those two recovered documents. Read them carefully.',
    points: 250,
    flag: 'ECCC{z1p_p4ssw0rd_crack3d}',
    hint:
      'Both text files together tell the full story — one describes the password *format*, the other gives you the *values* to fill in. Don\'t forget: the content of the file you extract isn\'t the flag yet.',
    instanceUrl: '/workshop/12-forensics-zip/index.html' as string | null,
    isPerUserInstance: false,
    isDraft: false,
  },
];

async function main() {
  console.log('🛡️  Importing Upgraded CyberGuard Workshop Challenges...\n');

  let created = 0;
  let updated = 0;

  for (const c of WORKSHOP_CHALLENGES) {
    const salt = generateSalt();
    const flagHash = hashFlag(c.flag, salt);

    // Look up by title, also matching unaccented/accented variations like Vigenère
    const existing = await prisma.challenge.findFirst({
      where: {
        OR: [
          { title: c.title },
          ...(c.title.includes('Vigen')
            ? [{ title: "Vigenere's Ghost" }, { title: "Vigenère's Ghost" }]
            : []),
        ],
      },
    });

    if (existing) {
      await prisma.challenge.update({
        where: { id: existing.id },
        data: {
          title: c.title,
          category: c.category,
          description: c.description,
          points: c.points,
          flagSalt: salt,
          flagHash: flagHash,
          hint: c.hint,
          instanceUrl: c.instanceUrl,
          isPerUserInstance: c.isPerUserInstance,
          isDraft: c.isDraft,
        },
      });
      console.log(`  Updated  "${c.title}" (${c.points} pts)  flag: ${c.flag}`);
      updated++;
    } else {
      await prisma.challenge.create({
        data: {
          title: c.title,
          category: c.category,
          description: c.description,
          points: c.points,
          flagSalt: salt,
          flagHash,
          hint: c.hint,
          instanceUrl: c.instanceUrl,
          isPerUserInstance: c.isPerUserInstance,
          isDraft: c.isDraft,
        },
      });
      console.log(`  Created  "${c.title}" (${c.points} pts)  flag: ${c.flag}`);
      created++;
    }
  }

  console.log(`\nDone! ${created} created, ${updated} updated.`);
  console.log('All upgraded workshop challenges are now live in the database.');
}

if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].replace(/\\/g, '/').includes('seed-workshop')) {
  main()
    .catch((e) => {
      console.error('Import error:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

