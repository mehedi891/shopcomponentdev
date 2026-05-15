import { createHmac } from "node:crypto";
import { useFetcher } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { useState } from "react";



const ERROR_MESSAGES = {
  400: 'Validation error or malformed payload.',
  401: 'HMAC verification failed.',
  403: 'App is disconnected.',
  410: 'Merchant in PII redaction window — write blocked.',
  429: 'Rate limited.',
  503: 'Service overloaded — retry after Retry-After seconds.',
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const bulk = formData.get('bulk');


  const INGEST_URL = `https://app.appthrive.io/api/ingest/org_XbPoGTQPldjc/app_ayLlm5B_RZN5/merchant/${bulk}`;
  const APPTHRIVE_SECRET = 'whsk_ba4be564cee8aa84961b618909f4df4710224db152f495e2';

  console.log("Bulk:", bulk, INGEST_URL);

  const shop = await db.shop.findUnique({
    where: { shopifyDomain: session.shop },
    select: {
      id: true,
      shopifyShopGid: true,
    },
  });

  // Fetch additional shop details from Shopify Admin API
  let shopDetails = {};
  try {
    const response = await admin.graphql(`
      query {
        shop {
          name
          email
          plan { displayName }
          createdAt
          primaryDomain { url }
          billingAddress {
            address1
            address2
            city
            province
            zip
            country
            countryCode
          }
          currencyCode
          timezoneAbbreviation
          ianaTimezone
          myshopifyDomain
        }
      }
    `);
    const { data } = await response.json();
    shopDetails = data.shop;
  } catch (e) {
    console.error('Failed to fetch shop details:', e);
  }

  const planName = shopDetails?.plan?.displayName?.toLowerCase() ?? 'unknown';
  const PLAN_TIERS = ['developer', 'basic', 'shopify', 'advanced', 'plus', 'trial'];
  const shopifyPlan = PLAN_TIERS.find((t) => planName.includes(t)) ?? 'unknown';

  const billing = shopDetails?.billingAddress ?? {};
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const payloadSin = {
    shopDomain: session.shop,
    shopOwnerName: " Mehedi Hasan dev Single",
     notes: [
      {
        content: 'Auto-enrolled in beta cohort 2026-05-12 from single merchant enrichment test',
        isPinned: true
      },
      {
        content: 'from single merchant enrichment test',
        isPinned: false
      }
    ],
  }

  const payload = [
    {
      shopId: "gid://shopify/Shop/62651891811", //this field is requred for merchant identification, but can be any unique identifier for the merchant
      shopDomain: session.shop, //this field is requred for merchant identification, but can be any unique identifier for the merchant
      //shopName: shopDetails?.name ?? null,
      //shopOwnerEmail: shopDetails?.email ?? null,
      shopOwnerName: " Mehedi Hasan dev bulk2",
      tags:["isVipC", "isReturningC"],
      // customAttributes: {
      //   mailSent: false,
      // }
      // shopOwnerPhone: null,
      // shopifyPlan,
      // shopifyCreatedAt: shopDetails?.createdAt ?? null,
      // shopifyTags: [],
      // address1: billing.address1 ?? null,
      // address2: billing.address2 ?? null,
      // city: billing.city ?? null,
      // province: billing.province ?? null,
      // zip: billing.zip ?? null,
      // country: billing.country ?? null,
      // countryCode: billing.countryCode ?? null,
      // currency: shopDetails?.currencyCode ?? null,
      // timezone: shopDetails?.ianaTimezone ?? null,
      // locale: null,
      // industry: null,
      // customAttributes: {},
      // idempotencyKey: `${session.shop}-${timestamp}`,
    },
    {
      //shopId: "58054246581", //this field is requred for merchant identification, but can be any unique identifier for the merchant
      shopDomain: "efoli-support8.myshopify.com", //this field is requred for merchant identification, but can be any unique identifier for the merchant
      //shopName: shopDetails?.name ?? null,
      //shopOwnerEmail: shopDetails?.email ?? null,
      shopOwnerName: " Mehedi Hasan mart3",
       notes: [
      {
        content: 'Auto-enrolled in beta cohort 2026-05-12 from bulk merchant enrichment test',
        isPinned: true
      },
      {
        content: 'from bulk merchant enrichment test',
        isPinned: false
      }
    ],
    }
  ];

  const body = bulk ? JSON.stringify({ merchants: payload }) : JSON.stringify(payloadSin);

  // HMAC: sign "timestamp.body" to cover both fields and prevent replay attacks
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
    } catch {
      data = responseText;
    }

    console.log('AppThrive enrichment response:', response.status, data);

    if (!response.ok) {
      const message = ERROR_MESSAGES[response.status] ?? `HTTP error! status: ${response.status}`;
      return { success: false, status: response.status, message, data };
    }

    return { success: true, status: response.status, message: 'Merchant enrichment sent successfully', data };
  } catch (error) {
    console.error('Error sending enrichment:', error);
    return { success: false, message: error.message };
  }
};

const SingleEnrich = () => {
  const fetcher = useFetcher();

  const [bulk, setBulk] = useState('bulk');

  const handleFormSubmit = (event) => {
    event.preventDefault();

     const data = {
      bulk: bulk === 'bulk' ? 'bulk' : '',
     }

    fetcher.submit(data , { method: 'post' });
  };

  const result = fetcher.data ?? null;

  return (
    <s-page inlineSize="small">
      <s-query-container>
        <form method="post" onSubmit={handleFormSubmit}>
          <s-stack gap="base" padding="base" background="base" borderRadius="base">
            <s-text variant="headingMd">Merchant Enrichment</s-text>
            <s-text>
              Pushes shop details (owner email, plan, address) to AppThrive. Idempotent — safe to call multiple times.
            </s-text>

            <s-choice-list
              label="Update"
              onChange={(e) => setBulk(e.target.values[0])}
              name="bulk"
            >
              <s-choice value="bulk" defaultSelected={bulk === 'bulk'}>Update in Bulk</s-choice>
              <s-choice value="single" defaultSelected={bulk === 'single'}>Update in Single</s-choice>
            </s-choice-list>


            <s-button type="submit" variant="primary" loading={fetcher.state !== 'idle'}>
              Send Enrichment
            </s-button>

            {result && (
              <s-banner tone={result.success ? 'success' : 'critical'}>
                {result.message}
                {result.data?.fieldsWritten?.length > 0 && (
                  <s-text>Fields updated: {result.data.fieldsWritten.join(', ')}</s-text>
                )}
              </s-banner>
            )}
          </s-stack>
        </form>
      </s-query-container>
    </s-page>
  );
};

export default SingleEnrich;



