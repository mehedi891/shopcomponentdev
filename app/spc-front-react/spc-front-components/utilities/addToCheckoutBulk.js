import { showLoading } from "./utilisFnc";

const addToCheckoutBulk = async (event, token, store, tracking, customerTracking, enableQtyField, products) => {
  event.preventDefault();

  const target = event.target;
  const mostParentContainer = target.closest('.shopcomponent_pd_container');

  let selectedVariants = [];
 

  if (!enableQtyField) {
    selectedVariants = (products ?? []).flatMap(product =>
      (product.variants ?? [])
        .filter(variant => Number(variant.quantity ?? 0) > 0)
        .map(variant => `${[variant.id.replace('gid://shopify/ProductVariant/', '')]}:${Number(variant.quantity)}`)
    )
  } else {
    const quantityInputs = mostParentContainer.querySelectorAll('.shopcomponent_variants_bulk_enable_quantity_input');
    selectedVariants = quantityInputs?.length > 0 ? Array.from(quantityInputs)
      .filter(item => Number(item.value) > 0)
      .map(variant => `${[variant.getAttribute('data-variant-id').replace('gid://shopify/ProductVariant/', '')]}:${Number(variant.value)}`)
      : [];
    if (selectedVariants.length === 0) {
      alert('Please select at least one product with quantity greater than zero.');
      return;
    }
  }

   showLoading(event.target, true);
   
  try {
    const checkoutUrl = `https://${store}/cart/${selectedVariants.join(',')}?access_token=${token}&attributes[SC_custom_tracking]=${customerTracking}&attributes[shopcomponent_tracking]=${tracking}&ref=shopcomponent`;

    window.open(checkoutUrl, '_top');

    //Open new tab
    //window.open(checkoutUrl, '_blank');

    setTimeout(() => {
      showLoading(event.target, false);
    }, 500);
  } catch (error) {
    console.log("Checkout redirection error:", error);
  } finally {
    showLoading(event.target, false);
  }




}

export default addToCheckoutBulk