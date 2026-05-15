# Shopify Custom App Events — Complete Guide

## Table of Contents

1. [What is it?](#1-what-is-it)
2. [Why should you use it?](#2-why-should-you-use-it)
3. [Types of events](#3-types-of-events)
4. [How it works](#4-how-it-works)
5. [Prerequisites](#5-prerequisites)
6. [Step-by-step setup guide](#6-step-by-step-setup-guide)
7. [How to configure](#7-how-to-configure)
8. [How to use it](#8-how-to-use-it)
9. [Viewing events in the Dev Dashboard](#9-viewing-events-in-the-dev-dashboard)
10. [Pros and limitations](#10-pros-and-limitations)
11. [Quick reference](#11-quick-reference)

---

## 1. What is it?

**Shopify App Events** is a write-only HTTP API that lets your Shopify app push structured event data to Shopify. Every event is tied to a specific merchant (shop), giving you per-merchant visibility into what is happening in your app.

Events flow into the **Dev Dashboard** (`dev.shopify.com`) where you can filter, search, and monitor them alongside your webhook and function logs.

There are two distinct event types:
- **Custom events** — track any meaningful app activity (onboarding, feature usage, errors)
- **Billing events** — feed directly into Shopify App Pricing to generate usage-based charges on merchant invoices

> The App Events API is **write-only**. There is no read endpoint and no way to query sent events back via the Partner API. If you need programmatic access to your event history, you must persist events in your own database.

---

## 2. Why should you use it?

| Reason | Detail |
|---|---|
| **Centralized observability** | All app events appear in one place alongside webhook logs and function logs in the Dev Dashboard |
| **Per-merchant visibility** | Every event is scoped to a `shop_id`, so you can filter by merchant and trace exactly what happened |
| **Debug production issues** | Filter by shop + event handle to investigate errors without querying your database |
| **Track feature adoption** | See which merchants use which features and when |
| **Power usage-based billing** | Billing events automatically calculate and apply charges to merchant invoices |
| **Zero infrastructure** | No queue, no worker, no log aggregator — Shopify stores events for 30 days |
| **Deployment monitoring** | After a deploy, filter the last 24 hours to watch for error spikes |

---

## 3. Types of events

### Custom events

Free-form events for anything meaningful in your app. No pre-configuration needed.

**Business events**
- Merchant completed onboarding
- Merchant created, updated, or deleted a resource (component, affiliate, campaign)
- Merchant activated or deactivated a feature
- Plan upgraded or downgraded

**Operational events**
- Data sync failed
- Third-party API timed out
- Background job completed or failed
- Rate limit hit

**Examples from EmbedUp**

| Event handle | When to fire |
|---|---|
| `component_created` | Merchant creates a buy button component |
| `component_status_changed` | Component activated or deactivated |
| `affiliate_created` | Merchant adds an affiliate |
| `order_processed` | An order is attributed to a buy button |
| `plan_upgraded` | Merchant upgrades from Free to Growth |
| `app_uninstalled` | App is uninstalled |

### Billing events

Tied to a **usage meter** configured in the Partner Dashboard. Shopify reads these events and applies charges to the merchant's invoice.

**Requirements for billing events:**
- Usage-based pricing must be configured in the Partner Dashboard first
- The `event_handle` must exactly match the meter handle
- The `attributes` object must include `"value": <number greater than 0>`
- Idempotency is enforced **permanently** (not just 24 hours like custom events)

---

## 4. How it works

```
Your app               Shopify App Events API          Dev Dashboard
   │                           │                             │
   │──── POST /events ────────>│                             │
   │     (bearer token)        │──── stores event ──────────>│
   │<─── 202 Accepted ─────────│     (30 days retention)     │
   │                           │                             │
   │                           │          You filter/search ─┤
```

1. Your app fetches a short-lived JWT bearer token using your `client_id` and `client_secret`
2. Your app sends one event per POST request to `https://api.shopify.com/app/unstable/events`
3. Shopify returns `202 Accepted` — always, even if a billing event fails validation
4. Events appear in the Dev Dashboard under **Logs** within seconds
5. For billing events, Shopify aggregates the `value` field and applies charges on the next billing cycle

> **Important:** The API always returns `202` regardless of billing validation outcome. Billing errors only surface in the Dev Dashboard under **Logs > App Billing Event**.

---

## 5. Prerequisites

- A Shopify app (public or custom) with an installed development store
- Access to [dev.shopify.com](https://dev.shopify.com)
- A `client_id` and `client_secret` from the Dev Dashboard (not the Partner Dashboard — these are different credentials)
- Node.js 20+ (has `node:crypto` built in — no extra packages needed)

---

## 6. Step-by-step setup guide

### Step 1 — Create an API key in the Dev Dashboard

1. Go to [dev.shopify.com](https://dev.shopify.com)
2. Select your app
3. Navigate to **Settings > API Keys**
4. Click **Create API key**
5. Copy the `client_id` and `client_secret`

> These credentials are different from your Partner Dashboard app API key. Do not mix them up.

---

### Step 2 — Add credentials to your environment

In your `.env` file:

```env
SHOPIFY_APP_EVENTS_CLIENT_ID=your_client_id_here
SHOPIFY_APP_EVENTS_CLIENT_SECRET=your_client_secret_here
```

---

### Step 3 — Create the shared helper

Create `app/shopify-events.server.js`:

```js
import process from 'node:process';

const EVENTS_API = 'https://api.shopify.com/app/unstable/events';
const TOKEN_URL  = 'https://api.shopify.com/auth/access_token';

// In-memory token cache — tokens expire every 60 minutes
let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_APP_EVENTS_CLIENT_ID,
      client_secret: process.env.SHOPIFY_APP_EVENTS_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  const { access_token, expires_in } = await res.json();

  if (!access_token) {
    console.error('[AppEvent] Token fetch failed — check your client_id and client_secret');
    return null;
  }

  cachedToken = access_token;
  tokenExpiresAt = Date.now() + (expires_in - 60) * 1000; // refresh 1 min before expiry
  return cachedToken;
}

export async function sendShopifyEvent({ shopId, eventHandle, attributes = {} }) {
  try {
    const token = await getAccessToken();
    if (!token) return;

    // Strip GID prefix to keep idempotency key under 64 chars
    const shopNumericId = String(shopId).replace('gid://shopify/Shop/', '');
    const idempotencyKey = `${eventHandle}-${shopNumericId}-${Date.now()}`.slice(0, 64);

    const res = await fetch(EVENTS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        shop_id: shopId,
        event_handle: eventHandle,
        timestamp: new Date().toISOString(),
        idempotency_key: idempotencyKey,
        attributes,
      }),
    });

    console.log(`[AppEvent] ${eventHandle} → ${res.status}`);
  } catch (err) {
    // Always non-blocking — never let event tracking crash your app
    console.error(`[AppEvent] Failed to send ${eventHandle}:`, err.message);
  }
}
```

---

### Step 4 — Hook into your app flows

**Order processed** — `app/routes/webhooks.orders.create.jsx`

```js
import { sendShopifyEvent } from '../shopify-events.server';

// After your DB transaction completes:
const shop = await db.shop.findUnique({
  where: { id: shopId },
  select: { shopifyShopGid: true },
});

await sendShopifyEvent({
  shopId: shop.shopifyShopGid,
  eventHandle: 'order_processed',
  attributes: { component_id: componentId },
});
```

**Component created** — `app/routes/app.createcomponent.jsx`

```js
await sendShopifyEvent({
  shopId: shop.shopifyShopGid,
  eventHandle: 'component_created',
  attributes: { layout: formData.get('layout') },
});
```

**Component status changed** — `app/routes/app.component.$id.jsx`

```js
await sendShopifyEvent({
  shopId: "gid://shopify/Shop/YOUR_SHOP_ID",
  eventHandle: 'component_status_changed',
  attributes: { status: data.status },
});
```

**App uninstalled** — `app/routes/webhooks.app.uninstalled.jsx`

```js
await sendShopifyEvent({
  shopId: payload.admin_graphql_api_id,  // shop GID from webhook payload
  eventHandle: 'app_uninstalled',
  attributes: {},
});
```

---

### Step 5 — Verify in Dev Dashboard

1. Open [dev.shopify.com](https://dev.shopify.com) → your app
2. Navigate to **Logs**
3. Set filter to **App event**
4. Trigger an action in your app (e.g. change a component status)
5. The event should appear within a few seconds

---

## 7. How to configure

### Required fields for every event

| Field | Type | Max length | Description |
|---|---|---|---|
| `shop_id` | string | — | GID (`gid://shopify/Shop/123`) or numeric string (`"123"`) |
| `event_handle` | string | — | Snake_case name. Must match meter handle exactly for billing events |
| `timestamp` | string | — | ISO 8601 format. Use the time the event actually occurred |
| `idempotency_key` | string | **64 chars** | Unique per event. 24-hour window for custom, permanent for billing |
| `attributes` | object | — | Any key/value pairs. Billing events must include `"value": <number > 0>` |

### Idempotency key rules

- Maximum **64 characters** — sending a longer key causes a `400` error
- For custom events: duplicate keys within 24 hours return the original event (no double-write)
- For billing events: duplicate keys are rejected **permanently** — use a truly unique key per charge

### Authentication token

- Tokens expire after **60 minutes** — cache and refresh automatically (see helper above)
- Use `client_credentials` grant type
- Scope granted: `write_global_api_app_events`

### PII restrictions

Do not include any personally identifiable information in `attributes`:
- No names, email addresses, phone numbers
- No IP addresses or device identifiers
- Use anonymized IDs and aggregated metrics only

---

## 8. How to use it

### Naming conventions

Use `snake_case` consistently. Good examples:

```
component_created
component_status_changed
affiliate_created
order_processed
plan_upgraded
sync_failed
api_rate_limit_hit
```

### Structuring attributes

Keep attributes structured and searchable. Bad vs good:

```js
// Bad — unstructured, hard to filter
attributes: { data: "user did something with thing 123" }

// Good — structured, filterable in Dev Dashboard
attributes: {
  component_id: 42,
  layout: "grid",
  applies_to: "product",
}
```

### Non-blocking pattern

Always fire events in a non-blocking way. Never let event tracking crash your main app flow:

```js
// Good — non-blocking, errors are caught internally
await sendShopifyEvent({ shopId, eventHandle: 'order_processed', attributes: {} });

// Bad — if this throws, it breaks your webhook response
fetch(EVENTS_API, { ... }).then(...); // unhandled promise rejection risk
```

### Persisting events locally (recommended)

Since events are not queryable via any API, log them to your own DB if you need programmatic access:

```js
// In sendShopifyEvent, before the fetch:
await db.appEvent.create({
  data: {
    shopId,
    eventHandle,
    attributes: JSON.stringify(attributes),
    occurredAt: new Date(),
  },
});
```

This requires an `AppEvent` model in your Prisma schema:

```prisma
model AppEvent {
  id          Int      @id @default(autoincrement())
  shopId      String
  eventHandle String
  attributes  String?  @db.Text
  occurredAt  DateTime
  createdAt   DateTime @default(now())

  @@index([shopId, eventHandle])
  @@index([occurredAt])
}
```

---

## 9. Viewing events in the Dev Dashboard

1. Go to [dev.shopify.com](https://dev.shopify.com) → your app → **Logs**
2. Use the **Type** filter:
   - **App Event** — all custom and billing events
   - **App Billing Event** — only events processed by Shopify App Pricing
3. Use the **Shops** filter to drill into a specific merchant
4. Use **Event name** filter to find a specific `event_handle`
5. Set a time range (events are retained for **30 days**)

### Checking for billing errors

The API always returns `202` — even when a billing event fails validation. To check for failures:

1. Go to **Logs**
2. Filter by **App Billing Event**
3. Look for failed entries
4. Check the error detail — common causes: meter handle mismatch, missing `value` field, usage pricing not configured

---

## 10. Pros and limitations

### Pros

| Pro | Detail |
|---|---|
| Zero infrastructure | No queue, worker, or third-party logging service needed |
| Per-merchant visibility | Every event is scoped to a shop — easy to investigate specific merchants |
| Native Dev Dashboard integration | Events appear alongside webhooks and function logs in one unified view |
| No extra packages | Node.js 20+ has `node:crypto` built in |
| Idempotent by default | Duplicate events within 24 hours are silently deduplicated |
| Free | No cost to send custom events |
| Future billing-ready | Same pattern used for usage-based billing — easy to upgrade |

### Limitations

| Limitation | Detail |
|---|---|
| **Write-only** | No read API, no way to query events back programmatically |
| **Not in Partner API** | The Partner API `AppEventTypes` enum only includes billing/relationship events — custom events are excluded |
| **No batch support** | One event per HTTP request — high-volume scenarios need queuing |
| **30-day retention** | Events older than 30 days are deleted — persist locally if you need history |
| **500 req/sec rate limit** | Throttled with `429` if exceeded — implement exponential backoff |
| **64-char idempotency key** | Longer keys cause a `400` error — easy to hit with GID-based IDs |
| **Token management required** | JWT tokens expire every 60 minutes — must implement caching and refresh |
| **No PII allowed** | Cannot include names, emails, or any personally identifiable data in attributes |
| **`unstable` API version** | The endpoint uses `/app/unstable/events` — subject to breaking changes before it stabilises |
| **Billing errors are silent** | API always returns `202` — billing validation failures only visible in Dev Dashboard |
| **Dev Dashboard only** | No programmatic alerting — you must manually check the dashboard |

---

## 11. Quick reference

### Endpoint

```
POST https://api.shopify.com/app/unstable/events
```

### Token endpoint

```
POST https://api.shopify.com/auth/access_token
```

### Minimal event payload

```json
{
  "shop_id": "gid://shopify/Shop/62651891811",
  "event_handle": "component_created",
  "timestamp": "2026-05-15T10:00:00Z",
  "idempotency_key": "component_created-62651891811-1747303200000",
  "attributes": {
    "layout": "grid"
  }
}
```

### Response codes

| Code | Meaning |
|---|---|
| `202` | Event accepted (always returned — even on billing validation failure) |
| `400` | Malformed payload — check idempotency key length, missing fields, invalid value |
| `401` | Token missing, expired, or invalid |
| `429` | Rate limit hit — back off and retry |
| `5xx` | Shopify internal error — check [shopifystatus.com](https://www.shopifystatus.com) |

### Rate limits

- **500 requests/second** per app
- Implement exponential backoff on `429`
- Do not batch events — each must be a separate request

### Key constraints summary

- Idempotency key: **max 64 characters**
- Attributes: **no PII**
- Billing events: `attributes.value` must be a **number greater than 0**
- Token lifetime: **60 minutes** — cache it
- Event retention: **30 days**
- Batch requests: **not supported**
