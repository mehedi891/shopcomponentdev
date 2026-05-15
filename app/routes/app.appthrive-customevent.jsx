import { createHmac } from "node:crypto";
import { useFetcher } from "react-router";

const INGEST_URL = `https://app.appthrive.io/api/ingest/org_XbPoGTQPldjc/app_ayLlm5B_RZN5`;
const APPTHRIVE_SECRET = 'whsk_ba4be564cee8aa84961b618909f4df4710224db152f495e2';

const ERROR_MESSAGES = {
  400: 'Validation error or malformed payload.',
  401: 'Signature verification failed.',
  403: 'App is disconnected.',
  429: 'Rate limited.',
  503: 'Service overloaded — retry later.',
};

export const action = async () => {
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const bodyPayload = {
    eventType: 'shop_free_plan_choose',
    shopId: 'fastdev891.myshopify.com',
    occurredAt: new Date().toISOString(),
    payload: { test: "data" },
    idempotencyKey: `test-${timestamp}`,
  };

  const body = JSON.stringify(bodyPayload);

  // Sign "timestamp.body" with the webhook secret
  const signature = createHmac('sha256', APPTHRIVE_SECRET)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  try {
    const response = await fetch(INGEST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AppThrive-Signature': signature,
        'X-AppThrive-Timestamp': timestamp,
      },
      body,
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
      console.log("data:", data);
    } catch {
      data = responseText;
      console.log("data C:", data);
    }

    if (!response.ok) {
      const message = ERROR_MESSAGES[response.status] ?? `HTTP error! status: ${response.status}`;
      return { success: false, status: response.status, message, data };
    }

    return { success: true, status: response.status, message: 'Event ingested successfully', data };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, message: error.message };
  }
};

const CustomEventFires = () => {
  const fetcher = useFetcher();

  const handleFormSubmit = (event) => {
    event.preventDefault();
    fetcher.submit(new FormData(event.target), { method: 'post' });
  };

  const result = fetcher.data ?? null;

  return (
    <s-page inlineSize="small">
      <s-query-container>
        <form method="post" onSubmit={handleFormSubmit}>
          <s-stack gap="base" padding="base" background="base" borderRadius="base">
            <s-text variant="headingMd">Ingest Custom Event</s-text>
            <s-text>
              Pushes a custom event into AppThrive. Drives the event-matched workflow trigger and populates the event timeline.
            </s-text>
            <s-button type="submit" variant="primary" loading={fetcher.state !== 'idle'}>
              Send Event
            </s-button>
            {result && (
              <s-banner tone={result.success ? 'success' : 'critical'}>
                {result.message}
                {result.data?.eventId && (
                  <s-text>Event ID: {result.data.eventId}</s-text>
                )}
              </s-banner>
            )}
          </s-stack>
        </form>
      </s-query-container>
    </s-page>
  );
};

export default CustomEventFires;
