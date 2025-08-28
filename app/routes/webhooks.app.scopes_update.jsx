// import { authenticate } from "../shopify.server";
// import db from "../db.server";

export const action = async ({ request }) => {
  // const { payload, session, topic, shop } = await authenticate.webhook(request);

  // console.log(`Received ${topic} webhook for ${shop} iopipipiipipipip`);
  // const current = payload.current;

  // if (session) {
  //   await db.session.update({
  //     where: {
  //       id: session.id,
  //     },
  //     data: {
  //       scope: current.toString(),
  //     },
  //   });
  // }

  // return new Response();


  //this need to add to shopify.app.toml file if need 

  //   [[webhooks.subscriptions]]
  // topics = [ "app/scopes_update" ]
  // uri = "/webhooks/app/scopes_update"



  console.log('Shop app ascopes update webhook');

  return null
};
