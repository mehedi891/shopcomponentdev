import { useContext, useEffect, useRef, useState } from "react";
import ProductCardInd from "../../ApplyByProductInd/Individual/ProductCardInd/ProductCardInd";
import PoweredBy from "../../PoweredBy/PoweredBy";
import GlobalStyle from "../../Styles/GlobalStyle/GlobalStyle";
import { getSelectedVariantId, showLoading } from "../../utilities/utilisFnc";
import cartLineAddFnc from "../../utilities/cartLineAddFnc";
import cartCreateFnc from "../../utilities/cartCreateFnc";
import { ContextComponent } from "../../../entryPoints/ContextWrapper/ContextWrapper";
import ShoppingCart from "../../ShoppingCart/ShoppingCart";
import { PLAN_NAME } from "../../../../constants/constants";
import { buildUtmParams } from "../../../../utilis/generalUtils";
import { storeAnalyticsDataToServer } from "../../../../utilis/storeAnalyticsDataToServer";

const IndividualCollection = ({ componentData, token, store }) => {
  const { id, title, description, buttonStyleSettings, componentSettings, productLayoutSettings, shoppingCartSettings, tracking, layout, shop, appliesTo, utmSource, utmMedium, utmCampaign ,market } = componentData;
  const [customTrackings, setCustomTrackings] = useState("");

  const { cartModal, cartRef } = useContext(ContextComponent);
  const { setCartData, setCartTotalCount } = cartRef.current;
  const divRef = useRef(null);
  const [hasViewed, setHasViewed] = useState(false);




  let trafficSource = '';
  if (typeof window !== "undefined") {
    const { origin, pathname } = window.location.origin !== 'null' ? window.location : window.parent.location;
    // Remove trailing slash if it exists in the pathname
    trafficSource = `${origin}${pathname.replace(/\/$/, "")}`;
  }
  const date = new Date()
  const day = date.toISOString().split('T')[0];



  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // If the element is in view
          if (!hasViewed) {
            console.log("Element is entering the viewport for the first time");
            storeAnalyticsDataToServer({ shopifyDomain: shop?.shopifyDomain || store + '.myshopify.com', trafficSource, componentId: id, day, isIncImpression: false, impressionIncVal: 0, isIncUniqueVisitor: true, uniqueVisitorIncVal: 1, isIncAddToCartClick: false, addTocartClickIncVal: 0, isIncCheckoutClick: false, checkoutClickIncVal: 0 });
            setHasViewed(true);
          } else {
            console.log("Element is in the viewport again (re-entered)");
          }
        } else {
          // If the element is out of view
          console.log("Element is not in the viewport");
        }
      },
      {
        threshold: 0.2, // Trigger when 20% of the element is visible
      }
    );

    if (divRef.current) {
      observer.observe(divRef.current);
    }

    // Cleanup observer on unmount
    return () => {
      if (divRef.current) {
        observer.unobserve(divRef.current);
      }
    };
  }, [hasViewed]);

  const moveSliderPrevNext = (btnType) => {
    const slider = document.querySelector(".shopcomponent_product_layout_gridSlider");
    const slideWidth = slider.querySelector(".product-card").offsetWidth + 16;
    slider.scrollBy({ left: btnType === 'next' ? slideWidth : -slideWidth, behavior: "smooth" });
  }

  useEffect(() => {
    if (shop?.plan?.planName === PLAN_NAME.pro) {
      setCustomTrackings(buildUtmParams({ source: utmSource, medium: utmMedium, campaign: utmCampaign }));
    }

  }, [shop?.plan?.planName]);

  const handleAddToCart = async (event, token, store, tracking, customerTracking, appliesTo, fullView, componentId) => {
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

    storeAnalyticsDataToServer({ shopifyDomain: store, trafficSource, componentId: Number(componentId), day, isIncImpression: false, impressionIncVal: 0, isIncUniqueVisitor: false, uniqueVisitorIncVal: 0, isIncAddToCartClick: true, addTocartClickIncVal: 1, isIncCheckoutClick: false, checkoutClickIncVal: 0 });

    //console.log("selectedVariant:", selectedVariant);
  };

  const handleAddToCheckout = async (event, token, store, tracking, customerTracking, appliesTo, fullView, customTrackings, componentId) => {
    event.preventDefault();

    const target = event.target;
    const variantId = getSelectedVariantId(target, appliesTo, fullView);
    showLoading(target, true);

    console.log("variantId:", variantId);

    try {
      const variantIdNum = variantId.replace('gid://shopify/ProductVariant/', '');
      const checkoutUrl = `https://${store}/cart/${variantIdNum}:1?access_token=${token}&attributes[EU_custom_tracking]=${customerTracking}&attributes[embedup_tracking]=${tracking}&ref=embedup${customTrackings}`;
      // window.location.href = checkoutUrl;
      window.open(checkoutUrl, '_top');

      //Open new tab
      //window.open(checkoutUrl, '_blank');

    } catch (error) {
      console.error("Checkout redirection error:", error);
    } finally {
      showLoading(target, false);
    }
    storeAnalyticsDataToServer({ shopifyDomain: store, trafficSource, componentId: Number(componentId), day, isIncImpression: false, impressionIncVal: 0, isIncUniqueVisitor: false, uniqueVisitorIncVal: 0, isIncAddToCartClick: false, addTocartClickIncVal: 0, isIncCheckoutClick: true, checkoutClickIncVal: 1 });
  }



  useEffect(() => {
    if (window && !window.spcAddToCartIndFnc && !window.spcAddToCheckoutFnc) {
      window.spcAddToCartIndFnc = (event, ...args) => {
        handleAddToCart(event, ...args);
      };
      window.spcAddToCheckoutFnc = (event, ...args) => {
        handleAddToCheckout(event, ...args);
      }
    }
  }, []);


  return (
    <div ref={divRef}>
      <shopify-store store-domain={shop?.shopifyDomain || `${store}.myshopify.com`} public-access-token={shop?.headlessAccessToken ? shop?.headlessAccessToken : shop?.scAccessToken || token} country={market || 'US'} language="en"></shopify-store>
      <GlobalStyle
        buttonStyleSettings={buttonStyleSettings}
        componentSettings={componentSettings}
        productLayoutSettings={productLayoutSettings}
        shoppingCartSettings={shoppingCartSettings}
        customCss={componentSettings?.customCss}
        tracking={tracking}

      />

      <div className="shopcomponent_pd_container">

        <div className="shopcomponent_title_N_description">
          <div className="shopcomponent_title">{title}</div>
          <div className="shopcomponent_description">{description}</div>
        </div>

        <div className={`shopcomponent_slider_container_${layout}`}>
          <button className="shopcomponent__slider-button next" onClick={() => moveSliderPrevNext('next')}>❯</button>

          {componentData?.addToCartType?.products?.map((product, index) =>

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
              customTrackings={customTrackings}
              componentId={id}
              market={market}
            />
          )}


          <button className="shopcomponent__slider-button prev" onClick={() => moveSliderPrevNext('prev')}>❮</button>
        </div>

        <ShoppingCart
          cartModal={cartModal}
          cartRef={cartRef}
          store={shop?.shopifyDomain}
          token={token}
          shoppingCartSettings={componentData?.shoppingCartSettings}
          customTrackings={customTrackings}
          componentId={id}
          day={day}
          trafficSource={trafficSource}
          market={market}
        />

      </div>

      {shop?.plan?.planName === 'Free' &&
        <PoweredBy
          shop={shop.shopifyDomain.replace('.myshopify.com', '')}
        />
      }

    </div>
  )
}

export default IndividualCollection