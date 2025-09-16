import { useEffect } from "react";
import addToCartIndFnc from "../../../utilities/addToCartInd";
import addToCheckoutInd from "../../../utilities/addToCheckoutInd";

const ProductCardInd = ({ product, tracking, componentSettings, viewBtnTxt,token,store,customerTracking,addToCartBtnTxt,checkoutBtnTxt,shop,appliesTo,layout }) => {

  useEffect(() => {
    // Define the function globally only once
    if ( window && !window.spcAddToCartIndFnc) {
      window.spcAddToCartIndFnc = function(event, token, store, tracking, customerTracking,appliesTo,fullView) {
        event.preventDefault();
        return addToCartIndFnc(event, token, store, tracking, customerTracking,appliesTo,fullView);
      };
    }
  }, []);

    useEffect(() => {
    // Define the function globally only once
    if ( window && !window.spcCheckoutIndFnc) {
      window.spcCheckoutIndFnc = function(event, token, store, tracking, customerTracking,appliesTo,fullView) {
        event.preventDefault();
        return addToCheckoutInd(event, token, store, tracking, customerTracking,appliesTo,fullView);
      };
    }
  }, []);

  const pdAddToCartBtnHtml = `
                <button
                class="product-card__add-button product-card__add-to-cart-button spcProductCardBtn_${tracking}"
                onclick="spcAddToCartIndFnc(event,'${token}','${store}','${tracking}','${customerTracking}','${appliesTo}','${componentSettings.fullView}')"
               
                shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale"
              >
                <span class="spcBtn_txt">${addToCartBtnTxt}</span>
                 <span class="spcBtn_outOfStock">Out of stock</span>
              </button>
  
  `;

  const pdCheckoutBtnHtml = `
   <button
                class="product-card__add-button product-card__checkout-button spcProductCardBtn_${tracking}"
                onclick="spcCheckoutIndFnc(event,'${token}','${store}','${tracking}','${customerTracking}','${appliesTo}','${componentSettings.fullView}')"
                shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale"
              >
                  <span class="spcBtn_txt">${checkoutBtnTxt}</span>
                 <span class="spcBtn_outOfStock">Out of stock</span>
              </button>
  `;

 const pdQuickViewBtnCollectionHtml = `
        <button
                class="product-card__add-button product-card__view-button spcProductCardBtn_${tracking}"
                onclick="getElementById('shopcomponent-product-modal').showModal(); getElementById('shopcomponent-product-modal-context').update(event);"
              >
                View product
              </button>

    `;
const modalQuickViewHtml = `
<dialog id="shopcomponent-product-modal" class="product-modal" >
  <shopify-context id="shopcomponent-product-modal-context" type="product" wait-for-update>
    <template>
      <div class="product-modal__container">
        <div class="product-modal__close-container">
          <button class="product-modal__close" onclick="getElementById('shopcomponent-product-modal').close();">&#10005;</button>
        </div>
        <div class="product-modal__content">
          <div class="product-modal__layout">
            <div class="product-modal__media">
              <shopify-media width="416" height="416" query="product.selectedOrFirstAvailableVariant.image"></shopify-media>
            </div>
            <div class="product-modal__details">
              <div class="product-modal__header">
                <div>
                  <span class="product-modal__vendor">
                    <shopify-data query="product.vendor"></shopify-data>
                  </span>
                </div>
                <h1 class="product-modal__title">
                  <shopify-data query="product.title"></shopify-data>
                </h1>
                <div class="product-modal__price-container">
                  <shopify-money query="product.selectedOrFirstAvailableVariant.price"></shopify-money>
                  <shopify-money
                    class="product-modal__compare-price"
                    query="product.selectedOrFirstAvailableVariant.compareAtPrice"
                  ></shopify-money>
                </div>
              </div>
              <shopify-variant-selector class="product-card__variant-selector" shopify-attr--data-variant-id="product.selectedOrFirstAvailableVariant.id"></shopify-variant-selector>

              <div class="product-modal__buttons product-card__buttons">
                   ${ componentSettings.cartBehavior == 'cart' ? pdAddToCartBtnHtml : ''}
                   ${ componentSettings.cartBehavior == 'checkout' ? pdCheckoutBtnHtml : ''}
              </div>
              <div class="product-modal__description">
                <span class="product-modal__description-text">
                  <shopify-data query="product.descriptionHtml"></shopify-data>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </shopify-context>
</dialog>

`;
  const productFullViewModalHtml = `

             <button class="product-card__add-button product-card__view-button spcProductCardBtn_${tracking}"
                onclick="getElementById('shopcomponent-product-modal').showModal(); getElementById('shopcomponent-product-modal-context').update(event);"
              >
               ${viewBtnTxt}
              </button>

              ${modalQuickViewHtml}

`

  const productCardHtml = `
    <div class="product-card spcProductCard_${tracking}" id="shopcomponent-${tracking}">
      <shopify-context type="product" handle="${product.handle}">
      <template>
        <div class="product-card__container">
          <div class="product-card__media">
            <div class="product-card__main-image">
              <shopify-media layout="fixed" width="200" height="200" query="product.selectedOrFirstAvailableVariant.image"></shopify-media>
            </div>
          </div>
          <div class="product-card__details">
            <div class="product-card__info">
              <h2 class="product-card__title spcProductCardTitle_${tracking}">
                <shopify-data query="product.title"></shopify-data>
              </h2>
              <div class="product-card__price spcProductCardPrice_${tracking}">
                <shopify-money query="product.selectedOrFirstAvailableVariant.price"></shopify-money>
                <shopify-money
                  class="product-card__compare-price"
                  query="product.selectedOrFirstAvailableVariant.compareAtPrice"
                ></shopify-money>
              </div>
            </div>
            
                 <shopify-variant-selector class="product-card__variant-selector ${componentSettings.fullView ? 'fullview' : ''}" shopify-attr--data-variant-id="product.selectedOrFirstAvailableVariant.id"></shopify-variant-selector>


                <div class="product-card__buttons">
                 ${componentSettings.fullView ? productFullViewModalHtml : ''}
                 ${!componentSettings.fullView && componentSettings.cartBehavior == 'cart' ? pdAddToCartBtnHtml : ''}
                  ${!componentSettings.fullView && componentSettings.cartBehavior == 'checkout' ? pdCheckoutBtnHtml : ''}
                </div>
          </div>
        </div>
      </template>
    </shopify-context>
 
  `;



  const collectionCardHtml = `
  <shopify-context type="collection" handle="${product.handle}">
      <template>
       <shopify-list-context type="product" query="collection.products" first="${shop?.plan?.planName === 'Free' ? 3 : 50}">
       <template>
        <div class="product-card spcProductCard_${tracking}">
        <div class="product-card__container">
          <div class="product-card__media">
            <div class="product-card__main-image">
              <shopify-media layout="fixed" width="200" height="200" query="product.selectedOrFirstAvailableVariant.image"></shopify-media>
            </div>
          </div>
          <div class="product-card__details shopcomponent_product_card__details">
            <div class="product-card__info">
              <h2 class="product-card__title spcProductCardTitle_${tracking}">
                <shopify-data query="product.title"></shopify-data>
              </h2>
              <div class="product-card__price spcProductCardPrice_$tracking}">
                <shopify-money query="product.selectedOrFirstAvailableVariant.price"></shopify-money>
                <shopify-money
                  class="product-card__compare-price"
                  query="product.selectedOrFirstAvailableVariant.compareAtPrice"
                ></shopify-money>
              </div>
            </div>
             <shopify-variant-selector class="product-card__variant-selector ${componentSettings.fullView ? 'fullview' : ''}" shopify-attr--data-variant-id="product.selectedOrFirstAvailableVariant.id"></shopify-variant-selector>
            

           <div class="product-card__buttons">
                 ${componentSettings.fullView ? pdQuickViewBtnCollectionHtml : ''}
                 ${!componentSettings.fullView && componentSettings.cartBehavior == 'cart' ? pdAddToCartBtnHtml : ''}
                  ${!componentSettings.fullView && componentSettings.cartBehavior == 'checkout' ? pdCheckoutBtnHtml : ''}
                </div>

             </div>
          </div>
        </div>
        </template>
        </shopify-list-context>
    </template>
    </shopify-context>
    ${modalQuickViewHtml}
  `;

  return appliesTo === 'product'?<div dangerouslySetInnerHTML={{ __html: productCardHtml }} /> : <div className={`shopcomponent_products_flex shopcomponent_product_layout_${layout}`} dangerouslySetInnerHTML={{ __html: collectionCardHtml }} /> ;
}

export default ProductCardInd