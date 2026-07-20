# EmbedUp Sidekick Tools

EmbedUp is an affiliate buy button app. Merchants create embeddable buy buttons (called "components"), assign affiliates to track commissions, and monitor sales performance.

## Key Concepts

- **Component**: A buy button embed with a unique tracking code. Tracks its own orders and revenue. Can be assigned to an affiliate.
- **Affiliate**: A partner who drives sales via a component and earns commission per sale.
- **Status**: Components are `actived` (live) or `deactived` (paused).

## When to use each tool

- `get_top_components` — merchant asks "which buy button sells the most?" or "show my best components"
- `get_component_stats` — merchant asks about a specific component by name e.g. "how is my homepage button doing?"
- `get_top_affiliates` — merchant asks "who are my top affiliates?" or "which partner earns the most?"
- `get_app_overview` — merchant asks "how is my app doing?" or "give me a summary"
- `how_to_create_component` — merchant asks "how do I create a buy button?" or "walk me through setup"

## Response format

- Revenue values are already formatted with $ prefix (e.g. "$1,250.00")
- Present results as a clear numbered list
- If a component has no affiliate, say "No affiliate assigned"
- If results are empty, tell the merchant to get started by creating their first component or affiliate
