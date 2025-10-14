
const GlobalStyle = ({ buttonStyleSettings, componentSettings, productLayoutSettings, shoppingCartSettings, tracking,customCss }) => {
  const globalStyles = `
         @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');

         /** Product card style **/
            .product-layout {
              display: flex;
            }
            .product-card {
              min-width: 300px;
              overflow: auto;
            }
            .product-card__container {
              display: flex;
              flex-direction: column;
              padding: 1.5rem;
              gap: 2rem;
              box-sizing: border-box;
            }

            .product-card__media {
              display: flex;
              flex-direction: column;
              align-items: center;
              width: 100%;
            }
            .product-card__main-image shopify-media img {
              border-radius: 4px;
            }
            .product-card__images {
              display: flex;
              flex-wrap: wrap;
              position: relative;
              justify-content: center;
              gap: 8px;
              width: 420px;
              margin-top: 8px;
            }
            .product-card__image-small {
              cursor: pointer;
              transition: opacity 0.2s ease;
            }
            .product-card__image-small img:hover {
              opacity: 0.8;
            }
            .product-card__image-small img {
              max-width: 200px;
              width: 100%;
              height: auto;
              border-radius: 4px;
            }
            .product-card__images .product-card__image-large {
              display: block !important;
              position: absolute;
              transition: 200ms opacity ease-in;
              opacity: 0;
              top: -432px;
              left: 0;
              z-index: 1;
            }
            .product-card__image:hover .product-card__image-large {
              opacity: 1;
            }
            .product-card__images .product-card__image-large img {
              width: 100%;
              border-radius: 4px;
            }
          
            .product-card__details {
              display: flex;
              flex-direction: column;
              gap: 1rem;
              width: 100%;
            }
            .product-card__info {
              display: flex;
              flex-direction: column;
              gap: 0.25rem;
            }
            .product-card__vendor {
              display: flex;
              justify-content: space-between;
            }
            .product-card__vendor-text {
              opacity: 0.5;
              font-weight: 700;
              letter-spacing: 0.05em;
              text-transform: uppercase;
              font-size: 0.75rem;
            }
            .product-card__description {
              display: flex;
              justify-content: space-between;
              padding-top: 1.5rem;
              border-top-color: rgb(229 231 235);
              opacity: 1;
              border-top-width: 1px;
              border-top-style: solid;
            }
            .product-card__description-text {
              font-weight: 400;
              color: #717171;
              letter-spacing: 0.02em;
              font-size: 0.875rem;
            }
            .product-card__description-text p {
              margin: 0;
            }

            .product-card__compare-price {
              text-decoration: line-through;
              opacity: 0.5;
            }
            .product-card__buttons {
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
          
            }
            .product-card__buttons button {
              cursor: pointer;
              text-transform: uppercase;
              transition: background-color 0.3s ease, color 0.3s ease;
            }
            
            .product-card__buy-button {
              background-color: #fff;
              color: #000;
              border-radius: 0.75rem;
              padding: 1rem;
              font-size: 18px;
              font-weight: 500;
              width: 100%;
            }
            .product-card__buttons button.product-card__buy-button:hover {
              opacity: 0.5;
            }
            .product-card__buy-button:disabled {
              opacity: 0.5;
            }
            .product-card__buy-button[disabled]:hover {
              opacity: 0.5;
              cursor: not-allowed;
              background-color: #fff;
              color: #000;
            }
            
            .product-card__add-button:disabled {
              opacity: 0.5;
            }
            .product-card__add-button[disabled]:hover {
              cursor: not-allowed;
              opacity: 0.5;
              background-color: #000;
              color: #fff;
            }
            /** Variant selector style **/
            shopify-variant-selector::part(radio) {
              padding: 0.5rem 0.875rem;
              font-size: 0.875rem;
            }

            @media(max-width:600px){
            .shopcomponent_product_layout_list .product-card__container {
              flex-wrap: wrap;
              flex-direction: row;
              justify-content: center;
            }
            }


          .product-card__add-button.loading,
          .spc_embedup_cart_total_amount_container.loading,
          .spc_embedup_discount_apply_button.loading {
            position: relative;
            color: transparent;    
            pointer-events: none;       
          }

          .product-card__add-button.loading::after,
          .spc_embedup_cart_total_amount_container.loading::after,
          .spc_embedup_discount_apply_button.loading::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            width: 16px;
            height: 16px;
            margin: -8px 0 0 -8px;  
            border: 2px solid #fff;
            border-top: 2px solid #000;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          .product-card__add-button:disabled .spcBtn_txt,
          .product-card__add-button .spcBtn_outOfStock {
            display:none;
          }
          .product-card__add-button:disabled .spcBtn_outOfStock {
            display:block;
            color: red;
            font-weight: bold;
          }

        .shopcomponent_pd_container *{
            box-sizing: border-box;
            font-family: 'Inter', sans-serif;
           }
            .shopcomponent_pd_container{
             position: relative;
             padding: 0 10px;
            font-weight: 400;
            font-style: normal;
            font-family: 'Inter', sans-serif;
            max-width: 100%;
            }
            .shopcomponent_products_flex{
                display: flex;
                justify-content: center;
                gap: 14px;
                flex-wrap: wrap;
                margin-top: 10px;
            }
            .product-card__variant-selector::part(form){
                gap: 1rem;
            }
            .product-card__variant-selector::part(label){
                font-size: 14px;
            }
            .shopcomponent_title{
                font-family: Inter;
                font-size: 20px;
                font-style: normal;
                font-weight: 650;
                line-height: 24px;
                letter-spacing: -0.2px; 
                margin-bottom: 10px;
                display: ${componentSettings?.showComponentTitle === 'no' ? 'none' : 'block'}             
            }
            .shopcomponent_description{
                font-family: Inter;
                font-size: 14px;
                font-style: normal;
                font-weight: 450;
                line-height: 20px;
            }
            .spcProductCard_${tracking}{
                border-radius: 8px;
                max-width: 350px;
                border: 1.5px solid ${productLayoutSettings.productCardBorderColor};
                background-color: ${productLayoutSettings.productCardBgColor};
            }
            .spcProductCardTitle_${tracking}{
                font-size: ${productLayoutSettings.productTitleSize};
                font-weight: ${productLayoutSettings.productTitleWeight};
                color: ${productLayoutSettings.productTitleColor};
            }
            .spcProductCardPrice_${tracking}{
                font-size: ${productLayoutSettings.productPriceSize};
                font-weight: ${productLayoutSettings.productPriceWeight};
                color: ${productLayoutSettings.productPriceColor};
            }
            .spcProductCardBtn_${tracking}{
                font-weight: ${buttonStyleSettings.buttonFontWeight};
                font-size: ${buttonStyleSettings.buttonFontSize};
                color: ${buttonStyleSettings.buttonTextColor};
                background-color: ${buttonStyleSettings.buttonBackgroundColor};
                border:1px solid ${buttonStyleSettings.buttonBorderColor};
                border-radius: ${buttonStyleSettings.buttonBorderRadius}px;
                padding: ${buttonStyleSettings.buttonTBPadding}px ${buttonStyleSettings.buttonLRPadding}px;
            }

            .shopcomponent_cart_header{
                font-weight: 700;
                font-size: 30px;
            }
            .shopcomponent_cart::part(dialog){
                background-color: ${shoppingCartSettings.shoppingCartBgColor};
            }
            .shopcomponent_discount_title{
                font-weight: 700;
                color: ${shoppingCartSettings.shoppingCartTextColor};
            }
             .shopcomponent_cart::part(input-field){
                 display: none;
             }
            .shopcomponent_cart_btn{
                background-color: ${shoppingCartSettings.shoppingCartBtnBgColor}
            }
             .shopcomponent_cart::part(line-heading),
             .shopcomponent_cart::part(line-price){
                color: ${shoppingCartSettings.shoppingCartTextColor};
             }   
            .shopcomponent_product_layout_grid .product-card__container{
                flex-direction: column;
            }
            .shopcomponent_product_layout_list .product-card{
                max-width: 700px;
            }
            .shopcomponent_product_layout_list .product-card__container{
                flex-direction: row;
            }
            .shopcomponent_product_layout_list {
                justify-content: start;
            }
            .shopcomponent_slider_container_gridSlider{
                position: relative;
                 overflow: hidden;
            }
            .shopcomponent_product_layout_gridSlider{
                flex-flow: nowrap;
                justify-content: start;
                overflow-x: scroll;
                scroll-behavior: smooth;
                scroll-snap-type: x mandatory;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: none;
            }
            .shopcomponent_product_layout_gridSlider::-webkit-scrollbar {
                display: none;
            }
            .shopcomponent__slider-button{
                background: inherit;
                border: 1px solid #2563EB;
                color: #2563EB;
                width: 30px;
                height: 30px;
                cursor: pointer;
                border-radius: 50px;
                transition: opacity 0.3s ease;
                position: absolute;
                top: 35%;
                transform: translateY(-50%);
                z-index: 999;
                box-shadow: rgb(38, 57, 77) 0px 20px 30px -10px;
            }
            .shopcomponent__slider-button.next{
                right: 0px;
                
            }
            .shopcomponent__slider-button.prev{
                left: 0;
            }
            .shopcomponent_slider_container_grid .shopcomponent__slider-button.next,
            .shopcomponent_slider_container_grid .shopcomponent__slider-button.prev,
            .shopcomponent_slider_container_list .shopcomponent__slider-button.next,
            .shopcomponent_slider_container_list .shopcomponent__slider-button.prev{
                display: none;
            }
            .shopcomponent_variant_title{
                font-size: 13px;
                color: #303030;
                font-weight: 600;
                margin-bottom: 6px;
            }
            .shopcomponent_variants_bulk_enable_quantity_container_title{
                font-size: 12px;
                color: #303030;
                font-weight: 450;
                margin-bottom: 4px;
            }
            .shopcomponent_variants_bulk_enable_quantity_input {
                border: none;
                outline: none;
                background: transparent;
                padding: 0;
                margin: 0;
                font-weight: 600;
                width: 40px;
                text-align: center;
                font-size: 13px;
                -moz-appearance: textfield;
                }
                .shopcomponent_variants_bulk_enable_quantity_input::-webkit-outer-spin-button,
                .shopcomponent_variants_bulk_enable_quantity_input::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
                }
                .shopcomponent_variants_bulk_enable_quantity_input:focus {
                border: none;
                outline: none;
                box-shadow: none;
                }
                .shopcomponent_variants_bulk_enable_quantity_dec,
                .shopcomponent_variants_bulk_enable_quantity_inc{
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 400;
                }
                .shopcomponent_variants_bulk_enable_quantity_dec{
                    padding-left : 10px;
                }
                .shopcomponent_variants_bulk_enable_quantity_inc{
                    padding-right: 10px;
                }
                .shopcomponent_variants_bulk_enable_quantity{
                    display: flex;
                    min-width: 100px;
                    align-items: center;
                    max-width: 100px;
                    border: 1px solid #ccc;
                    justify-content: space-between;
                    min-height: 30px;
                    max-height: 35px;
                    border-radius: 8px;
                }
            .shopcomponent_variants_bulk_enable_quantity_field_container{
                display: flex;
                flex-direction: row;
                align-items: center;
                flex-wrap: wrap;
                gap: 10px;
            }
            .shopcomponent_pd_buttons_bulk{
                margin-top: 15px;
                margin-bottom: 10px;
            }
            .product-card__variant-selector.fullview{
              pointer-events: none;
              opacity: 0;
              display: none !important;
            }

             /** Modal styles **/
            .product-modal {
              padding: 0;
              border-radius: 0.75rem;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              border: 0;
            }
            .product-modal::backdrop {
              background-color: rgba(156, 163, 175, 0.5);
            }
            .product-modal__container {
              position: relative;
              overflow-x: hidden;
              padding: 2rem;
            }
            .product-modal__close-container {
              display: grid;
              justify-items: end;
              justify-content: end;
              margin-left: 2rem;
              padding-bottom: 1rem;
            }
            .product-modal__close {
              border-radius: 12px;
              width: 32px;
              height: 32px;
              border: 0;
              cursor: pointer;
            }
            .product-modal__content {
              width: 100%;
              background-color: #ffffff;
              border-radius: 0.75rem;
              max-width: 54rem;
              min-width: 320px;
            }
            .product-modal__layout {
              display: flex;
              flex-direction: column;
              gap: 2rem;
            }
            @media (min-width: 768px) {
              .product-modal__layout {
                flex-direction: row;
              }
            }
            .product-modal__media {
              display: flex;
              flex-direction: column;
              align-items: center;
              width: 100%;
            }
            .product-modal__media img {
              border-radius: 0.25rem;
              width: 100%;
            }
            .product-modal__details {
              display: flex;
              flex-direction: column;
              gap: 2rem;
              width: 100%;
            }
            .product-modal__header {
              display: flex;
              flex-direction: column;
              gap: 0.25rem;
            }
            .product-modal__vendor {
              opacity: 0.5;
              font-weight: 700;
              letter-spacing: 0.05em;
              text-transform: uppercase;
              font-size: 0.75rem;
            }
            .product-modal__title {
              font-size: 2.25rem;
              font-weight: 700;
              margin: 0;
            }
            .product-modal__price-container {
              display: flex;
              gap: 0.5rem;
              font-weight: 500;
              font-size: 1.25rem;
            }
            .product-modal__compare-price {
              text-decoration: line-through;
              opacity: 0.5;
            }
            .product-modal__description-text {
              font-weight: 400;
              color: #717171;
              letter-spacing: 0.05em;
              font-size: 0.875rem;
            }
            .product-modal__description-text p {
              margin: 0;
            }

            .shopcomponent_cart_btn{
                    border-radius: 4px 0 0 4px;
                    box-shadow: 0 4px 32px 0 rgba(0, 0, 0, 0.15);
                    padding: 10px 12px 8px 10px;
                    position: fixed;
                    right: 0%;
                    btoom: 50%;
                    top: 50%;
                    min-height: 30px;
                    transform: translateY(-10%);
                    z-index: 999;
                    cursor: pointer;
                }
    
                .shopcomponent_cart_count{
                    font-weight: 500;
                    font-size: 12px;
                    line-height: 15px;
                    color: #2563EB;
                    background: #FFFFFF;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    position: absolute;
                    right: 5px;
                    top: 5px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    
                }

              


            ${customCss}
        
    `
  return (
    <style dangerouslySetInnerHTML={{ __html: globalStyles }} />

  )
}

export default GlobalStyle