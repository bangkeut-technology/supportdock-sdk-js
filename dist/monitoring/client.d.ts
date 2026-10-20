import type { ErrorContext, MonitoringOptions, Runtime } from './types';
export declare const SupportDock: {
    /**
     * Start monitoring. Call once, as early as possible.
     *
     * ```ts
     * SupportDock.init({ projectKey, monitoring: { errors: true, crashes: true } });
     * ```
     */
    init(options: MonitoringOptions, runtime?: Runtime): void;
    /** Report an error you caught. Does nothing unless `monitoring.errors` is on. */
    captureException(error: unknown, context?: ErrorContext): void;
    /** Send anything queued now, e.g. before a graceful shutdown. */
    flush(timeoutMs?: number): Promise<void>;
    /** Settings the framework presets build on. */
    config(): {
        options: MonitoringOptions;
        release: string;
        ingestUrl: string;
    } | null;
};
