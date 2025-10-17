import { CART_FIELDS } from "./fragments/cartPlayLoad";

const cartLineRemoveFnc = async (cartId,lineIdsArr,token, store) => {

  const mutation = `#graphql
mutation cartLinesRemove(
  $cartId: ID!
  $lineIds: [ID!]!
  $country: CountryCode!
  $language: LanguageCode!
) @inContext(country: $country, language: $language) {
  cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
       cart { ...CartFields }
       userErrors { field message }
     }
   }
   ${CART_FIELDS}
`;

  const variables = {
    cartId: cartId,
    lineIds: lineIdsArr,
    country: 'US',
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
    console.log(data);
    if (data.data.cartLinesRemove.userErrors.length) {
      console.log("error:", data.data.cartLinesRemove.userErrors);

      //CartId error handled here

      //localStorage.setItem('embedup_cart_data', JSON.stringify(data.data.cartLinesRemove.cart));
      return {
        cartData: {},
        error: data.data.cartLinesRemove.userErrors,
        success: false
      }
    } else {

      localStorage.setItem('__shopify:cartId', data.data.cartLinesRemove.cart.id);
      localStorage.setItem('shopcomponent_cartId', data.data.cartLinesRemove.cart.id);
      localStorage.setItem('embedup_cart_data', JSON.stringify(data.data.cartLinesRemove.cart));

      return {
        cartData: data.data.cartLinesRemove.cart,
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

export default cartLineRemoveFnc;