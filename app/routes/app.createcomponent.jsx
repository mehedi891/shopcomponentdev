import { useActionData, useLoaderData, useNavigate, useNavigation, useSubmit } from "@remix-run/react";
import { BlockStack, Box, Button, Card, Checkbox, Collapsible, Divider, Icon, InlineError, InlineStack, Layout, Page, RadioButton, RangeSlider, Select, Tabs, Text, TextField, Thumbnail } from "@shopify/polaris"
import {
    DeleteIcon,
    DesktopIcon,
    MobileIcon,
    SearchIcon,
    ViewportWideIcon,
    XIcon
} from '@shopify/polaris-icons';
import { useTranslation } from "react-i18next"
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { Controller, useForm } from "react-hook-form";
import { useCallback, useEffect, useState } from "react";
import { Modal, SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { limitTotalVariants } from "../utilis/limitVariants";
import { authenticate } from "../shopify.server";
import crypto from "crypto";
import { fontSize, fontWeight } from "../utilis/staticData";
import CustomColorPicker from "../components/CustomColorPicker/CustomColorPicker";
import { emptyStateHtml } from "../webcomponentsHtml/emptyState";
import { stylesPdT1 } from "../webcomponentsHtml/stylesProduct";
import { floatingCartCountBuble } from "../webcomponentsHtml/generalHTML";



export const loader = async ({ request }) => {
    const { admin } = await authenticate.admin(request);
    const shopResponse = await admin.graphql(
        `#graphql
                query shopInfo{
                    shop{
                    id
                    myshopifyDomain
                    plan{
                    partnerDevelopment
                    }
                }
                
                }`,
    );

    const data = await shopResponse.json();
    const trackingCode = crypto.randomBytes(15).toString("base64url").slice(0, 10).toUpperCase();

    return {
        trackingCode: trackingCode,
        shopData: data.data.shop,
    }
}

const CreateComponent = () => {
    const { trackingCode, shopData } = useLoaderData();
    const [titleAndDescToggleOpen, setTitleAndDescToggleOpen] = useState(true);
    const [appliesToOpen, setAppliesToOpen] = useState(false);
    const [chooseProductOpen, setChooseProductOpen] = useState(true);
    const [chooseCollectionOpen, setChooseCollectionOpen] = useState(false);
    const [layoutOpen, setLayoutOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [buttonStyleOpen, setButtonStyleOpen] = useState(false);
    const [shoppingCartOpen, setShoppingCartOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [tranckingOpen, setTranckingOpen] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState([]);
    const [selectedProductsInd, setSelectedProductsInd] = useState([]);
    const [selectedProductsBulk, setSelectedProductsBulk] = useState([]);
    const [settingsTabSelected, setSettingsTabSelected] = useState(0);
    const [productLayoutSettings, setProductLayoutSettings] = useState({
        productTitleColor: '#303030',
        productPriceColor: '#303030',
        productCardBgColor: '#FFF',
        productCardBorderColor: '#E5E5E5',
    })
    const [buttonStyleSettings, setButtonStyleSettings] = useState({
        buttonTextColor: '#FFFFFF',
        buttonBackgroundColor: '#000000',
        buttonBorderColor: '#E5E5E5',
        buttonBorderRadius: '8',
        buttonTBPadding: '16',
        buttonLRPadding: '10'

    });
    const [shoppingCartSettings, setShoppingCartSettings] = useState({
        shoppingCartBgColor: '#ffffff',
        shoppingCartTextColor: '#000000',
        shoppingCartBtnBgColor: '#2563EB',
    });
    const [selectedViewMDF, setSelectedViewMDF] = useState({
        id: 2,
        view: 'desktop'
    });
    const [embedPHtmlCode, setEmbedPHtmlCode] = useState('');

    const [checkMaxSelectedVariants, setCheckMaxSelectedVariants] = useState(false);
    const navigation = useNavigation();
    const navigate = useNavigate();
    const actionData = useActionData();
    const shopify = useAppBridge();

    const submit = useSubmit();
    const { t } = useTranslation();

    const { register, handleSubmit, reset, formState: { errors, isDirty }, control, watch, setValue } = useForm({
        defaultValues: {
            title: '',
            description: '',
            appliesTo: 'product',
            addToCartType: {
                type: 'individual',
                products: []
            },
            enableQtyField: false,
            layout: 'grid',
            status: 'activate',
            componentSettings: {
                fullView: false,
                cartBehavior: 'cart',
            },
            shoppingCartSettings: {
                heading: 'Shopping cart',
                emptyCartText: 'Your cart is empty',
                additionalInfo: 'Additional information',
                shoppingCartBgColor: '#ffffff',
                shoppingCartTextColor: '#000000',
                shoppingCartBtnBgColor: '#2563EB',
            },
            productLayoutSettings: {
                productTitleWeight: '600',
                productTitleSize: '20px',
                productPriceWeight: '600',
                productPriceSize: '14px',
                productTitleColor: productLayoutSettings.productTitleColor || '#000000',
                productPriceColor: productLayoutSettings.productPriceColor || '#000000',
                productCardBgColor: productLayoutSettings.productCardBgColor || '#ffffff',
                productCardBorderColor: productLayoutSettings.productCardBorderColor || '#e5e5e5',
            },
            buttonStyleSettings: {
                buttonFontWeight: '600',
                buttonFontSize: '14px',
                buttonTextColor: buttonStyleSettings.buttonTextColor || '#FFFFFF',
                buttonBackgroundColor: buttonStyleSettings.buttonBackgroundColor || '#303030',
                buttonBorderColor: buttonStyleSettings.buttonBorderColor || '#e5e5e5',
                buttonBorderRadius: buttonStyleSettings.buttonBorderRadius || '8',
                buttonTBPadding: buttonStyleSettings.buttonTBPadding || '8',
                buttonLRPadding: buttonStyleSettings.buttonLRPadding || '16',
            },
            tracking: trackingCode || '',
        }
    });
    const watchedValues = watch();

    useEffect(() => {
        if (watchedValues.appliesTo === 'product') {
            if (watchedValues.addToCartType.type === 'individual') {
                setValue('addToCartType.products', selectedProductsInd, { shouldDirty: true, shouldValidate: true });
            } else if (watchedValues.addToCartType.type === 'bulk') {
                setValue('addToCartType.products', selectedProductsBulk, { shouldDirty: true, shouldValidate: true });
            }
        } else if (watchedValues.appliesTo === 'collection') {
            setValue('addToCartType.products', selectedCollection, { shouldDirty: true, shouldValidate: true });
        }

    }, [selectedProductsInd, selectedCollection, watchedValues.appliesTo, selectedProductsBulk, watchedValues.addToCartType.type, setValue]);

    const formHandleSubmit = (data) => {
        const updatedWithShop = { ...data };
        console.log(updatedWithShop);
        submit(updatedWithShop, { method: 'POST' });
    };

    const handleChooseProductsInd = async (query) => {
        const selected = await shopify.resourcePicker({
            type: 'product',
            multiple: 3,
            selectionIds: selectedProductsInd.length > 0 ? selectedProductsInd.map(product => {
                return {
                    id: product.id
                }
            }) : [],
            filter: { variants: false, archived: false, draft: false },
            action: "select",
            query: query
        });
        if (selected) {
            setSelectedProductsInd(() => {
                const selectedProducts = selected.map(product => {
                    return { id: product.id, title: product.title, handle: product.handle, image: product.images[0].originalSrc };
                })
                return selectedProducts
            });
        }

    }



    const handleChooseProductsBulk = async (query) => {
        const selected = await shopify.resourcePicker({
            type: 'product',
            multiple: 12,
            query: '',
            selectionIds: selectedProductsBulk?.length > 0 && selectedProductsBulk?.map(item => {
                return {
                    id: item.id,
                    variants: item?.variants?.length > 0 && item?.variants?.map(variant => {
                        return {
                            id: variant.id
                        }
                    })
                }
            }),
            filter: {
                hidden: true,
                variants: true,
                draft: false,
                archived: false,
            },
        });

        if (selected) {
            //console.log('selected', selected);
            setSelectedProductsBulk(limitTotalVariants(selected, 12));
        }

    }

    const handleChooseCollection = async (query) => {
        const selected = await shopify.resourcePicker({
            type: 'collection',
            multiple: false,
            selectionIds: selectedCollection.length > 0 ? selectedCollection.map(item => {
                return {
                    id: item.id
                }
            }) : [],
            filter: { variants: false, archived: false, draft: false },
            action: "select",
            query: query
        });
        if (selected) {
            setSelectedCollection(() => {
                const selectedCollection = selected.map(item => {
                    return { id: item.id, title: item.title, handle: item.handle, image: item?.image?.originalSrc ? item.image.originalSrc : null };
                })
                return selectedCollection
            });

            console.log(selected);
        }
    }

    useEffect(() => {
        if (selectedProductsBulk?.length > 0) {
            const totalVariants = selectedProductsBulk.reduce((sum, product) => {
                return sum + (product.variants?.length || 0);
            }, 0);
            setCheckMaxSelectedVariants(totalVariants >= 10);
            //console.log('selectedProductsBulk', selectedProductsBulk);
        }
    }, [selectedProductsBulk]);

    const handleDeleteProductInd = (id) => {
        setSelectedProductsInd(selectedProductsInd.filter(product => product.id !== id));
    }

    const handleDeleteProductBulk = (id, type) => {
        if (type === 'product') {
            setSelectedProductsBulk(() => {
                return selectedProductsBulk?.filter(item => item.id !== id)
            });
        } else if (type === 'variant') {
            setSelectedProductsBulk((prevSelectedProducts) => {
                return prevSelectedProducts.reduce((acc, product) => {
                    const updatedVariants = product.variants.filter(variant => variant.id !== id);

                    if (updatedVariants.length > 0) {
                        acc.push({
                            ...product,
                            variants: updatedVariants
                        });
                    }

                    return acc;
                }, []);
            });

        }
    }

    const handleChangeQuantityDefault = (id, qtyValue) => {
        setSelectedProductsBulk((prevSelectedProducts) => {
            return prevSelectedProducts.map((product) => {
                const updatedVariants = product.variants.map((variant) => {
                    return {
                        ...variant,
                        quantity: variant.id === id ? qtyValue : variant.quantity
                    };
                });

                return {
                    ...product,
                    variants: updatedVariants
                };
            });
        });
    };

    const settingsTab = [
        {
            id: 'component-settings',
            content: t("component_settings"),
            accessibilityLabel: t("component_settings"),
            panelID: 'settingsTab-content-1',
        },
        {
            id: 'product-laoput',
            content: t("product_layout"),
            accessibilityLabel: t("product_layout"),
            panelID: 'settingsTab-content-2',
        }
    ];

    const handleSettingsTabChange = useCallback((selectedTabIndex) => {
        setSettingsTabSelected(selectedTabIndex);
    }, []);


    useEffect(() => {
        setValue('productLayoutSettings.productTitleColor', productLayoutSettings.productTitleColor, { shouldDirty: true });
        setValue('productLayoutSettings.productPriceColor', productLayoutSettings.productPriceColor, { shouldDirty: true });
        setValue('productLayoutSettings.productCardBgColor', productLayoutSettings.productCardBgColor, { shouldDirty: true });
        setValue('productLayoutSettings.productCardBorderColor', productLayoutSettings.productCardBorderColor, { shouldDirty: true });
    }, [productLayoutSettings.productTitleColor, setValue, productLayoutSettings.productPriceColor, productLayoutSettings.productCardBgColor, productLayoutSettings.productCardBorderColor]);


    useEffect(() => {
        setValue('buttonStyleSettings.buttonTextColor', buttonStyleSettings.buttonTextColor, { shouldDirty: true });
        setValue('buttonStyleSettings.buttonBackgroundColor', buttonStyleSettings.buttonBackgroundColor, { shouldDirty: true });
        setValue('buttonStyleSettings.buttonBorderColor', buttonStyleSettings.buttonBorderColor, { shouldDirty: true });
        setValue('buttonStyleSettings.buttonBorderRadius', buttonStyleSettings.buttonBorderRadius, { shouldDirty: true });
        setValue('buttonStyleSettings.buttonTBPadding', buttonStyleSettings.buttonTBPadding, { shouldDirty: true });
        setValue('buttonStyleSettings.buttonLRPadding', buttonStyleSettings.buttonLRPadding, { shouldDirty: true });
    }, [buttonStyleSettings.buttonTextColor, buttonStyleSettings.buttonBackgroundColor, buttonStyleSettings.buttonBorderRadius, buttonStyleSettings.buttonTBPadding, buttonStyleSettings.buttonLRPadding, buttonStyleSettings.buttonBorderColor, setValue]);

    useEffect(() => {
        setValue('shoppingCartSettings.shoppingCartBgColor', shoppingCartSettings.shoppingCartBgColor, { shouldDirty: true });
        setValue('shoppingCartSettings.shoppingCartTextColor', shoppingCartSettings.shoppingCartTextColor, { shouldDirty: true });
        setValue('shoppingCartSettings.shoppingCartBtnBgColor', shoppingCartSettings.shoppingCartBtnBgColor, { shouldDirty: true });
    }, [setValue, shoppingCartSettings.shoppingCartBgColor, shoppingCartSettings.shoppingCartTextColor, shoppingCartSettings.shoppingCartBtnBgColor]);

    useEffect(() => {
        if (isDirty) {
            shopify.saveBar.show('spc-save-bar');
        } else {
            shopify.saveBar.hide('spc-save-bar');
        }
    }, [isDirty]);

    useEffect(()=>{
        if(watchedValues.appliesTo === 'product' && watchedValues.addToCartType.type === 'bulk'){
            setValue('componentSettings.fullView', false, {shouldValidate: true});
        }
    },[setValue, watchedValues.appliesTo, watchedValues.addToCartType.type]);

    //Start webcomponents 




    const showViewMDF = [
        {
            id: 1,
            titele: 'Mobile view',
            view: 'mobile',
            icon: MobileIcon

        },
        {
            id: 2,
            titele: 'Desktop view',
            view: 'desktop',
            icon: DesktopIcon
        },
        {
            id: 3,
            titele: 'Full view',
            view: 'full',
            icon: ViewportWideIcon
        }
    ];

    const handleShowViewMDF = (id, veiw) => {
        setSelectedViewMDF({ id, view: veiw });
    }

    const globalStyles = `
        <style>
         @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
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
            }
            .shopcomponent_description{
                font-family: Inter;
                font-size: 14px;
                font-style: normal;
                font-weight: 450;
                line-height: 20px;
            }
            .product-card{
                border-radius: 8px;
                max-width: 350px;
                border: 1.5px solid ${watchedValues.productLayoutSettings.productCardBorderColor};
                background-color: ${watchedValues.productLayoutSettings.productCardBgColor};
            }
            .product-card__title{
                font-size: ${watchedValues.productLayoutSettings.productTitleSize};
                font-weight: ${watchedValues.productLayoutSettings.productTitleWeight};
                color: ${watchedValues.productLayoutSettings.productTitleColor};
            }
            .product-card__price{
                font-size: ${watchedValues.productLayoutSettings.productPriceSize};
                font-weight: ${watchedValues.productLayoutSettings.productPriceWeight};
                color: ${watchedValues.productLayoutSettings.productPriceColor};
            }
            .product-card__add-button{
                font-weight: ${watchedValues.buttonStyleSettings.buttonFontWeight};
                font-size: ${watchedValues.buttonStyleSettings.buttonFontSize};
                color: ${watchedValues.buttonStyleSettings.buttonTextColor};
                background-color: ${watchedValues.buttonStyleSettings.buttonBackgroundColor};
                border:1px solid ${watchedValues.buttonStyleSettings.buttonBorderColor};
                border-radius: ${watchedValues.buttonStyleSettings.buttonBorderRadius}px;
                padding: ${watchedValues.buttonStyleSettings.buttonTBPadding}px ${watchedValues.buttonStyleSettings.buttonLRPadding}px;
            }

            .shopcomponent_cart_header{
                font-weight: 700;
                font-size: 30px;
            }
            .shopcomponent_cart::part(dialog){
                background-color: ${watchedValues.shoppingCartSettings.shoppingCartBgColor};
            }
            .shopcomponent_discount_title{
                font-weight: 700;
                color: ${watchedValues.shoppingCartSettings.shoppingCartTextColor};
            }
             .shopcomponent_cart::part(input-field){
                 display: none;
             }
            .shopcomponent_cart_btn{
                background-color: ${watchedValues.shoppingCartSettings.shoppingCartBtnBgColor}
            }
             .shopcomponent_cart::part(line-heading),
             .shopcomponent_cart::part(line-price){
                color: ${watchedValues.shoppingCartSettings.shoppingCartTextColor};
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

            
        </style>
    `



    useEffect(() => {
        if (selectedViewMDF.id === 3 && selectedViewMDF.view === 'full') {
            shopify.modal.show('spc-modal')
        }
    }, [selectedViewMDF.id, selectedViewMDF.view]);

    const pdAddToCartHtml = `
             <button
                class="product-card__add-button product-card__add-to-cart-button"
                onclick="getElementById("cart").addLine(event).showModal();"
                shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale"
              >
                Add to cart
              </button>
    `;

    const pdCheckoutBtnHtml = `
             <button
                class="product-card__add-button product-card__checkout-button"
                onclick="getElementById('cart').addLine(event).showModal();"
                shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale"
              >
                Checkout
              </button>
    `;

    const productFullViewModalHtml = `

<style>
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
</style>

<dialog id="shopcomponent-product-modal" class="product-modal">
  <!-- The handle of this context is automatically set when the dialog is opened -->
  <shopify-context id="shopcomponent-product-modal-context" type="product" wait-for-update>
    <template>
      <div class="product-modal__container">
        <div class="product-modal__close-container">
          <button class="product-modal__close" onclick="getElementById('shopcomponent-product-modal').close();">&#10005;</button>
        </div>
        <div class="product-modal__content">
          <div class="product-modal__layout">
            <div class="product-modal__media">
              <shopify-media width="416" height="416" query="product.selectedOrFirstAvailableVariant.image"></shopify-media>
            </div>
            <div class="product-modal__details">
              <div class="product-modal__header">
                <div>
                  <span class="product-modal__vendor">
                    <shopify-data query="product.vendor"></shopify-data>
                  </span>
                </div>
                <h1 class="product-modal__title">
                  <shopify-data query="product.title"></shopify-data>
                </h1>
                <div class="product-modal__price-container">
                  <shopify-money query="product.selectedOrFirstAvailableVariant.price"></shopify-money>
                  <shopify-money
                    class="product-modal__compare-price"
                    query="product.selectedOrFirstAvailableVariant.compareAtPrice"
                  ></shopify-money>
                </div>
              </div>
              <shopify-variant-selector></shopify-variant-selector>

              <div class="product-modal__buttons product-card__buttons">
                    ${watchedValues.componentSettings.cartBehavior === 'cart' ? pdAddToCartHtml : pdCheckoutBtnHtml}
              </div>
              <div class="product-modal__description">
                <span class="product-modal__description-text">
                  <shopify-data query="product.descriptionHtml"></shopify-data>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </shopify-context>
</dialog>

`

    const pdViewBtnHtml = `
             <button
                class="product-card__add-button product-card__view-button"
                onclick="getElementById('shopcomponent-product-modal').showModal(); getElementById('shopcomponent-product-modal-context').update(event);"
              >
                View product
              </button>

              ${productFullViewModalHtml}
    `;


    const productLayoutIndCardHtml = selectedProductsInd?.length > 0 ? selectedProductsInd.map((product) => (
        `
            <div class="product-card" id="shopcomponent-${watchedValues.tracking}">
    <!-- Set product you want to display -->
    <shopify-context type="product" handle="${product.handle}">
      <template>
        <div class="product-card__container">
          <div class="product-card__media">
            <div class="product-card__main-image">
              <shopify-media layout="fixed" width="316" height="316" query="product.selectedOrFirstAvailableVariant.image"></shopify-media>
            </div>
          </div>
          <div class="product-card__details">
            <div class="product-card__info">
              <h1 class="product-card__title">
                <shopify-data query="product.title"></shopify-data>
              </h1>
              <div class="product-card__price">
                <shopify-money query="product.selectedOrFirstAvailableVariant.price"></shopify-money>
                <shopify-money
                  class="product-card__compare-price"
                  query="product.selectedOrFirstAvailableVariant.compareAtPrice"
                ></shopify-money>
              </div>
            </div>
            ${!watchedValues.componentSettings.fullView ?
            '<shopify-variant-selector class="product-card__variant-selector" shopify-attr--data-variant-id="product.selectedOrFirstAvailableVariant.id"></shopify-variant-selector>' : ''
        }
            

            <div class="product-card__buttons">
              <!-- Add behavior to an existing button -->
               
              ${!watchedValues.componentSettings.fullView
            ? (watchedValues.componentSettings.cartBehavior === 'cart'
                ? pdAddToCartHtml
                : pdCheckoutBtnHtml)
            : pdViewBtnHtml
        }
             


              <!-- Add buy button -->
            </div>

           
          </div>
        </div>
      </template>
      <!-- Placeholder -->
    </shopify-context>
  </div>
        `
    )).join('\n') : emptyStateHtml;

    const productLayoutIndHtml = `
        <script type="module" src="https://cdn.shopify.com/storefront/web-components.js"></script>
        <shopify-store public-access-token="40e54142b7de3372a26b591477308f56" store-domain="${shopData.myshopifyDomain}" country="US" language="en"></shopify-store>


        <div class="shopcomponent_pd_container">
            ${watchedValues.componentSettings.cartBehavior === 'cart' && floatingCartCountBuble}
            <div class="shopcomponent_title_N_description">
                <div class="shopcomponent_title">${watchedValues.title}</div>
                <div class="shopcomponent_description">${watchedValues.description}</div>
            </div>

            <div class="shopcomponent_slider_container_${watchedValues.layout}">
                <button class="shopcomponent__slider-button next" onclick="moveSliderPrevNext('next')">❯</button>
                <div class="shopcomponent_products_flex shopcomponent_product_layout_${watchedValues.layout}">
                    ${productLayoutIndCardHtml}
                </div>
                <button class="shopcomponent__slider-button prev" onclick="moveSliderPrevNext('prev')">❮</button>
            <script>
                function moveSliderPrevNext (btnType) {
                    const slider = document.querySelector(".shopcomponent_product_layout_gridSlider");
                   const slideWidth = slider.querySelector(".product-card").offsetWidth + 16;
                     slider.scrollBy({ left: btnType === 'next' ? slideWidth : -slideWidth , behavior: "smooth" });
                }
            </script>
            </div>
           
          
                 

            <shopify-cart id="cart" class="shopcomponent_cart">
                <div slot="header" class="shopcomponent_cart_header">
                           ${watchedValues.shoppingCartSettings.heading}
                    </div>
                    <div class="shopcomponent_discount_title" slot="discounts-title">
                        ${watchedValues.shoppingCartSettings.additionalInfo}
                    </div>
                    <div class="shopcomponent_empty_cart_txt" slot="empty">
                        ${watchedValues.shoppingCartSettings.emptyCartText}
                    </div>
            </shopify-cart>
        </div>

        
     
        ${stylesPdT1}
        ${globalStyles}

    `
      const productLayoutBulkCardHtml = selectedProductsBulk?.length > 0 ? selectedProductsBulk.map((product) => (
        `
            <div class="product-card">
    <!-- Set product you want to display -->
    <shopify-context type="product" handle="${product.handle}">
      <template>
        <div class="product-card__container">
          <div class="product-card__media">
            <div class="product-card__main-image">
              <shopify-media layout="fixed" width="316" height="316" query="product.selectedOrFirstAvailableVariant.image"></shopify-media>
            </div>
          </div>
          <div class="product-card__details">
            <div class="product-card__info">
              <h1 class="product-card__title">
                <shopify-data query="product.title"></shopify-data>
              </h1>
              <div class="product-card__price">
                <shopify-money query="product.selectedOrFirstAvailableVariant.price"></shopify-money>
                <shopify-money
                  class="product-card__compare-price"
                  query="product.selectedOrFirstAvailableVariant.compareAtPrice"
                ></shopify-money>
              </div>
            </div>

                <div class="shopcomponent_variants_bulk_container ${watchedValues.enableQtyField ? 'shopcomponent_variants_bulk_enable_quantity_field_container' : ''}">
                    ${product.variants.map((variant) => (
                        `
                            ${!watchedValues.enableQtyField ?
                                    `<div class="shopcomponent_variants_bulk_fixed_quantity">
                                <div class="shopcomponent_variant_title">${variant.title}  x  ${variant.quantity}</div>
                            </div>` : `
                                <div class="shopcomponent_variants_bulk_enable_quantity_container">
                                    <div class="shopcomponent_variants_bulk_enable_quantity_container_title">
                                        ${variant.title}
                                        </div>
                                    <div class="shopcomponent_variants_bulk_enable_quantity">
                                        <div class="shopcomponent_variants_bulk_enable_quantity_dec">-</div>
                                        <input class="shopcomponent_variants_bulk_enable_quantity_input" type="number" min="0" value="1"/>
                                        <div class="shopcomponent_variants_bulk_enable_quantity_inc">+</div>
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
      <!-- Placeholder -->
    </shopify-context>
  </div>
        `
    )).join('\n') : emptyStateHtml;
    const productLayoutBulkHtml = `

    <script type="module" src="https://cdn.shopify.com/storefront/web-components.js"></script>
        <shopify-store public-access-token="40e54142b7de3372a26b591477308f56" store-domain="${shopData.myshopifyDomain}" country="US" language="en"></shopify-store>


        <div class="shopcomponent_pd_container">
            ${watchedValues.componentSettings.cartBehavior === 'cart' && floatingCartCountBuble}
            <div class="shopcomponent_title_N_description">
                <div class="shopcomponent_title">${watchedValues.title}</div>
                <div class="shopcomponent_description">${watchedValues.description}</div>
            </div>

            <div class="shopcomponent_slider_container_${watchedValues.layout}">
                <button class="shopcomponent__slider-button next" onclick="moveSliderPrevNext('next')">❯</button>
                <div class="shopcomponent_products_flex shopcomponent_product_layout_${watchedValues.layout}">
                    ${productLayoutBulkCardHtml}
                </div>
                <button class="shopcomponent__slider-button prev" onclick="moveSliderPrevNext('prev')">❮</button>
            <script>
                function moveSliderPrevNext (btnType) {
                    const slider = document.querySelector(".shopcomponent_product_layout_gridSlider");
                   const slideWidth = slider.querySelector(".product-card").offsetWidth + 16;
                     slider.scrollBy({ left: btnType === 'next' ? slideWidth : -slideWidth , behavior: "smooth" });
                }
            </script>
            </div>
           
          
                 

            <shopify-cart id="cart" class="shopcomponent_cart">
                <div slot="header" class="shopcomponent_cart_header">
                           ${watchedValues.shoppingCartSettings.heading}
                    </div>
                    <div class="shopcomponent_discount_title" slot="discounts-title">
                        ${watchedValues.shoppingCartSettings.additionalInfo}
                    </div>
                    <div class="shopcomponent_empty_cart_txt" slot="empty">
                        ${watchedValues.shoppingCartSettings.emptyCartText}
                    </div>
            </shopify-cart>

              <div class="product-card__buttons shopcomponent_pd_buttons_bulk">
              <!-- Add behavior to an existing button -->
               
              ${!watchedValues.componentSettings.fullView
            ? (watchedValues.componentSettings.cartBehavior === 'cart'
                ? pdAddToCartHtml
                : pdCheckoutBtnHtml)
            : pdViewBtnHtml
        }
            </div>

        </div>

        
     
        ${stylesPdT1}
        ${globalStyles}
    
    `

    useEffect(() => {
        if(watchedValues.appliesTo === 'product' && watchedValues.addToCartType.type === 'individual') {
            setEmbedPHtmlCode(productLayoutIndHtml)
        }else if(watchedValues.appliesTo === 'product' && watchedValues.addToCartType.type === 'bulk') {
            setEmbedPHtmlCode(productLayoutBulkHtml)
        }
    },[productLayoutBulkHtml,productLayoutIndHtml,watchedValues.addToCartType.type,watchedValues.appliesTo]);


    return (
        navigation.state === "loading" ? <LoadingSkeleton /> :
            <form method="post" onSubmit={handleSubmit(formHandleSubmit)} >
                <SaveBar id="spc-save-bar">
                    <button type="submit" variant="primary"
                        {...(navigation.state === 'submitting' ? { 'loading': '' } : {})}
                    ></button>
                    <button
                        type="button"
                        onClick={() => {
                            reset();
                        }}
                    >
                    </button>
                </SaveBar>
                <Page
                    fullWidth
                    title={t("create_componet")}
                    backAction={{ onAction: () => navigate('/app') }}
                >
                    <Layout>

                        <Layout.Section variant="oneThird">

                            <BlockStack>
                                <Box paddingBlockEnd={'400'}>
                                    <Box background="bg-fill" borderRadius="200">
                                        <Box minHeight="50px">
                                            <div className="collapsibleButtonDiv">
                                                <Button onClick={() => { setTitleAndDescToggleOpen(!titleAndDescToggleOpen) }} textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={titleAndDescToggleOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("titleAndDesc")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={titleAndDescToggleOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box padding={'300'}>
                                                <BlockStack gap={'300'}>
                                                    <Controller
                                                        name="title"
                                                        control={control}
                                                        rules={{
                                                            required: t("title_require_msg"), minLength: { value: 4, message: t("title_min_length_msg") },
                                                            maxLength: {
                                                                value: 100,
                                                                message: t("title_max_length_msg")
                                                            }
                                                        }}
                                                        render={({ field, fieldState }) => (
                                                            <TextField
                                                                type="text"
                                                                label={t("title")}
                                                                name="title"
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                error={fieldState.error?.message || actionData?.errors?.title}
                                                                autoComplete="off"
                                                                placeholder={t("enter_title_placeholder")}
                                                                maxLength={100}
                                                                showCharacterCount
                                                                requiredIndicator
                                                            />
                                                        )}
                                                    />

                                                    <Controller
                                                        name="description"
                                                        control={control}
                                                        rules={{
                                                            required: false,
                                                            maxLength: {
                                                                value: 150,
                                                                message: t("description_max_length_msg")
                                                            }
                                                        }}
                                                        render={({ field, fieldState }) => (
                                                            <TextField
                                                                type="text"
                                                                multiline={3}
                                                                label={t("description")}
                                                                name="description"
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                error={fieldState.error?.message || actionData?.errors?.description}
                                                                autoComplete="off"
                                                                placeholder={t("description_placeholder")}
                                                                maxLength={150}
                                                                showCharacterCount

                                                            />
                                                        )}
                                                    />
                                                </BlockStack>
                                            </Box>
                                        </Collapsible>
                                    </Box>
                                </Box>


                                <Box paddingBlockEnd={'400'}>
                                    <Box background="bg-fill" borderRadius="200">
                                        <Box minHeight="50px">
                                            <div className="collapsibleButtonDiv">
                                                <Button onClick={() => { setAppliesToOpen(!appliesToOpen) }} textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={appliesToOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("applies_to")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={appliesToOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box padding={'300'}>
                                                <BlockStack gap={'100'}>
                                                    <Controller
                                                        name="appliesTo"
                                                        control={control}
                                                        defaultValue="product"
                                                        render={({ field }) => (
                                                            <>
                                                                <RadioButton
                                                                    name="appliesTo"
                                                                    label={t("applies_to_collection")}
                                                                    checked={field.value === 'collection'}
                                                                    onChange={() => field.onChange('collection')}
                                                                />
                                                                <RadioButton
                                                                    name="appliesTo"
                                                                    label={t("applies_to_product")}
                                                                    checked={field.value === 'product'}
                                                                    onChange={() => field.onChange('product')}
                                                                />
                                                            </>
                                                        )}
                                                    />

                                                    {watchedValues.appliesTo === "product" &&
                                                        <Box paddingBlockStart={'200'}>
                                                            <Controller
                                                                name="addToCartType.type"
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Select
                                                                        label={t("add_to_cart_type")}
                                                                        options={[
                                                                            { label: t("individual_add_to_cart"), value: 'individual' },
                                                                            { label: t("bulk_add_to_cart"), value: 'bulk' },]}
                                                                        selected={field.value}
                                                                        onChange={field.onChange}
                                                                        value={field.value}
                                                                    />
                                                                )}
                                                            />
                                                        </Box>
                                                    }
                                                </BlockStack>
                                            </Box>
                                        </Collapsible>
                                    </Box>
                                </Box>
                                {watchedValues.appliesTo === "collection" &&
                                    <Box paddingBlockEnd={'400'}>
                                        <Box background="bg-fill" borderRadius="200">
                                            <Box minHeight="50px">
                                                <div className="collapsibleButtonDiv">
                                                    <Button onClick={() => { setChooseCollectionOpen(!chooseCollectionOpen) }} textAlign="left"
                                                        variant="monochromePlain"
                                                        size="large"
                                                        fullWidth
                                                        disclosure={chooseCollectionOpen ? 'up' : 'down'}
                                                    >
                                                        <Text variant="bodyMd" fontWeight="medium">{t("choose_collection")}</Text>
                                                    </Button>
                                                </div>
                                            </Box>

                                            <Collapsible
                                                open={chooseCollectionOpen}
                                                transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                                expandOnPrint
                                            >
                                                <Box padding={'300'}>
                                                    <InlineStack blockAlign="center" align="space-between">
                                                        <Controller
                                                            name="addToCartType.products"
                                                            control={control}
                                                            rules={{
                                                                validate: (value) => {
                                                                    //console.log('v:', value);
                                                                    return value?.length !== 0 ? true : t("product_required_msg");
                                                                }
                                                            }}
                                                            render={({ field, fieldState }) => (
                                                                <input type="hidden"
                                                                    name="addToCartType.products"
                                                                    value={field.value}
                                                                    onChange={field.onChange}
                                                                />

                                                            )}
                                                        />

                                                        <Box width="78%">
                                                            <TextField
                                                                type="text"
                                                                autoSize
                                                                name="productSearchQuery"
                                                                value={''}
                                                                onChange={(value) => { handleChooseCollection(value) }}
                                                                autoComplete="off"
                                                                placeholder={t("browse_collection")}
                                                                prefix={<Icon source={SearchIcon} />}
                                                            />
                                                        </Box>

                                                        <Button onClick={() => { handleChooseCollection('') }} size="large">Browse</Button>
                                                    </InlineStack>
                                                </Box>

                                                {errors?.addToCartType?.products?.message && (
                                                    <Box paddingInlineStart={'300'} >
                                                        <InlineError
                                                            message={errors.addToCartType.products.message}
                                                        />
                                                    </Box>
                                                )}

                                                <Box paddingBlock={'400'} paddingInline={'300'}>
                                                    <BlockStack gap={'300'}>
                                                        {selectedCollection?.length > 0 && selectedCollection.map((item) => {
                                                            return <InlineStack key={item.id} blockAlign="center" align="space-between">
                                                                <InlineStack blockAlign="center" gap={'200'}>
                                                                    <Thumbnail
                                                                        source={item.image ? item.image : ''}
                                                                        alt={item.handle}
                                                                        size="small"
                                                                    />
                                                                    <Text fontWeight="medium">{item.title}</Text>
                                                                </InlineStack>
                                                                <Button
                                                                    onClick={() => {
                                                                        setSelectedCollection([]);
                                                                    }}
                                                                    variant="monochromePlain">
                                                                    <Icon tone="subdued" source={DeleteIcon} />
                                                                </Button>
                                                            </InlineStack>
                                                        })

                                                        }
                                                    </BlockStack>
                                                </Box>
                                            </Collapsible>
                                        </Box>
                                    </Box>
                                }
                                {watchedValues.appliesTo === "product" && watchedValues.addToCartType.type === "individual" &&
                                    <Box paddingBlockEnd={'400'}>
                                        <Box background="bg-fill" borderRadius="200">
                                            <Box minHeight="50px">
                                                <div className="collapsibleButtonDiv">
                                                    <Button onClick={() => { setChooseProductOpen(!chooseProductOpen) }} textAlign="left"
                                                        variant="monochromePlain"
                                                        size="large"
                                                        fullWidth
                                                        disclosure={chooseProductOpen ? 'up' : 'down'}
                                                    >
                                                        <Text variant="bodyMd" fontWeight="medium">{t("choose_product")}</Text>
                                                    </Button>
                                                </div>
                                            </Box>

                                            <Collapsible
                                                open={chooseProductOpen}
                                                transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                                expandOnPrint
                                            >
                                                <Box padding={'300'}>
                                                    <InlineStack blockAlign="center" align="space-between">
                                                        <Controller
                                                            name="addToCartType.products"
                                                            control={control}
                                                            rules={{
                                                                validate: (value) => {
                                                                    //console.log('v:', value);
                                                                    return value?.length !== 0 ? true : t("product_required_msg");
                                                                }
                                                            }}
                                                            render={({ field, fieldState }) => (
                                                                <input type="hidden"
                                                                    name="addToCartType.products"
                                                                    value={field.value}
                                                                    onChange={field.onChange}
                                                                />

                                                            )}
                                                        />

                                                        <Box width="78%">
                                                            <TextField
                                                                type="text"
                                                                autoSize
                                                                name="productSearchQuery"
                                                                value={''}
                                                                onChange={(value) => { handleChooseProductsInd(value) }}
                                                                autoComplete="off"
                                                                placeholder={t("browse_products")}
                                                                prefix={<Icon source={SearchIcon} />}
                                                            />
                                                        </Box>

                                                        <Button onClick={() => { handleChooseProductsInd('') }} size="large">Browse</Button>
                                                    </InlineStack>
                                                </Box>

                                                {errors?.addToCartType?.products?.message && (
                                                    <Box paddingInlineStart={'300'} >
                                                        <InlineError
                                                            message={errors.addToCartType.products.message}
                                                        />
                                                    </Box>
                                                )}

                                                <Box paddingBlock={'400'} paddingInline={'300'}>
                                                    <BlockStack gap={'300'}>
                                                        {selectedProductsInd?.length > 0 && selectedProductsInd.map((product) => {
                                                            return <InlineStack key={product.id} blockAlign="center" align="space-between">
                                                                <InlineStack blockAlign="center" gap={'200'}>
                                                                    <Thumbnail
                                                                        source={product.image}
                                                                        alt={product.handle}
                                                                        size="small"
                                                                    />
                                                                    <Text fontWeight="medium">{product.title}</Text>
                                                                </InlineStack>
                                                                <Button onClick={() => { handleDeleteProductInd(product.id) }} variant="monochromePlain">
                                                                    <Icon tone="subdued" source={DeleteIcon} />
                                                                </Button>
                                                            </InlineStack>
                                                        })

                                                        }
                                                    </BlockStack>
                                                </Box>
                                            </Collapsible>
                                        </Box>
                                    </Box>
                                }


                                {watchedValues.appliesTo === "product" && watchedValues.addToCartType.type === "bulk" &&
                                    <Box paddingBlockEnd={'400'}>
                                        <Box background="bg-fill" borderRadius="200">
                                            <Box minHeight="50px">
                                                <div className="collapsibleButtonDiv">
                                                    <Button onClick={() => { setChooseProductOpen(!chooseProductOpen) }} textAlign="left"
                                                        variant="monochromePlain"
                                                        size="large"
                                                        fullWidth
                                                        disclosure={chooseProductOpen ? 'up' : 'down'}
                                                    >
                                                        <Text variant="bodyMd" fontWeight="medium">{t("choose_product")}</Text>
                                                    </Button>
                                                </div>
                                            </Box>

                                            <Collapsible
                                                open={chooseProductOpen}
                                                transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                                expandOnPrint
                                            >
                                                <Box padding={'300'}>
                                                    <InlineStack blockAlign="center" align="space-between">
                                                        <Controller
                                                            name="addToCartType.products"
                                                            control={control}
                                                            rules={{
                                                                validate: (value) => {
                                                                    //console.log('v:', value);
                                                                    return value?.length !== 0 ? true : t("product_required_msg");
                                                                }
                                                            }}
                                                            render={({ field, fieldState }) => (
                                                                <input type="hidden"
                                                                    name="addToCartType.products"
                                                                    value={field.value}
                                                                    onChange={field.onChange}
                                                                />

                                                            )}
                                                        />

                                                        <Box width="78%">
                                                            <TextField
                                                                type="text"
                                                                autoSize
                                                                name="productSearchQuery"
                                                                value={''}
                                                                onChange={(value) => { handleChooseProductsBulk(value) }}
                                                                autoComplete="off"
                                                                placeholder={t("browse_products")}
                                                                prefix={<Icon source={SearchIcon} />}
                                                            />
                                                        </Box>

                                                        <Button onClick={() => { handleChooseProductsBulk('') }} size="large">Browse</Button>
                                                    </InlineStack>

                                                </Box>

                                                {errors?.addToCartType?.products?.message && (
                                                    <Box paddingInlineStart={'300'} >
                                                        <InlineError
                                                            message={errors.addToCartType.products.message}
                                                        />
                                                    </Box>
                                                )}

                                                <Box paddingBlockStart={'200'} paddingInline={'300'}>
                                                    <Box background="bg-surface-caution" borderRadius="200" padding={'200'}>
                                                        <Text variant="bodySm">{t("product_max_limit_msg")}</Text>
                                                    </Box>
                                                </Box>

                                                <Box paddingBlock={'400'} paddingInline={'300'}>
                                                    <BlockStack gap={'400'}>

                                                        {selectedProductsBulk?.length > 0 && selectedProductsBulk.map((product) => (
                                                            <Box key={product.id}>
                                                                <InlineStack align="space-between" blockAlign="center">
                                                                    <InlineStack gap={'200'} blockAlign="center">
                                                                        <Thumbnail size="small" source={product?.image ? product?.image : 'https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png'}
                                                                            alt={product.handle} />
                                                                        <Text variant="bodyMd" fontWeight="medium">{product.title}</Text>
                                                                    </InlineStack>
                                                                    <Button size="large" variant="monochromePlain" onClick={() => { handleDeleteProductBulk(product.id, 'product') }}>
                                                                        <Icon tone="subdued" source={DeleteIcon} />
                                                                    </Button>
                                                                </InlineStack>

                                                                {product?.variants?.length > 0 && product?.variants.map((variant) => (
                                                                    <Box key={variant.id} paddingBlockStart={'200'} paddingBlockEnd={'200'} paddingInlineStart={'400'} >

                                                                        <InlineStack align="center" blockAlign="center" gap={'200'}>
                                                                            <Thumbnail size="small" source={variant?.image ? variant.image : 'https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png'}
                                                                                alt={variant.title} />

                                                                            <BlockStack gap={'100'}>

                                                                                <Box paddingInline={'100'}>
                                                                                    <InlineStack align="space-between" blockAlign="center">
                                                                                        <Text variant="bodySm">{variant.title}</Text>

                                                                                        <Button size="medium" variant="monochromePlain" onClick={() => { handleDeleteProductBulk(variant.id, 'variant') }} >
                                                                                            <Icon tone="subdued" source={XIcon} />
                                                                                        </Button>
                                                                                    </InlineStack>
                                                                                </Box>
                                                                                <TextField
                                                                                    label='Quantity'
                                                                                    labelHidden
                                                                                    value={variant.quantity || 0}
                                                                                    onChange={(value) => { handleChangeQuantityDefault(variant.id, value) }}
                                                                                    align="center"
                                                                                    size="slim"
                                                                                    type="number"
                                                                                    min={1}
                                                                                    disabled={watchedValues?.enableQtyField === true ? true : false}
                                                                                />

                                                                            </BlockStack>

                                                                        </InlineStack>
                                                                    </Box>
                                                                ))

                                                                }

                                                                <Divider />
                                                            </Box>



                                                        ))


                                                        }
                                                        <Box borderRadius="100" padding={'400'} background="bg-surface-secondary">
                                                            <Controller
                                                                name="enableQtyField"
                                                                control={control}

                                                                render={({ field }) => (
                                                                    <BlockStack gap="200">
                                                                        <Checkbox
                                                                            label={t("fixed_qty")}
                                                                            checked={field.value === false}
                                                                            onChange={() => field.onChange(false)}
                                                                        />
                                                                        <Checkbox
                                                                            label={t("enable_qty_field")}
                                                                            checked={field.value === true}
                                                                            onChange={() => field.onChange(true)}
                                                                        />
                                                                    </BlockStack>
                                                                )}
                                                            />

                                                        </Box>
                                                    </BlockStack>
                                                </Box>
                                            </Collapsible>
                                        </Box>
                                    </Box>
                                }

                                <Box paddingBlockEnd={'400'}>
                                    <Box background="bg-fill" borderRadius="200">
                                        <Box minHeight="50px">
                                            <div className="collapsibleButtonDiv">
                                                <Button onClick={() => { setLayoutOpen(!layoutOpen) }} textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={layoutOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("layout_preview")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={layoutOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box padding={'300'}>
                                                <BlockStack gap={'100'}>
                                                    <Controller
                                                        name="layout"
                                                        control={control}
                                                        defaultValue="list"
                                                        render={({ field }) => (
                                                            <>
                                                                <RadioButton
                                                                    name="layout"
                                                                    label={t("list")}
                                                                    checked={field.value === 'list'}
                                                                    onChange={() => field.onChange('list')}

                                                                />
                                                                <RadioButton
                                                                    name="layout"
                                                                    label={t("grid")}
                                                                    checked={field.value === 'grid'}
                                                                    onChange={() => field.onChange('grid')}

                                                                />
                                                                <RadioButton
                                                                    name="layout"
                                                                    label={t("grid_slider")}
                                                                    checked={field.value === 'gridSlider'}
                                                                    onChange={() => field.onChange('gridSlider')}

                                                                />
                                                            </>
                                                        )}
                                                    />
                                                </BlockStack>
                                            </Box>
                                        </Collapsible>
                                    </Box>
                                </Box>

                                <Box paddingBlockEnd={'400'}>
                                    <Box background="bg-fill" borderRadius="200">
                                        <Box minHeight="50px">
                                            <div className="collapsibleButtonDiv">
                                                <Button onClick={() => { setStatusOpen(!statusOpen) }} textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={statusOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("status")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={statusOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box padding={'300'}>
                                                <BlockStack gap={'100'}>
                                                    <Controller
                                                        name="status"
                                                        control={control}
                                                        defaultValue="active"
                                                        render={({ field }) => (
                                                            <>
                                                                <RadioButton
                                                                    name="status"
                                                                    label={t("activate")}
                                                                    checked={field.value === 'activate'}
                                                                    onChange={() => field.onChange('activate')}

                                                                />
                                                                <RadioButton
                                                                    name="status"
                                                                    label={t("deactivate")}
                                                                    checked={field.value === 'deactivate'}
                                                                    onChange={() => field.onChange('deactivate')}

                                                                />
                                                            </>
                                                        )}
                                                    />
                                                </BlockStack>
                                            </Box>
                                        </Collapsible>
                                    </Box>
                                </Box>

                                <Box paddingBlockEnd={'400'}>
                                    <Box background="bg-fill" borderRadius="200">
                                        <Box minHeight="50px">
                                            <div className="collapsibleButtonDiv">
                                                <Button onClick={() => { setButtonStyleOpen(!buttonStyleOpen) }} textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={buttonStyleOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("button_style")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={buttonStyleOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box padding={'300'}>
                                                <BlockStack gap={'300'}>
                                                    <InlineStack gap={'100'} blockAlign="center" align="space-between">
                                                        <Box minWidth="48%">
                                                            <Controller
                                                                name="buttonStyleSettings.buttonFontWeight"
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Select
                                                                        label={t("button_font_weight")}
                                                                        options={fontWeight}
                                                                        selected={field.value}
                                                                        onChange={field.onChange}
                                                                        value={field.value}
                                                                    />
                                                                )}
                                                            />
                                                        </Box>
                                                        <Box minWidth="48%">
                                                            <Controller
                                                                name="buttonStyleSettings.buttonFontSize"
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Select
                                                                        label={t("button_font_size")}
                                                                        options={fontSize}
                                                                        selected={field.value}
                                                                        onChange={field.onChange}
                                                                        value={field.value}
                                                                    />
                                                                )}
                                                            />
                                                        </Box>
                                                    </InlineStack>

                                                    <Box>
                                                        <CustomColorPicker
                                                            label={t("button_font_color")}
                                                            defaultColor={buttonStyleSettings.buttonTextColor}
                                                            onColorChange={(value) => {
                                                                setButtonStyleSettings({ ...buttonStyleSettings, buttonTextColor: value });
                                                            }}
                                                        />
                                                    </Box>

                                                    <Box>
                                                        <CustomColorPicker
                                                            label={t("button_bg_color")}
                                                            defaultColor={buttonStyleSettings.buttonBackgroundColor}
                                                            onColorChange={(value) => {
                                                                setButtonStyleSettings({ ...buttonStyleSettings, buttonBackgroundColor: value });
                                                            }}
                                                        />
                                                    </Box>

                                                    <Box>
                                                        <CustomColorPicker
                                                            label={t("button_border_color")}
                                                            defaultColor={buttonStyleSettings.buttonBorderColor}
                                                            onColorChange={(value) => {
                                                                setButtonStyleSettings({ ...buttonStyleSettings, buttonBorderColor: value });
                                                            }}
                                                        />
                                                    </Box>

                                                    <BlockStack gap={'300'}>
                                                        <RangeSlider
                                                            label={t("border_radius")}
                                                            value={buttonStyleSettings.buttonBorderRadius}
                                                            onChange={(value) => {
                                                                setButtonStyleSettings({ ...buttonStyleSettings, buttonBorderRadius: value });
                                                            }}
                                                            min={0}
                                                            max={50}
                                                            step={1}
                                                            suffix={`${buttonStyleSettings.buttonBorderRadius}px`}
                                                        />

                                                        <RangeSlider
                                                            label={t("top_bottom_padding")}
                                                            value={buttonStyleSettings.buttonTBPadding}
                                                            onChange={(value) => {
                                                                setButtonStyleSettings({ ...buttonStyleSettings, buttonTBPadding: value });
                                                            }}
                                                            min={0}
                                                            max={100}
                                                            step={1}
                                                            suffix={`${buttonStyleSettings.buttonTBPadding}px`}
                                                        />

                                                        <RangeSlider
                                                            label={t("right_left_padding")}
                                                            value={buttonStyleSettings.buttonLRPadding}
                                                            onChange={(value) => {
                                                                setButtonStyleSettings({ ...buttonStyleSettings, buttonLRPadding: value });
                                                            }}
                                                            min={0}
                                                            max={100}
                                                            step={1}
                                                            suffix={`${buttonStyleSettings.buttonLRPadding}px`}
                                                        />
                                                    </BlockStack>

                                                </BlockStack>
                                            </Box>
                                        </Collapsible>
                                    </Box>
                                </Box>

                                <Box paddingBlockEnd={'400'}>
                                    <Box background="bg-fill" borderRadius="200">
                                        <Box minHeight="50px">
                                            <div className="collapsibleButtonDiv">
                                                <Button onClick={() => { setShoppingCartOpen(!shoppingCartOpen) }} textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={shoppingCartOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("shopping_cart")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={shoppingCartOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box padding={'300'}>

                                                <BlockStack gap={'300'}>
                                                    <Controller
                                                        name="shoppingCartSettings.heading"
                                                        control={control}
                                                        rules={{
                                                            required: false,
                                                            maxLength: {
                                                                value: 50,
                                                                message: t("heading_max_length_error")
                                                            }
                                                        }}
                                                        render={({ field, fieldState }) => (
                                                            <TextField
                                                                type="text"
                                                                label={t("heading")}
                                                                name="shoppingCartSettings.heading"
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                error={fieldState.error?.message || actionData?.errors?.shoppingCartSettings?.heading}
                                                                autoComplete="off"
                                                                maxLength={50}
                                                                showCharacterCount
                                                            />
                                                        )}
                                                    />

                                                    <Controller
                                                        name="shoppingCartSettings.emptyCartText"
                                                        control={control}
                                                        rules={{
                                                            required: false,
                                                            maxLength: {
                                                                value: 50,
                                                                message: t("heading_max_length_error")
                                                            }
                                                        }}
                                                        render={({ field, fieldState }) => (
                                                            <TextField
                                                                type="text"
                                                                label={t("empty_cart_text")}
                                                                name="shoppingCartSettings.emptyCartText"
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                error={fieldState.error?.message || actionData?.errors?.shoppingCartSettings?.emptyCartText}
                                                                autoComplete="off"
                                                                maxLength={50}
                                                                showCharacterCount
                                                            />
                                                        )}
                                                    />

                                                    <Controller
                                                        name="shoppingCartSettings.additionalInfo"
                                                        control={control}
                                                        rules={{
                                                            required: false,
                                                            maxLength: {
                                                                value: 100,
                                                                message: t("heading_max_length_error")
                                                            }
                                                        }}
                                                        render={({ field, fieldState }) => (
                                                            <TextField
                                                                type="text"
                                                                label={t("additional_info")}
                                                                name="shoppingCartSettings.additionalInfo"
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                error={fieldState.error?.message || actionData?.errors?.shoppingCartSettings?.additionalInfo}
                                                                autoComplete="off"
                                                                maxLength={100}
                                                                showCharacterCount
                                                            />
                                                        )}
                                                    />

                                                    <Box>
                                                        <CustomColorPicker
                                                            label={t("shopping_cart_bg_color")}
                                                            defaultColor={shoppingCartSettings.shoppingCartBgColor}
                                                            onColorChange={(value) => {
                                                                setShoppingCartSettings({ ...shoppingCartSettings, shoppingCartBgColor: value });
                                                            }}
                                                        />
                                                    </Box>

                                                    <Box>
                                                        <CustomColorPicker
                                                            label={t("shpping_cart_txt_color")}
                                                            defaultColor={shoppingCartSettings.shoppingCartTextColor}
                                                            onColorChange={(value) => {
                                                                setShoppingCartSettings({ ...shoppingCartSettings, shoppingCartTextColor: value });
                                                            }}
                                                        />
                                                    </Box>

                                                    <Box>
                                                        <CustomColorPicker
                                                            label={t("shopping_cart_btn_bg_color")}
                                                            defaultColor={shoppingCartSettings.shoppingCartBtnBgColor}
                                                            onColorChange={(value) => {
                                                                setShoppingCartSettings({ ...shoppingCartSettings, shoppingCartBtnBgColor: value });
                                                            }}
                                                        />
                                                    </Box>


                                                </BlockStack>
                                            </Box>
                                        </Collapsible>
                                    </Box>
                                </Box>

                                <Box paddingBlockEnd={'400'}>
                                    <Box background="bg-fill" borderRadius="200">
                                        <Box minHeight="50px">
                                            <div className="collapsibleButtonDiv">
                                                <Button onClick={() => { setSettingsOpen(!settingsOpen) }} textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={settingsOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("settings")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={settingsOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box padding={'300'}>
                                                {/* <InlineStack  gap={'100'} direction={'row'} align="start" blockAlign="stretch">
                                                    {settingsTab.map((item, index) => (
                                                        <Box 
                                                        key={index} 
                                                        background={settingsTabSelected === index ? "bg" : "bg-fill"} 
                                                        borderRadius="200"
                                                        >
                                                            <Button
                                                                size="medium"
                                                                variant="tertiary"
                                                                onClick={() => { handleSettingsTabChange(index) }}
                                                                fullWidth
                                                                >
                                                                {item.content}
                                                            </Button>
                                                        </Box>
                                                    ))

                                                    }
                                                </InlineStack> */}

                                                <Tabs
                                                    selected={settingsTabSelected}
                                                    onSelect={handleSettingsTabChange}
                                                    tabs={settingsTab}
                                                    fitted
                                                >
                                                    {settingsTabSelected === 0 &&
                                                        <Box paddingInline={'300'} paddingBlock={'200'}>
                                                            <BlockStack gap={'300'}>
                                                                <Box visuallyHidden={watchedValues.appliesTo === "product" && watchedValues.addToCartType.type === "bulk"}>
                                                                    <BlockStack gap={'100'}>
                                                                    <Text variant="bodyMd" fontWeight="regular">{t("view_full_product")}</Text>
                                                                    <Controller
                                                                        name="componentSettings.fullView"
                                                                        control={control}
                                                                        defaultValue="active"
                                                                        render={({ field }) => (
                                                                            <InlineStack gap={'400'} blockAlign="center">
                                                                                <RadioButton
                                                                                    name="componentSettings.fullView"
                                                                                    label={t("yes")}
                                                                                    checked={field.value === true}
                                                                                    onChange={() => field.onChange(true)}

                                                                                />
                                                                                <RadioButton
                                                                                    name="componentSettings.fullView"
                                                                                    label={t("no")}
                                                                                    checked={field.value === false}
                                                                                    onChange={() => field.onChange(false)}

                                                                                />
                                                                            </InlineStack>
                                                                        )}
                                                                    />

                                                                </BlockStack>
                                                                </Box>

                                                                <BlockStack gap={'100'}>
                                                                    <Text variant="bodyMd" fontWeight="regular">{t("cart_behavior")}</Text>
                                                                    <Controller
                                                                        name="componentSettings.cartBehavior"
                                                                        control={control}
                                                                        defaultValue="active"
                                                                        render={({ field }) => (
                                                                            <InlineStack gap={'400'} blockAlign="center">
                                                                                <RadioButton
                                                                                    name="componentSettings.cartBehavior"
                                                                                    label={t("open_to_cart")}
                                                                                    checked={field.value === 'cart'}
                                                                                    onChange={() => field.onChange('cart')}

                                                                                />
                                                                                <RadioButton
                                                                                    name="componentSettings.cartBehavior"
                                                                                    label={t("checkout")}
                                                                                    checked={field.value === 'checkout'}
                                                                                    onChange={() => field.onChange('checkout')}

                                                                                />
                                                                            </InlineStack>
                                                                        )}
                                                                    />

                                                                </BlockStack>
                                                            </BlockStack>
                                                        </Box>

                                                    }

                                                    {settingsTabSelected === 1 &&
                                                        <Box paddingInline={'300'} paddingBlock={'200'}>
                                                            <BlockStack gap={'300'}>
                                                                <InlineStack gap={'100'} blockAlign="center" align="space-between">
                                                                    <Box minWidth="48%">
                                                                        <Controller
                                                                            name="productLayoutSettings.productTitleWeight"
                                                                            control={control}
                                                                            render={({ field }) => (
                                                                                <Select
                                                                                    label={t("Product_title_font_weight")}
                                                                                    options={fontWeight}
                                                                                    selected={field.value}
                                                                                    onChange={field.onChange}
                                                                                    value={field.value}
                                                                                />
                                                                            )}
                                                                        />
                                                                    </Box>
                                                                    <Box minWidth="48%">
                                                                        <Controller
                                                                            name="productLayoutSettings.productTitleSize"
                                                                            control={control}
                                                                            render={({ field }) => (
                                                                                <Select
                                                                                    label={t("Product_title_font_size")}
                                                                                    options={fontSize}
                                                                                    selected={field.value}
                                                                                    onChange={field.onChange}
                                                                                    value={field.value}
                                                                                />
                                                                            )}
                                                                        />
                                                                    </Box>
                                                                </InlineStack>

                                                                <InlineStack gap={'100'} blockAlign="center" align="space-between">
                                                                    <Box minWidth="48%">
                                                                        <Controller
                                                                            name="productLayoutSettings.productPriceWeight"
                                                                            control={control}
                                                                            render={({ field }) => (
                                                                                <Select
                                                                                    label={t("prouct_price_font_weight")}
                                                                                    options={fontWeight}
                                                                                    selected={field.value}
                                                                                    onChange={field.onChange}
                                                                                    value={field.value}
                                                                                />
                                                                            )}
                                                                        />
                                                                    </Box>
                                                                    <Box minWidth="48%">
                                                                        <Controller
                                                                            name="productLayoutSettings.productPriceSize"
                                                                            control={control}
                                                                            render={({ field }) => (
                                                                                <Select
                                                                                    label={t("prouct_price_font_size")}
                                                                                    options={fontSize}
                                                                                    selected={field.value}
                                                                                    onChange={field.onChange}
                                                                                    value={field.value}
                                                                                />
                                                                            )}
                                                                        />
                                                                    </Box>
                                                                </InlineStack>

                                                                <Box>
                                                                    <CustomColorPicker
                                                                        label={t("product_title_font_color")}
                                                                        defaultColor={productLayoutSettings.productTitleColor}
                                                                        onColorChange={(value) => {
                                                                            setProductLayoutSettings({ ...productLayoutSettings, productTitleColor: value });
                                                                        }}
                                                                    />
                                                                </Box>

                                                                <Box>
                                                                    <CustomColorPicker
                                                                        label={t("product_price_font_color")}
                                                                        defaultColor={productLayoutSettings.productPriceColor}
                                                                        onColorChange={(value) => {
                                                                            setProductLayoutSettings({ ...productLayoutSettings, productPriceColor: value });
                                                                        }}
                                                                    />
                                                                </Box>

                                                                <Box>
                                                                    <CustomColorPicker
                                                                        label={t("product_card_bg_color")}
                                                                        defaultColor={productLayoutSettings.productCardBgColor}
                                                                        onColorChange={(value) => {
                                                                            setProductLayoutSettings({ ...productLayoutSettings, productCardBgColor: value });
                                                                        }}
                                                                    />
                                                                </Box>

                                                                <Box>
                                                                    <CustomColorPicker
                                                                        label={t("product_card_border_color")}
                                                                        defaultColor={productLayoutSettings.productCardBorderColor}
                                                                        onColorChange={(value) => {
                                                                            setProductLayoutSettings({ ...productLayoutSettings, productCardBorderColor: value });
                                                                        }}
                                                                    />
                                                                </Box>

                                                            </BlockStack>
                                                        </Box>

                                                    }

                                                </Tabs>
                                            </Box>
                                        </Collapsible>
                                    </Box>
                                </Box>

                                <Box paddingBlockEnd={'400'}>
                                    <Box background="bg-fill" borderRadius="200">
                                        <Box minHeight="50px">
                                            <div className="collapsibleButtonDiv">
                                                <Button onClick={() => { setTranckingOpen(!tranckingOpen) }} textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={tranckingOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("trancking")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={tranckingOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box padding={'300'}>
                                                <BlockStack gap={'100'}>
                                                    <Controller
                                                        name="tracking"
                                                        control={control}
                                                        // rules={{
                                                        //     required: true,

                                                        // }}
                                                        render={({ field }) => (
                                                            <TextField
                                                                name="tracking"
                                                                label={t("tracking_code")}
                                                                value={field.value}
                                                                onChange={(value) => {
                                                                    value === '' ? field.onChange(trackingCode) : field.onChange(value.toUpperCase())
                                                                }}
                                                                type="text"
                                                                minLength={2}
                                                                maxLength={20}
                                                                showCharacterCount
                                                                placeholder={t("enter_tracking_code")}
                                                            />
                                                        )}
                                                    />
                                                </BlockStack>
                                            </Box>
                                        </Collapsible>
                                    </Box>
                                </Box>


                            </BlockStack>

                            <Box paddingBlockEnd={'400'}>
                                <InlineStack align="end">
                                    <Button disabled={!isDirty} size="large" variant="primary" submit>
                                        Save
                                    </Button>
                                </InlineStack>
                            </Box>

                        </Layout.Section>

                        <Layout.Section>
                            <Box>
                                <Card padding={'0'} roundedAbove="xs">
                                    <InlineStack align="space-between" blockAlign="center">
                                        <Box></Box>
                                        <Box paddingBlockStart={'300'}>
                                            <Box
                                                paddingBlock={'100'}
                                                paddingInline={'100'}
                                                background={"bg"}
                                                borderRadius={'200'}
                                            >
                                                <InlineStack gap={'200'}>

                                                    {showViewMDF?.length > 0 && showViewMDF.map((btn) => (
                                                        <Button onClick={() => { handleShowViewMDF(btn.id, btn.view) }} key={btn.id} variant={selectedViewMDF.id === btn.id ? 'secondary' : 'tertiary'} icon={btn.icon} size="micro" />
                                                    ))

                                                    }
                                                </InlineStack>
                                            </Box>
                                        </Box>
                                        <Box paddingBlockStart={'300'} paddingInlineEnd={'300'}>
                                            <Button>Copy Code</Button>
                                        </Box>

                                    </InlineStack>
                                    <iframe
                                        title="spc-iframe"
                                        srcDoc={embedPHtmlCode}
                                        style={{ width: '100%', height: '100vh', border: 'none' }}
                                        sandbox="allow-scripts allow-same-origin allow-popups"
                                        className={`spc_iframe_view_${selectedViewMDF.view} spc_iframe`}
                                    ></iframe>

                                    <Modal id="spc-modal" variant="max" onHide={() => {
                                        setSelectedViewMDF({ id: 2, view: 'desktop' })
                                    }}>
                                        <iframe
                                            title="spc-iframe"
                                            srcDoc={embedPHtmlCode}
                                            style={{ width: '100%', height: "100vh", border: 'none' }}
                                            sandbox="allow-scripts allow-same-origin allow-popups"
                                            className={`spc_iframe_view_${selectedViewMDF.view} spc_iframe`}
                                        ></iframe>
                                    </Modal>
                                    <Box paddingBlock={'200'} paddingInlineEnd={'400'}>
                                        <InlineStack align="end">
                                            <Button>Copy Code</Button>
                                        </InlineStack>
                                    </Box>
                                </Card>
                            </Box>

                        </Layout.Section>
                    </Layout>
                </Page >
            </form >
    )
}

export default CreateComponent

export const action = async ({ request }) => {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    console.log(data);
    return null;
}