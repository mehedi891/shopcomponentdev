import GlobalStyle from "../Styles/GlobalStyle/GlobalStyle";
import BulkProductCard from "./BulkProductCard/BulkProductCard";
import PoweredBy from "../PoweredBy/PoweredBy";
import CartCountBuble from "../ShoppingCart/CartCountBuble/CartCountBuble";
import ShoppingCart from "../ShoppingCart/ShoppingCart";
import { useContext } from "react";
import { ContextComponent } from "../../entryPoints/ContextWrapper/ContextWrapper";
import { resetSelectedQuantity, showLoading } from "../utilities/utilisFnc";
import cartLineAddFnc from "../utilities/cartLineAddFnc";
import cartCreateFnc from "../utilities/cartCreateFnc";

const BulkProduct = ({ componentData, token, store }) => {
  const { title, description, buttonStyleSettings, componentSettings, productLayoutSettings, shoppingCartSettings, customCss, tracking, layout, shop, enableQtyField, customerTracking, addToCartType } = componentData;

  const { cartModal, cartRef } = useContext(ContextComponent);
  const { setCartData, setCartTotalCount } = cartRef.current;

  const moveSliderPrevNext = (btnType) => {
    const slider = document.querySelector(".shopcomponent_product_layout_gridSlider");
    const slideWidth = slider.querySelector(".product-card").offsetWidth + 16;
    slider.scrollBy({ left: btnType === 'next' ? slideWidth : -slideWidth, behavior: "smooth" });
  }


  const handleAddToCartBulk = async (event, token, store, tracking, customerTracking, enableQtyField, products) => {
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

          setCartData({ ...cartAdd.cartData });
          setCartTotalCount(cartAdd.cartData.totalQuantity);

          if (enableQtyField) resetSelectedQuantity(mostParentContainer);

        } else if (cartAdd?.error) {
          if (cartAdd.error[0]?.field[0] === "cartId") {
            const createCart = await cartCreateFnc(selectedVariants, store, token, tracking, customerTracking);
            if (createCart?.success) {
              setCartData({ ...createCart.cartData });
              setCartTotalCount(createCart.cartData.totalQuantity);
              if (enableQtyField) resetSelectedQuantity(mostParentContainer);
            }
          }
        }
      } catch (error) {
        console.error("Existing Add to cart error:", error);
      } finally {
        showLoading(target, false);
        cartModal?.current?.showModal();
      }
    } else {
      try {
        const createCart = await cartCreateFnc(selectedVariants, store, token, tracking, customerTracking);
        if (createCart?.success) {
          setCartData({ ...createCart.cartData });
          setCartTotalCount(createCart.cartData.totalQuantity);
          if (enableQtyField) resetSelectedQuantity(mostParentContainer);
        }
      } catch (error) {
        console.error("Create cart error:", error);
      } finally {
        showLoading(target, false);
        cartModal?.current?.showModal();
      }
    }
  }

  const handleAddToCheckoutBulk = (event, token, store, tracking, customerTracking, enableQtyField, products) => {
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

        {componentSettings.cartBehavior === 'cart' && <CartCountBuble />}

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


        <ShoppingCart
          cartModal={cartModal}
          cartRef={cartRef}
          store={shop?.shopifyDomain}
          token={token}
          shoppingCartSettings={componentData?.shoppingCartSettings}
        />
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