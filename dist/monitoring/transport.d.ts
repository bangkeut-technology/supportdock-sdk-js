import type { ErrorEventPayload } from './types';
export declare class Transport {
    private readonly ingestUrl;
    private readonly projectKey;
    private readonly debug;
    private queue;
    private timer;
    private readonly gzip;
    constructor(ingestUrl: string, projectKey: string, debug: boolean);
    start(): void;
    stop(): void;
    push(event: ErrorEventPayload): void;
    flush(timeoutMs?: number): Promise<void>;
}
