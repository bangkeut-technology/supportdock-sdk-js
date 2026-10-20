import type { MonitoringOptions } from '../monitoring/types';
export interface NestMonitoringOptions extends MonitoringOptions {
    /** Reported as service.name. Defaults to npm_package_name, then "nestjs-app". */
    serviceName?: string;
}
/**
 * NestJS preset (Express adapter): errors and crashes through the SupportDock
 * client, request and query timing through OpenTelemetry (HTTP, Postgres, Redis;
 * plus Express and Nest internals on versions that load them as CommonJS).
 *
 * OpenTelemetry has to patch modules before they are first required, so call
 * this from a file your entry point imports *first*:
 *
 * ```ts
 * // instrument.ts
 * import { initNestMonitoring } from '@bangkeut-technology/supportdock-sdk/nestjs';
 * initNestMonitoring({ projectKey: process.env.SUPPORTDOCK_KEY!, monitoring: { traces: true, errors: true, crashes: true, sampleRate: 0.2 } });
 *
 * // main.ts
 * import './instrument';
 * ```
 */
export declare function initNestMonitoring(options: NestMonitoringOptions): void;
