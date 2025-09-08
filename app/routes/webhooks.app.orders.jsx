import { authenticate } from "../shopify.server";
//import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, session, topic,payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop} from orders`);
  console.log("payloaod oorder:",payload);

  return new Response();
}