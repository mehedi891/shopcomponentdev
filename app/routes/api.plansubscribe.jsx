import { BillingInterval } from "@shopify/shopify-app-remix/server";
import { authenticate, FREE_PLAN, MONTHLY_PLAN } from "../shopify.server"

export const loader = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);

  const returnURL = `https://admin.shopify.com/store/${session.shop.replace('.myshopify.com', '')}/apps/${process.env.APP_NAME}/app/headless`;

  // const subscription = await billing.require({
  //   plans: [MONTHLY_PLAN],
  //   onFailure: async () => billing.request({
  //     plan: MONTHLY_PLAN,
  //     isTest: true,
  //     trialDays: 14,
  //     returnUrl: returnURL,
  //     // lineItems: [
  //     //   {
  //     //     interval: BillingInterval.Every30Days,
  //     //     discount: { value: { percentage: 0.1 } },
  //     //   },
  //     // ],
  //   }),
  // });

  const url = new URL(request.url);
  const planName = url.searchParams.get('planName') || "";
  const planType = url.searchParams.get('planType') || "";
  const shopId = url.searchParams.get('shopId') || "";
 

  if (planName === 'growth' && planType === 'monthly') {
    await billing.require({
      plans: [MONTHLY_PLAN],
      onFailure: async () => billing.request({
        plan: MONTHLY_PLAN,
        isTest: true,
        trialDays: 14,
        returnUrl: returnURL,
        // lineItems: [
        //   {
        //     interval: BillingInterval.Every30Days,
        //     discount: { value: { percentage: 0.5 } },
        //   },
        // ],
      }),
    });

    //console.log('monthlyPlan growth created');
  } else if (planName === 'free') {
    
    await billing.require({
      plans: [FREE_PLAN],
      onFailure: async () => billing.request({
        plan: FREE_PLAN,
        isTest: true,
        returnUrl: returnURL,
        lineItems: [
          {
            interval: BillingInterval.Every30Days,
            discount: { value: { percentage: 1 } },
          },
        ],
      }),
    });

        //console.log('monthlyPlan free created');
  }



 // console.log('planName', planName, planType, shopId);
  return null
}

