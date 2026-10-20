import type { Span } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor, ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { SupportDock } from '../monitoring/client';
import type { MonitoringOptions } from '../monitoring/types';
import { ScrubbingExporter } from './scrub';

export interface NestMonitoringOptions extends MonitoringOptions {
    /** Reported as service.name. Defaults to npm_package_name, then "nestjs-app". */
    serviceName?: string;
}

let sdk: NodeSDK | null = null;

/**
 * Name requests by their route template ("GET /users/:id"), read from
 * req.route at the moment the response ends. Express's own instrumentation
 * would do this, but Nest 12 loads Express as an ES module, which the require
 * hook never sees; req.route is there whichever way Express was loaded.
 */
function routeFromRequest(span: Span, request: unknown) {
    const req = request as { method?: string; baseUrl?: string; route?: { path?: unknown } };
    if (typeof req.route?.path !== 'string') return;
    const route = `${req.baseUrl ?? ''}${req.route.path}` || '/';
    span.setAttribute('http.route', route);
    span.updateName(`${req.method ?? 'GET'} ${route}`);
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
export function initNestMonitoring(options: NestMonitoringOptions): void {
    SupportDock.init(options, 'nestjs');
    const config = SupportDock.config();
    if (!config || !options.monitoring.traces || sdk) return;

    const ratio = Math.min(1, Math.max(0, options.monitoring.sampleRate ?? 1));
    const exporter = new OTLPTraceExporter({
        url: `${config.ingestUrl}/v1/traces`,
        headers: { 'x-api-key': options.projectKey },
    });

    sdk = new NodeSDK({
        resource: resourceFromAttributes({
            'service.name': options.serviceName ?? process.env.npm_package_name ?? 'nestjs-app',
            'service.version': config.release,
        }),
        sampler: new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(ratio) }),
        spanProcessors: [new BatchSpanProcessor(new ScrubbingExporter(exporter), { scheduledDelayMillis: 10_000 })],
        instrumentations: [
            new HttpInstrumentation({ applyCustomAttributesOnSpan: routeFromRequest }),
            new ExpressInstrumentation(),
            new NestInstrumentation(),
            new PgInstrumentation(),
            new IORedisInstrumentation(),
        ],
    });
    sdk.start();

    // Flush what is buffered when the platform stops the process.
    const stop = () => void Promise.allSettled([sdk?.shutdown(), SupportDock.flush(2_000)]);
    process.once('SIGTERM', stop);
    process.once('SIGINT', stop);
}
