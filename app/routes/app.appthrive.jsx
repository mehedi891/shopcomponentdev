import { useActionData, useFetcher } from "react-router";
import { createHmac } from "node:crypto";
import { authenticate } from "../shopify.server";
import db from "../db.server";

const WEBHOOK_URL = 'https://app.appthrive.io/api/workflows/webhook/wh_3O7V4bnc8rd7bhgeIM4nNYVH';
const HMAC_SECRET = 'Kb5S9SSexLrga9qkxL0ChEXF4q8pcsPwJj-Kwy01Lns';

const ERROR_MESSAGES = {
  400: 'Body is not JSON; or no merchant identifier was supplied.',
  401: 'X-AppThrive-Signature missing, or HMAC did not verify.',
  404: 'webhookId unknown or revoked, or the merchant identifier did not resolve in your org.',
  409: 'Workflow exists but is not Published.',
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const webhookUrl = formData.get('webhook') || WEBHOOK_URL;

  const shop = await db.shop.findUnique({
    where: { shopifyDomain: session.shop },
    select: {
      id: true,
      shopifyShopGid: true,
    },
  });

  const body = JSON.stringify({
    //merchant_id: shop.shopifyShopGid,
    shop_domain: session.shop,
  });

  const signature = createHmac('sha256', HMAC_SECRET)
    .update(body)
    .digest('hex');

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-appthrive-signature': signature,
       // 'x-appthrive-merchant-id': shop.shopifyShopGid,
        'x-appthrive-shop-domain': session.shop,
      },
      body,
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }

    if (!response.ok) {
      const message = ERROR_MESSAGES[response.status] ?? `HTTP error! status: ${response.status}`;
      return { success: false, status: response.status, message, data };
    }

    return { success: true, status: response.status, message: 'Workflow triggered successfully', data };
  } catch (error) {
    console.error('Error triggering webhook:', error);
    return { success: false, message: error.message };
  }
};

const AppThrive = () => {
  const fetcher = useFetcher();
  const actionData = useActionData();

  const handleFormSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    fetcher.submit(formData, { method: 'post' });
  };

  const result = fetcher.data ?? actionData;

  return (
    <s-page inlineSize="small">
      <s-query-container>
        <form method="post" onSubmit={handleFormSubmit}>
          <s-stack gap="base" padding="base" background="base" borderRadius="base">
            <s-text-field
              name="webhook"
              label="Webhook URL"
              placeholder="Enter your webhook URL here"
              value={WEBHOOK_URL}
              onChange={() => {}}
            />
            <s-button type="submit" variant="primary" loading={fetcher.state !== 'idle'}>
              Submit
            </s-button>
            {result && (
              <s-banner tone={result.success ? 'success' : 'critical'}>
                {result.message}
              </s-banner>
            )}
          </s-stack>
        </form>
      </s-query-container>
    </s-page>
  );
};

export default AppThrive;
