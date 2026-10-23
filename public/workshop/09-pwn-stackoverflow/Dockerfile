FROM debian:bookworm-slim

# Install socat to expose the vulnerable binary over TCP port 9002
RUN apt-get update && apt-get install -y --no-install-recommends socat && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# The binary is prebuilt (statically linked, -fno-stack-protector -no-pie)
# Addresses found via objdump on the downloaded binary match this running instance exactly.
COPY vuln .

# Baked-in flag (defaults to the workshop flag, base64-encoded for win() to read)
ARG FLAG="ECCC{mind_the_buffer}"
RUN echo "$FLAG" | base64 > /app/flag.txt

RUN chmod +x vuln && useradd -m ctf && chown -R ctf:ctf /app
USER ctf

EXPOSE 9002

# Serve the binary over TCP without pty mangling
CMD ["socat", "TCP-LISTEN:9002,reuseaddr,fork", "EXEC:/app/vuln,stderr"]
