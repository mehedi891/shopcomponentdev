import process from 'node:process';

const EVENTS_API = 'https://api.shopify.com/app/unstable/events';
const TOKEN_URL = 'https://api.shopify.com/auth/access_token';

// In-memory cache — fine for a single-server deploy
let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      grant_type: 'client_credentials',
    }),
  });


  const { access_token, expires_in } = await res.json();
  if (!access_token) console.error('[AppEvent] Token fetch failed:', { access_token, expires_in });

  cachedToken = access_token;
  tokenExpiresAt = Date.now() + (expires_in - 60) * 1000; // refresh 1 min early
  return cachedToken;
}

export async function sendShopifyEvent({ shopId, eventHandle, attributes = {} }) {
  const shopNumericId = String(shopId).replace('gid://shopify/Shop/', '');

  try {
    const token = await getAccessToken();
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
        idempotency_key: `${eventHandle}-${shopNumericId}-${Date.now()}`.slice(0, 64),
        attributes,
      }),
    });
    console.log(`[AppEvent] ${eventHandle} →`, res.status);
  } catch (err) {
    // Non-blocking — never let event tracking break your app flow
    console.error(`[AppEvent] Failed to send ${eventHandle}:`, err.message);
  }
}
