const dispatchCartUpdate = (cart) => {
  const shoppingCart = document.querySelectorAll('shopify-cart');
  const qtyCount = document.querySelectorAll('.shopcomponent_cart_count_qty');
  const evt = new CustomEvent('shopify:cartData', {
    detail: cart,
  });

  //console.log('cart dispact');

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

const getSelectedVariantId = (targetElement,appliesTo,fullView)=>{
   let variantId = '';
  if (appliesTo == 'collection' && fullView === 'true') {
    const variantNodeParent = targetElement.closest('.product-modal__container');
    const variantNode = variantNodeParent.querySelector('.product-card__variant-selector');
    variantId = variantNode.getAttribute('data-variant-id');
  } else {
    const variantNodeParent = targetElement.closest('.product-card');
    const variantNode = variantNodeParent.querySelector('.product-card__variant-selector');
    variantId = variantNode.getAttribute('data-variant-id');
  }
  return variantId;
}

const showLoading = (btn, isLoading) => {
  const btnToLoad = btn.closest('.product-card__add-button');
  if (isLoading) {
    btnToLoad.classList.add('loading');
  } else {
    setTimeout(() => {
      btnToLoad.classList.remove('loading');
    }, 500)
  }
}

const  updateQuantity = (event, type) =>{
  const quantityParentField = event.target.closest('.shopcomponent_variants_bulk_enable_quantity');
  const quantityField = quantityParentField.querySelector('.shopcomponent_variants_bulk_enable_quantity_input');
  if (type === 'inc') {
    quantityField.value = quantityField.value * 1 + 1;
    
  } else {
    if (quantityField.value * 1 <= 0) {
      return;
    }
    quantityField.value = quantityField.value * 1 - 1;
  }
}

const resetSelectedQuantity = (container) => {
  const quantityInputs = container.querySelectorAll('.shopcomponent_variants_bulk_enable_quantity_input');
  quantityInputs.forEach(input => {
    input.value = 0;
  });
 }




export {
  dispatchCartUpdate,
  showLoading,
  getSelectedVariantId,
  updateQuantity,
  resetSelectedQuantity,
}