"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSupportDock = useSupportDock;
const react_1 = require("react");
const client_1 = require("./client");
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
function useSupportDock(config) {
    const clientRef = (0, react_1.useRef)(null);
    if (!clientRef.current) {
        clientRef.current = new client_1.SupportDockClient(config);
    }
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [success, setSuccess] = (0, react_1.useState)(false);
    const sendFeedback = (0, react_1.useCallback)(async (options) => {
        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            const result = await clientRef.current.sendFeedback(options);
            setSuccess(true);
            return result;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to send feedback';
            setError(message);
            return { success: false, error: message };
        }
        finally {
            setLoading(false);
        }
    }, []);
    const reset = (0, react_1.useCallback)(() => {
        setError(null);
        setSuccess(false);
    }, []);
    return { sendFeedback, loading, error, success, reset, client: clientRef.current };
}
