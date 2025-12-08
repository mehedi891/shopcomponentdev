import calculateCommission from "./calculateCommission";

function calculateComponentTotalOrders(components, shopifyOrders, commissionCiteria,commission,tieredCommissionType) {
  return components.map(component => {
    const matchedOrders = component.orders.map(o => {
      return shopifyOrders.find(s => s.id === o.orderId);
    }).filter(Boolean);

    const totalValue = matchedOrders.reduce((sum, order) => {
      return sum + Number(order.currentTotalPriceSet.shopMoney.amount);
    }, 0);
    const currMonthPendingCommission = calculateCommission(matchedOrders.length,totalValue,commissionCiteria,commission,tieredCommissionType);
   
    return {
      ...component,
      currMonthTotalOrders: matchedOrders.length,
      currMonthTotalValue: totalValue,
      matchedOrders,
      currMonthPendingCommission:currMonthPendingCommission ?? 0
    };
  });
}




export default calculateComponentTotalOrders;