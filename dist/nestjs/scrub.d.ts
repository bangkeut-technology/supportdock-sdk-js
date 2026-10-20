import type { ExportResult } from '@opentelemetry/core';
import type { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-base';
export declare function normalizeSql(sql: string): string;
export declare class ScrubbingExporter implements SpanExporter {
    private readonly inner;
    constructor(inner: SpanExporter);
    export(spans: ReadableSpan[], done: (result: ExportResult) => void): void;
    shutdown(): Promise<void>;
    forceFlush(): Promise<void>;
}
