# @bangkeut-technology/supportdock-sdk

Official SDK for [SupportDock](https://supportdock.io) — submit feedback and read FAQs from your React Native / Expo app, and (opt-in) report errors from Node and NestJS backends.

SupportDock is a product of [bill&go](https://billandgo.app).

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
import { Button, Platform, Text, View } from 'react-native';

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
    apiKey: string;          // Required — your app's API key (starts with sdk_). Throws if empty.
    baseUrl?: string;        // Default: 'https://supportdock.io'
    defaultMetadata?: Record<string, string>;  // Merged into every feedback submission; per-call metadata wins on conflicts
    timeout?: number;        // Request timeout in ms (default: 10000)
});
```

All option, result and entity types (`SupportDockConfig`, `FeedbackOptions`, `FeedbackAttachment`, `FeedbackResult`, `FeedbackType`, `FAQ`, `CreateFAQOptions`, `UpdateFAQOptions`) are exported from the root entry point.

### Feedback

```ts
const result = await sdk.sendFeedback({
    type: 'bug' | 'feature' | 'question' | 'general',  // default: 'general'
    message: string,         // required
    email?: string,
    name?: string,
    subject?: string,        // if omitted, the server uses the message's first line (up to 80 chars)
    metadata?: Record<string, string>,
    source?: string,         // default: 'mobile-app'
    images?: string[],       // up to 3 base64 data URLs (PNG/JPEG/WebP/GIF, each ≤ 2 MB)
    videos?: string[],       // up to 2 base64 data URLs (MP4/WebM/QuickTime, each ≤ 10 MB)
    attachments?: { name: string; data: string }[],  // up to 3 PDFs (each ≤ 5 MB)
});
// result: { success: boolean; error?: string }
```

The SDK checks the counts and the data-URL prefixes before sending, and throws a `SupportDockError` with status `400` if they fail. It does not check file sizes.

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

Reading FAQs works with the app's SDK key (`sdk_…`):

```ts
const faqs = await sdk.listFAQs(); // FAQ[]
```

```ts
type FAQ = {
    id: string;
    question: string;
    answer: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
};
```

The client also has write methods (`createFAQ`, `updateFAQ`, `deleteFAQ`). These call `/api/v1/faqs/remote` and need the app's **secret key** (`sk_…`, shown once on the app dashboard). With an `sdk_` key the server answers `403`. Use the secret key only from your server or a script. Never put it in an app bundle, where anyone can extract it.

```ts
// Server-side or script only — never in a client app
const admin = new SupportDockClient({ apiKey: 'sk_your_secret_key' });

const faq = await admin.createFAQ({ question: '...', answer: '...', sortOrder: 0 }); // FAQ
await admin.updateFAQ(faq.id, { answer: 'Updated answer' });                         // FAQ
await admin.deleteFAQ(faq.id);                                                       // { success: boolean }
```

`updateFAQ` accepts any of `question`, `answer` and `sortOrder`.

### Changelog

The SDK does not wrap the changelog feed. It is available over HTTP at `GET /api/v1/changelog/remote` with the `x-api-key` header (supports `?since=<version>`).

### Error Handling

```ts
import { SupportDockError } from '@bangkeut-technology/supportdock-sdk';

try {
    await sdk.sendFeedback({ message: '...' });
} catch (err) {
    if (err instanceof SupportDockError) {
        console.log(err.message); // Error message from the API, or a local validation message
        console.log(err.status);  // HTTP status code (400, 401, 403, 429, etc.)
    } else {
        // Network failure, or the request timed out (err.name === 'AbortError')
    }
}
```

`SupportDockError` covers HTTP errors and local validation (status `400`). A `429` means either the monthly feedback limit is reached (see [Get Your API Key](#get-your-api-key)) or the key sent more than 5 submissions in 15 minutes.

### `useSupportDock`

A hook that wraps a `SupportDockClient` with loading and error state. It never throws: failures come back in `error`, and `sendFeedback` resolves to `{ success: false, error }`.

```ts
const {
    sendFeedback, // (options: FeedbackOptions) => Promise<FeedbackResult>
    loading,      // boolean, true while a request is in flight
    error,        // string | null — message of the last failure
    success,      // boolean — true after a successful send
    reset,        // () => void — clears error and success
    client,       // the underlying SupportDockClient, for listFAQs() and the rest
} = useSupportDock(config); // config: same as SupportDockClient
```

The client is created on the first render, so later changes to the config are ignored.

## Monitoring (opt-in)

Errors, crashes and request performance, shown next to your feedback in SupportDock (app → **Monitoring**). Every feature is off until you turn it on, and the feedback API above is unchanged. It authenticates with the same `sdk_` key.

Traces never include query strings, request or response bodies, or SQL values (`WHERE email = 'jane@…'` is sent as `WHERE email = ?`). Error messages and stack traces are sent as they are (messages are capped at 2,000 characters, stacks at 16,000), so keep personal data out of error messages. Events are batched (every 10 s or 100 events), gzipped on Node, and dropped rather than retried if SupportDock is unreachable. Monitoring never throws into your code.

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
    serviceName: 'api', // optional; default: npm_package_name, then "nestjs-app"
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
app.useGlobalFilters(new SupportDockExceptionFilter(httpAdapter)); // reports errors, then Nest responds as usual
await app.listen(3000);
```

`initNestMonitoring` takes the same options as `SupportDock.init` (table below) plus `serviceName`. Errors and crashes work without `traces`; OpenTelemetry starts only when `monitoring.traces` is on.

`SupportDockExceptionFilter` reports every non-HTTP exception (a bug) and every `HttpException` with a 5xx status, then hands the response to Nest's default handling, so responses do not change. Without it, Nest catches handler exceptions before the process-level crash handler sees them.

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

| Method | |
|---|---|
| `SupportDock.init(options, runtime?)` | Start monitoring. Call once, as early as possible; later calls are ignored. If `projectKey` does not start with `sdk_`, it logs a warning and stays disabled. `runtime` labels events (default `'node'`). |
| `SupportDock.captureException(error, context?)` | Report an error you caught. Does nothing unless `monitoring.errors` is on. `context` is `{ route?, screen?, device?, os? }`, all optional strings. |
| `SupportDock.flush(timeoutMs?)` | Returns a promise. Sends what is queued now, e.g. before a graceful shutdown. |
| `SupportDock.config()` | Returns the active settings (`{ options, release, ingestUrl }`) or `null` if not started. Used by the framework presets. |

`fingerprint(name, message, stack)` (also exported from `/monitoring`) returns the group id SupportDock uses for an error. It is built from the error type and the top five frames' function and file names, never line numbers, so one bug stays one group across deploys.

| Option | Default | |
|---|---|---|
| `projectKey` | — | Your app's `sdk_…` key. Required. |
| `monitoring.errors` | `false` | `captureException` and the Nest filter report errors |
| `monitoring.crashes` | `false` | Uncaught exceptions and unhandled rejections are reported (and printed to stderr), then the process exits with code 1, as Node would |
| `monitoring.traces` | `false` | Request and query timing (NestJS preset) |
| `monitoring.sampleRate` | `1` | Share of traces kept, 0–1 (NestJS preset; errors are never sampled) |
| `release` | auto | `SUPPORTDOCK_RELEASE`, then `GIT_SHA` / `GIT_COMMIT` / `SOURCE_VERSION` / `VERCEL_GIT_COMMIT_SHA` / `RAILWAY_GIT_COMMIT_SHA` / `GITHUB_SHA`, then `npm_package_version`, else `unknown`. Explicit values are cut to 128 characters; SHA values to 12. |
| `ingestUrl` | `https://supportdock.io/ingest` | |
| `debug` | `false` | Log delivery failures to the console |

**Releases** are what let SupportDock say "this error started in `a1b2c3d`". Set one per deploy. To mark the deploy in SupportDock, `POST /api/v1/monitor/deploys` with the secret key (`sk_…`) and a body of `{ "release": "a1b2c3d" }` (`deployedAt` is optional). Use the same value as the SDK's `release`, and note the SDK cuts SHA values to 12 characters. The SDK does not call this endpoint.

## Get Your API Key

1. Go to your app dashboard on [supportdock.io](https://supportdock.io)
2. Click **Generate API key**
3. Copy the key (starts with `sdk_`) for your app, and the secret key (starts with `sk_`) if you manage FAQs from a server. The secret key is shown once, so store it when it appears.

The feedback API and API keys are available on the **Free** plan, which includes 100 inbound feedback messages per month across your account. Past that limit the API answers `429`. **Pro** is unlimited. On every plan, each key may send at most 5 submissions per 15 minutes; more answer `429` with a `Retry-After` header.

## License

MIT © SupportDock by [bill&go](https://billandgo.app)
