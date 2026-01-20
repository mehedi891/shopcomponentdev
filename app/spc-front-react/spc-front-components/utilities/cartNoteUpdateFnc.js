import { CART_FIELDS } from "./fragments/cartPlayLoad";

const cartNoteUpdateFnc = async (cartId,note,token, store) => {

  const mutation = `#graphql
mutation cartNoteUpdate(
  $cartId: ID!
  $note: String!
  $country: CountryCode!
  $language: LanguageCode!
) @inContext(country: $country, language: $language) {
  cartNoteUpdate(cartId: $cartId, note: $note) {
    cart { ...CartFields }
        userErrors { field message }
        warnings{code message target}
      }
    }
    ${CART_FIELDS}

`;

  const variables = {
    cartId: cartId,
    note: note,
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
    if (data.data.cartNoteUpdate.userErrors.length) {
      console.error('Errors:', data.data.cartNoteUpdate.userErrors);
      return {
        cartData: {},
        success: false
      }
    } else {

      localStorage.setItem('__shopify:cartId', data.data.cartNoteUpdate.cart.id);
      localStorage.setItem('shopcomponent_cartId', data.data.cartNoteUpdate.cart.id);
      localStorage.setItem('embedup_cart_data', JSON.stringify(data.data.cartNoteUpdate.cart));


      return {
        cartData: data.data.cartNoteUpdate.cart,
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

export default cartNoteUpdateFnc;