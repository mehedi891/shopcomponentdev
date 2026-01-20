function calculateTotalRefund(refunds) {
  let total = 0;

  if (!refunds || refunds.length === 0) {
    return total;
  }

  refunds.forEach(refund => {
    // 1. Add transaction amounts (money actually refunded)
    if (refund.transactions?.length > 0) {
      refund.transactions.forEach(t => {
        total += Number(t.amount || 0);
      });
    }

    // 2. Add refund line items (subtotal + tax)
    if (refund.refund_line_items?.length > 0) {
      refund.refund_line_items.forEach(item => {
        total += Number(item.subtotal_set?.shop_money?.amount || 0);
        //total += Number(item.total_tax_set?.shop_money?.amount || 0);
      });
    }

    // 3. Add order adjustments (but convert negative values to positive)
    if (refund.order_adjustments?.length > 0) {
      refund.order_adjustments.forEach(adj => {
        total += Math.abs(Number(adj.amount_set?.shop_money?.amount || 0));
      });
    }
  });

  return total;
}

export default calculateTotalRefund

