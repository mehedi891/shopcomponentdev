import { CART_FIELDS } from "./fragments/cartPlayLoad";

const getExistCart = async (cartId,token, store) => {

  const mutation = `#graphql
query cart(
  $id: ID!
  $country: CountryCode!
  $language: LanguageCode!
) @inContext(country: $country, language: $language) {
  cart(id: $id) {
      ...CartFields 
      }
    }
    ${CART_FIELDS}

`;

  const variables = {
    id: cartId,
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
    //console.log("CartExist:",data?.data?.cart);
    if (!data?.data?.cart) {
      
      return {
        cartData: {},
        success: false
      }
    } else {

      localStorage.setItem('__shopify:cartId', data.data.cart.id);
      localStorage.setItem('shopcomponent_cartId', data.data.cart.id);
      //localStorage.setItem('embedup_cart_data', JSON.stringify(data.data.cart));


      return {
        cartData: data.data.cart,
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

export default getExistCart;