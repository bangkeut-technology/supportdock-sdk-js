import { useCallback, useRef, useState } from 'react';
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
export function useSupportDock(config: SupportDockConfig) {
    const clientRef = useRef<SupportDockClient | null>(null);
    if (!clientRef.current) {
        clientRef.current = new SupportDockClient(config);
    }

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const sendFeedback = useCallback(
        async (options: FeedbackOptions): Promise<FeedbackResult> => {
            setLoading(true);
            setError(null);
            setSuccess(false);

            try {
                const result = await clientRef.current!.sendFeedback(options);
                setSuccess(true);
                return result;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to send feedback';
                setError(message);
                return { success: false, error: message };
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    const reset = useCallback(() => {
        setError(null);
        setSuccess(false);
    }, []);

    return { sendFeedback, loading, error, success, reset, client: clientRef.current };
}
