"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transport = void 0;
/**
 * Batches events and posts them to SupportDock ingest. Flushes every 10 s or at
 * 100 events, whichever comes first. Never throws, never blocks the caller, and
 * drops a batch that fails — monitoring must not become the outage.
 */
const FLUSH_MS = 10000;
const FLUSH_AT = 100;
const MAX_QUEUE = 1000;
/** Node's zlib when present (gzip cuts a batch ~10×); plain JSON elsewhere. */
function loadGzip() {
    try {
        if (typeof process === 'undefined' || !process.versions?.node)
            return null;
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const zlib = require('zlib');
        return (body) => zlib.gzipSync(body);
    }
    catch {
        return null;
    }
}
class Transport {
    constructor(ingestUrl, projectKey, debug) {
        this.ingestUrl = ingestUrl;
        this.projectKey = projectKey;
        this.debug = debug;
        this.queue = [];
        this.timer = null;
        this.gzip = loadGzip();
    }
    start() {
        if (this.timer)
            return;
        this.timer = setInterval(() => void this.flush(), FLUSH_MS);
        // Don't keep a Node process alive just to flush monitoring data.
        this.timer.unref?.();
    }
    stop() {
        if (this.timer)
            clearInterval(this.timer);
        this.timer = null;
    }
    push(event) {
        if (this.queue.length >= MAX_QUEUE)
            this.queue.shift();
        this.queue.push(event);
        if (this.queue.length >= FLUSH_AT)
            void this.flush();
    }
    async flush(timeoutMs = 5000) {
        if (this.queue.length === 0)
            return;
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
                body: (this.gzip ? this.gzip(json) : json),
                signal: controller.signal,
            });
            if (!res.ok && this.debug)
                console.warn(`[supportdock] ingest answered ${res.status}`);
        }
        catch (err) {
            if (this.debug)
                console.warn('[supportdock] could not send errors:', err);
        }
        finally {
            clearTimeout(timer);
        }
    }
}
exports.Transport = Transport;
