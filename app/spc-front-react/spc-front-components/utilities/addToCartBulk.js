import cartCreateFnc from "./cartCreateFnc";
import cartLineAddFnc from "./cartLineAddFnc";
import { dispatchCartUpdate, resetSelectedQuantity, showLoading } from "./utilisFnc";

const addToCartBulk = async (event, token, store, tracking, customerTracking, enableQtyField, products) => {
  event.preventDefault();

  const target = event.target;
  const mostParentContainer = target.closest('.shopcomponent_pd_container');

  const isExistCart = localStorage.getItem('shopcomponent_cartId') ? localStorage.getItem('shopcomponent_cartId') : null;

  let selectedVariants = [];

  if (!enableQtyField) {
    selectedVariants = (products ?? []).flatMap(product =>
      (product.variants ?? [])
        .filter(variant => Number(variant.quantity ?? 0) > 0)
        .map(variant => ({ merchandiseId: variant.id, quantity: Number(variant.quantity) }))
    );
  } else {
    const quantityInputs = mostParentContainer.querySelectorAll('.shopcomponent_variants_bulk_enable_quantity_input');
    quantityInputs.forEach(input => {
      const quantity = Number(input.value);
      if (quantity > 0) {
        selectedVariants.push({ merchandiseId: input.getAttribute('data-variant-id'), quantity });
      }
    });
    if (selectedVariants.length === 0) {
      alert('Please select at least one product with quantity greater than zero.');
      return;
    }
  }


  showLoading(target, true);


  if (isExistCart) {
    try {
      const cartAdd = await cartLineAddFnc(isExistCart, selectedVariants, store, token);
      if (cartAdd?.success) {

        dispatchCartUpdate(cartAdd.cartData);
        setTimeout(() => {
          mostParentContainer.querySelector('shopify-cart').showModal();

        }, 1000);

        if(enableQtyField) resetSelectedQuantity(mostParentContainer);

      } else if (cartAdd?.error) {
        if (cartAdd.error[0]?.field[0] === "cartId") {
          const createCart = await cartCreateFnc(selectedVariants, store, token, tracking, customerTracking);
          if (createCart?.success) {
            dispatchCartUpdate(createCart.cartData);
            setTimeout(() => {
              mostParentContainer.querySelector('shopify-cart').showModal();

            }, 1000);
            if(enableQtyField) resetSelectedQuantity(mostParentContainer);
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
      const createCart = await cartCreateFnc(selectedVariants, store, token, tracking, customerTracking);
      if (createCart?.success) {
        dispatchCartUpdate(createCart.cartData);
        setTimeout(() => {
          mostParentContainer.querySelector('shopify-cart').showModal();
        }, 1000);
        if(enableQtyField) resetSelectedQuantity(mostParentContainer);
      }
    } catch (error) {
      console.error("Create cart error:", error);
    } finally {
      showLoading(target, false);
    }
  }

}

export default addToCartBulk