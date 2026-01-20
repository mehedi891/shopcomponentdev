import { CART_FIELDS } from "./fragments/cartPlayLoad";

const cartCreateFnc = async (selectedVariant, store, token, tracking, customerTracking,market) => {
  const mutation = `#graphql
      mutation cartCreate(
         $input: CartInput
         $country: CountryCode!
         $language: LanguageCode!
        ) 
       @inContext(country: $country, language: $language){
        cartCreate(input: $input) {
   cart { ...CartFields }
       userErrors { field message }
     }
   }
   ${CART_FIELDS}
      
    `;
  const variables = {
    "input": {
      "lines": selectedVariant,
      // "buyerIdentity": {
      //   "countryCode": "US"
      // },
      "attributes": [
        {
          "key": "EU_custom_tracking",
          "value": customerTracking
        },
        {
          "key": "embedup_tracking",
          "value": tracking
        }
      ]
    },
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
    if (data.data.cartCreate.userErrors.length) {
      console.error('Errors:', data.data.cartCreate.userErrors);
      return {
        cartData: {},
        success: false
      }
    } else {

      localStorage.setItem('__shopify:cartId', data.data.cartCreate.cart.id);
      localStorage.setItem('shopcomponent_cartId', data.data.cartCreate.cart.id);
      localStorage.setItem('embedup_cart_data', JSON.stringify(data.data.cartCreate.cart));

      localStorage.setItem("embedup_store_info", JSON.stringify({
        store: store,
        token: token
      }));


      return {
        cartData: data.data.cartCreate.cart,
        success: true
      }
    }
  } catch (error) {
    return {
      cartData: {},
      success: false
    }
  }
};

export default cartCreateFnc;