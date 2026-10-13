/*
 * CyberGuard CTF - "Stack Warmup" (Pwn / Hard, but a gentle first pwn)
 *
 * Classic ret2win: overflow a stack buffer to overwrite the saved return
 * address so the program jumps into win() instead of returning normally.
 * Compiled with no stack canary and no PIE so beginners can find win()'s
 * address with a plain `objdump -d`. This binary is intentionally
 * memory-unsafe - never write real software like this.
 */
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

void win(void) {
    char buf[256];
    FILE *f = fopen("flag.txt", "r");
    if (!f) {
        printf("win() reached, but flag.txt is missing on this server.\n");
        return;
    }
    if (fgets(buf, sizeof(buf), f)) {
        printf("%s", buf);
    }
    fclose(f);
}

void vulnerable(void) {
    char buffer[64];
    printf("Enter your name for the lab logbook: ");
    fflush(stdout);
    /* Deliberately reads far more than `buffer` can hold. */
    read(0, buffer, 200);
    printf("Logged: %s\n", buffer);
    fflush(stdout);
}

int main(void) {
    setvbuf(stdout, NULL, _IONBF, 0);
    printf("=== CyberGuard Lab Warmup Terminal ===\n");
    vulnerable();
    printf("Thanks for stopping by. Goodbye.\n");
    return 0;
}
