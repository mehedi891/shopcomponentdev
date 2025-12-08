import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { payload } = await authenticate.webhook(request);
  //console.log('Payload:', payload);
  const isSpcOrder = payload?.note_attributes?.find(
    (item) => item.name === "shopcomponent_tracking"
  );

  if (!isSpcOrder) return new Response();

  const component = await db.component.findUnique({
    where: {
      tracking: isSpcOrder.value,
    },
    // include: {
    //   shop: true,
    // },
  });

  if (!component?.id) return new Response();

  const totalPrice = parseFloat(payload.total_price);
  const shopId = Number(component.shopId);
  const componentId = Number(component.id);
  const currDate = new Date().toISOString().slice(0, 7);
  console.log("Initiate transaction");
  try {
    await db.$transaction(async (tx) => {
      // 1️⃣ Read component inside transaction
      const component = await tx.component.findUnique({
        where: { id: componentId },
        select: { affiliateId: true },
      });

      // 2️⃣ Create order
      await tx.order.create({
        data: {
          orderId: payload?.admin_graphql_api_id,
          shopId,
          componentId,
          affiliateId: component?.affiliateId ?? null
        }
      });

      // 3️⃣ Update component
      await tx.component.update({
        where: { id: componentId },
        data: {
          totalOrderCount: { increment: 1 },
          totalOrderValue: { increment: totalPrice },
        },
      });

      // 4️⃣ Update shop
      await tx.shop.update({
        where: { id: shopId },
        data: {
          totalOrderCount: { increment: 1 },
          totalOrderValue: { increment: totalPrice },
        },
      });

      // 5️⃣ Update monthly shop stats
      await tx.ShopOrdersByMonth.upsert({
        where: {
          monthYear_shopId: {
            monthYear: currDate,
            shopId: shopId
          }
        },
        update: {
          totalOrders: { increment: 1 },
          totalValue: { increment: totalPrice },
        },
        create: {
          monthYear: currDate,
          totalOrders: 1,
          totalValue: totalPrice,
          shopId,
        },
      });

      // 6️⃣ Update app totals
      await tx.app.upsert({
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
      });

      // 7️⃣ Update affiliate ONLY IF EXISTS
      if (component?.affiliateId) {
        await tx.affiliate.update({
          where: { id: component.affiliateId },
          data: {
            totalOrderCount: { increment: 1 },
            totalOrderValue: { increment: totalPrice },
          }
        });

        await tx.affiliateOrdersByMonth.upsert({
          where: {
            monthYear_shopId_affiliateId: {
              monthYear: currDate,
              shopId: shopId,
              affiliateId: component.affiliateId,
            }
          },
          update: {
            totalOrders: { increment: 1 },
            totalValue: { increment: totalPrice },
          },
          create: {
            monthYear: currDate,
            totalOrders: 1,
            totalValue: totalPrice,
            affiliateId: component.affiliateId,
            shopId: shopId
          },
        });

      }
    });

    console.log("End transaction");
  } catch (error) {
    console.error("Transaction failed:", error);
  }



  return new Response();
};
