import { useContext, useEffect, useState } from "react";
import "./style.module.css";
import { ContextComponent } from "../../entryPoints/ContextWrapper/ContextWrapper";
import getSymbolFromCurrency from 'currency-symbol-map'
import cartLineRemoveFnc from "../utilities/cartLineRemoveFnc";
import cartLinesUpdateFnc from "../utilities/cartLinesUpdateFnc";
import cartApplyDiscountCodeFnc from "../utilities/cartApplyDiscountCodeFnc";
import cartNoteUpdateFnc from "../utilities/cartNoteUpdateFnc";
import { showLoading } from "../utilities/utilisFnc";
import { BoleanOptions } from "../../../constants/constants";
import { storeAnalyticsDataToServer } from "../../../utilis/storeAnalyticsDataToServer";

const ShoppingCart = ({ cartModal, cartRef, token, store, shoppingCartSettings,customTrackings,componentId,day,trafficSource }) => {
  const { cartData } = useContext(ContextComponent);
  const { setCartData, setCartTotalCount } = cartRef.current;
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [showDiscountError, setShowDiscountError] = useState({
    type: '',
    message: '',
  });
  const [showAddNotes, setShowAddNotes] = useState(false);
  const [cartUpdateLoading, setCartUpdateLoading] = useState(false);
  //console.log("cartDataFromShoppingCart:", cartData);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const dialog = cartModal.current;
      //console.log(event.target);
      if (!dialog) return;
      if (event.target === dialog) {
        dialog.close();
      }
    };
    const dialog = cartModal.current;
    if (dialog) dialog.addEventListener("click", handleClickOutside);

    return () => {
      if (dialog) dialog.removeEventListener("click", handleClickOutside);
    };
  }, [cartModal]);

  useEffect(() => {
    if (cartData?.note) {
      setAddNotes(cartData?.note);
    }
  }, [cartData?.note]);



  const handleRemoveFromCart = async (lineId) => {
    const isExistCart = localStorage.getItem('shopcomponent_cartId') ? localStorage.getItem('shopcomponent_cartId') : null;
    if (isExistCart) {
      setCartUpdateLoading(true);
      setCartData((prev) => {
        return {
          ...prev,
          lines: {
            ...prev.lines,
            nodes: prev.lines.nodes.filter((node) => node.id !== lineId)
          },
        };
      })
      //console.log("cartDataAfterRemove:", cartData);
      try {
        const lineIdArr = [lineId];
        const cartRemove = await cartLineRemoveFnc(isExistCart, lineIdArr, token, store);
        if (cartRemove?.success) {
          setCartData({ ...cartRemove.cartData });
          setCartTotalCount(cartRemove.cartData.totalQuantity);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setCartUpdateLoading(false);
      }
    }
  };

  const handleUpdateLineQuantity = async (updateType = 'increment', lineId, quantity) => {
    const isExistCart = localStorage.getItem('shopcomponent_cartId') ? localStorage.getItem('shopcomponent_cartId') : null;
    if (isExistCart) {
      setCartUpdateLoading(true);
      const updatedQty = updateType === 'increment' ? quantity + 1 : quantity - 1;

      if (updatedQty <= 0) {
        setCartData((prev) => {
          return {
            ...prev,
            lines: {
              ...prev.lines,
              nodes: prev.lines.nodes.filter((node) => node.id !== lineId)
            },
          };
        })
      }

      setCartData((prev) => {
        return {
          ...prev,
          lines: {
            ...prev.lines,
            nodes: prev.lines.nodes.map((node) => {
              if (node.id === lineId) {
                return {
                  ...node,
                  quantity: updatedQty,
                };
              }
              return node;
            }),
          },
        };
      });

      try {
        const linesArr = [{
          "id": lineId,
          "quantity": updatedQty
        }
        ];
        //console.log('linesArr', linesArr);
        const cartQtyUpdate = await cartLinesUpdateFnc(isExistCart, linesArr, token, store);
        if (cartQtyUpdate?.success) {
          setCartData({ ...cartQtyUpdate.cartData });
          setCartTotalCount(cartQtyUpdate.cartData.totalQuantity);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setCartUpdateLoading(false);
      }
    }
  };

  const handleApplyDiscount = async (type = 'add') => {
    const isExistCart = localStorage.getItem('shopcomponent_cartId') ? localStorage.getItem('shopcomponent_cartId') : null;
    if (isExistCart) {
      const discountCodeArr = [discountCode];
      setCartUpdateLoading(true);
      if (type === 'add') {
        try {
          const cartApplyDiscount = await cartApplyDiscountCodeFnc(isExistCart, discountCodeArr, token, store);
          if (cartApplyDiscount?.success) {
            setCartData({ ...cartApplyDiscount.cartData });
            setCartTotalCount(cartApplyDiscount.cartData.totalQuantity);
            setShowDiscountError({ type: 'success', message: 'Discount code applied successfully' });
          } else if (!cartApplyDiscount?.success && cartApplyDiscount?.message) {
            setShowDiscountError({ type: 'error', message: cartApplyDiscount.message });
            setCartData({ ...cartApplyDiscount.cartData });
          }
        } catch (error) {
          console.log(error);
        } finally {
          setCartUpdateLoading(false);
        }
      } else if (type === 'remove') {
        try {
          const discountCodeArr = [''];
          const cartApplyDiscount = await cartApplyDiscountCodeFnc(isExistCart, discountCodeArr, token, store);
          console.log('cartApplyDiscountRemove:', cartApplyDiscount);
          if (!cartApplyDiscount?.success && cartApplyDiscount?.message) {
            setCartData({ ...cartApplyDiscount.cartData });
            setCartTotalCount(cartApplyDiscount.cartData.totalQuantity);
            setShowDiscountError({ type: 'success', message: 'Discount code removed successfully' });
          }
        } catch (error) {
          console.log(error);
        } finally {
          setCartUpdateLoading(false);
        }
      }
    }
  }

  const handleCheckout = async (e, notes,customTrackings) => {
    const target = e.target;
    showLoading(target, true);
    if (cartData?.lines?.nodes?.length > 0) {
      if (notes && notes.length > 0) {
        //console.log('notes', notes);
        const isExistCart = localStorage.getItem('shopcomponent_cartId') ? localStorage.getItem('shopcomponent_cartId') : null;
        if (isExistCart) {
          try {
            const cartNoteData = await cartNoteUpdateFnc(isExistCart, notes, token, store);
            if (cartNoteData?.success) {
              setCartData({ ...cartNoteData.cartData });
              setCartTotalCount(cartNoteData.cartData.totalQuantity);
            }
          } catch (error) {
            console.log(error);
          } finally {
            showLoading(target, false);
          }
        }
      }
      const checkoutUrl = cartData?.checkoutUrl;
      const searchParams =  new URLSearchParams(checkoutUrl)
      const newCheckoutUrl = checkoutUrl + `${searchParams?.size > 0 ? `&${customTrackings}` : `?${customTrackings}`}`;
      
      storeAnalyticsDataToServer({ shopifyDomain: store, trafficSource, componentId:Number(componentId), day, isIncImpression: false, impressionIncVal: 0, isIncUniqueVisitor: false, uniqueVisitorIncVal: 0, isIncAddToCartClick: false, addTocartClickIncVal: 0, isIncCheckoutClick: true, checkoutClickIncVal: 1 });

     
      
      window.open(newCheckoutUrl, '_top');
      setTimeout(() => {
        showLoading(target, false);
      }, 100);

    }
  }

  const shoppingCartStyle = `

  .spc_embedup_button {
    font-weight: 700;
    box-sizing: border-box;
    font-size: 16px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 16px 24px;
    gap: 8px;
    border: none;
    flex: 1;
    align-self: stretch;
    flex-grow: 1;
    text-decoration: none;
    border-radius: 12px;
    width: 100%;
}

.spc_embedup_tertiary_button {
    flex-direction: row;
    padding: 0;
    flex: none;
    align-self: auto;
    width: auto;
    display: inline-flex;
    height: 36px;
    padding: 0 4px;
}

.spc_embedup_tertiary_button {
    background-color: #e4e4e4;
    color: #000;
    border: 1px solid #cdcdcd
}

.spc_embedup_tertiary_button:hover:not(:disabled):not(.disabled) {
    background-color: #c6c6c6;
    color: rgba(0, 0, 0, .9);
    border-color: rgba(205, 205, 205, .9)
}

.spc_embedup_tertiary_button:active:not(:disabled):not(.disabled) {
    background-color: #b6b6b6;
    color: rgba(0, 0, 0, .8);
    border-color: rgba(205, 205, 205, .7)
}

.spc_embedup_primary_button {
    background-color: ${shoppingCartSettings?.shoppingCartBtnBgColor ? shoppingCartSettings?.shoppingCartBtnBgColor : '#000'};
    color: #fff;
    border: 0;
    cursor: pointer;
}

.spc_embedup_primary_button:hover:not(:disabled):not(.disabled) {
    color: rgba(255, 255, 255, .9)
}

.spc_embedup_primary_button:active:not(:disabled):not(.disabled) {
    color: rgba(255, 255, 255, .7)
}

.spc_embedup_button.disabled,
.spc_embedup_button:disabled {
    opacity: .5
}

.spc_embedup_closeButton {
    display: inline-flex;
    justify-content: center;
    align-items: center;
}

.spc_embedup_closeButton .spc_embedup_button {
    padding: 8px;
    width: 36px;
    height: 36px;
    cursor: pointer;
}

.spc_embedup_cart_head_line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 14px 16px 0px 16px;
    box-sizing: border-box;
}
    .spc_embedup_cart_title {
    font-size: 30px;
    font-weight: 700;
    color: ${shoppingCartSettings?.shoppingCartTextColor ? shoppingCartSettings?.shoppingCartTextColor : '#000'};
}
  .spc_embedup_cart_dialog {
    width: 480px;
    background-color: ${shoppingCartSettings?.shoppingCartBgColor ? shoppingCartSettings?.shoppingCartBgColor : '#000'};
    color: #000;
    top: 32px;
    right: 32px;
    z-index: 10;
    position: fixed;
    gap: 12px;
    flex-direction: column;
    border: 0;
    border-radius: 12px;
    left: auto;
    margin-right: 0;
    margin-top: 0;
    opacity: 0;
    transform: translateX(100%);

    box-sizing: border-box;
}

.spc_embedup_cart_dialog[open] {
    opacity: 1;
    transform: translateX(0%);
}

.spc_embedup_cart_dialog[open]::backdrop {
    opacity: 1;
}

.spc_embedup_cart_dialog::backdrop {
    opacity: 0;
}

.spc_embedup_shadow {
    box-shadow: 0 20px 20px -8px #1a1a1a47, 0 1px 0 0 #cccccc80 inset, 0 -1px 0 0 #0000002b inset, -1px 0 0 0 #0000002b inset, 1px 0 0 0 #00000021 inset
}
.spc_embedup_discount_error {
    font-size: 13px;
    text-align: left;
    color: #c31313;
}
.spc_embedup_discount_success {
    font-size: 13px;
    text-align: left;
    color: #2e7d32;
}
@starting-style {
    .spc_embedup_cart_dialog[open] {
        opacity: 0;
        transform: translateX(100%);
    }

    .spc_embedup_cart_dialog[open]::backdrop {
        opacity: 0;
    }
}

@media (prefers-reduced-motion: no-preference) {
    .spc_embedup_cart_dialog {
        transition:
            opacity 200ms ease-out,
            transform 200ms ease-out,
            overlay 0.7s ease-out allow-discrete,
            display 0.7s ease-out allow-discrete;
    }
}

.spc_embedup_cart_dialog::backdrop {
    transition:
        opacity 200ms ease-out;
}

.spc_embedup_cart_empty {
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: 95%;
    min-height: 200px;
    text-align: center;
    margin: 8px;
    font-size: 24px;
}

.spc_embedup_line_items {
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 298px);
    overflow-y: auto;
    padding: 0px 16px 0 24px;
    margin: 24px 0 8px 0;
    gap: 24px;
}

.spc_embedup_line_item_container {
    contain: content;
    height: calc-size(max-content, size);
    transition: height 200ms ease-out;
}

.spc_embedup_line_item_container.closed {
    height: 0;
}

.spc_embedup_line_item {
    display: flex;
    gap: 16px;
}

.spc_embedup_line_item.removed {
    transform: scaleY(0);
}

.spc_embedup_line_item img {
    border-radius: 12px;
    width: 128px;
    height: 128px;
    object-fit: cover;
}

.spc_embedup_line_image {
    display: block;
}

@container (max-width: 460px) {
    .spc_embedup_line_image {
        display: none;
    }
}

.spc_embedup_img_placeholder:empty {
    width: 128px;
    height: 128px;
    background-color: gray;
    opacity: .5;
    border-radius: 3px;
}

.spc_embedup_line_details {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 262px;
}

.spc_embedup_line_header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.spc_embedup_line_heading {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 8px;
    line-height: 1.25;
    overflow: clip;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.spc_embedup_placeholder:empty {
    background-color: gray;
    width: 100%;
    height: 10px;
    opacity: .5;
    border-radius: 3px;
}
.spc_embedup_line_price_column {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 100px;
}

.spc_embedup_line_price {
    font-size: 18px;
    font-weight: 500;
}

.spc_embedup_line_options {
    color: #717171;
    font-weight: 500;
    margin-bottom: 14px;
    line-height: 1.25;
    width: calc(100% - 44px);
}

.spc_embedup_truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap
}

.spc_embedup_line_edits {
    display: flex;
    justify-content: space-between;
}
.spc_embedup_line_edits .spc_embedup_button button {
    border: 0;
    background-color: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.spc_embedup_line_remove {
    display: flex;
}

.spc_embedup_line_remove button.spc_embedup_tertiary_button {
    padding: 16px;
     cursor: pointer;
}

.spc_embedup_line_edits svg{
    width: 20px;
    height: 20px;
}
.spc_embedup_cart_actions {
    padding: 0px 16px 16px 16px;
    display: flex;
    flex-direction: column;
    align-items: end;
    gap: 0px;
    position: sticky;
    bottom: 0;
    background-color: ${shoppingCartSettings?.shoppingCartBgColor ? shoppingCartSettings?.shoppingCartBgColor : '#fff'};
}

              .spc_embedup_cart_total_label{
                  font-size: 0.875rem;
                  font-weight: 400;
                  color: #000000cf;
              }
              .spc_embedup_cart_total_amount_container{
               font-size: 18px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .spc_embedup_cart_total{
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                width: 100%;
                padding:0 12px;
                padding: 11px 12px 0 12px;
                border-top: 0px solid #e5e5e5;
              }
.spc_embedup_discount_section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-left: 16px;
    padding-right: 16px;
    width: 100%;
}
.spc_embedup_discount_section_only{
   border-top: 1px solid #e5e5e5;
   padding-top: 10px;
}
.spc_embedup_notes_section{
  padding-top: 6px;
}
.spc_embedup_additional_text{
    margin-bottom: 10px;
    margin-top: 12px;
}
.spc_embedup_discount_header_row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
}
.spc_embedup_discount_toggle_button {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #222;
}

.spc_embedup_discount_toggle_button:focus {
    outline: none;
}
.spc_embedup_discount_expanded_ui {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.spc_embedup_discount_code_input {
    display: flex;
    gap: 8px;
    align-items: center;
}

.spc_embedup_discount_input_field {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 16px;
    background-color: #ffffff;
    color: #374151;
}

.spc_embedup_discount_input_field:focus {
    outline: none;
    border-color: #6b7280;
    box-shadow: 0 0 0 1px #6b7280;
}

.spc_embedup_discount_input_field::spc_embedup_placeholder {
    color: #9ca3af;
}

.spc_embedup_discount_apply_button {
    padding: 8px 16px;
    border-radius: 6px;
    height: 34px;
    cursor: pointer;
}
.spc_embedup_notes_section{
    margin-top: 0rem;
}
.spc_embedup_line_original_price {
    text-decoration: line-through;
    color: #888;
    font-size: 0.95em;
    margin-top: 2px;
}
.spc_embedup_additional_text{
    text-align: center;
    font-size: 12px;
    align-self: center;
}
.spc_embedup_primary_button_container,
.spc_embedup_additional_text{
  width: 100%;
}
.spc_embedup_cart_sub_total_amount{
  text-decoration: line-through;
  color: #888;
}
.spc_embedup_discount_code_display{
  display: flex;
  align-items: center;
  gap: 3px;
  background: #efefef;
  max-width: max-content;
  padding: 6px;
  border-radius: 15px;

}
.spc_embedup_discount_remove_button{
  background: none;
  border: none;
  cursor: pointer;
  }
  .spc_embedup_discount_code_text{
    color: #867c7c;
    font-size: 14px;
  }
@media (max-width: 768px) {
    .spc_embedup_cart_dialog {
        right: 0px;
        top: 0px;
        margin: 0;
        border-radius: 0;
        min-width: 100%;
        width: 100%;
}
        .spc_embedup_line_items {
        max-height: calc(100vh - 220px);
        padding: 0 16px;
    }
    
    .spc_embedup_line_item img {
        width: 70px;
        height: 100px;
    }
    spc_embedup_line_details{
        width: 186px;
        
    }
    .spc_embedup_line_heading,
    .spc_embedup_line_price {
        font-size: 16px;
    }
    .spc_embedup_line_options{
        font-size: 12px;
        margin-bottom: 10px;
    }

    .spc_embedup_line_edits .spc_embedup_button button {
      height: 30px;
    }

    .spc_embedup_line_remove button.spc_embedup_tertiary_button {
      padding: 14px 16px;
    }

    
    }




  `

  return (
    <dialog className="spc_embedup_shadow spc_embedup_cart_dialog" ref={cartModal}>
      <div className="spc_embedup_cart_head_line">
        <span className="spc_embedup_cart_title">{shoppingCartSettings.heading}</span>
        <div className="spc_embedup_closeButton">
          <button onClick={() => cartModal.current.close()} aria-label="Close cart dialog" className="spc_embedup_button spc_embedup_tertiary_button">
            <svg viewBox="0 0 20 20" width="20" height="20">
              <path d="M9 5a1 1 0 1 1 2 0v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5z" style={{ transform: "rotate(45deg)", transformOrigin: "10px 10px" }}
              >
              </path>
            </svg>
          </button>
        </div>
      </div>

      {cartData?.lines?.nodes?.length > 0 ?
        <div className="spc_embedup_cart-contents">

          <div className="spc_embedup_line_items">

            {cartData?.lines?.nodes && cartData.lines.nodes.map((item, index) => {
              return <div key={item?.id || index} className="spc_embedup_line_item_container">
                <div className="spc_embedup_line_item">
                  <div className="spc_embedup_line_image spc_embedup_img_placeholder">
                    <img
                      src={`${item?.merchandise?.image?.url}&width=216&height=240`}
                      alt="Top and bottom view of a snowboard. The top view shows a stylized scene of water, trees, mountains, sky and a moon in blue colours. The bottom view has a blue liquid, drippy background with the text 'liquid' in a stylized script typeface."
                      width="108"
                    />
                  </div>

                  <div className="spc_embedup_line_details">
                    <div className="spc_embedup_line_header">
                      <div className="spc_embedup_line_heading spc_embedup_placeholder">
                        {item?.merchandise?.product?.title}
                      </div>
                      <span className="spc_embedup_line_price_column">
                        <span className="spc_embedup_line_price">{getSymbolFromCurrency(item?.cost?.totalAmount?.currencyCode)}{item?.cost?.totalAmount?.amount}</span>
                        {item?.cost?.compareAtAmountPerQuantity &&
                          <span className="spc_embedup_line_original_price">
                            {getSymbolFromCurrency(item?.cost?.compareAtAmountPerQuantity?.currencyCode)}{((item?.cost?.compareAtAmountPerQuantity?.amount * 1) * item?.quantity).toFixed(2)}
                          </span>
                        }
                      </span>
                    </div>

                    <div
                      className="spc_embedup_line_options spc_embedup_truncate spc_embedup_placeholder"
                    >
                      <span>{item?.merchandise?.title === "Default Title" ? '' : item?.merchandise?.title}</span>
                    </div>

                    <div className="spc_embedup_line_edits">
                      <div className="spc_embedup_button spc_embedup_tertiary_button">
                        <button
                          className="spc_embedup_decrement"
                          onClick={() => handleUpdateLineQuantity('decrement', item?.id, item?.quantity)}
                        >
                          <svg viewBox="0 0 20 20" className="w-4 h-4">
                            <path d="M5 9h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2"></path>
                          </svg>
                        </button>
                        <span data-testid="spc_embedup_quantity_label">{item?.quantity}</span>
                        <button
                          className="spc_embedup_increment"
                          onClick={() => handleUpdateLineQuantity('increment', item?.id, item?.quantity)}
                        >
                          <svg viewBox="0 0 20 20" className="w-4 h-4">
                            <path d="M9 5a1 1 0 1 1 2 0v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5z"></path>
                          </svg>
                        </button>
                      </div>

                      <span onClick={() => handleRemoveFromCart(item?.id)} className="spc_embedup_line_remove">
                        <button
                          className="spc_embedup_button spc_embedup_tertiary_button"
                          aria-label="Remove item from cart"
                        >
                          <svg style={{ width: "14px", height: "16px" }}>
                            <path
                              d="M6.31 7.18c0-.51-.4-.92-.9-.92s-.9.41-.9.92v4.63c0 .51.4.93.9.93s.9-.42.9-.93V7.18z"
                              style={{ transform: "translateX(3px)" }}
                            ></path>
                            <path d="M6.31 7.18c0-.51-.4-.92-.9-.92s-.9.41-.9.92v4.63c0 .51.4.93.9.93s.9-.42.9-.93V7.18z"></path>
                            <path d="m7 0c-1.634 0-2.965 1.33-3.021 2.993H.902C.404 2.993 0 3.407 0 3.918c0 .511.404.926.902.926h.689v5.828c0 .91 0 1.599.044 2.148.043.551.132.971.314 1.338.315.635.818 1.151 1.437 1.474.358.187.766.278 1.303.323.535.045 1.207.045 2.094.045h.434c.887 0 1.558 0 2.093-.045.537-.045.946-.136 1.304-.323a3.3 3.3 0 0 0 1.437-1.474c.182-.367.27-.787.314-1.338.044-.55.044-1.239.044-2.148V4.844h.69c.497 0 .901-.415.901-.926 0-.511-.404-.925-.901-.925h-3.078C9.965 1.33 8.634 0 7 0zm-1.326 3.102h2.652a1.54 1.54 0 0 0-.387-.961c.215.222.357.521.383.852.002.036.004.073.004.109H5.674zM7 1.85c.638 0 1.161.503 1.215 1.143H5.785C5.839 2.353 6.362 1.85 7 1.85zM3.394 4.844h7.212v5.823c0 .943-.001 1.545-.038 2.003-.035.436-.093.585-.124.648a2.42 2.42 0 0 1-.649.666c-.061.032-.206.091-.632.127-.445.037-1.032.039-1.951.039h-.424c-.919 0-1.506-.002-1.952-.039-.426-.036-.57-.095-.631-.127a2.42 2.42 0 0 1-.649-.666c-.031-.063-.09-.212-.124-.648-.037-.458-.038-1.06-.038-2.003V4.844z"></path>
                          </svg>
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            })

            }



          </div>

          <div className="spc_embedup_cart_actions">

            {shoppingCartSettings?.showDiscountCodeField === BoleanOptions.yes &&

              <div className="spc_embedup_discount_section spc_embedup_discount_section_only">
                <div className="spc_embedup_discount_header_row" onClick={() => setShowDiscountInput(!showDiscountInput)}>
                  <span className="spc_embedup_discount_header">
                    <span>{shoppingCartSettings?.discountCodeTitle ?? 'Discounts'}</span>
                  </span>
                  <button className="spc_embedup_discount_toggle_button" type="button">{showDiscountInput ? "-" : "+"}</button>
                </div>

                {showDiscountInput &&
                  <div className="spc_embedup_discount_expanded_ui">
                    <div className="spc_embedup_discount_code_input">
                      <input type="text" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} className="spc_embedup_discount_input_field" id="spc_embedup_discount_code_input" placeholder={shoppingCartSettings?.discountCodePlaceholder ?? 'Enter discount code'} />

                      <button onClick={() => { handleApplyDiscount('add') }} className={`spc_embedup_discount_apply_button spc_embedup_tertiary_button ${cartUpdateLoading ? 'loading' : ''}`} type="button">
                        <span>{shoppingCartSettings?.discountApplyBtnTxt ?? 'Apply'}</span>
                      </button>
                    </div>

                    {showDiscountError.type === 'error' &&
                      <div className="spc_embedup_discount_error">{showDiscountError.message}</div>
                    }

                    {showDiscountError.type === 'success' &&
                      <div className="spc_embedup_discount_success">{showDiscountError.message}</div>
                    }

                    {cartData?.discountAllocations?.length > 0 &&
                      <div className="spc_embedup_discount_code_display">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13.25 4.25H11.2759C10.4606 4.25 9.68048 4.58181 9.11496 5.16908L4.86136 9.58629C4.10538 10.3713 4.11713 11.6171 4.88778 12.3878L7.78569 15.2857C8.46001 15.96 9.55008 15.9703 10.237 15.3088L14.9841 10.7375C15.4735 10.2663 15.75 9.61613 15.75 8.93673V6.75C15.75 5.36929 14.6307 4.25 13.25 4.25Z" stroke="currentColor" strokeWidth="1.5px" strokeLinecap="round" strokeLinejoin="round"></path>
                          <circle cx="13" cy="7" r="1" fill="currentColor"></circle>
                        </svg>
                        <span className="spc_embedup_discount_code_text">{cartData?.discountCodes[0].code}</span>
                        <button onClick={() => { setDiscountCode(""); handleApplyDiscount('remove'); }} className="spc_embedup_discount_remove_button" type="button">
                          <svg width="12" height="12" viewBox="0 0 7 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g opacity="0.4">
                              <path d="M6 1.5L1 6.5" stroke="currentColor" strokeWidth="1.5px" strokeLinecap="round"></path>
                              <path d="M1 1.5L6 6.5" stroke="currentColor" strokeWidth="1.5px" strokeLinecap="round"></path>
                            </g>
                          </svg>
                        </button>
                      </div>
                    }

                  </div>
                }


              </div>
            }

            {shoppingCartSettings?.showOrderNote === BoleanOptions.yes &&
              <div className="spc_embedup_discount_section spc_embedup_notes_section">
                <div className="spc_embedup_discount_header_row" onClick={() => setShowAddNotes(!showAddNotes)}>
                  <span className="spc_embedup_discount_header">
                    <span>{shoppingCartSettings?.orderNoteTitle ?? 'Add Notes'}</span>
                  </span>
                  <button data-testid="discount-toggle-button" className="spc_embedup_discount_toggle_button" type="button">{showAddNotes ? "-" : "+"}</button>
                </div>
                {showAddNotes &&
                  <div className="spc_embedup_discount_expanded_ui">
                    <div className="spc_embedup_discount_code_input">
                      <textarea value={addNotes} onChange={(e) => setAddNotes(e.target.value)} className="spc_embedup_discount_input_field" id="spc_embedup_discount_code_input" placeholder={shoppingCartSettings?.orderNotePlaceholder ?? 'Enter notes'} />
                    </div>
                  </div>
                }
              </div>
            }

            <div className="spc_embedup_cart_total">
              <span className="spc_embedup_cart_total_label">Estimate total </span>
              <span className={`spc_embedup_cart_total_amount_container ${cartUpdateLoading ? "loading" : ""}`}>
                {cartData?.discountAllocations?.length > 0 &&
                  <span className="spc_embedup_cart_sub_total_amount">{getSymbolFromCurrency(cartData?.cost?.subtotalAmount?.currencyCode)}{cartData?.cost?.subtotalAmount?.amount}</span>
                }
                <span className="spc_embedup_cart_total_amount">{getSymbolFromCurrency(cartData?.cost?.totalAmount?.currencyCode)}{cartData?.cost?.totalAmount?.amount}</span>
              </span>
            </div>

            <div className="spc_embedup_additional_text">
              <span>{shoppingCartSettings?.additionalInfo}</span>
            </div>

            <div className="spc_embedup_primary_button_container">
              <button onClick={(e) => { handleCheckout(e, addNotes,customTrackings); }} className="spc_embedup_button spc_embedup_primary_button product-card__add-button" >
                <span>{shoppingCartSettings?.shoppingCartBtnTxt ?? 'Checkout'}</span>
              </button>
            </div>

          </div>

        </div>
        :
        <div className="spc_embedup_cart-contents">
          <div className="spc_embedup_cart_empty">{shoppingCartSettings?.emptyCartText}</div>
        </div>
      }

      <style>
        {shoppingCartStyle}
      </style>

    </dialog>
  )
}

export default ShoppingCart