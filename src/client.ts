import type {
    SupportDockConfig,
    FeedbackOptions,
    FeedbackResult,
    FAQ,
    CreateFAQOptions,
    UpdateFAQOptions,
} from './types';

const DEFAULT_BASE_URL = 'https://supportdock.io';
const DEFAULT_TIMEOUT = 10000;

export class SupportDockClient {
    private apiKey: string;
    private baseUrl: string;
    private defaultMetadata: Record<string, string>;
    private timeout: number;

    constructor(config: SupportDockConfig) {
        if (!config.apiKey) throw new Error('SupportDock: apiKey is required');
        this.apiKey = config.apiKey;
        this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
        this.defaultMetadata = config.defaultMetadata ?? {};
        this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
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
                throw new SupportDockError(
                    (data as { error?: string }).error ?? `Request failed with status ${res.status}`,
                    res.status,
                );
            }

            return data as T;
        } finally {
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
    async sendFeedback(options: FeedbackOptions): Promise<FeedbackResult> {
        const metadata = { ...this.defaultMetadata, ...options.metadata };

        if (options.images) {
            if (options.images.length > 3) {
                throw new SupportDockError('Maximum 3 images allowed', 400);
            }
            for (const img of options.images) {
                if (!/^data:image\/(png|jpeg|webp|gif);base64,/.test(img)) {
                    throw new SupportDockError(
                        'Images must be base64-encoded data URLs (PNG, JPEG, WebP, or GIF)',
                        400,
                    );
                }
            }
        }

        return this.request<FeedbackResult>('/api/v1/feedback/remote', {
            method: 'POST',
            body: JSON.stringify({
                type: options.type ?? 'general',
                message: options.message,
                email: options.email,
                name: options.name,
                subject: options.subject,
                metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
                source: options.source ?? 'mobile-app',
                images: options.images,
            }),
        });
    }

    // ─── FAQ ─────────────────────────────────────────────────────

    /** List all FAQ entries for this app. */
    async listFAQs(): Promise<FAQ[]> {
        return this.request<FAQ[]>('/api/v1/faqs/remote');
    }

    /** Create a new FAQ entry. */
    async createFAQ(options: CreateFAQOptions): Promise<FAQ> {
        return this.request<FAQ>('/api/v1/faqs/remote', {
            method: 'POST',
            body: JSON.stringify(options),
        });
    }

    /** Update an existing FAQ entry. */
    async updateFAQ(faqId: string, options: UpdateFAQOptions): Promise<FAQ> {
        return this.request<FAQ>(`/api/v1/faqs/remote/${faqId}`, {
            method: 'PATCH',
            body: JSON.stringify(options),
        });
    }

    /** Delete a FAQ entry. */
    async deleteFAQ(faqId: string): Promise<{ success: boolean }> {
        return this.request<{ success: boolean }>(`/api/v1/faqs/remote/${faqId}`, {
            method: 'DELETE',
        });
    }
}

export class SupportDockError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'SupportDockError';
        this.status = status;
    }
}
