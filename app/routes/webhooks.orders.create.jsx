import { authenticate } from "../shopify.server";
import db from "../db.server";
import { COMISSION_CRITERIA } from "../constants/constants";
import { calculateFixedCommission, calculateTierCommission } from "../utilis/calculateCommission";

export const action = async ({ request }) => {
  const { payload } = await authenticate.webhook(request);
  //console.log('Payload:', payload);
  const isSpcOrder = payload?.note_attributes?.find(
    (item) => item.name === "embedup_tracking"
  );

  //console.log('From orders create:::', isSpcOrder);

  if (!isSpcOrder) return new Response();

  const component = await db.component.findUnique({
    where: {
      tracking: isSpcOrder.value,
    },
  });

  if (!component?.id) return new Response();

  const totalPrice = parseFloat(payload?.total_price_set?.shop_money.amount);
  const subTotalValue = parseFloat(payload?.subtotal_price_set?.shop_money?.amount);
  const shopId = Number(component.shopId);
  const componentId = Number(component.id);
  const currDate = new Date().toISOString().slice(0, 7);
  console.log("Initiate transaction");

  let commission = 0;



  try {
    await db.$transaction(async (tx) => {
      // 1️⃣ Read component inside transaction
      const component = await tx.component.findUnique({
        where: { id: componentId },
        select: {
          affiliateId: true,
          affiliate: {
            select: {
              id: true,
              commissionCiteria: true,
              fixedCommission: true,
              tieredCommission: true,
              totalSubTotalValue: true,
            },
          },
        },
      });


      if (component?.affiliateId) {
        const aff = component?.affiliate;
        const affSubTotal = Number(aff?.totalSubTotalValue) + subTotalValue;

        if (aff?.commissionCiteria === COMISSION_CRITERIA.fixed) {

          commission = calculateFixedCommission(aff.fixedCommission, subTotalValue);
        } else if (aff?.commissionCiteria === COMISSION_CRITERIA.tiered) {

          commission = calculateTierCommission(aff.tieredCommission, affSubTotal || 0, subTotalValue);
        }
      }

      // 2️⃣ Create order
      await tx.order.create({
        data: {
          orderId: payload?.admin_graphql_api_id,
          shopId,
          componentId,
          affiliateId: component?.affiliateId ?? null,
          totalValue: totalPrice,
          subTotalValue: subTotalValue,
          shopifyOrderNumber: payload?.order_number,
          commission: commission,
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
            totalSubTotalValue: { increment: subTotalValue },
          }
        });

      }
    });

    console.log("End transaction");
  } catch (error) {
    console.error("Transaction failed:", error);
  }



  return new Response();
};
