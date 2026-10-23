export interface ChallengeFile {
  name: string;
  path: string;
  size: string;
  type: string;
  description: string;
  isImage?: boolean;
}

export interface EnhancedChallengeInfo {
  category: string;
  fullDescription: string;
  targetUrl: string | null;
  files: ChallengeFile[];
}

export const WORKSHOP_CHALLENGE_METADATA: Record<string, EnhancedChallengeInfo> = {
  'Welcome Byte': {
    category: 'Misc',
    targetUrl: '/workshop/01-warmup/index.html',
    fullDescription: `Hey there, future hacker! Before you dive into the harder challenges, let's make sure your tools are working.

Every good hacker's first habit: always check the page source. Browsers let you inspect everything a server sends you — and sometimes developers forget what they leave behind.

Rules of the CTF:
• No attacking the scoring platform itself — only the challenge targets.
• No sharing flags with other teams.
• Have fun and ask a mentor if you're stuck for more than 15 minutes.

Good luck. The flag format is always ECCC{...}.`,
    files: [],
  },

  'Broken Auth': {
    category: 'Web',
    targetUrl: '/ctf-targets/broken-auth',
    fullDescription: `The club intranet has a login portal. The developer swears the query is "just a simple check" — famous last words in application security.

Your objective: get into the admin account without knowing the admin password. Getting in is only step one — the flag is not on the welcome screen. Once inside, there's an internal notes search interface waiting for you.

Click "Launch Target" to attack the live login portal directly.`,
    files: [],
  },

  "Vigenère's Ghost": {
    category: 'Crypto',
    targetUrl: null,
    fullDescription: `An old member's intercepted letter was found in the club archives, encrypted with a polyalphabetic cipher popular before modern cryptography existed.

Download the intercepted message and recover the plaintext.

Hint: the key is the name of the school this club belongs to.

There's a second file in the same archive, encrypted the same way. Whatever you decrypt from the first message should tell you exactly what key to use for it.`,
    files: [
      {
        name: 'intercepted_message.txt',
        path: '/workshop/03-crypto-vigenere/intercepted_message.txt',
        size: '329 B',
        type: 'text/plain',
        description: 'Primary intercepted encrypted letter',
      },
      {
        name: 'archive_footer.txt',
        path: '/workshop/03-crypto-vigenere/archive_footer.txt',
        size: '290 B',
        type: 'text/plain',
        description: 'Second encrypted archive file',
      },
    ],
  },

  "Metadata Doesn't Lie": {
    category: 'Forensics',
    targetUrl: null,
    fullDescription: `This photo from last year's workshop was uploaded to the club drive. Nothing looks unusual about it at first glance — but photo files carry a lot more information than what you can see.

Hints:
• Try tools like exiftool, or even just strings, on the downloaded file.
• Don't stop at the first metadata field you find useful — check all of them.
• If a string of text ends in = or == and only contains letters, digits, + and /, that's a strong sign it's base64.`,
    files: [
      {
        name: 'event_photo.jpg',
        path: '/workshop/04-forensics-exif/event_photo.jpg',
        size: '349.9 KB',
        type: 'image/jpeg',
        description: 'Workshop photo with embedded EXIF metadata',
        isImage: true,
      },
    ],
  },

  'Pixels Never Lie': {
    category: 'Steganography',
    targetUrl: null,
    fullDescription: `This image was shared in the club's general chat as "just a cool wallpaper." One of the mentors says it's about 4 KB heavier than it should be for its dimensions and colour count. That's suspicious.

Hints:
• The least significant bit of each colour channel can carry hidden information without visibly changing the image. Try writing a small Python script with Pillow to read the red channel's LSB of every pixel, in order — the first 32 bits tell you how many bytes of hidden data follow.
• If what you extract doesn't look like a readable flag, don't assume you did it wrong — look at the image itself again. Not everything in this challenge is hidden in the pixels.`,
    files: [
      {
        name: 'digital_noise.png',
        path: '/workshop/05-stego-lsb/digital_noise.png',
        size: '27.1 KB',
        type: 'image/png',
        description: 'The suspicious wallpaper image',
        isImage: true,
      },
    ],
  },

  "The Intern's Trail": {
    category: 'OSINT',
    targetUrl: null,
    fullDescription: `All names and people in this challenge are fictional and created for this workshop only.

A resume was accidentally left on the shared printer, along with a forum screenshot and an HR sticky note, all found in the same folder. Someone in HR flagged it as a good example of why personal details leak into "throwaway" account passwords — and why you should never trust the first document you find without cross-checking it.

Hints:
• The flag content (inside the braces) follows the exact pattern the candidate admits to using: petname_gradyear, all lowercase, with an underscore.
• All three documents matter. One of them corrects something the other two get wrong — make sure you're using the right value, not just the first one you see.`,
    files: [
      {
        name: 'leaked_resume.txt',
        path: '/workshop/06-osint-intern/leaked_resume.txt',
        size: '1.1 KB',
        type: 'text/plain',
        description: 'Candidate CV found on the printer',
      },
      {
        name: 'forum_screenshot.png',
        path: '/workshop/06-osint-intern/forum_screenshot.png',
        size: '48.2 KB',
        type: 'image/png',
        description: 'Online forum discussion screenshot',
        isImage: true,
      },
      {
        name: 'hr_followup_note.txt',
        path: '/workshop/06-osint-intern/hr_followup_note.txt',
        size: '384 B',
        type: 'text/plain',
        description: 'HR verification memo',
        isImage: false,
      },
    ],
  },

  'Whispers on the Wire': {
    category: 'Networking',
    targetUrl: null,
    fullDescription: `A packet capture from the old lab network was found on a decommissioned switch. Someone was logging into a server that really should not still exist in 2026.

Hints:
• Open it in Wireshark, find the TCP conversation on port 23, right-click a packet in that stream, and choose "Follow → TCP Stream" to read the whole session as plaintext.
• What comes back from cat capture_the_flag.txt isn't in flag format yet — the file itself was stored encoded. Does it look like a format you've seen in another challenge today?`,
    files: [
      {
        name: 'lab_capture.pcap',
        path: '/workshop/07-network-pcap/lab_capture.pcap',
        size: '38.4 KB',
        type: 'application/vnd.tcpdump.pcap',
        description: 'Raw network traffic packet capture',
      },
    ],
  },

  'Crack Me If You Can': {
    category: 'Reverse',
    targetUrl: null,
    fullDescription: `A small Linux access-terminal binary was found on a retired lab machine. It asks for an "unlock code" and tells you if you got it right — but running strings on it won't hand you anything useful, even if you skip straight to the end.

Hint: CYBERGUARD_UNLOCK`,

    files: [
      {
        name: 'crackme.zip',
        path: '/workshop/08-reverse-crackme/crackme.zip',
        size: '4.2 KB',
        type: 'application/zip',
        description: 'Contains the Linux x86-64 binary',
      },
    ],
  },

  'Stack Warmup': {
    category: 'Pwn',
    targetUrl: '/workshop/09-pwn-stackoverflow/index.html',
    fullDescription: `A practice terminal is listening on port 9002. It logs your name into a fixed-size buffer using a read that is larger than the buffer itself. There is a function called win() in the binary that nobody ever calls during normal execution... or is it?

To make this challenge accessible anywhere without network/IP barriers, the challenge package includes a Dockerfile so you can spin it up directly on your own machine.

Quick Start:
1. Download vuln.zip and extract it.
2. Run locally with Docker:
   docker compose up -d
   (or: docker build -t stack-warmup . && docker run -d -p 9002:9002 stack-warmup)
3. Connect locally:
   nc localhost 9002 (or 127.0.0.1 9002)

Hints:
• objdump -d ./vuln to find the address of win().
• The vulnerable buffer is 64 bytes; calculate how many bytes come before the saved return address (remember the saved base pointer).
• This binary has no stack canary and no PIE — on purpose, for your first overflow.
• pwntools' p64() is the easiest way to pack the address in the right byte order.
• What win() prints once you redirect execution there isn't in flag format yet — decode it to reveal the flag.`,
    files: [
      {
        name: 'vuln.zip',
        path: '/workshop/09-pwn-stackoverflow/vuln.zip',
        size: '354 KB',
        type: 'application/zip',
        description: 'Vulnerable binary + C source + Dockerfile + docker-compose.yml',
      },
    ],
  },

  'Broken Encryption': {
    category: 'Crypto',
    targetUrl: '/workshop/10-crypto-rsa/index.html',
    fullDescription: `Our intelligence team intercepted an RSA-encrypted message from a suspicious network node. The public key parameters are attached — but something about the way this key was generated is deeply unusual.

Download challenge.txt and examine the parameters. One value in particular stands out as a very suspicious choice for a production system.

Hints:
• RSA security fundamentally depends on certain assumptions about the relationship between the message, the exponent, and the modulus. If those assumptions are violated, the whole thing can unravel without ever needing to factor anything.
• Once you have the plaintext as an integer, you'll need to convert it to text. Flag format is ECCC{...}.`,
    files: [
      {
        name: 'challenge.txt',
        path: '/workshop/10-crypto-rsa/challenge.txt',
        size: '535 B',
        type: 'text/plain',
        description: 'RSA public key parameters and ciphertext',
      },
    ],
  },

  'The Secure Portal': {
    category: 'Web',
    targetUrl: '/workshop/11-web-jwt/index.html',
    fullDescription: `An internal admin portal uses JSON Web Tokens (JWTs) for access control. You've been issued a guest token — the admin area is restricted. Your objective: get in anyway.

The portal runs entirely in your browser. Start by decoding your current token and studying its structure. Pay close attention to every field — especially the ones that tell the server how to handle the token.

Hints:
• A JWT has three base64url-encoded sections separated by dots: header, payload, and signature. The header declares which algorithm was used to sign the token.
• Open your browser's developer console (F12). You can encode and decode JWT parts manually — no external tools needed.
• Think about what the server does if it can't verify a signature.`,
    files: [],
  },

  'The Locked Vault': {
    category: 'Misc',
    targetUrl: '/workshop/12-forensics-zip/index.html',
    fullDescription: `During a forensics investigation, a password-protected ZIP archive was recovered from a suspect's laptop — along with two text files found in the same directory that the suspect clearly didn't mean to leave behind.

The archive is named vault.zip and it contains the flag. Your job: figure out the password from the recovered documents and extract it.

Hints:
• Read both text files carefully before reaching for any cracking tools. The password isn't random — it follows a predictable pattern described in one of the documents.
• On Linux/Mac: unzip -P <password> vault.zip. On Windows, right-click → Extract All and enter the password when prompted. Python's zipfile module works on any OS.
• Whatever you extract from the archive isn't ready to submit yet — you'll recognise the next step from an earlier challenge.`,
    files: [
      {
        name: 'vault.zip',
        path: '/workshop/12-forensics-zip/vault.zip',
        size: '231 B',
        type: 'application/zip',
        description: 'Password-protected ZIP archive containing flag.txt',
      },
    ],
  },
};

/**
 * Returns enhanced metadata (files, description, target URL) for a challenge title.
 */
export function getChallengeEnhancements(title: string): EnhancedChallengeInfo | null {
  // Direct title match
  if (WORKSHOP_CHALLENGE_METADATA[title]) {
    return WORKSHOP_CHALLENGE_METADATA[title];
  }

  // Handle accents / aliases like Vigenere's Ghost vs Vigenère's Ghost
  const normalizedTitle = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  for (const [key, value] of Object.entries(WORKSHOP_CHALLENGE_METADATA)) {
    const normKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (normalizedTitle === normKey || normalizedTitle.includes(normKey) || normKey.includes(normalizedTitle)) {
      return value;
    }
  }

  return null;
}
