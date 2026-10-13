# CyberGuard Workshop — Participant Guide

Welcome! Today you'll solve 9 challenges across web security, cryptography, forensics, steganography,
OSINT, networking, reverse engineering, and binary exploitation. Every flag looks like `ECCC{...}`.

## Getting started
1. Log in (or register) on the CyberGuard platform at the address your organizer gives you.
2. Go to **Challenges** and pick any category — they don't need to be solved in order, though difficulty
   generally increases from Easy → Hard.
3. Each challenge page has a description, an **Open Challenge** button (or connection instructions for
   networked challenges), and optional hints if you get stuck.
4. Submit flags directly on the challenge page. Wrong guesses don't cost you anything — try again.

## Suggested tools
Install these ahead of time if you can:
- A terminal with Python 3 (`pip install pwntools pillow` for a couple of the challenges)
- [Wireshark](https://www.wireshark.org/) for the networking challenge
- A disassembler for the reverse engineering challenge — `objdump` (usually preinstalled on Linux/WSL/Mac)
  is enough, or [Ghidra](https://ghidra-sre.org/) (free) if you want a friendlier GUI
- `exiftool` (or just your terminal's built-in `strings` command) for the forensics challenge
- `netcat`/`nc` for connecting to the pwn challenge

## A few honest tips
- Read the *whole* description and every hint before asking a mentor — the answer to "what do I do next"
  is usually already there.
- Most challenges here have more than one step. If what you've found so far doesn't look like a flag
  (`ECCC{...}`) yet, you're probably not done — look for a second file, a second field, or an encoding you
  need to recognize and decode (base64 shows up a lot today: look for text using only letters, digits,
  `+`, `/`, and possibly ending in `=`).
- If something feels "too easy" for the *first* part of a challenge, it probably is the intended first
  step — there's likely a second part waiting. CTF challenges are designed to be solvable, not to trick
  you with red herrings.
- Ask a mentor if you're stuck more than ~15 minutes on any one challenge. That's what we're here for.
- These challenges use deliberately vulnerable code written for training. **The techniques you learn today
  (SQL injection, buffer overflows, etc.) should only ever be used on systems you own or have explicit
  permission to test.** Using them against real systems without authorization is illegal.

Good luck, and have fun. 🚩
