FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends socat && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# The binary is prebuilt (statically linked, -fno-stack-protector -no-pie) and committed as-is,
# so the copy served here is byte-for-byte identical to the one given to participants in vuln.zip.
# Addresses found via objdump on the downloaded binary will match this running instance exactly.
COPY vuln .

# The flag is NEVER a tracked file in this project - it's baked into the image only at build
# time, from a build arg you supply yourself (see docker-compose.yml / .env). This way the
# flag never sits as a plain file in a folder someone could browse, zip, or accidentally hand
# to a participant along with the binary/source.
#
# flag.txt is stored base64-ENCODED on purpose, matching the "last mile needs a decode" theme
# running through this whole workshop. win() just prints whatever is in flag.txt verbatim (see
# vuln.c) - it was never changed, so the exploit itself (offset 72, win() at 0x4019a5) is
# unaffected. Only what comes out at the end needs one more recognize-and-decode step.
ARG FLAG="ECCC{FLAG_NOT_CONFIGURED}"
RUN echo "$FLAG" | base64 > /app/flag.txt

RUN chmod +x vuln && useradd -m ctf && chown -R ctf:ctf /app
USER ctf
EXPOSE 9002
CMD ["socat", "TCP-LISTEN:9002,reuseaddr,fork", "EXEC:/app/vuln,pty,stderr"]
