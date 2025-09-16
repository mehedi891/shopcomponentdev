import { getSelectedVariantId, showLoading } from "./utilisFnc";

const addToCheckoutInd = (event, token, store, tracking, customerTracking, appliesTo, fullView) => {
  event.preventDefault();

  const target = event.target;
  const variantId = getSelectedVariantId(target, appliesTo, fullView);
  showLoading(target, true);

  try {
    const variantIdNum = variantId.replace('gid://shopify/ProductVariant/', '');
    const checkoutUrl = `https://${store}/cart/${variantIdNum}:1?access_token=${token}&attributes[SC_custom_tracking]=${customerTracking}&attributes[shopcomponent_tracking]=${tracking}&ref=shopcomponent`;
    // window.location.href = checkoutUrl;
    window.open(checkoutUrl, '_top');

    //Open new tab
    //window.open(checkoutUrl, '_blank');

  } catch (error) {
    console.error("Checkout redirection error:", error);
  } finally {
    showLoading(target, false);
  }

};

export default addToCheckoutInd;