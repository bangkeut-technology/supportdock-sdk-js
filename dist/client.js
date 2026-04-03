"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportDockError = exports.SupportDockClient = void 0;
const DEFAULT_BASE_URL = 'https://supportdock.io';
const DEFAULT_TIMEOUT = 10000;
class SupportDockClient {
    constructor(config) {
        if (!config.apiKey)
            throw new Error('SupportDock: apiKey is required');
        this.apiKey = config.apiKey;
        this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
        this.defaultMetadata = config.defaultMetadata ?? {};
        this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    }
    async request(path, options = {}) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeout);
        try {
            const res = await fetch(`${this.baseUrl}${path}`, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    ...options.headers,
                },
            });
            const data = await res.json();
            if (!res.ok) {
                throw new SupportDockError(data.error ?? `Request failed with status ${res.status}`, res.status);
            }
            return data;
        }
        finally {
            clearTimeout(timer);
        }
    }
    // ─── Feedback ────────────────────────────────────────────────
    /**
     * Submit feedback from your app.
     *
     * ```ts
     * await sdk.sendFeedback({ type: 'bug', message: 'App crashes on launch' });
     * ```
     */
    async sendFeedback(options) {
        const metadata = { ...this.defaultMetadata, ...options.metadata };
        return this.request('/api/feedback/remote', {
            method: 'POST',
            body: JSON.stringify({
                type: options.type ?? 'general',
                message: options.message,
                email: options.email,
                name: options.name,
                subject: options.subject,
                metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
                source: options.source ?? 'mobile-app',
            }),
        });
    }
    // ─── FAQ ─────────────────────────────────────────────────────
    /** List all FAQ entries for this app. */
    async listFAQs() {
        return this.request('/api/faqs/remote');
    }
    /** Create a new FAQ entry. */
    async createFAQ(options) {
        return this.request('/api/faqs/remote', {
            method: 'POST',
            body: JSON.stringify(options),
        });
    }
    /** Update an existing FAQ entry. */
    async updateFAQ(faqId, options) {
        return this.request(`/api/faqs/remote/${faqId}`, {
            method: 'PATCH',
            body: JSON.stringify(options),
        });
    }
    /** Delete a FAQ entry. */
    async deleteFAQ(faqId) {
        return this.request(`/api/faqs/remote/${faqId}`, {
            method: 'DELETE',
        });
    }
}
exports.SupportDockClient = SupportDockClient;
class SupportDockError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'SupportDockError';
        this.status = status;
    }
}
exports.SupportDockError = SupportDockError;
