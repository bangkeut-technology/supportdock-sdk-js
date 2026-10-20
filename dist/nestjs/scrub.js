"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrubbingExporter = void 0;
exports.normalizeSql = normalizeSql;
/**
 * PII never leaves the app: before spans are exported, query strings are cut
 * from URLs, and SQL is reduced to its shape (literals → ?). SupportDock ingest
 * normalises again on arrival, but data that is never sent cannot leak.
 */
const URL_KEYS = ['url.full', 'http.url', 'http.target'];
const DROP_KEYS = ['url.query', 'http.request.body', 'http.response.body', 'db.query.parameter'];
function normalizeSql(sql) {
    return sql
        .replace(/--[^\n]*/g, ' ')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/'(?:[^']|'')*'/g, '?')
        .replace(/\$\$[\s\S]*?\$\$/g, '?')
        .replace(/\b0x[0-9a-f]+\b/gi, '?')
        .replace(/(?<![\w$])-?\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/gi, '?')
        .replace(/\(\s*\?(?:\s*,\s*\?)+\s*\)/g, '(?)')
        .replace(/\(\s*\$\d+(?:\s*,\s*\$\d+)+\s*\)/g, '(?)')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 1000);
}
function scrub(span) {
    // Ended spans are frozen in type only; rewriting attributes in place keeps
    // every other part of the span (methods, links, events) intact.
    const attrs = span.attributes;
    for (const key of URL_KEYS) {
        if (typeof attrs[key] === 'string')
            attrs[key] = attrs[key].split('?')[0];
    }
    for (const key of Object.keys(attrs)) {
        if (DROP_KEYS.includes(key) || key.startsWith('db.query.parameter.'))
            delete attrs[key];
    }
    for (const key of ['db.statement', 'db.query.text']) {
        const text = attrs[key];
        if (typeof text !== 'string')
            continue;
        attrs[key] =
            attrs['db.system'] === 'redis' || attrs['db.system.name'] === 'redis'
                ? text.trim().split(/\s+/)[0].toUpperCase()
                : normalizeSql(text);
    }
}
class ScrubbingExporter {
    constructor(inner) {
        this.inner = inner;
    }
    export(spans, done) {
        for (const span of spans)
            scrub(span);
        this.inner.export(spans, done);
    }
    shutdown() {
        return this.inner.shutdown();
    }
    forceFlush() {
        return this.inner.forceFlush?.() ?? Promise.resolve();
    }
}
exports.ScrubbingExporter = ScrubbingExporter;
