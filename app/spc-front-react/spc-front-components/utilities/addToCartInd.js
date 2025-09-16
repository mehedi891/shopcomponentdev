import cartCreateFnc from "./cartCreateFnc";
import cartLineAddFnc from "./cartLineAddFnc";
import { dispatchCartUpdate, getSelectedVariantId, showLoading } from "./utilisFnc";

async function addToCartIndFnc(event, token, store, tracking, customerTracking, appliesTo, fullView) {
  event.preventDefault();

  const target = event.target;
  const mostParentContainer = target.closest('.shopcomponent_pd_container');
 
  const variantId = getSelectedVariantId(target,appliesTo,fullView);

  const isExistCart = localStorage.getItem('shopcomponent_cartId') ? localStorage.getItem('shopcomponent_cartId') : null;
  showLoading(target, true);

  const selectedVariant = [
    {
      merchandiseId: variantId,
      quantity: 1
    }
  ];
  if (isExistCart) {
    try {
      const cartAdd = await cartLineAddFnc(isExistCart, selectedVariant, store, token);
      if (cartAdd?.success) {

        dispatchCartUpdate(cartAdd.cartData);
        setTimeout(() => {
          mostParentContainer.querySelector('shopify-cart').showModal();

        }, 1000);

      } else if (cartAdd?.error) {
        if (cartAdd.error[0]?.field[0] === "cartId") {
          const createCart = await cartCreateFnc(selectedVariant, store, token, tracking, customerTracking);
          if (createCart?.success) {
            dispatchCartUpdate(createCart.cartData);
            setTimeout(() => {
              mostParentContainer.querySelector('shopify-cart').showModal();

            }, 1000);
          }
        }
      }
    } catch (error) {
      console.error("Existing Add to cart error:", error);
    } finally {
      showLoading(target, false);
    }
  } else {
    try {
      const createCart = await cartCreateFnc(selectedVariant, store, token, tracking, customerTracking);
      if (createCart?.success) {
        dispatchCartUpdate(createCart.cartData);
        setTimeout(() => {
          mostParentContainer.querySelector('shopify-cart').showModal();
        }, 1000);
      }
    } catch (error) {
      console.error("Create cart error:", error);
    } finally {
      showLoading(target, false);
    }
  }




}






export default addToCartIndFnc;