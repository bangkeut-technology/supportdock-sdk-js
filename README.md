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
    images?: string[],       // up to 3 base64 data URLs (PNG/JPEG/WebP/GIF, each ≤ 2 MB)
    videos?: string[],       // up to 2 base64 data URLs (MP4/WebM/QuickTime, each ≤ 10 MB)
    attachments?: { name: string; data: string }[],  // up to 3 PDFs (each ≤ 5 MB)
});
```

#### Attaching images

```ts
// Convert a local image to base64 (React Native example)
import * as FileSystem from 'expo-file-system';

const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
});

await sdk.sendFeedback({
    type: 'bug',
    message: 'UI is broken on this screen',
    images: [`data:image/png;base64,${base64}`],
});
```

#### Attaching videos

```ts
// Convert a local video to base64 (React Native example)
import * as FileSystem from 'expo-file-system';

const base64 = await FileSystem.readAsStringAsync(videoUri, {
    encoding: FileSystem.EncodingType.Base64,
});

await sdk.sendFeedback({
    type: 'bug',
    message: 'Screen recording of the crash attached',
    videos: [`data:video/mp4;base64,${base64}`],
});
```

#### Attaching PDFs

```ts
// Convert a local PDF to base64 (React Native example)
import * as FileSystem from 'expo-file-system';

const base64 = await FileSystem.readAsStringAsync(pdfUri, {
    encoding: FileSystem.EncodingType.Base64,
});

await sdk.sendFeedback({
    type: 'bug',
    message: 'Steps to reproduce are in the attached report',
    attachments: [{ name: 'report.pdf', data: `data:application/pdf;base64,${base64}` }],
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
        console.log(err.status); // HTTP status code (401, 429, etc.)
    }
}
```

## Monitoring (opt-in)

Errors, crashes and request performance, shown next to your feedback in SupportDock (app → **Monitoring**). Every feature is off until you turn it on, and the feedback API above is unchanged. It authenticates with the same API key.

What never leaves your process: query strings, request and response bodies, and SQL values (`WHERE email = 'jane@…'` is sent as `WHERE email = ?`). Events are batched (every 10 s or 100 events), gzipped, and dropped rather than retried if SupportDock is unreachable. Monitoring never throws into your code.

### NestJS

Requires the Express adapter (the default). Install the SDK plus the OpenTelemetry packages it drives:

```bash
npm i @bangkeut-technology/supportdock-sdk @opentelemetry/sdk-node @opentelemetry/api @opentelemetry/core \
  @opentelemetry/resources @opentelemetry/sdk-trace-base @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/instrumentation-http @opentelemetry/instrumentation-express \
  @opentelemetry/instrumentation-nestjs-core @opentelemetry/instrumentation-pg @opentelemetry/instrumentation-ioredis
```

OpenTelemetry must load before anything it instruments, so start it from its own file and import that file first:

```ts
// src/instrument.ts
import { initNestMonitoring } from '@bangkeut-technology/supportdock-sdk/nestjs';

initNestMonitoring({
    projectKey: process.env.SUPPORTDOCK_KEY!, // your app's API key (sdk_…)
    release: process.env.GIT_SHA, // optional; see "Releases" below
    monitoring: { traces: true, errors: true, crashes: true, sampleRate: 0.2 },
});
```

```ts
// src/main.ts
import './instrument'; // first line
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { SupportDockExceptionFilter } from '@bangkeut-technology/supportdock-sdk/nestjs';
import { AppModule } from './app.module';

const app = await NestFactory.create(AppModule);
const { httpAdapter } = app.get(HttpAdapterHost);
app.useGlobalFilters(new SupportDockExceptionFilter(httpAdapter)); // reports 5xx, then Nest responds as usual
await app.listen(3000);
```

You get per-route latency (named by route template, e.g. `GET /users/:id`), error rates, slow Postgres (`pg`) and Redis (`ioredis`) queries, and grouped errors with stack traces.

### Any Node app

```ts
import { SupportDock } from '@bangkeut-technology/supportdock-sdk/monitoring';

SupportDock.init({ projectKey: process.env.SUPPORTDOCK_KEY!, monitoring: { errors: true, crashes: true } });

try {
    await chargeCard(order);
} catch (err) {
    SupportDock.captureException(err, { route: 'POST /orders' });
    throw err;
}
```

| Option | Default | |
|---|---|---|
| `monitoring.errors` | `false` | `captureException` and the Nest filter report errors |
| `monitoring.crashes` | `false` | Uncaught exceptions and unhandled rejections are reported, then the process exits with code 1, as Node would |
| `monitoring.traces` | `false` | Request and query timing (NestJS preset) |
| `monitoring.sampleRate` | `1` | Share of traces kept (errors are never sampled) |
| `release` | auto | `SUPPORTDOCK_RELEASE`, then `GIT_SHA` / `SOURCE_VERSION` / `VERCEL_GIT_COMMIT_SHA` / `RAILWAY_GIT_COMMIT_SHA` / `GITHUB_SHA`, then `npm_package_version` |
| `ingestUrl` | `https://supportdock.io/ingest` | |
| `debug` | `false` | Log delivery failures to the console |

**Releases** are what let SupportDock say "this error started in `a1b2c3d`". Set one per deploy.

## Get Your API Key

1. Go to your app dashboard on [supportdock.io](https://supportdock.io)
2. Click **Generate API key**
3. Copy the key (starts with `sdk_`)

Requires a Pro plan.

## License

MIT
