"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initNestMonitoring = initNestMonitoring;
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const instrumentation_express_1 = require("@opentelemetry/instrumentation-express");
const instrumentation_http_1 = require("@opentelemetry/instrumentation-http");
const instrumentation_ioredis_1 = require("@opentelemetry/instrumentation-ioredis");
const instrumentation_nestjs_core_1 = require("@opentelemetry/instrumentation-nestjs-core");
const instrumentation_pg_1 = require("@opentelemetry/instrumentation-pg");
const resources_1 = require("@opentelemetry/resources");
const sdk_node_1 = require("@opentelemetry/sdk-node");
const sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
const client_1 = require("../monitoring/client");
const scrub_1 = require("./scrub");
let sdk = null;
/**
 * Name requests by their route template ("GET /users/:id"), read from
 * req.route at the moment the response ends. Express's own instrumentation
 * would do this, but Nest 12 loads Express as an ES module, which the require
 * hook never sees; req.route is there whichever way Express was loaded.
 */
function routeFromRequest(span, request) {
    const req = request;
    if (typeof req.route?.path !== 'string')
        return;
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
function initNestMonitoring(options) {
    client_1.SupportDock.init(options, 'nestjs');
    const config = client_1.SupportDock.config();
    if (!config || !options.monitoring.traces || sdk)
        return;
    const ratio = Math.min(1, Math.max(0, options.monitoring.sampleRate ?? 1));
    const exporter = new exporter_trace_otlp_http_1.OTLPTraceExporter({
        url: `${config.ingestUrl}/v1/traces`,
        headers: { 'x-api-key': options.projectKey },
    });
    sdk = new sdk_node_1.NodeSDK({
        resource: (0, resources_1.resourceFromAttributes)({
            'service.name': options.serviceName ?? process.env.npm_package_name ?? 'nestjs-app',
            'service.version': config.release,
        }),
        sampler: new sdk_trace_base_1.ParentBasedSampler({ root: new sdk_trace_base_1.TraceIdRatioBasedSampler(ratio) }),
        spanProcessors: [new sdk_trace_base_1.BatchSpanProcessor(new scrub_1.ScrubbingExporter(exporter), { scheduledDelayMillis: 10000 })],
        instrumentations: [
            new instrumentation_http_1.HttpInstrumentation({ applyCustomAttributesOnSpan: routeFromRequest }),
            new instrumentation_express_1.ExpressInstrumentation(),
            new instrumentation_nestjs_core_1.NestInstrumentation(),
            new instrumentation_pg_1.PgInstrumentation(),
            new instrumentation_ioredis_1.IORedisInstrumentation(),
        ],
    });
    sdk.start();
    // Flush what is buffered when the platform stops the process.
    const stop = () => void Promise.allSettled([sdk?.shutdown(), client_1.SupportDock.flush(2000)]);
    process.once('SIGTERM', stop);
    process.once('SIGINT', stop);
}
