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
    /** Create a new FAQ entry. */
    createFAQ(options: CreateFAQOptions): Promise<FAQ>;
    /** Update an existing FAQ entry. */
    updateFAQ(faqId: string, options: UpdateFAQOptions): Promise<FAQ>;
    /** Delete a FAQ entry. */
    deleteFAQ(faqId: string): Promise<{
        success: boolean;
    }>;
}
export declare class SupportDockError extends Error {
    status: number;
    constructor(message: string, status: number);
}
