
async function addToCartNcheckoutIndProduct(event, accessToken, shop, tracingCode = 'spc_track12', customertackingCode = '', cartBehavior = 'cart') {
  const mostParentContainer = event.target.closest('.shopcomponent_pd_container');
  const variantNodeParent = event.target.closest('.product-card');
  const variantNode = variantNodeParent.querySelector('.product-card__variant-selector');
  const variantId = variantNode.getAttribute('data-variant-id');
  const withoutMyShopify = shop.replace('.myshopify.com', '');
  const isExistCart = localStorage.getItem('shopcomponent_cartId') ? localStorage.getItem('shopcomponent_cartId') : null;


  const shoppingCart = mostParentContainer.querySelector('shopify-cart');
  const shoppingCartClone = shoppingCart.cloneNode(true);
  const CART_EVENT = 'shopify:cartData';

  const selectedVariant = [
    {
      merchandiseId: variantId,
      quantity: 1
    }
  ];

  //need to show shopping cart modal
  if (cartBehavior === 'cart') {
    if (variantNode) {
      if (isExistCart) {

        try {
          const data = await cartLineAddFnc(isExistCart, shop, accessToken, selectedVariant);
          if (data.success) {
            const evt = new CustomEvent(CART_EVENT, {
              detail: data.cartData,
            });
            shoppingCart.dispatchEvent(evt);
            dispatchCartUpdate(data.cartData);

            // console.log('cartFnc:', data);
            // shoppingCart.parentNode.replaceChild(shoppingCartClone, shoppingCart);
            // mostParentContainer.querySelector('shopify-cart').dispatchEvent(evt);
            setTimeout(() => {
              mostParentContainer.querySelector('shopify-cart').showModal();
            }, 1000);
          } else {
            const data = await cartCreateFnc(shop, accessToken, selectedVariant, tracingCode, customertackingCode);
            if (data.success) {
              const evt = new CustomEvent(CART_EVENT, {
                detail: data.cartData,
              });
              shoppingCart.dispatchEvent(evt);

              dispatchCartUpdate(data.cartData);
              //shoppingCart.parentNode.replaceChild(shoppingCartClone, shoppingCart);
              setTimeout(() => {
                mostParentContainer.querySelector('shopify-cart').showModal();
              }, 1000);
            }
            console.log('Someting went wrong to adding Existing cart yyy');
          }
        }
        catch (error) {
          console.log('Someting went wrong to adding Existing cart');
        }

      } else {
        try {
          const data = await cartCreateFnc(shop, accessToken, selectedVariant, tracingCode, customertackingCode);
          if (data.success) {
            const evt = new CustomEvent(CART_EVENT, {
              detail: data.cartData,
            });
            shoppingCart.dispatchEvent(evt);

            dispatchCartUpdate(data.cartData);
            //shoppingCart.parentNode.replaceChild(shoppingCartClone, shoppingCart);
            setTimeout(() => {
              mostParentContainer.querySelector('shopify-cart').showModal();
            }, 1000);
          }
        } catch (error) {
          console.log('Someting went wrong to add to cart');
        }
      }

    }
  } else if (cartBehavior === 'checkout') {
    const variantIdNum = variantId.replace('gid://shopify/ProductVariant/', '');
    const checkoutUrl = `https://${shop}/cart/${variantIdNum}:1?access_token=${accessToken}&attributes[SC_custom_tracking]=${customertackingCode}&attributes[shopcomponent_tracking]=${tracingCode}&ref=shopcomponent`;
    window.location.href = checkoutUrl;
    //console.log(variantIdNum);
  } else {
    console.log('Method not found');
  }


}



async function addToCartNcheckoutBulkProduct(event, accessToken, shop, tracingCode = 'spc_track12', customertackingCode = '', cartBehavior = 'cart', isQtyEnaled = false) {
  const mostParentContainer = event.target.closest('.shopcomponent_pd_container');
  const withoutMyShopify = shop.replace('.myshopify.com', '');

  const isExistCart = localStorage.getItem('shopcomponent_cartId') ? localStorage.getItem('shopcomponent_cartId') : null;


  const shoppingCart = mostParentContainer.querySelector('shopify-cart');
  const shoppingCartClone = shoppingCart.cloneNode(true);
  const CART_EVENT = 'shopify:cartData';

  if (isQtyEnaled) {
    const qtyFileds = mostParentContainer.querySelectorAll('.shopcomponent_variants_bulk_enable_quantity_input');
    const enableQtyVariants =
      qtyFileds?.length > 0
        ? Array.from(qtyFileds)
          .filter(item => Number(item.value) > 0)
          .map(item => ({
            merchandiseId: item.getAttribute('data-variant-id'),
            quantity: Number(item.value),
          }))
        : [];


    console.log(enableQtyVariants);


    if (cartBehavior === 'cart') {
      if (enableQtyVariants.length === 0) {
        return alert('Please select at least one quantity');
      };
      if (isExistCart) {
        try {
          const data = await cartLineAddFnc(isExistCart, shop, accessToken, enableQtyVariants);
          if (data.success) {
            const evt = new CustomEvent(CART_EVENT, {
              detail: data.cartData,
            });
            shoppingCart.dispatchEvent(evt);

            dispatchCartUpdate(data.cartData);
            setTimeout(() => {
              mostParentContainer.querySelector('shopify-cart').showModal();
              qtyFileds.forEach(item => item.value = 0);
            }, 1000);
          } else {
            const data = await cartCreateFnc(shop, accessToken, enableQtyVariants, tracingCode, customertackingCode);
            if (data.success) {
              const evt = new CustomEvent(CART_EVENT, {
                detail: data.cartData,
              });
              shoppingCart.dispatchEvent(evt);
              dispatchCartUpdate(data.cartData);
              setTimeout(() => {
                mostParentContainer.querySelector('shopify-cart').showModal();
                qtyFileds.forEach(item => item.value = 0);
              }, 1000);
            }
          }
        }
        catch (error) {
          console.log('Someting went wrong to adding Existing cart');
        }
      } else {
        try {
          const data = await cartCreateFnc(shop, accessToken, enableQtyVariants, tracingCode, customertackingCode);
          if (data.success) {
            const evt = new CustomEvent(CART_EVENT, {
              detail: data.cartData,
            });
            shoppingCart.dispatchEvent(evt);
            dispatchCartUpdate(data.cartData);
            setTimeout(() => {
              mostParentContainer.querySelector('shopify-cart').showModal();
              qtyFileds.forEach(item => item.value = 0);
            }, 1000);
          }
        } catch (error) {
          console.log('Someting went wrong to add to cart');
        }
      }
    } else {
      if (enableQtyVariants.length === 0) {
        return alert('Please select at least one quantity');
      };
      const checkoutVariants = enableQtyVariants.map(variant => {
        const id = variant.merchandiseId.replace('gid://shopify/ProductVariant/', '');
        return `${[id]}:${variant.quantity}`;
      });
      const checkoutUrl = `https://${shop}/cart/${checkoutVariants.join(',')}?access_token=${accessToken}&attributes[SC_custom_tracking]=${customertackingCode}&attributes[shopcomponent_tracking]=${tracingCode}&ref=shopcomponent`;
      window.location.href = checkoutUrl;
    }

  } else {
    const products = JSON.parse(mostParentContainer.querySelector('.shopcomponent_pd_bulk_script').innerText) || [];
    if (products?.length > 0) {
      const variants = products.flatMap(product =>
        product.variants.map(variant => {
          return {
            merchandiseId: variant.id,
            quantity: Number(variant.quantity)
          }
        })
      );
      if (cartBehavior === 'cart') {
        if (isExistCart) {
          try {
            const data = await cartLineAddFnc(isExistCart, shop, accessToken, variants);
            if (data.success) {
              const evt = new CustomEvent(CART_EVENT, {
                detail: data.cartData,
              });
              shoppingCart.dispatchEvent(evt);

              dispatchCartUpdate(data.cartData);
              setTimeout(() => {
                mostParentContainer.querySelector('shopify-cart').showModal();
              }, 1000);
            } else {
              const data = await cartCreateFnc(shop, accessToken, variants, tracingCode, customertackingCode);
              if (data.success) {
                const evt = new CustomEvent(CART_EVENT, {
                  detail: data.cartData,
                });
                shoppingCart.dispatchEvent(evt);


                dispatchCartUpdate(data.cartData);
                setTimeout(() => {
                  mostParentContainer.querySelector('shopify-cart').showModal();
                }, 1000);
              }
            }
          }
          catch (error) {
            console.log('Someting went wrong to adding Existing cart');
          }
        } else {

          try {
            const data = await cartCreateFnc(shop, accessToken, variants, tracingCode, customertackingCode);
            if (data.success) {
              const evt = new CustomEvent(CART_EVENT, {
                detail: data.cartData,
              });
              shoppingCart.dispatchEvent(evt);


              dispatchCartUpdate(data.cartData);
              setTimeout(() => {
                mostParentContainer.querySelector('shopify-cart').showModal();
              }, 1000);
            }
          } catch (error) {
            console.log('Someting went wrong to add to cart');
          }
        }
      } else {
        //console.log(variants);
        const checkoutVariants = variants.map(variant => {
          const id = variant.merchandiseId.replace('gid://shopify/ProductVariant/', '');
          return `${[id]}:${variant.quantity}`;
        });
        //console.log(checkoutVariants.join(','));
        const checkoutUrl = `https://${shop}/cart/${checkoutVariants.join(',')}?access_token=${accessToken}&attributes[SC_custom_tracking]=${customertackingCode}&attributes[shopcomponent_tracking]=${tracingCode}&ref=shopcomponent`;
        window.location.href = checkoutUrl;
      }

    }
  }

}


async function cartLineAddFnc(existCartId, shop, accessToken, variants) {

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
    cartId: existCartId,
    lines: variants,
    country: 'US',
    language: 'EN',
  };

  try {
    const res = await fetch(`https://${shop}/api/2025-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': accessToken
      },
      body: JSON.stringify({ query: mutation, variables })
    });

    const data = await res.json();
    console.log(data);
    if (data.data.cartLinesAdd.userErrors.length) {
      console.log("error", data.data.cartLinesAdd.userErrors);
      return {
        cartData: {},
        success: false
      }
    } else {
      console.log('Cart updated:', data.data.cartLinesAdd.cart);
      // Store the cart ID and checkout URL in localStorage
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
      success: false
    }
  }

}

async function cartCreateFnc(shop, accessToken, variants, tracingCode, customertackingCode) {
  const withoutMyShopify = shop.replace('.myshopify.com', '');
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
      "lines": variants,
      "attributes": [
        {
          "key": "SC_custom_tracking",
          "value": customertackingCode
        },
        {
          "key": "shopcomponent_tracking",
          "value": tracingCode
        }
      ]
    }
  };
  try {
    const res = await fetch(`https://${shop}/api/2025-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': accessToken
      },
      body: JSON.stringify({ query: mutation, variables })
    });

    const data = await res.json();
    if (data.data.cartCreate.userErrors.length) {
      console.error('Errors:', data.data.cartCreate.userErrors);
    } else {
      console.log('Cart created:', data.data.cartCreate.cart);

      // Store the cart ID and checkout URL in localStorage
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
}

function updateQuantity(event, type) {
  const quantityParentField = event.target.closest('.shopcomponent_variants_bulk_enable_quantity');
  const quantityField = quantityParentField.querySelector('.shopcomponent_variants_bulk_enable_quantity_input');
  if (type === 'inc') {
    quantityField.value = quantityField.value * 1 + 1;
    console.log('');
  } else {
    if (quantityField.value * 1 <= 0) {
      return;
    }
    quantityField.value = quantityField.value * 1 - 1;
  }
}

function moveSliderPrevNext(btnType) {
  const slider = document.querySelector(".shopcomponent_product_layout_gridSlider");
  const slideWidth = slider.querySelector(".product-card").offsetWidth + 16;
  slider.scrollBy({ left: btnType === 'next' ? slideWidth : -slideWidth, behavior: "smooth" });
}


const originalFetch = window.fetch.bind(window);

window.fetch = async (...args) => {
  const [resource, config] = args;
  const response = await originalFetch(...args);
  console.log('response.....', resource);
  try {
    if (config?.body) {
      const body = JSON.parse(config.body);

      if (body.query) {
        if (body.query.includes("mutation cartLinesUpdate") || body.query.includes("mutation cartLinesRemove")) {
          const cloneResponse = response.clone();
          const data = await cloneResponse.json();
          // console.log('data', data.data);

          const cartCount = data?.data?.cartLinesUpdate ? data.data.cartLinesUpdate.cart.totalQuantity : data?.data?.cartLinesRemove.cart.totalQuantity;
          //console.log('cartCount', cartCount);

          const shoppingCartCount = document.querySelectorAll('.shopcomponent_cart_count_qty');
          if (shoppingCartCount) {
            shoppingCartCount.forEach(shoppingCartCount => {
              shoppingCartCount.innerHTML = cartCount;
            })
          }


          shoppingCartOnlyUpdate();

        }
      }
    }
  } catch (err) {
    console.warn("Failed to parse fetch body", err);
  }

  // Call the real fetch

  return response;
};

setTimeout(() => {
  initialCartCount();
}, 1000);


function initialCartCount() {
  const cartCountAll = document.querySelectorAll('.shopcomponent_cart_count_qty');
  if (cartCountAll?.length > 0) {
    const shoppingCart = document.querySelectorAll('shopify-cart');
    shoppingCart.forEach(shoppingCart => {
      shoppingCart.addEventListener("shopify:cartData", (event) => {
        console.log('response', event.detail);
        cartCountAll.forEach(cartCount => {
          // if text isn't a number, force to "0"
          if (!Number(cartCount.innerText)) {
            cartCount.innerText = event?.detail?.totalQuantity;
          }
        });
      });
    })

  }
}







function dispatchCartUpdate(cart) {
  const shoppingCart = document.querySelectorAll('shopify-cart');
  const qtyCount = document.querySelectorAll('.shopcomponent_cart_count_qty');
  const evt = new CustomEvent('shopify:cartData', {
    detail: cart,
  });

  console.log('cart dispact');

  if (shoppingCart) {
    shoppingCart.forEach(shoppingCart => {
      shoppingCart.dispatchEvent(evt);
      const cloneShoppingCart = shoppingCart.cloneNode(true);
      cloneShoppingCart.dispatchEvent(evt);
      shoppingCart.parentNode.replaceChild(cloneShoppingCart, shoppingCart);
    });
  }
  if (qtyCount) {
    qtyCount.forEach(qtyCount => {
      qtyCount.innerHTML = cart.totalQuantity;
    });
  }

}

function shoppingCartOnlyUpdate() {
  const shoppingCarts = document.querySelectorAll('shopify-cart.shopcomponent_cart');

  if (shoppingCarts.length) {
    shoppingCarts.forEach((cart) => {
      cart.addEventListener('click', (e) => {
        const mostParentContainer = e.target.closest('.shopcomponent_pd_container');

        if (!mostParentContainer) return;

        // the cart inside the clicked container
        const currentShoppingCart = mostParentContainer.querySelector('shopify-cart.shopcomponent_cart');

        // all other carts in the DOM
        const otherShoppingCarts = document.querySelectorAll('shopify-cart.shopcomponent_cart');

        otherShoppingCarts.forEach((otherCart) => {
          if (otherCart !== currentShoppingCart) {
            const clone = otherCart.cloneNode(true);
            otherCart.parentNode.replaceChild(clone, otherCart);
          }
        });
      });
    });
  }
}


//  const cartOri = document.querySelector('.shopcomponent_cart');

// cartOri.addEventListener('click',(e)=>{
//   console.log('cartOri',e.target);
// });

setTimeout(() => {
  const localData = localStorage.getItem('shopcomponentData');
  const parsedData = localData ? JSON.parse(localData) : {};
  poweredByAddFnc(parsedData.plan, parsedData.shop);
}, 1500)

function poweredByAddFnc(planName = 'Free', shop) {
  if (planName !== 'Free') {
    return;
  }

  const urlPath = window.location.origin;

  console.log('urlPath', urlPath);

  const poweredBy = document.querySelectorAll('.shopcomponent_pd_container');
  if (poweredBy) {
    poweredBy.forEach(poweredBy => {
      const poweredByDiv = document.createElement('div');
      poweredByDiv.innerHTML = `
          <div style="font-size: 12px;display:flex;justify-content:end;align-items:center;gap:5px;">Powered by <a style="font-size: 14px; font-weight: 600;text-decoration: none;color:#0000ee" href="https://shopcomponent.com/?utm_source=${window.location.host}&utm_medium=${shop}&utm_campaign=pby" target="_blank" rel="noopener noreferrer"> Shopcomponent</a></div>
      `;
      poweredBy.appendChild(poweredByDiv);
    });
  }

}


console.log('Shopcomponent loaded..');


