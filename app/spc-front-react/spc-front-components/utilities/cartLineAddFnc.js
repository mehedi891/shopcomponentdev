import { CART_FIELDS } from "./fragments/cartPlayLoad";

const cartLineAddFnc = async (isExistCart, selectedVariant, store, token,market) => {
  //console.log({ isExistCart, selectedVariant, store, token });
  const mutation = `#graphql
   mutation cartLinesAdd(
  $cartId: ID!
  $lines: [CartLineInput!]!
  $country: CountryCode!
  $language: LanguageCode!
) @inContext(country: $country, language: $language) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    cart { ...CartFields }
    userErrors { field message }
  }
}
${CART_FIELDS}
`;

  const variables = {
    cartId: isExistCart,
    lines: selectedVariant,
    country: market || 'US',
    language: 'EN',
  };


  try {
    const res = await fetch(`https://${store}/api/2025-10/graphql.json`, {
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
      console.log("error:", data.data.cartLinesAdd.userErrors);

      //CartId error handled here

      //localStorage.setItem('embedup_cart_data', JSON.stringify(data.data.cartLinesAdd.cart));
      return {
        cartData: {},
        error: data.data.cartLinesAdd.userErrors,
        success: false
      }
    } else {

      localStorage.setItem('__shopify:cartId', data.data.cartLinesAdd.cart.id);
      localStorage.setItem('shopcomponent_cartId', data.data.cartLinesAdd.cart.id);
      localStorage.setItem('embedup_cart_data', JSON.stringify(data.data.cartLinesAdd.cart));

       localStorage.setItem("embedup_store_info", JSON.stringify({
        store: store,
        token: token
      }));

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