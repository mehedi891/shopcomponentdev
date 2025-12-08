import calculateCommission from "./calculateCommission";
import filterCurrentMonthOrders from "./filterCurrentMonthOrders"

function calcCurrMonthPendingCommision (orders,commissionCiteria,commission,tieredCommissionType) {
  const currMonthOrders = filterCurrentMonthOrders(orders);
  if(currMonthOrders?.length === 0) return 0;
  
  const totalValue = currMonthOrders.reduce((sum, order) => {
    return sum + Number(order.currentTotalPriceSet.shopMoney.amount);
  }, 0);
  return calculateCommission(currMonthOrders.length,totalValue,commissionCiteria,commission,tieredCommissionType);

}

export default calcCurrMonthPendingCommision