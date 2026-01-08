const storeAnalyticsDataToServer = async ({
  shopifyDomain,
  trafficSource,
  componentId,
  day,
  isIncImpression,
  impressionIncVal,
  isIncUniqueVisitor,
  uniqueVisitorIncVal,
  isIncAddToCartClick,
  addTocartClickIncVal,
  isIncCheckoutClick,
  checkoutClickIncVal
}) => {
  const data = {
    shopifyDomain,
    trafficSource,
    componentId,
    day,
    isIncImpression,
    impressionIncVal,
    isIncUniqueVisitor,
    uniqueVisitorIncVal,
    isIncAddToCartClick,
    addTocartClickIncVal,
    isIncCheckoutClick,
    checkoutClickIncVal
  };
  //console.log("data:", data);

  //console.log("apiUri:", import.meta.env.VITE_DATA_API);

  try {
    const res = await fetch(`${import.meta.env.VITE_DATA_API}/queue/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    //console.log("result:", result);
  } catch (error) {
    console.log("Something wen't wrong", error);
  }


};

export {
  storeAnalyticsDataToServer
}


