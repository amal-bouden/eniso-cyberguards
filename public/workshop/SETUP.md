# CyberGuard Workshop — Hosting Setup

9 real, self-contained challenges for your workshop: one per major category, built to actually teach the
underlying technique (not just "guess the flag"). Everything here runs **locally on your own machine/LAN**
— nothing needs the public internet, and nothing should be exposed to it (see Security Notes at the bottom).

## What's included

| # | Title | Category | Difficulty | Points | How it's served |
|---|-------|----------|------------|--------|------------------|
| 1 | Welcome Byte | Misc | Easy | 50 | Static page (nginx) |
| 2 | Broken Auth | Web | Easy | 150 | Live Flask app (Docker) |
| 3 | Vigenère's Ghost | Crypto | Easy | 150 | Static page (nginx) |
| 4 | Metadata Doesn't Lie | Forensics | Easy | 200 | Static page (nginx) |
| 5 | Pixels Never Lie | Steganography | Medium | 250 | Static page (nginx) |
| 6 | The Intern's Trail | OSINT | Easy | 150 | Static page (nginx) |
| 7 | Whispers on the Wire | Networking | Medium | 250 | Static page (nginx) |
| 8 | Crack Me If You Can | Reverse Engineering | Medium | 300 | Static page (nginx) |
| 9 | Stack Warmup | Pwn | Hard | 400 | Network service via `nc` (Docker) |

Total: 1900 points across a genuine easy → hard progression.

## 0. Set up your flags (local-only, never shared)

Flags are **never stored as plain files anywhere in this project** — they're injected at
build/run time from a `.env` file that only you have:

```powershell
cp .env.example .env
```

Open `.env` and set real values for `WEB_SQLI_FLAG` and `PWN_FLAG` (defaults match the ones in
`seed-workshop.ts` and `SOLUTIONS_ADMIN_ONLY.md` — change them if you want fresh flags). The
other 7 challenges have their flags baked into their actual files (the encrypted message, the
EXIF data, the pcap, etc.) since that's the nature of those challenge types — nothing further
to configure for those.

**`.env` is the one file in this whole project you must never zip up, email, or commit anywhere
participants (or the public) could see it.** `.gitignore` already excludes it if you put this
in git.

## 1. Find your machine's LAN IP

Participants' laptops need to reach your machine over your workshop's local network (WiFi/LAN), not
`localhost`. Find your IP:

- **Windows (PowerShell):** `ipconfig` → look for "IPv4 Address" under your active adapter (e.g. `192.168.1.42`)
- **Mac/Linux:** `ifconfig` or `ip addr` → look for your WiFi/LAN interface's `inet` address

## 2. Set the host IP in the seed script

Open `seed-workshop.ts`, find the line:
```ts
const HOST = 'REPLACE_WITH_YOUR_LAN_IP';
```
Replace it with your real IP, e.g. `const HOST = '192.168.1.42';`.

## 3. Start the challenge infrastructure

From this folder:
```powershell
docker compose up -d --build
```
This starts three things:
- **nginx** on port `8080` — serves challenges 1, 3–9's landing pages/files
- **web-sqli** on port `5001` — the live vulnerable login app (challenge 2)
- **pwn-stackwarmup** on port `9002` — the network service for challenge 9 (`nc <host> 9002`)

Confirm everything is up:
```powershell
docker compose ps
```
All three should show `Up`.

Quick sanity check from another device on the same network:
```
http://<your-ip>:8080/
http://<your-ip>:5001/
nc <your-ip> 9002
```

## 4. Apply the platform code update (time-decay scoring + first blood)

This workshop content assumes your platform has time-decay ("first blood") scoring support. If
you haven't already applied the platform update that adds this:
1. Copy the updated `server/src/` and `client/src/` folders over your existing ones (from the
   `CyberGuard-Platform-TimeDecay-Update.zip` provided alongside this workshop pack).
2. Copy the updated `server/prisma/schema.prisma` over yours.
3. From `server/`, run the migration:
   ```powershell
   npx prisma migrate dev --name add_time_decay_scoring
   npx prisma generate
   ```
4. Restart your `npm run dev` for both server and client.

## 5. Load the challenges into your CyberGuard platform

Copy `seed-workshop.ts` into your platform's `server/prisma/` folder. Before running it, open it
and set `WORKSHOP_START` to your actual session start time (or leave the default and adjust it
later from Admin > Events — see the decay-scoring note in `SOLUTIONS_ADMIN_ONLY.md`). Then from
`server/`:
```powershell
npx tsx prisma/seed-workshop.ts
```
This creates a "CyberGuard Workshop" event and adds all 9 challenges attached to it, each with
time-decay scoring configured (safe to re-run — it updates rather than duplicates). Your existing
demo/placeholder challenges are untouched; hide them from Admin → Challenges if you don't want
them shown during the workshop.

## 6. Verify from the platform itself

Log in as a **regular participant account** (not admin) and open each challenge from `/challenges`. Click
"Open Challenge" on a couple of them to confirm the URLs resolve correctly from a normal browser on your
network — this is the #1 thing that goes wrong (usually a stale/incorrect IP in step 2).

## What participants actually get vs. what's organizer-only

**This is the most important section in this file.** Never zip up and hand out this whole
`workshop/` folder to participants — several of these directories contain solutions, source
code with embedded flags, or admin-only material. Participants only ever need:

- **The platform URL** (to log in, browse challenges, submit flags) — that's it, for everything.
- **The LAN IP** for `nc <host> 9002` if a hint says so (challenge 9).

Every file a participant is meant to download is served automatically through the platform's
"Open Challenge" button or nginx at `:8080`, pointed at the `public/` subfolder of each
challenge. They never need direct filesystem access to this project at all.

What's organizer-only and must **never** be shared, even by accident:
- `_writeups/SOLUTIONS_ADMIN_ONLY.md` — full solutions.
- `.env` — your real flags.
- `08-reverse-crackme/crackme.c` — the reverse engineering challenge's full source (gives away
  the transform algorithm instantly). Only `08-reverse-crackme/public/crackme.zip` (the compiled
  binary) should ever reach participants, and that's exactly what nginx serves.
- `09-pwn-stackoverflow/vuln.c` at the project root (note: a *copy* of this same source is
  deliberately included inside `public/vuln.zip` — for this one challenge, giving out source
  alongside the binary is intentional, standard practice for a beginner pwn challenge. The root
  copy is just there for your own reference and isn't what gets served).

## Files reference

```
workshop/
├── docker-compose.yml          # one command to run everything
├── .env.example                # copy to .env and fill in real flags (never share .env itself)
├── .gitignore                  # excludes .env if you put this in git
├── nginx-index.html            # landing page listing all static challenges
├── nginx-noautoindex.conf      # explicitly disables directory listing (defense in depth)
├── seed-workshop.ts            # loads the 9 challenges into your platform's DB
├── SETUP.md                    # this file
├── 01-warmup/public/           # only `public/` subfolders are ever mounted into nginx -
├── 03-crypto-vigenere/public/  # anything outside `public/` in these folders is never
├── 04-forensics-exif/public/   # reachable over HTTP, even by guessing a URL
├── 05-stego-lsb/public/
├── 06-osint-intern/public/
├── 07-network-pcap/public/
├── 08-reverse-crackme/
│   ├── public/                 # crackme.zip + index.html — what participants actually get
│   ├── crackme.c                # organizer-only: full source, never served
│   └── crackme                  # organizer-only: debug build with symbols, never served
├── 02-web-sqli/                 # Flask app + Dockerfile; flag comes from $CHALLENGE_FLAG, not source
├── 09-pwn-stackoverflow/
│   ├── public/                 # vuln.zip + index.html — what participants actually get
│   ├── Dockerfile               # builds the image, bakes in $PWN_FLAG at build time
│   └── vuln.c, vuln              # organizer-only reference copies, never served
└── _writeups/
    ├── SOLUTIONS_ADMIN_ONLY.md  # full solutions for mentors — NEVER share with participants
    └── PARTICIPANT_HANDOUT.md   # safe to share - this one's actually meant for them
```

## Security notes — please read before workshop day

- **Do not expose these services to the public internet.** The web SQLi app and the pwn binary are
  *intentionally* vulnerable. They're safe on an isolated workshop LAN with people you trust in the room;
  they are not safe on a machine with a public IP or port-forwarded router.
- **Shut everything down after the workshop:** `docker compose down`.
- **Rotate/replace these flags before any *scored* future event** if you plan to reuse this content —
  once flags are shared once (even accidentally), treat them as burned for competitive integrity. For a
  pure learning workshop with no prize on the line, reuse is fine.
- The pwn and web challenges run as regular (non-root) users inside their containers, but container
  isolation is not a substitute for network isolation — keep this on a closed LAN regardless.
