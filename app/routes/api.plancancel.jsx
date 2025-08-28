import { authenticate } from "../shopify.server"

export const loader = async ({ request }) => {
   const { billing } = await authenticate.admin(request);
  const {  appSubscriptions } = await billing.check();

  if (appSubscriptions?.length > 0) {
   const subscription = appSubscriptions[0];
   await billing.cancel({
    subscriptionId: subscription.id,
    isTest: true,
    prorate: true,
   });
  }

  return null
}