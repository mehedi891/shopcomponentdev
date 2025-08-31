const stylesPdT1 = `
    <style>
  /** Product card style **/
  .product-layout {
    display: flex;
  }
  .product-card {
    max-width: 100%;
    max-width: 56rem;
    min-width: 320px;
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
</style>
`

export {
  stylesPdT1
}