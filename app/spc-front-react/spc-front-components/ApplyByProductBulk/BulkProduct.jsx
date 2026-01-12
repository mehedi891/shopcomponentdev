import GlobalStyle from "../Styles/GlobalStyle/GlobalStyle";
import BulkProductCard from "./BulkProductCard/BulkProductCard";
import PoweredBy from "../PoweredBy/PoweredBy";
import CartCountBuble from "../ShoppingCart/CartCountBuble/CartCountBuble";
import ShoppingCart from "../ShoppingCart/ShoppingCart";
import { useContext, useEffect, useRef, useState } from "react";
import { ContextComponent } from "../../entryPoints/ContextWrapper/ContextWrapper";
import { resetSelectedQuantity, showLoading } from "../utilities/utilisFnc";
import cartLineAddFnc from "../utilities/cartLineAddFnc";
import cartCreateFnc from "../utilities/cartCreateFnc";
import { PLAN_NAME } from "../../../constants/constants";
import { buildUtmParams } from "../../../utilis/generalUtils";
import { storeAnalyticsDataToServer } from "../../../utilis/storeAnalyticsDataToServer";

const BulkProduct = ({ componentData, token, store }) => {
  const { id,title, description, buttonStyleSettings, componentSettings, productLayoutSettings, shoppingCartSettings, tracking, layout, shop, enableQtyField, customerTracking, addToCartType, utmSource, utmMedium, utmCampaign,market } = componentData;
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


  const handleAddToCartBulk = async (event, token, store, tracking, customerTracking, enableQtyField, products,componentId,market) => {
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
        const cartAdd = await cartLineAddFnc(isExistCart, selectedVariants, store, token,market);
        if (cartAdd?.success) {

          setCartData({ ...cartAdd.cartData });
          setCartTotalCount(cartAdd.cartData.totalQuantity);

          if (enableQtyField) resetSelectedQuantity(mostParentContainer);

        } else if (cartAdd?.error) {
          if (cartAdd.error[0]?.field[0] === "cartId") {
            const createCart = await cartCreateFnc(selectedVariants, store, token, tracking, customerTracking,market);
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
        const createCart = await cartCreateFnc(selectedVariants, store, token, tracking, customerTracking,market);
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

    storeAnalyticsDataToServer({ shopifyDomain: store, trafficSource, componentId:Number(componentId), day, isIncImpression: false, impressionIncVal: 0, isIncUniqueVisitor: false, uniqueVisitorIncVal: 0, isIncAddToCartClick: true, addTocartClickIncVal: 1, isIncCheckoutClick: false, checkoutClickIncVal: 0 });
  }

  const handleAddToCheckoutBulk = (event, token, store, tracking, customerTracking, enableQtyField, products, customTrackings,componentId) => {
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
      const checkoutUrl = `https://${store}/cart/${selectedVariants.join(',')}?access_token=${token}&attributes[EU_custom_tracking]=${customerTracking}&attributes[embedup_tracking]=${tracking}&ref=embedup&${customTrackings}`;

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

    storeAnalyticsDataToServer({ shopifyDomain: store, trafficSource, componentId:Number(componentId), day, isIncImpression: false, impressionIncVal: 0, isIncUniqueVisitor: false, uniqueVisitorIncVal: 0, isIncAddToCartClick: false, addTocartClickIncVal: 0, isIncCheckoutClick: true, checkoutClickIncVal: 1 });

  }



  return (
    <div className="shopcomponent_pd_container" ref={divRef}>

      <shopify-store store-domain={shop?.shopifyDomain || `${store}.myshopify.com`} public-access-token={shop?.headlessAccessToken ? shop?.headlessAccessToken : shop?.scAccessToken || token} country={market || 'US'} language="en"></shopify-store>
      <GlobalStyle
        buttonStyleSettings={buttonStyleSettings}
        componentSettings={componentSettings}
        productLayoutSettings={productLayoutSettings}
        shoppingCartSettings={shoppingCartSettings}
        customCss={componentSettings?.customCss}
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
          customTrackings={customTrackings}
          componentId={id}
          day={day}
          trafficSource={trafficSource}
          market={market}
        />
      </div>


      {componentSettings.cartBehavior == 'cart' &&
        <div className="product-card__buttons shopcomponent_pd_buttons_bulk">
          <button
            className={`product-card__add-button product-card__add-to-cart-button spcProductCardBtn_${tracking}`}
            onClick={(event) => { handleAddToCartBulk(event, shop.scAccessToken, shop.shopifyDomain, tracking, customerTracking, enableQtyField, addToCartType.products,id,market) }}
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
            onClick={(event) => { handleAddToCheckoutBulk(event, shop.scAccessToken, shop.shopifyDomain, tracking, customerTracking, enableQtyField, addToCartType.products, customTrackings,id) }}
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