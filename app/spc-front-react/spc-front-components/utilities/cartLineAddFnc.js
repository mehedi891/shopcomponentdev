const cartLineAddFnc = async (isExistCart,selectedVariant,store,token) => {
  const mutation = `#graphql
   mutation cartLinesAdd(
  $cartId: ID!
  $lines: [CartLineInput!]!
  $country: CountryCode!
  $language: LanguageCode!
) @inContext(country: $country, language: $language) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    cart {
      updatedAt
      id
      appliedGiftCards{
        id lastCharacters
      }
      checkoutUrl
      totalQuantity
      lines(first: 250) {
          nodes{
            id 
            quantity 
            attributes{
              key value
            }
        }
      }
      cost{
        subtotalAmount{currencyCode amount}
        totalAmount{currencyCode amount}
        totalDutyAmount{currencyCode amount}
        totalTaxAmount{currencyCode amount}
      }
      note
      attributes{
        key
        value
      }
      discountCodes{
        code
      }
    }
    userErrors { field message }
  }
}

`;

  const variables = {
    cartId: isExistCart,
    lines: selectedVariant,
    country: 'US',
    language: 'EN',
  };


    try {
    const res = await fetch(`https://${store}/api/2025-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token
      },
      body: JSON.stringify({ query: mutation, variables })
    });

    const data = await res.json();
    //console.log(data);
    if (data.data.cartLinesAdd.userErrors.length) {
      //console.log("error:", data.data.cartLinesAdd.userErrors);
      
      //CartId error handled here
      return {
        cartData: {},
        error: data.data.cartLinesAdd.userErrors,
        success: false
      }
    } else {

      localStorage.setItem('__shopify:cartId', data.data.cartLinesAdd.cart.id);
      localStorage.setItem('shopcomponent_cartId', data.data.cartLinesAdd.cart.id);

      return {
        cartData: data.data.cartLinesAdd.cart,
        success: true
      }




    }
  } catch (error) {
    console.log("error", error);
    return {
      cartData: {},
      error: error,
      success: false
    }
  }

} 

export default cartLineAddFnc;