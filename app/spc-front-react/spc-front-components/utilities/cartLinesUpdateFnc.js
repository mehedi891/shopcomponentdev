import { CART_FIELDS } from "./fragments/cartPlayLoad";

const cartLinesUpdateFnc = async (cartId,linesArr,token, store) => {

  const mutation = `#graphql
mutation cartLinesRemove(
  $cartId: ID!
  $lines: [CartLineUpdateInput!]!
  $country: CountryCode!
  $language: LanguageCode!
) @inContext(country: $country, language: $language) {
  cartLinesUpdate(cartId: $cartId, lines: $lines) {
       cart { ...CartFields }
       userErrors { field message }
     }
   }
   ${CART_FIELDS}

`;

  const variables = {
    cartId: cartId,
    lines: linesArr,
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
    //console.log(data);
    if (data.data.cartLinesUpdate.userErrors.length) {
      console.log("error:", data.data.cartLinesUpdate.userErrors);

      //CartId error handled here

      //localStorage.setItem('embedup_cart_data', JSON.stringify(data.data.cartLinesUpdate.cart));
      return {
        cartData: {},
        error: data.data.cartLinesUpdate.userErrors,
        success: false
      }
    } else {

      localStorage.setItem('__shopify:cartId', data.data.cartLinesUpdate.cart.id);
      localStorage.setItem('shopcomponent_cartId', data.data.cartLinesUpdate.cart.id);
      localStorage.setItem('embedup_cart_data', JSON.stringify(data.data.cartLinesUpdate.cart));

      return {
        cartData: data.data.cartLinesUpdate.cart,
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

export default cartLinesUpdateFnc;