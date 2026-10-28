export const updateMerchantEnrichment = async (shop, enrichmentData) => {
  const { createHmac } = await import('node:crypto');
  const INGEST_URL = 'https://app.appthrive.io/api/ingest/org_XbPoGTQPldjc/app_ayLlm5B_RZN5/merchant';
  const APPTHRIVE_SECRET = process.env.APPTHRIVE_WEBHOOK_SECRET;
  if (!APPTHRIVE_SECRET) return { success: false, message: "APPTHRIVE_WEBHOOK_SECRET is not set" };

  const ERROR_MESSAGES = {
    400: 'Body invalid or missing required fields.',
    401: 'Authentication required or token invalid.',
    403: 'Insufficient scope.',
    404: 'Merchant not found in this org.',
    429: 'Rate limited.',
  };

  /****** Data structure for enrichment payload
   *shopId: 'gid://shopify/Shop/12345',
    *shopDomain: 'fastdev891.myshopify.com',
    shopName: null,
    shopOwnerName: null,
    shopOwnerEmail: null,
    shopOwnerPhone: null,
    shopifyPlan: 'unknown',
    shopifyCreatedAt: null,
    shopifyTags: [''],
    address1: null,
    address2: null,
    city: null,
    province: null,
    zip: null,
    country: null,
    countryCode: null,
    currency: null,
    timezone: null,
    locale: null,
    industry: null,
    customAttributes: {
      tier: 'gold',
      lifetime_orders: 142
    },
    tags: ['VIP', 'trial-2025'],
    notes: [
      {
        content: 'Auto-enrolled in beta cohort 2026-05-12'
      },
      {
        content: 'Migrated from legacy SKU',
        isPinned: true
      }
    ],
    idempotencyKey: ''
   * 
   * ***** */

  
    const timestamp = Math.floor(Date.now() / 1000).toString();

   const body =  JSON.stringify({...enrichmentData, shopDomain: shop});

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


export const triggerManualWorkflow = async(shop, initiatedBy,workflowId,payload) => {
  //console.log({shop,initiatedBy});
  //const WORKFLOW_ID = "wf_BxVvsNKp4QIe"
  const WEBHOOK_URL = `https://app.appthrive.io/api/v1/workflows/${workflowId}/runs`;
  const APPTHRIVE_PAT = process.env.APPTHRIVE_PAT;
  if (!APPTHRIVE_PAT) return { success: false, message: "APPTHRIVE_PAT is not set" };

  const ERROR_MESSAGES = {
    400: 'Body invalid, workflow not active, or workflow trigger type is not manual-api.',
    401: 'Authentication required or token invalid.',
    403: 'Insufficient scope.',
    404: 'Workflow or merchant not found in this org.',
    429: 'Rate limited.',
  };

  const body = JSON.stringify({
    merchantId: shop,
    initiatedBy: initiatedBy || 'embedup',
    payload,
    // payload: {
    //   change_type: 'trial_started',
    //   add_tags: ['trial_plan'],
    //   remove_tags: ['free_plan'],
    //   custom_data: {
    //     trial_days: 14
    //   }
    // }
  });
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APPTHRIVE_PAT}`,
        //'x-appthrive-signature': signature,
        // 'x-appthrive-merchant-id': shop.shopifyShopGid,
        //'x-appthrive-shop-domain': session.shop,
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

    return { success: true, status: response.status, message: 'Workflow triggered successfully', data };
  } catch (error) {
    console.error('Error triggering webhook:', error);
    return { success: false, message: error.message };
  }

}