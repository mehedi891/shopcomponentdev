import { useEffect } from "react";
import { updateQuantity } from "../../utilities/utilisFnc";

const BulkProductCard = ({ tracking, product, enableQtyField }) => {
  useEffect(() => {
      // Define the function globally only once
      if ( window && !window.spcUpdateQuantity) {
        window.spcUpdateQuantity = function(event, type) {
          event.preventDefault();
          return updateQuantity(event,type);
        };
      }
    }, []);
  const bulkProductCardHtml = `

     <div class="product-card spcProductCard_${tracking}">
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

                <div class="shopcomponent_variants_bulk_container ${enableQtyField ? 'shopcomponent_variants_bulk_enable_quantity_field_container' : ''}">
                    ${product?.variants?.map((variant) => (
    `
                            ${!enableQtyField ?
      `<div class="shopcomponent_variants_bulk_fixed_quantity">
                                <div class="shopcomponent_variant_title">${variant.title}  x  ${variant.quantity}</div>
                            </div>` : `
                                <div class="shopcomponent_variants_bulk_enable_quantity_container">
                                    <div class="shopcomponent_variants_bulk_enable_quantity_container_title">
                                        ${variant.title}
                                        </div>
                                    <div class="shopcomponent_variants_bulk_enable_quantity">
                                        <div
                                        onclick="spcUpdateQuantity(event,'dec')" 
                                        class="shopcomponent_variants_bulk_enable_quantity_dec">-</div>
                                        <input class="shopcomponent_variants_bulk_enable_quantity_input" type="number" min="0" value="0" data-variant-id="${variant.id}"/>
                                        <div 
                                        onclick="spcUpdateQuantity(event,'inc')"
                                        class="shopcomponent_variants_bulk_enable_quantity_inc">+</div>
                                    </div>
                                </div>
                            `
    }
                        `
  )).join('\n')}
                </div>
          </div>
        </div>
      </template>
    </shopify-context>
  </div>
  
  `;

  return <div dangerouslySetInnerHTML={{ __html: bulkProductCardHtml }}  /> ;
}

export default BulkProductCard