# embedUp — App Summary for Chatbot

## Short Description
embedUp is a Shopify embedded app that provides embeddable front-end components, store analytics, chat support, affiliate management, and subscription/plan handling for merchants. It integrates with Shopify via webhooks and the Shopify App framework, persists data using Prisma (Postgres), and serves dynamic web components and admin routes for store owners.

## Primary Purpose
- Let merchants create and manage embeddable web components for their storefronts.
- Provide analytics and tracking for component usage and affiliate performance.
- Provide in-app chat and customer support workflows.
- Handle subscription plans, purchases, trial periods, and upgrades.

## Key Features (high level)
- Analytics: collect and store usage and performance data for components and affiliates.
- Chat: in-app chat endpoint and UI to let merchants and support teams exchange messages.
- Components Marketplace: create, list, edit, and serve embeddable components (web components + scripts).
- Affiliate System: track affiliates, their transactions, and commissions.
- Subscription & Plans: plan purchasing, plan cancellation, upgrade banners, trial handling.
- Webhooks: react to Shopify events (app scopes_update, app uninstalled, orders.create, orders.update).
- Webcomponents HTML endpoints: server-side generation of component HTML/CSS/JS for embedding.
- In-app UI: Polaris-styled React routes for merchant-facing admin interfaces.

## Notable User Flows
- Merchant installs app via Shopify -> app bootstraps with Shopify auth -> merchant configures components -> embed scripts generated and placed on storefront.
- Component usage generates analytics events -> events are stored and visible via admin analytics pages.
- Merchant or customer interacts via chat -> messages routed via `api.chat.jsx` and related chat endpoints.
- Affiliate makes a referral -> transaction recorded and commission calculated via util functions.
- Merchant changes subscription -> backend routes handle plan purchase, cancellation, and trial logic.

## Architecture & Important Files (high level)
- `app/` — main server and routes for the embedded app (React + server entry).
  - `entry.server.jsx`, `root.jsx` — server entry and root UI.
  - `routes/` — route structure for pages and API endpoints.
    - `api.chat.jsx` — chat API route.
    - `api.analytics.jsx` — analytics ingestion.
    - `api.getcomponent.jsx`, `api.webcompjs.jsx`, `api.spceflmainjs.jsx` — component-serving endpoints.
    - `webhooks.*` — Shopify webhook handlers.
  - `components/` — React components used in admin UI (loading, banners, tooltips, etc.).
  - `utilis/` — utility functions: commission calculations, order/refund helpers, Redis initializer, etc.
- `webcomponentsHtml/` — templates and generator scripts for component HTML and styles.
- `public/` — static assets and images.
- `prisma/` — Prisma schema and migrations for Postgres DB.
- `shopify.*.toml` — Shopify-specific configuration files.

## API Endpoints of Interest (examples)
- `POST /routes/api.analytics.jsx` — ingest analytics events.
- `POST /routes/api.chat.jsx` — chat messages and chat actions.
- `GET /routes/api.getcomponent.jsx` — fetch component metadata or HTML.
- `GET /routes/api.webcompjs.jsx` — serve component JavaScript for embedding.
- Webhooks: handled under `routes/webhooks.*.jsx` for Shopify events like `orders.create`.

## Dev & Setup (quick)
- Node + npm is used. Typical commands:

```bash
npm install
npm run dev
# If using Prisma locally:
npx prisma migrate dev
```

- Database: PostgreSQL via Prisma. Migrations are in `prisma/migrations/`.
- Environment variables (typical): Shopify app keys and secrets, database URL, Redis connection, any third-party API keys.

## Data & Persistence
- Prisma models (in `prisma/schema.prisma`) store merchants, components, analytics events, affiliates, transactions, subscriptions, etc.
- Redis is used for transient data or caching via `utilis/redis.init.js`.

## Utilities & Calculations
- Commission and payout calculations live in `utilis/calcCommission.js` and `utilis/calculateCommission.js`.
- Order/refund calculation helpers in `utilis/calculateTotalRefund.js` and `utilis/buildOrderQuery.js`.

## How the Chatbot Should Use This File
- Use this document as a concise reference to answer questions about the app's purpose, major features, and where code lives.
- For routing or API questions, point to the `routes/` files under `app/`.
- For database schema questions, consult `prisma/schema.prisma`.
- For embedding behavior and scripts, consult `webcomponentsHtml/` and the `api.webcompjs.jsx` endpoint.

## Quick Reference (one-liners)
- App root: `app/` — server + React UI.
- Components templates: `webcomponentsHtml/`.
- API & webhooks: `app/routes/`.
- DB schema & migrations: `prisma/`.

---

If you want, I can:
- Expand any section with examples (API request/response samples).
- Generate a shorter “chatbot-friendly” JSON spec summarizing routes and entities.
- Add environment variable and deployment instructions.
