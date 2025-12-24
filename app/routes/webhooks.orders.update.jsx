import { authenticate } from "../shopify.server";
import { inspect } from 'node:util';

import db from "../db.server";
//import calculateTotalRefund from "../utilis/calculateTotalRefund";
import { COMISSION_CRITERIA } from "../constants/constants";
import { calculateFixedCommission, calculateTierCommission } from "../utilis/calculateCommission";

export const action = async ({ request }) => {
  const { payload, topic, subTopic } = await authenticate.webhook(request);


  console.log('from orders update');
  // console.log('from orders update payload', payload);
  console.log('topic:', topic, 'Subtopic:', subTopic);
  console.log(
    inspect(payload, {
      depth: null,            // no depth limit
      maxArrayLength: null,   // print all elements
      colors: true,
      compact: false,
      breakLength: 120
    })
  );

  const isExistOrder = await db.order.findUnique({
    where: {
      orderId: payload?.admin_graphql_api_id,
    },
    include: {
      affiliate: {
        select: {
          id: true,
          commissionCiteria: true,
          fixedCommission: true,
          tieredCommission: true,
          totalSubTotalValue: true,
        }
      }
    }
  });
  if (!isExistOrder) {
    console.log('Not find any order in DBBBBBBBBB');
    return new Response();
  }

  if (payload?.cancel_reason || payload?.cancelled_at) {
    await db.order.update({
      where: {
        orderId: payload?.admin_graphql_api_id,
      },
      data: {
        isCancelled: true,
      },
    });

    return new Response();
  }

  let refundValue = 0;

  if (Array.isArray(payload?.refunds) && payload?.refunds?.length > 0) {
    console.log('Start Calculate refun>>>>>>>>>>>>>>>>>>>:');
    refundValue = Number(payload?.subtotal_price_set?.shop_money?.amount) - Number(payload?.current_subtotal_price_set?.shop_money?.amount)
    ///refundValue = calculateTotalRefund(payload?.refunds || []);
    console.log("Refunds:>>>>>>>>>>>>>>>>>", refundValue);
  }

  let fulFilledValue = 0;

  if (Array.isArray(payload?.fulfillments) && payload?.fulfillments?.length > 0) {
    fulFilledValue = payload?.fulfillments.reduce((sum, f) => {
      const lineTotal = f.line_items.reduce((s, item) => {
        return s + Number(item.price_set.shop_money.amount);
      }, 0);
      return sum + lineTotal;
    }, 0);
  }

  let commissionalValue = Number(payload?.subtotal_price_set?.shop_money?.amount) - refundValue;

  if(commissionalValue <=0 ) commissionalValue = 0;

  let commission = 0;
  if(isExistOrder?.affiliateId && commissionalValue > 0){
    const aff = isExistOrder?.affiliate;
    
    if(aff?.commissionCiteria === COMISSION_CRITERIA.fixed){
      
      commission = calculateFixedCommission(aff.fixedCommission,commissionalValue);
    }else if(aff?.commissionCiteria === COMISSION_CRITERIA.tiered){
       
      commission = calculateTierCommission(aff.tieredCommission,aff?.totalSubTotalValue || 0,commissionalValue);
    }
  }

  //console.log("Commission:",commission);
  //console.log("affiliate:",isExistOrder?.affiliate);

  await db.order.update({
    where: {
      orderId: payload?.admin_graphql_api_id,
    },
    data: {
      refundValue: refundValue,
      fulFilledValue: fulFilledValue,
      commissionalValue: commissionalValue,
      commission: commission,
    },
  });

  console.log("Orders update completed!!!!!!!");


  return new Response();
};
