import { fingerprint } from './fingerprint';
import { detectRelease } from './release';
import { Transport } from './transport';
import type { ErrorContext, ErrorEventPayload, MonitoringOptions, Runtime } from './types';

const DEFAULT_INGEST = 'https://supportdock.io/ingest';
const CRASH_FLUSH_MS = 2_000;

interface State {
    options: MonitoringOptions;
    release: string;
    runtime: Runtime;
    transport: Transport;
}

let state: State | null = null;

function toError(value: unknown): Error {
    if (value instanceof Error) return value;
    return new Error(typeof value === 'string' ? value : JSON.stringify(value ?? 'Unknown error'));
}

function build(err: Error, context: ErrorContext, crash?: { native: boolean }): ErrorEventPayload {
    const s = state!;
    const message = `${err.name}: ${err.message}`.slice(0, 2000);
    const stack = (err.stack ?? message).slice(0, 16000);
    return {
        v: 1,
        ts: new Date().toISOString(),
        release: s.release,
        runtime: s.runtime,
        fingerprint: fingerprint(err.name, err.message, stack),
        message,
        stack,
        context,
        ...(crash ? { fatal: true as const, native: crash.native } : {}),
    };
}

/** Node only: report the crash, then exit 1 exactly as Node would have. */
function installCrashHandlers() {
    if (typeof process === 'undefined' || typeof process.on !== 'function') return;
    let exiting = false;

    process.on('uncaughtException', (err) => {
        if (exiting) return;
        exiting = true;
        console.error(err);
        if (state) state.transport.push(build(toError(err), {}, { native: false }));
        void (state?.transport.flush(CRASH_FLUSH_MS) ?? Promise.resolve()).finally(() => process.exit(1));
    });
    // Node's default for an unhandled rejection is to crash; keep that, via the handler above.
    process.on('unhandledRejection', (reason) => {
        setImmediate(() => {
            throw toError(reason);
        });
    });
}

export const SupportDock = {
    /**
     * Start monitoring. Call once, as early as possible.
     *
     * ```ts
     * SupportDock.init({ projectKey, monitoring: { errors: true, crashes: true } });
     * ```
     */
    init(options: MonitoringOptions, runtime: Runtime = 'node'): void {
        if (state) return;
        if (!options.projectKey?.startsWith('sdk_')) {
            console.warn('[supportdock] monitoring disabled: projectKey must be your app API key (sdk_…)');
            return;
        }
        const ingestUrl = (options.ingestUrl ?? DEFAULT_INGEST).replace(/\/$/, '');
        const transport = new Transport(ingestUrl, options.projectKey, !!options.debug);
        state = { options, release: detectRelease(options.release), runtime, transport };
        transport.start();
        if (options.monitoring.crashes) installCrashHandlers();
    },

    /** Report an error you caught. Does nothing unless `monitoring.errors` is on. */
    captureException(error: unknown, context: ErrorContext = {}): void {
        if (!state?.options.monitoring.errors) return;
        try {
            state.transport.push(build(toError(error), context));
        } catch {
            // Never let reporting an error raise another one.
        }
    },

    /** Send anything queued now, e.g. before a graceful shutdown. */
    flush(timeoutMs?: number): Promise<void> {
        return state?.transport.flush(timeoutMs) ?? Promise.resolve();
    },

    /** Settings the framework presets build on. */
    config(): { options: MonitoringOptions; release: string; ingestUrl: string } | null {
        if (!state) return null;
        return {
            options: state.options,
            release: state.release,
            ingestUrl: (state.options.ingestUrl ?? DEFAULT_INGEST).replace(/\/$/, ''),
        };
    },
};
