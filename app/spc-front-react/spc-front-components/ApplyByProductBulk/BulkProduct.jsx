import { useEffect } from "react";
import GlobalStyle from "../Styles/GlobalStyle/GlobalStyle";
import BulkProductCard from "./BulkProductCard/BulkProductCard";
import addToCartBulk from "../utilities/addToCartBulk";
import addToCheckoutBulk from "../utilities/addToCheckoutBulk";
import PoweredBy from "../PoweredBy/PoweredBy";

const BulkProduct = ({ componentData, token, store }) => {
  const { title, description, buttonStyleSettings, componentSettings, productLayoutSettings, shoppingCartSettings, customCss, tracking, layout, shop, enableQtyField, customerTracking, addToCartType } = componentData;

  const moveSliderPrevNext = (btnType) => {
    const slider = document.querySelector(".shopcomponent_product_layout_gridSlider");
    const slideWidth = slider.querySelector(".product-card").offsetWidth + 16;
    slider.scrollBy({ left: btnType === 'next' ? slideWidth : -slideWidth, behavior: "smooth" });
  }


  const handleAddToCartBulk = (event, token, store, tracking, customerTracking, enableQtyField, products) => {
    return addToCartBulk(event, token, store, tracking, customerTracking, enableQtyField, products);
  }

  const handleAddToCheckoutBulk = (event, token, store, tracking, customerTracking, enableQtyField, products) => {
    return addToCheckoutBulk(event, token, store, tracking, customerTracking, enableQtyField, products)
  }

  const floatingCartCountBuble = `
    <div class="shopcomponent_cart_btn" onclick="document.querySelector('shopify-cart').showModal()">
                <div class="shopcomponent_cart_icon">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M2 3.66669C2 3.1144 2.44772 2.66669 3 2.66669H5.14932C6.3119 2.66669 7.29387 3.52176 7.45873 4.66669H20.3333C20.6119 4.66669 20.8778 4.78286 21.0671 4.98724C21.2563 5.19161 21.3518 5.46566 21.3304 5.74338L20.8531 11.9479C20.7062 13.8582 19.1132 15.3334 17.1973 15.3334H8.72928L8.85302 16.3728C8.87298 16.5404 9.01517 16.6667 9.18402 16.6667H17.6667C18.219 16.6667 18.6667 17.1144 18.6667 17.6667C18.6667 18.219 18.219 18.6667 17.6667 18.6667H9.18402C8.00205 18.6667 7.00677 17.7829 6.86705 16.6092L5.48031 4.96062C5.46035 4.79295 5.31817 4.66669 5.14932 4.66669H3C2.44772 4.66669 2 4.21897 2 3.66669ZM8.49119 13.3334H17.1973C18.0681 13.3334 18.7922 12.6628 18.859 11.7945L19.2535 6.66669H7.69754L8.49119 13.3334Z" fill="white"/>
                        <path d="M12 21.3334C12 22.0697 11.403 22.6667 10.6667 22.6667C9.93029 22.6667 9.33333 22.0697 9.33333 21.3334C9.33333 20.597 9.93029 20 10.6667 20C11.403 20 12 20.597 12 21.3334Z" fill="white"/>
                        <path d="M18.6667 21.3334C18.6667 22.0697 18.0697 22.6667 17.3333 22.6667C16.597 22.6667 16 22.0697 16 21.3334C16 20.597 16.597 20 17.3333 20C18.0697 20 18.6667 20.597 18.6667 21.3334Z" fill="white"/>
                        </svg>
                            <div class="shopcomponent_cart_count">
                            <shopify-context id="cart_modal_context" type="cart" wait-for-update>
                              <template>
                                <shopify-data class="shopcomponent_cart_count_qty" query="cart.totalQuantity"></shopify-data>
                          
                              </template>
                            </shopify-context>
                           
                          </div>
                </div>
            </div>

`;

  return (
    <div className="shopcomponent_pd_container">

      <shopify-store store-domain={shop?.shopifyDomain || `${store}.myshopify.com`} public-access-token={shop?.headlessAccessToken ? shop?.headlessAccessToken : shop?.scAccessToken || token} country="US" language="en"></shopify-store>
      <GlobalStyle
        buttonStyleSettings={buttonStyleSettings}
        componentSettings={componentSettings}
        productLayoutSettings={productLayoutSettings}
        shoppingCartSettings={shoppingCartSettings}
        customCss={customCss}
        tracking={tracking}
      />

      <div>
        {componentSettings.cartBehavior === 'cart' && <div dangerouslySetInnerHTML={{ __html: floatingCartCountBuble }} />}
        <div className="shopcomponent_title_N_description">
          <div className="shopcomponent_title">{title}</div>
          <div className="shopcomponent_description">{description}</div>
        </div>

        <div className={`shopcomponent_slider_container_${layout}`}>
          <button className="shopcomponent__slider-button next" onClick={() => moveSliderPrevNext('next')}>❯</button>
          <div className={`shopcomponent_products_flex shopcomponent_product_layout_${layout}`}>
            {addToCartType?.products?.map((product, index) =>

              <BulkProductCard
                key={index}
                product={product}
                tracking={tracking}
                enableQtyField={enableQtyField}
              />
            )}
          </div>
          <button className="shopcomponent__slider-button prev" onClick={() => moveSliderPrevNext('prev')}>❮</button>
        </div>


        <shopify-cart id="cart" className="shopcomponent_cart">
          <div slot="header" className="shopcomponent_cart_header">
            {shoppingCartSettings.heading}
          </div>
          <div className="shopcomponent_discount_title" slot="discounts-title">
            {shoppingCartSettings.additionalInfo}
          </div>
          <div className="shopcomponent_empty_cart_txt" slot="empty">
            {shoppingCartSettings.emptyCartText}
          </div>
        </shopify-cart>
      </div>


      {componentSettings.cartBehavior == 'cart' &&
        <div className="product-card__buttons shopcomponent_pd_buttons_bulk">
          <button
            className={`product-card__add-button product-card__add-to-cart-button spcProductCardBtn_${tracking}`}
            onClick={(event) => { handleAddToCartBulk(event, shop.scAccessToken, shop.shopifyDomain, tracking, customerTracking, enableQtyField, addToCartType.products) }}
            shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale"
          >
            <span className="spcBtn_txt"> {buttonStyleSettings.addToCartBtnTxt}</span>
            <span className="spcBtn_outOfStock">Out of stock</span>
          </button>
        </div>
      }

      {componentSettings.cartBehavior == 'checkout' &&
        <div className="product-card__buttons shopcomponent_pd_buttons_bulk">
          <button
            className={`product-card__add-button product-card__checkout-button spcProductCardBtn_${tracking}`}
            onClick={(event) => { handleAddToCheckoutBulk(event, shop.scAccessToken, shop.shopifyDomain, tracking, customerTracking, enableQtyField, addToCartType.products) }}
            shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale"
          >
            <span className="spcBtn_txt"> {buttonStyleSettings.checkoutBtnTxt}</span>
            <span className="spcBtn_outOfStock">Out of stock</span>
          </button>
        </div>
      }

      {shop?.plan?.planName === 'Free' &&
          <PoweredBy
            shop={shop.shopifyDomain.replace('.myshopify.com', '')}
          />
        }

    </div>
  )
}

export default BulkProduct