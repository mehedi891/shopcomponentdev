import { authenticate } from "../shopify.server";


export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);



  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST":
      console.log('CUSTOMERS_DATA_REQUEST',shop);
      return new Response("Request received to view stored customer data", { status: 200 });

    case "CUSTOMERS_REDACT":
      console.log('CUSTOMERS_REDACT');
      return new Response("Request received to delete customer data", { status: 200 });

    case "SHOP_REDACT":
      console.log('SHOP_REDACT');
      return new Response("Request received to delete shop data", { status: 200 });

    default:
      return new Response("Unhandled webhook topic", { status: 200 });
  }
};

