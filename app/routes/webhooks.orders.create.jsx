import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { payload } = await authenticate.webhook(request);
    console.log('Payload:',payload);
  const isSpcOrder = payload?.note_attributes?.find(
    (item) => item.name === "shopcomponent_tracking"
  );

  if (!isSpcOrder) return new Response();

  const component = await db.component.findUnique({
    where: {
      tracking: isSpcOrder.value,
    },
  });

  if (!component?.id) return new Response();

  const totalPrice = parseFloat(payload.total_price);
  const shopId = Number(component.shopId);
  const componentId = Number(component.id);

  try {
    await db.$transaction([
      db.order.create({
        data: {
          orderId: payload?.admin_graphql_api_id,
          orderObj: JSON.stringify(payload),
          shopId,
          componentId,
        },
      }),

      db.component.update({
        where: { id: componentId },
        data: {
          totalOrderCount: { increment: 1 },
          totalOrderValue: { increment: totalPrice },
        },
      }),

      db.shop.update({
        where: { id: shopId },
        data: {
          totalOrderCount: { increment: 1 },
          totalOrderValue: { increment: totalPrice },
        },
      }),

      db.app.upsert({
        where: { id: 1 },
        update: {
          totalOrderCount: { increment: 1 },
          totalOrderValue: { increment: totalPrice },
        },
        create: {
          id: 1,
          totalOrderCount: 1,
          totalOrderValue: totalPrice,
        },
      }),

    ]);
  } catch (error) {
    console.error("Transaction failed:", error);
  }

 

  return new Response();
};
