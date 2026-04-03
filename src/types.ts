export type FeedbackType = 'bug' | 'feature' | 'question' | 'general';

export interface FeedbackOptions {
    /** Feedback type. Defaults to 'general'. */
    type?: FeedbackType;
    /** The feedback message (required). */
    message: string;
    /** Sender email (optional). */
    email?: string;
    /** Sender name (optional). */
    name?: string;
    /** Subject line (optional — auto-generated from type if omitted). */
    subject?: string;
    /** Arbitrary metadata (e.g. appVersion, platform, deviceModel). */
    metadata?: Record<string, string>;
    /** Source identifier (defaults to 'mobile-app'). */
    source?: string;
}

export interface FeedbackResult {
    success: boolean;
    error?: string;
}

export interface FAQ {
    id: string;
    question: string;
    answer: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateFAQOptions {
    question: string;
    answer: string;
    sortOrder?: number;
}

export interface UpdateFAQOptions {
    question?: string;
    answer?: string;
    sortOrder?: number;
}

export interface SupportDockConfig {
    /** Your app's API key (starts with sdk_). */
    apiKey: string;
    /** Base URL. Defaults to https://supportdock.io. */
    baseUrl?: string;
    /** Default metadata merged into every feedback submission. */
    defaultMetadata?: Record<string, string>;
    /** Request timeout in ms. Defaults to 10000. */
    timeout?: number;
}
