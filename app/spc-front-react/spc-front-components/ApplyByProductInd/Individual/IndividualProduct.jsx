import { useContext, useEffect, useRef, useState } from "react";
import PoweredBy from "../../PoweredBy/PoweredBy";
import GlobalStyle from "../../Styles/GlobalStyle/GlobalStyle";
import ProductCardInd from "./ProductCardInd/ProductCardInd";
import ShoppingCart from "../../ShoppingCart/ShoppingCart";
import { ContextComponent } from "../../../entryPoints/ContextWrapper/ContextWrapper";
import { getSelectedVariantId, showLoading } from "../../utilities/utilisFnc";
import cartLineAddFnc from "../../utilities/cartLineAddFnc";
import cartCreateFnc from "../../utilities/cartCreateFnc";
import { PLAN_NAME } from "../../../../constants/constants";
import { buildUtmParams } from "../../../../utilis/generalUtils";
import { storeAnalyticsDataToServer } from "../../../../utilis/storeAnalyticsDataToServer";



const IndividualProduct = ({ componentData, token, store }) => {
  const { id, title, description, buttonStyleSettings, componentSettings, productLayoutSettings, shoppingCartSettings, tracking, layout, shop, appliesTo, addToCartType, utmSource, utmMedium, utmCampaign,market } = componentData;
  //console.log("componentData222:",componentData);
  const [selectecTedProducts, setSelectecTedProducts] = useState([]);
  const [customTrackings, setCustomTrackings] = useState("");
  const { cartModal, cartRef } = useContext(ContextComponent);
  const { setCartData, setCartTotalCount } = cartRef.current;
  const divRef = useRef(null);
  const [hasViewed, setHasViewed] = useState(false);




  let trafficSource = '';
  if (typeof window !== "undefined" || typeof window.parent !== "undefined") {
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

  // window.sessionStorage.setItem("siiooonn:",JSON.stringify(crypto.randomUUID()));

  // useEffect(() => {
  //   const observer = new IntersectionObserver(
  //     ([entry]) => {
  //       if (entry.isIntersecting) {
  //         // timeoutId.current = setTimeout(() => {
  //         //   setImpCount((prev) => hasSentRequest ? 0 : prev + 1);
  //         //   console.log("Element stayed in the viewport for 5s: cmp::" + id);
  //         // }, 5000);

  //         // setTimeout(() => {
  //         //   if (hasSentRequest) return
  //         //   storeAnalyticsDataToServer({ shopifyDomain: shop?.shopifyDomain || store + '.myshopify.com', trafficSource, componentId: id, day, isIncImpression: true, impressionIncVal: impCount, isIncUniqueVisitor: false, uniqueVisitorIncVal: 0, isIncAddToCartClick: false, addTocartClickIncVal: 0, isIncCheckoutClick: false, checkoutClickIncVal: 0 });
  //         //   setImpCount(0);
  //         //   setHasSentRequest(true);
  //         // }, 15000);

  //         console.log("entry:::ID:",id,entry.intersectionRatio);

  //       } else {
  //         // If the element is not in view, clear the timeout to avoid unnecessary action
  //         if (timeoutId.current) {
  //           clearTimeout(timeoutId.current);
  //           timeoutId.current = null; // Reset the timeout ID
  //         }
  //         console.log("Element not showing");
  //       }
  //     },
  //     {
  //       threshold: 0.1, // Trigger when 10% of the element is visible
  //     }
  //   );

  //   if (divRef.current) {
  //     observer.observe(divRef.current);
  //   } else {
  //     observer.unobserve(divRef.current);
  //   }

  //   // Cleanup observer and timeout on unmount
  //   return () => {
  //     if (divRef.current) {
  //       observer.unobserve(divRef.current);
  //     }
  //     if (timeoutId.current) {
  //       clearTimeout(timeoutId.current);
  //     }
  //   };
  // }, [id, impCount, shop?.shopifyDomain, store, trafficSource, day]);

  //console.log("count:", id, impCount);

  const moveSliderPrevNext = (btnType) => {
    const slider = document.querySelector(".shopcomponent_product_layout_gridSlider");
    const slideWidth = slider.querySelector(".product-card").offsetWidth + 16;
    slider.scrollBy({ left: btnType === 'next' ? slideWidth : -slideWidth, behavior: "smooth" });
  }




  useEffect(() => {
    setSelectecTedProducts(shop?.plan?.planName === PLAN_NAME.free ? addToCartType?.products?.slice(0, 3) : addToCartType?.products);
    if (shop?.plan?.planName === PLAN_NAME.pro) {
      setCustomTrackings(buildUtmParams({ source: utmSource, medium: utmMedium, campaign: utmCampaign }));
    }

  }, [addToCartType.products, shop?.plan?.planName]);



  //console.log("customTrackings:",customTrackings);




  const handleAddToCart = async (event, token, store, tracking, customerTracking, appliesTo, fullView, componentId,market) => {
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
        const cartAdd = await cartLineAddFnc(isExistCart, selectedVariant, store, token,market);
        if (cartAdd?.success) {
          setCartData({ ...cartAdd.cartData });
          setCartTotalCount(cartAdd.cartData.totalQuantity);
        } else if (cartAdd?.error) {
          if (cartAdd.error[0]?.field[0] === "cartId") {
            const createCart = await cartCreateFnc(selectedVariant, store, token, tracking, customerTracking,market);
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
        const createCart = await cartCreateFnc(selectedVariant, store, token, tracking, customerTracking,market);
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
    storeAnalyticsDataToServer({ shopifyDomain: store, trafficSource, componentId:Number(componentId), day, isIncImpression: false, impressionIncVal: 0, isIncUniqueVisitor: false, uniqueVisitorIncVal: 0, isIncAddToCartClick: true, addTocartClickIncVal: 1, isIncCheckoutClick: false, checkoutClickIncVal: 0 });

    //console.log("selectedVariant:", selectedVariant);
  };

  const handleAddToCheckout = async (event, token, store, tracking, customerTracking, appliesTo, fullView, customTrackings, componentId) => {
    event.preventDefault();

    const target = event.target;
    const variantId = getSelectedVariantId(target, appliesTo, fullView);
    showLoading(target, true);

    //console.log("variantId:", variantId);

    try {
      const variantIdNum = variantId.replace('gid://shopify/ProductVariant/', '');
      const checkoutUrl = `https://${store}/cart/${variantIdNum}:1?access_token=${token}&attributes[EU_custom_tracking]=${customerTracking}&attributes[embedup_tracking]=${tracking}&ref=embedup&${customTrackings}`;
      // window.location.href = checkoutUrl;
      window.open(checkoutUrl, '_top');

      //Open new tab
      //window.open(checkoutUrl, '_blank');
      //console.log("checkoutUrl:", checkoutUrl);

    } catch (error) {
      console.error("Checkout redirection error:", error);
    } finally {
      showLoading(target, false);
    }

    storeAnalyticsDataToServer({ shopifyDomain: store, trafficSource, componentId:Number(componentId), day, isIncImpression: false, impressionIncVal: 0, isIncUniqueVisitor: false, uniqueVisitorIncVal: 0, isIncAddToCartClick: false, addTocartClickIncVal: 0, isIncCheckoutClick: true, checkoutClickIncVal: 1 });
  }


  const handleOpenQuickView = async (event, appliesTo) => {
    event.preventDefault();

    const target = event.target;
    showLoading(target, true);

    if (appliesTo === 'product') {
      const container = target.closest('.product-card__buttons');
      const dialog = container.querySelector('#shopcomponent-product-modal');
      if (dialog) {
        dialog.showModal();
        dialog.querySelector('#shopcomponent-product-modal-context').update(event);
        setTimeout(() => {
          showLoading(target, false);
        }, 1000);
      }
    } else if (appliesTo === 'collection') {
      const container = target.closest('.shopcomponent_pd_container');
      const dialog = container.querySelector('#shopcomponent-product-modal');
      if (dialog) {
        dialog.showModal();
        dialog.querySelector('#shopcomponent-product-modal-context').update(event);
        setTimeout(() => {
          showLoading(target, false);
        }, 1000);
      }
    } else {
      console.log('Method not allowed');
      setTimeout(() => {
        showLoading(target, false);
      }, 1000);
    }

  }



  useEffect(() => {
    window.spcAddToCartIndFnc = (event, ...args) => {
      handleAddToCart(event, ...args);
    };
    window.spcAddToCheckoutFnc = (event, ...args) => {
      handleAddToCheckout(event, ...args);
    }
    window.spcShowQuickView = (event, ...args) => {
      handleOpenQuickView(event, ...args);
    }
  }, []);

  return (
    <div>
      <shopify-store store-domain={shop?.shopifyDomain || `${store}.myshopify.com`} public-access-token={shop?.headlessAccessToken ? shop?.headlessAccessToken : shop?.scAccessToken || token} country={market || 'US'} language="en"></shopify-store>


      <div className="shopcomponent_pd_container" ref={divRef}>



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
                customTrackings={customTrackings}
                componentId={id}
                market={market}
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

      <GlobalStyle
        buttonStyleSettings={buttonStyleSettings}
        componentSettings={componentSettings}
        productLayoutSettings={productLayoutSettings}
        shoppingCartSettings={shoppingCartSettings}
        customCss={componentSettings?.customCss || ''}
        tracking={tracking}
      />

    </div>
  )
}

export default IndividualProduct



