/**
 * Monitoring is opt-in per feature, so an app that only sends feedback pays
 * nothing for it. Every flag defaults to off.
 */
export interface MonitoringFeatures {
    /** Request timing via OpenTelemetry (NestJS preset). */
    traces?: boolean;
    /** Errors you capture, plus errors your framework hands to SupportDock. */
    errors?: boolean;
    /** Uncaught exceptions and unhandled rejections; reported before the process exits. */
    crashes?: boolean;
    /** Web Vitals / app start (browser and Expo; not used by the NestJS preset). */
    vitals?: boolean;
    /** Share of traces kept, 0–1. Errors are never sampled. Defaults to 1. */
    sampleRate?: number;
}

export interface MonitoringOptions {
    /** Your app's API key (starts with sdk_) — the same key feedback uses. */
    projectKey: string;
    monitoring: MonitoringFeatures;
    /**
     * Git sha or app version, so regressions line up with deploys. Defaults to
     * SUPPORTDOCK_RELEASE, then common CI variables, then npm_package_version.
     */
    release?: string;
    /** Defaults to https://supportdock.io/ingest. */
    ingestUrl?: string;
    /** Log transport failures to the console. Off by default: monitoring must stay invisible. */
    debug?: boolean;
}

export type Runtime = 'nestjs' | 'nextjs' | 'expo' | 'browser' | 'node';

export interface ErrorContext {
    route?: string;
    screen?: string;
    device?: string;
    os?: string;
}

/** Wire format — mirrors ErrorEvent / CrashEvent in SupportDock's monitor-contracts. */
export interface ErrorEventPayload {
    v: 1;
    ts: string;
    release: string;
    runtime: Runtime;
    fingerprint: string;
    message: string;
    stack: string;
    context: ErrorContext;
    fatal?: true;
    native?: boolean;
}
