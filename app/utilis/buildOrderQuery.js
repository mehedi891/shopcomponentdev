function buildOrderQuery(orderIds) {
  let fields = orderIds
    .map((item, index) => {
      return `
        order_${index + 1}: order(id: "${item.orderId}") {
          id
          name
          createdAt
          displayFinancialStatus
          currentTotalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          fulfillments(first: 250) {
            id
            displayStatus
          }
        }
      `;
    })
    .join("\n");

  return `{ ${fields} }`;
}

export default buildOrderQuery;