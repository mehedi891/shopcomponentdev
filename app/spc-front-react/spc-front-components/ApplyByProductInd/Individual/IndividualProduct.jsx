import { useContext, useEffect, useState } from "react";
import PoweredBy from "../../PoweredBy/PoweredBy";
import GlobalStyle from "../../Styles/GlobalStyle/GlobalStyle";
import ProductCardInd from "./ProductCardInd/ProductCardInd";
import ShoppingCart from "../../ShoppingCart/ShoppingCart";
import { ContextComponent } from "../../../entryPoints/ContextWrapper/ContextWrapper";
import { getSelectedVariantId, showLoading } from "../../utilities/utilisFnc";
import cartLineAddFnc from "../../utilities/cartLineAddFnc";
import cartCreateFnc from "../../utilities/cartCreateFnc";
import CartCountBuble from "../../ShoppingCart/CartCountBuble/CartCountBuble";



const IndividualProduct = ({ componentData, token, store }) => {
  const { title, description, buttonStyleSettings, componentSettings, productLayoutSettings, shoppingCartSettings, customCss, tracking, layout, shop, appliesTo, addToCartType } = componentData;
  const [selectecTedProducts, setSelectecTedProducts] = useState([]);
  const { cartModal, cartRef } = useContext(ContextComponent);
  const { setCartData, setCartTotalCount } = cartRef.current;


  const moveSliderPrevNext = (btnType) => {
    const slider = document.querySelector(".shopcomponent_product_layout_gridSlider");
    const slideWidth = slider.querySelector(".product-card").offsetWidth + 16;
    slider.scrollBy({ left: btnType === 'next' ? slideWidth : -slideWidth, behavior: "smooth" });
  }




  useEffect(() => {
    setSelectecTedProducts(shop?.plan?.planName === "Free" ? addToCartType?.products?.slice(0, 3) : addToCartType?.products)
  }, [addToCartType.products, shop?.plan?.planName]);




  const handleAddToCart = async (event, token, store, tracking, customerTracking, appliesTo, fullView) => {
    const target = event.target;

    const variantId = getSelectedVariantId(target, appliesTo, fullView);

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
          setCartData({ ...cartAdd.cartData });
          setCartTotalCount(cartAdd.cartData.totalQuantity);
        } else if (cartAdd?.error) {
          if (cartAdd.error[0]?.field[0] === "cartId") {
            const createCart = await cartCreateFnc(selectedVariant, store, token, tracking, customerTracking);
            if (createCart?.success) {
              setCartData({ ...createCart.cartData });
              setCartTotalCount(createCart.cartData.totalQuantity);
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
        const createCart = await cartCreateFnc(selectedVariant, store, token, tracking, customerTracking);
        if (createCart?.success) {
          setCartData({ ...createCart.cartData });
          setCartTotalCount(createCart.cartData.totalQuantity);
        }
      } catch (error) {
        console.error("Create cart error:", error);
      } finally {
        showLoading(target, false);
        cartModal?.current?.showModal();
      }
    }


    //console.log("selectedVariant:", selectedVariant);
  };

  const handleAddToCheckout = async (event, token, store, tracking, customerTracking, appliesTo, fullView) => {
    event.preventDefault();

    const target = event.target;
    const variantId = getSelectedVariantId(target, appliesTo, fullView);
    showLoading(target, true);

    console.log("variantId:", variantId);

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
  }



  useEffect(() => {
    window.spcAddToCartIndFnc = (event, ...args) => {
      handleAddToCart(event, ...args);
    };
    window.spcAddToCheckoutFnc = (event, ...args) => {
      handleAddToCheckout(event, ...args);
    }
  }, []);

  return (
    <div>
      <shopify-store store-domain={shop?.shopifyDomain || `${store}.myshopify.com`} public-access-token={shop?.headlessAccessToken ? shop?.headlessAccessToken : shop?.scAccessToken || token} country="US" language="en"></shopify-store>


      <div className="shopcomponent_pd_container">

        {componentSettings.cartBehavior === 'cart' && <CartCountBuble />}

        <div className="shopcomponent_title_N_description">
          <div className="shopcomponent_title">{title}</div>
          <div className="shopcomponent_description">{description}</div>
        </div>

        <div className={`shopcomponent_slider_container_${layout}`}>
          <button className="shopcomponent__slider-button next" onClick={() => moveSliderPrevNext('next')}>❯</button>
          <div className={`shopcomponent_products_flex shopcomponent_product_layout_${layout}`}>
            {selectecTedProducts?.length > 0 && selectecTedProducts?.map((product, index) =>

              <ProductCardInd
                key={index} product={product}
                tracking={tracking}
                componentSettings={componentSettings}
                viewBtnTxt={buttonStyleSettings.viewBtnTxt}
                token={shop?.scAccessToken || token}
                store={shop?.shopifyDomain || `${store}.myshopify.com`}
                customerTracking={componentData?.customerTracking || ''}
                addToCartBtnTxt={buttonStyleSettings.addToCartBtnTxt}
                checkoutBtnTxt={buttonStyleSettings.checkoutBtnTxt}
                shop={shop}
                appliesTo={appliesTo}
                layout={layout}
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
        />


      </div>

      {shop?.plan?.planName === 'Free' &&
        <PoweredBy
          shop={shop.shopifyDomain.replace('.myshopify.com', '')}
        />
      }

      <GlobalStyle
        buttonStyleSettings={buttonStyleSettings}
        componentSettings={componentSettings}
        productLayoutSettings={productLayoutSettings}
        shoppingCartSettings={shoppingCartSettings}
        customCss={customCss}
        tracking={tracking}
      />

    </div>
  )
}

export default IndividualProduct



