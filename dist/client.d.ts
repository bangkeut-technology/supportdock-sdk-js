import type { SupportDockConfig, FeedbackOptions, FeedbackResult, FAQ, CreateFAQOptions, UpdateFAQOptions } from './types';
export declare class SupportDockClient {
    private apiKey;
    private baseUrl;
    private defaultMetadata;
    private timeout;
    constructor(config: SupportDockConfig);
    private request;
    /**
     * Submit feedback from your app.
     *
     * ```ts
     * await sdk.sendFeedback({ type: 'bug', message: 'App crashes on launch' });
     * ```
     */
    sendFeedback(options: FeedbackOptions): Promise<FeedbackResult>;
    /** List all FAQ entries for this app. */
    listFAQs(): Promise<FAQ[]>;
    /**
     * FAQ writes take the app's secret key (sk_…). The SDK key ships inside
     * apps, so the server refuses it with a 403; fail the same way before the
     * request, with a message that says which key to use.
     */
    private requireSecretKey;
    /** Create a new FAQ entry. Needs the secret key (sk_…). */
    createFAQ(options: CreateFAQOptions): Promise<FAQ>;
    /** Update an existing FAQ entry. Needs the secret key (sk_…). */
    updateFAQ(faqId: string, options: UpdateFAQOptions): Promise<FAQ>;
    /** Delete a FAQ entry. Needs the secret key (sk_…). */
    deleteFAQ(faqId: string): Promise<{
        success: boolean;
    }>;
}
export declare class SupportDockError extends Error {
    status: number;
    constructor(message: string, status: number);
}
