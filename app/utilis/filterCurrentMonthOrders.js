function filterCurrentMonthOrders(shopifyOrders) {
  if (!shopifyOrders || !shopifyOrders?.length) return [];
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  return shopifyOrders.filter(order => {
    const created = new Date(order.createdAt);
    return created.getMonth() === month && created.getFullYear() === year;
  });
}
export default filterCurrentMonthOrders