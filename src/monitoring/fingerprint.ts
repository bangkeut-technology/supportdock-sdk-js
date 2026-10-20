/**
 * Groups occurrences of the same error. Built from the error's type and the
 * top frames' function and file — never line or column numbers, which move
 * with every unrelated edit and would split one bug into a group per deploy.
 */

const FRAMES = 5;

/** cyrb53: small, fast, good spread, and available in every runtime (no crypto import). */
function hash53(input: string): string {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < input.length; i++) {
        const ch = input.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

/** "at fn (/app/dist/x.js:12:5)" → "fn x.js"; skips node internals and node_modules. */
function frameKeys(stack: string): string[] {
    const keys: string[] = [];
    for (const line of stack.split('\n')) {
        const m = /^\s*at (?:(.+?) \()?(.+?)(?::\d+){1,2}\)?$/.exec(line);
        if (!m) continue;
        const file = m[2];
        if (file.startsWith('node:') || file.includes('node_modules') || file.startsWith('internal/')) continue;
        keys.push(`${m[1] ?? '<anonymous>'} ${file.split(/[\\/]/).pop()}`);
        if (keys.length === FRAMES) break;
    }
    return keys;
}

export function fingerprint(name: string, message: string, stack: string): string {
    const frames = frameKeys(stack);
    // Without usable frames, fall back to the message with numbers and ids blanked.
    const basis = frames.length > 0 ? frames.join('|') : message.replace(/\d+|[0-9a-f]{8,}/gi, '#');
    return hash53(`${name}|${basis}`);
}
