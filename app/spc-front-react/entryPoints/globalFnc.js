// Install once (helps with HMR / multiple mounts)
if (!window.__SPC_CART_FETCH_HOOK__) {
  window.__SPC_CART_FETCH_HOOK__ = true;

  const originalFetch = window.fetch.bind(window);

  const isTargetMutation = (q) =>
    typeof q === "string" &&
    (q.includes("mutation cartLinesUpdate") ||
      q.includes("mutation cartLinesRemove"));

  const updateCartCount = (qty) => {
    const count = Number.isFinite(Number(qty)) ? Number(qty) : 0;
    const els = document.querySelectorAll(".shopcomponent_cart_count_qty");

    els.forEach((el) => {

      // if(el.innerText === "0" || el.innerText === 0 || !el.innerText){
      //   const parent = el.closest(".shopcomponent_cart_count");
      //   parent.setAttribute("area-hidden", "true");
      //   return;
      // }else{
      //   const parent = el.closest(".shopcomponent_cart_count");
      //   parent.removeAttribute("area-hidden");
      // }
      el.textContent = String(count);

    });

  };

  // Read body JSON safely whether fetch was called with a Request or (url, init)
  const readBodyJSON = async (input, init) => {
    try {
      if (input instanceof Request) {
        const txt = await input.clone().text();
        return txt ? JSON.parse(txt) : null;
      }
      const body = init?.body;
      if (typeof body === "string") return JSON.parse(body);
      return null; // not JSON string (FormData, Blob, etc.)
    } catch {
      return null;
    }
  };

  window.fetch = async function fetchHook(input, init) {
    // Start parsing the request body in parallel to the network call
    const bodyPromise = readBodyJSON(input, init);

    // Do the real request
    const response = await originalFetch(input, init);


    // After we have the response, check whether the request was our target mutation
    const body = await bodyPromise;
    const query = body?.query;

    if (isTargetMutation(query)) {

      try {
        const data = await response.clone().json();
        const cart =
          data?.data?.cartLinesUpdate?.cart ??
          data?.data?.cartLinesRemove?.cart;

        updateCartCount(cart?.totalQuantity);
        window?.spc_shoppingCartOnlyUpdate?.();
      } catch {
        // Non-JSON or unreadable response; ignore
      }
    }

    return response;
  };
}


const mo = new MutationObserver(() => {
  const newBadges = document.querySelectorAll(".shopcomponent_cart_count_qty");
  if (newBadges.length) {
    newBadges.forEach((el) => {

      if (!el.innerText) {
        // const parent = el.closest(".shopcomponent_cart_count");
        // parent.setAttribute("area-hidden", "true");
        el.innerText = 0;
        return
      }
      return;
    });
  }
});
mo.observe(document.documentElement, { childList: true, subtree: true });


if (!window.spc_shoppingCartOnlyUpdate) {
  window.spc_shoppingCartOnlyUpdate = function () {
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
}


setTimeout(() => {
  console.log(
    "%c ShopComponent app loaded.. ",
    `background: linear-gradient(
    135deg,
    #FDDDE6 0%,
    #F4B7FF 25%,
    #B499FF 50%,
    #9AC5FF 75%,
    #FFE4B5 100%
  ); 
  color: white; 
  font-weight: bold; 
  font-size: 16px; 
  padding: 6px 14px; 
  border-radius: 6px;`
  );
}, 1000);