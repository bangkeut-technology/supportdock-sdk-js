# @bangkeut-technology/supportdock-sdk

Official SDK for [SupportDock](https://supportdock.io) — submit feedback and manage FAQs from your React Native / Expo app.

## Install

```bash
npm install @bangkeut-technology/supportdock-sdk
```

## Quick Start

```ts
import { SupportDockClient } from '@bangkeut-technology/supportdock-sdk';

const sdk = new SupportDockClient({
    apiKey: 'sdk_your_api_key',
});

// Submit feedback
await sdk.sendFeedback({
    type: 'bug',
    message: 'App crashes when opening settings',
    email: 'user@example.com',
    metadata: { appVersion: '2.1.0', platform: 'ios' },
});

// List FAQs
const faqs = await sdk.listFAQs();
```

## React Hook (Expo / React Native)

```tsx
import { useSupportDock } from '@bangkeut-technology/supportdock-sdk';
import { Platform } from 'react-native';

function FeedbackScreen() {
    const { sendFeedback, loading, error, success } = useSupportDock({
        apiKey: 'sdk_your_api_key',
        defaultMetadata: {
            appVersion: '2.1.0',
            platform: Platform.OS,
        },
    });

    const handleSubmit = async () => {
        await sendFeedback({
            type: 'bug',
            message: 'Something went wrong',
            email: userEmail,
        });
    };

    if (success) return <Text>Thanks for your feedback!</Text>;

    return (
        <View>
            <Button onPress={handleSubmit} disabled={loading} title="Send Feedback" />
            {error && <Text style={{ color: 'red' }}>{error}</Text>}
        </View>
    );
}
```

## API

### `SupportDockClient`

```ts
const sdk = new SupportDockClient({
    apiKey: string;          // Required — your app's API key (starts with sdk_)
    baseUrl?: string;        // Default: 'https://supportdock.io'
    defaultMetadata?: Record<string, string>;  // Merged into every feedback submission
    timeout?: number;        // Request timeout in ms (default: 10000)
});
```

### Feedback

```ts
// Submit feedback
await sdk.sendFeedback({
    type: 'bug' | 'feature' | 'question' | 'general',  // default: 'general'
    message: string,         // required
    email?: string,
    name?: string,
    subject?: string,        // auto-generated from type if omitted
    metadata?: Record<string, string>,
    source?: string,         // default: 'mobile-app'
});
```

### FAQs

```ts
// List all FAQs
const faqs = await sdk.listFAQs();

// Create FAQ
const faq = await sdk.createFAQ({ question: '...', answer: '...', sortOrder: 0 });

// Update FAQ
await sdk.updateFAQ(faqId, { answer: 'Updated answer' });

// Delete FAQ
await sdk.deleteFAQ(faqId);
```

### Error Handling

```ts
import { SupportDockError } from '@bangkeut-technology/supportdock-sdk';

try {
    await sdk.sendFeedback({ message: '...' });
} catch (err) {
    if (err instanceof SupportDockError) {
        console.log(err.message); // Error message from API
        console.log(err.status);  // HTTP status code (401, 429, etc.)
    }
}
```

## Get Your API Key

1. Go to your app dashboard on [supportdock.io](https://supportdock.io)
2. Click **Generate API key**
3. Copy the key (starts with `sdk_`)

Requires a Pro plan.

## License

MIT
