import { CART_FIELDS } from "./fragments/cartPlayLoad";

const cartApplyDiscountCodeFnc = async (cartId,discountCodesArr,token, store) => {

  const mutation = `#graphql
mutation cartDiscountCodesUpdate(
  $cartId: ID!
  $discountCodes: [String!]!
  $country: CountryCode!
  $language: LanguageCode!
) @inContext(country: $country, language: $language) {
  cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
    cart { ...CartFields }
        userErrors { field message }
        warnings{code message target}
      }
    }
    ${CART_FIELDS}

`;

  const variables = {
    cartId: cartId,
    discountCodes: discountCodesArr,
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
    console.log(data?.data);
    if (data.data.cartDiscountCodesUpdate.userErrors.length) {
      console.log("error:", data.data.cartDiscountCodesUpdate.userErrors);

      //CartId error handled here

      //localStorage.setItem('embedup_cart_data', JSON.stringify(data.data.cartDiscountCodesUpdate.cart));
      return {
        cartData: {},
        error: data.data.cartDiscountCodesUpdate.userErrors,
        success: false
      }
    } else {

      localStorage.setItem('__shopify:cartId', data.data.cartDiscountCodesUpdate.cart.id);
      localStorage.setItem('shopcomponent_cartId', data.data.cartDiscountCodesUpdate.cart.id);
      localStorage.setItem('embedup_cart_data', JSON.stringify(data.data.cartDiscountCodesUpdate.cart));

      return {
        cartData: data.data.cartDiscountCodesUpdate.cart,
        success: data?.data?.cartDiscountCodesUpdate?.warnings.length > 0 ? false : true,
        message: data?.data?.cartDiscountCodesUpdate?.warnings.length > 0 ? data.data.cartDiscountCodesUpdate.warnings[0].message : 'Successfully applied discount code',
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

export default cartApplyDiscountCodeFnc;