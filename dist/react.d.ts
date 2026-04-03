import { SupportDockClient } from './client';
import type { SupportDockConfig, FeedbackOptions, FeedbackResult } from './types';
/**
 * React hook for submitting feedback from your Expo / React Native app.
 *
 * ```tsx
 * const { sendFeedback, loading, error, success } = useSupportDock({
 *   apiKey: 'sdk_your_key',
 *   defaultMetadata: { appVersion: '2.0.0', platform: Platform.OS },
 * });
 *
 * await sendFeedback({ type: 'bug', message: 'Something went wrong' });
 * ```
 */
export declare function useSupportDock(config: SupportDockConfig): {
    sendFeedback: (options: FeedbackOptions) => Promise<FeedbackResult>;
    loading: boolean;
    error: string | null;
    success: boolean;
    reset: () => void;
    client: SupportDockClient;
};
