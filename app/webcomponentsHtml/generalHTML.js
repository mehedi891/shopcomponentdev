const floatingCartCountBuble = `
  <style>
    .shopcomponent_cart_btn{
                    border-radius: 4px 0 0 4px;
                    box-shadow: 0 4px 32px 0 rgba(0, 0, 0, 0.15);
                    padding: 10px 12px 8px 10px;
                    position: absolute;
                    right: -1%;
                    transform: translateY(-10%);
                    top: 10%;
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
  </style>
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




export {
  floatingCartCountBuble
}