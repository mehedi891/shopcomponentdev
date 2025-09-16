const cartCreateFnc = async(selectedVariant,store,token,tracking,customerTracking) => {
   const mutation = `#graphql
      mutation cartCreate($input: CartInput) {
        cartCreate(input: $input) {
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
    "input": {
      "lines": selectedVariant,
      "attributes": [
        {
          "key": "SC_custom_tracking",
          "value": customerTracking
        },
        {
          "key": "shopcomponent_tracking",
          "value": tracking
        }
      ]
    }
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
    if (data.data.cartCreate.userErrors.length) {
      console.error('Errors:', data.data.cartCreate.userErrors);
      return {
        cartData: {},
        success: false
      }
    } else {
     
      localStorage.setItem('__shopify:cartId', data.data.cartCreate.cart.id);
      localStorage.setItem('shopcomponent_cartId', data.data.cartCreate.cart.id);

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