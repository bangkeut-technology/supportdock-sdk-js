import type { ErrorEventPayload } from './types';

/**
 * Batches events and posts them to SupportDock ingest. Flushes every 10 s or at
 * 100 events, whichever comes first. Never throws, never blocks the caller, and
 * drops a batch that fails — monitoring must not become the outage.
 */
const FLUSH_MS = 10_000;
const FLUSH_AT = 100;
const MAX_QUEUE = 1_000;

type Gzip = (body: string) => Uint8Array;

/** Node's zlib when present (gzip cuts a batch ~10×); plain JSON elsewhere. */
function loadGzip(): Gzip | null {
    try {
        if (typeof process === 'undefined' || !process.versions?.node) return null;
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const zlib = require('zlib') as typeof import('zlib');
        return (body) => zlib.gzipSync(body);
    } catch {
        return null;
    }
}

export class Transport {
    private queue: ErrorEventPayload[] = [];
    private timer: ReturnType<typeof setInterval> | null = null;
    private readonly gzip = loadGzip();

    constructor(
        private readonly ingestUrl: string,
        private readonly projectKey: string,
        private readonly debug: boolean,
    ) {}

    start() {
        if (this.timer) return;
        this.timer = setInterval(() => void this.flush(), FLUSH_MS);
        // Don't keep a Node process alive just to flush monitoring data.
        (this.timer as { unref?: () => void }).unref?.();
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
    }

    push(event: ErrorEventPayload) {
        if (this.queue.length >= MAX_QUEUE) this.queue.shift();
        this.queue.push(event);
        if (this.queue.length >= FLUSH_AT) void this.flush();
    }

    async flush(timeoutMs = 5_000): Promise<void> {
        if (this.queue.length === 0) return;
        const batch = this.queue.splice(0, this.queue.length);
        const json = JSON.stringify(batch);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(`${this.ingestUrl}/v1/events/errors`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.projectKey,
                    ...(this.gzip ? { 'Content-Encoding': 'gzip' } : {}),
                },
                body: (this.gzip ? this.gzip(json) : json) as BodyInit,
                signal: controller.signal,
            });
            if (!res.ok && this.debug) console.warn(`[supportdock] ingest answered ${res.status}`);
        } catch (err) {
            if (this.debug) console.warn('[supportdock] could not send errors:', err);
        } finally {
            clearTimeout(timer);
        }
    }
}
