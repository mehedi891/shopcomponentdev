import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    const shopData = await db.shop.findUnique({
      where: { shopifyDomain: shop },
      include: { plan: true },
    });

    if (shopData?.plan) {
     
      await db.shop.update({
        where: { shopifyDomain: shop },
        data: {
          plan: {
            delete: true, 
          },
          // components: {
          //   deleteMany: {}, 
          // },
          appDisabled: true,
          headlessAccessToken: null,
          scAccessToken: null,
          isInstalled: false,
          coupon:'',
        },
      });
    } else {

      await db.shop.update({
        where: { shopifyDomain: shop },
        data: {
          // components: {
          //   deleteMany: {}, 
          // },
          appDisabled: true,
          isInstalled: false,
          headlessAccessToken: null,
          scAccessToken: null,
          coupon:'',
        },
      });
    }

    await db.session.deleteMany({ where: { shop } });
  }

  console.log(`Deleted session for ${shop}`);

  return new Response();
};
