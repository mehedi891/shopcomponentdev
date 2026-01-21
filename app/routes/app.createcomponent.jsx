import { useActionData, useLoaderData, useNavigate, useNavigation, useSubmit } from "react-router";
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Modal, SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { limitTotalVariants } from "../utilis/limitVariants";
import { authenticate } from "../shopify.server";
import crypto from "crypto";
import { fontSize, fontWeight } from "../utilis/staticData";
import { emptyStateHtml } from "../webcomponentsHtml/emptyState";
import { stylesPdT1 } from "../webcomponentsHtml/stylesProduct";
import { floatingCartCountBuble } from "../webcomponentsHtml/generalHTML";
import db from "../db.server";
import UpgradeTooltip from "../components/UpgradeTooltip/UpgradeTooltip";
import DraggableProductInd from "../components/DragAblePd/DraggableProductInd";
import DraggableProductBulk from "../components/DragAblePd/DraggableProductBulk";
import { ADD_TO_CART_TYPE, APPLIES_TO, BoleanOptions, CART_BEHAVIOR, LAYOUT, PLAN_NAME, SHOW_COMPONENT_TITLE, STATUS } from "../constants/constants";
import redis from "../utilis/redis.init";
import { getRemainingTrialDays } from "../utilis/remainTrialDaysCount";
import ColorFieldController from "../components/ColorFieldController/ColorFieldController";




export const loader = async ({ request }) => {
    const { session, redirect, admin } = await authenticate.admin(request);


    let marketRegions = [];
    const isExistMarketRegions = await redis.get(`shop:${session.shop}:marketRegions`);

    if (isExistMarketRegions) {
        marketRegions = JSON.parse(isExistMarketRegions);
    } else {
        try {
            const marketResponse = await admin.graphql(`#graphql
      query MarketsRegionCountryCodes {
        markets(first: 250) {
          nodes {
            name
            conditions {
              regionsCondition {
                regions(first: 250) {
                  nodes {
                    name
                    ... on MarketRegionCountry {
                      code
                    }
                  }
                }
              }
            }
          }
        }
      }
    `);

            const marketData = await marketResponse.json();

            marketRegions = (marketData?.data?.markets?.nodes ?? []).reduce((acc, m) => {
                const regions = m?.conditions?.regionsCondition?.regions?.nodes ?? [];
                for (const r of regions) {
                    if (!r?.code) continue;              // keep only country regions
                    if (acc.seen.has(r.code)) continue;  // prevent duplicates
                    acc.seen.add(r.code);
                    acc.items.push(r);
                }
                return acc;
            }, { seen: new Set(), items: [] }).items;

            await redis.set(`shop:${session.shop}:marketRegions`, JSON.stringify(marketRegions), 'EX', 600,); // cache for 10 minutes
        } catch (error) {
            console.log('error:from market regions', error);
        }
    }

    const shop = await db.shop.findUnique({
        where: {
            shopifyDomain: session.shop
        },
        include: {
            plan: true,
            affiliates: true,
            components: {
                select: { id: true }
            }
        }
    });

    if (!shop?.plan) {
        throw redirect('/app/plans');
    }

    if (shop?.plan?.isTestPlan) {
        const remaingTrialDays = getRemainingTrialDays(shop?.createdAt, shop?.trialDays);
        if (!shop?.plan || (shop?.plan?.isTestPlan && remaingTrialDays < 1)) {
            throw redirect('/app/plans');
        }
    }



    const totalPublishSpc = await admin.graphql(
        `#graphql
            query PublishedProductCount($publicationId: ID!) {
                publishedProductsCount(publicationId: $publicationId) {
                count
                precision
                }
            }`,

        {
            variables: {
                "publicationId": shop?.publicationId
            },
        },
    );

    const totalPublishSpcJson = await totalPublishSpc.json();

    if (totalPublishSpcJson?.data?.publishedProductsCount?.count === 0) {
        const fiftyPdIdsRes = await admin.graphql(
            `#graphql
            query GetProducts {
                products(first: 40) {
                nodes {
                    id
                }
                }
            }`,
        );
        const fiftyPdIds = await fiftyPdIdsRes.json();

        let pdArr = [];
        if (fiftyPdIds?.data?.products?.nodes.length > 0) {
            pdArr = fiftyPdIds?.data?.products?.nodes?.map(pd => {
                return `${pd.id}`
            });

            await admin.graphql(
                `#graphql
                mutation publicationUpdate($id: ID!, $input: PublicationUpdateInput!) {
                    publicationUpdate(id: $id, input: $input) {
                    publication {
                        id
                        autoPublish
                    }
                    userErrors {
                        field
                        message
                    }
                    }
                }`,
                {
                    variables: {
                        id: shop?.publicationId,
                        input: {
                            publishablesToAdd: pdArr,
                            publishablesToRemove: [],
                            autoPublish: true,
                        },
                    },
                }
            );


        }


    }

    const pulblicationCollection = await admin.graphql(
        `#graphql
            query publication($id: ID!) {
                publication(id: $id) {
                id
                collections(first: 40) {
                    edges {
                    node {
                        id
                    }
                    }
                }
                }
            }`,
        {
            variables: {
                "id": shop?.publicationId
            },
        },
    );

    const pulblicationCollectionJson = await pulblicationCollection.json();

    if (pulblicationCollectionJson?.data?.publication?.collections?.edges?.length === 0) {
        const collectionsRes = await admin.graphql(
            `#graphql
              query {
                collections(first: 10) {
                  edges {
                    node {
                      id
                    }
                  }
                }
              }`,
        );
        const collections = await collectionsRes.json();

        let collectionArr = [];

        if (collections?.data?.collections?.edges?.length > 0) {
            collectionArr = collections?.data?.collections?.edges.map(collection => `${collection.node.id}`);

        }

        console.log('colloecrtionArr:', collectionArr);


        await admin.graphql(
            `#graphql
  mutation PublishablePublish($collectionId: ID!, $publicationId: ID!) {
    publishablePublish(id: $collectionId, input: {publicationId: $publicationId}) {
      publishable {
        publishedOnPublication(publicationId: $publicationId)
      }
      userErrors {
        field
        message
      }
    }
  }`,
            {
                variables: {
                    "collectionId": collectionArr[0] || "",
                    "publicationId": shop?.publicationId || ""
                },
            },
        );

    }





    const trackingCode = crypto.randomBytes(15).toString("base64url").slice(0, 10).toUpperCase();

    return {
        trackingCode: trackingCode,
        shopData: shop,
        marketRegions
    }
}

const CreateComponent = () => {
    const { trackingCode, shopData, marketRegions } = useLoaderData();
    //console.log('shopData:', shopData);
    const navigate = useNavigate();
    const actionData = useActionData();
    const [toogleOpen, setToogleOpen] = useState({
        titleAndDescToggleOpen: true,
        cartBehaviorOpen: true,
        appliesToOpen: true,
        layoutOpen: false,
        statusOpen: false,
        buttonStyleOpen: false,
        shoppingCartOpen: false,
        settingsOpen: false,
        customCssOpen: false,
        tranckingOpen: false,
        affiliateAssignOpen: true,
        marketAssignOpen: true,
    });
    const [selectedCollection, setSelectedCollection] = useState([]);
    const [selectedProductsInd, setSelectedProductsInd] = useState([]);
    const [selectedProductsBulk, setSelectedProductsBulk] = useState([]);
    const [settingsTabSelected, setSettingsTabSelected] = useState(0);

    const [selectedViewMDF, setSelectedViewMDF] = useState({
        id: 2,
        view: 'desktop'
    });
    const [embedPHtmlCode, setEmbedPHtmlCode] = useState('');
    const [disabledContentByPlan, setDisabledContentByPlan] = useState(false);
    const [disabledContentProPlan, setDisabledContentProPlan] = useState(false);
    const [delayedSrcDoc, setDelayedSrcDoc] = useState("");
    const [checkMaxSelectedVariants, setCheckMaxSelectedVariants] = useState(false);
    const navigation = useNavigation();
    const shopify = useAppBridge();

    const submit = useSubmit();
  


    const { register, setError, getValues, handleSubmit, reset, formState: { errors, isDirty }, control, watch, setValue } = useForm({
        mode: "onChange",        // validate on change
        reValidateMode: "onChange",
        defaultValues: {
            title: '',
            description: '',
            appliesTo: APPLIES_TO.byproduct,
            addToCartType: {
                type: ADD_TO_CART_TYPE.individual,
                products: []
            },
            enableQtyField: false,
            layout: LAYOUT.grid,
            status: STATUS.activate,
            componentSettings: {
                fullView: false,
                cartBehavior: CART_BEHAVIOR.checkout,
                customCss: '',
                showComponentTitle: SHOW_COMPONENT_TITLE.yes
            },
            shoppingCartSettings: {
                heading: 'Shopping cart',
                emptyCartText: 'Your cart is empty',
                additionalInfo: 'Note: Shipping and taxes will be added at checkout.',
                shoppingCartBgColor: '#ffffff',
                shoppingCartTextColor: '#000000',
                shoppingCartBtnBgColor: '#2563EB',

                shoppingCartBtnTxt: 'CHECKOUT',
                showOrderNote: BoleanOptions.no,
                orderNoteTitle: 'Add a note to your order',
                orderNotePlaceholder: 'Write a note...',
                showDiscountCodeField: BoleanOptions.no,
                discountCodeTitle: 'Apply discount code',
                discountCodePlaceholder: 'Enter your code',
                discountApplyBtnTxt: 'Apply',
            },
            productLayoutSettings: {
                productTitleWeight: '600',
                productTitleSize: '20px',
                productPriceWeight: '600',
                productPriceSize: '14px',
                productTitleColor: '#000000',
                productPriceColor: '#000000',
                productCardBgColor: '#ffffff',
                productCardBorderColor: '#e5e5e5',
            },
            buttonStyleSettings: {
                addToCartBtnTxt: 'Add to cart',
                checkoutBtnTxt: 'Buy now',
                viewBtnTxt: 'View product',
                buttonFontWeight: '600',
                buttonFontSize: '14px',
                buttonTextColor: '#FFFFFF',
                buttonBackgroundColor: '#303030',
                buttonBorderColor: '#e5e5e5',
                buttonBorderRadius: '8',
                buttonTBPadding: '14',
                buttonLRPadding: '10',
            },
            tracking: trackingCode || '',
            customerTracking: '',
            utmSource: '',
            utmMedium: '',
            utmCampaign: '',
            shopId: shopData?.id,
            affiliateId: null,
            market: 'US',
            compHtml: 'EmptyHtml'
        }
    });
    const watchedValues = watch();


    useEffect(() => {
        setDisabledContentByPlan(shopData?.plan?.planName === PLAN_NAME.free ? true : false)
        setDisabledContentProPlan(shopData?.plan?.planName === PLAN_NAME.pro ? false : true)
    }, [shopData]);


console.log('disable content by plan',shopData?.plan?.planName, disabledContentByPlan);
    // console.log('disable content by plan::',disabledContentByPlan && shopData?.components?.length,shopData?.plan?.planName, disabledContentByPlan);


    useEffect(() => {
        if (watchedValues.appliesTo === APPLIES_TO.byproduct) {
            if (watchedValues.addToCartType.type === ADD_TO_CART_TYPE.individual) {
                setValue('addToCartType.products', selectedProductsInd, { shouldDirty: true, shouldValidate: true });
            } else if (watchedValues.addToCartType.type === ADD_TO_CART_TYPE.bulk) {
                setValue('addToCartType.products', selectedProductsBulk, { shouldDirty: true, shouldValidate: true });
            }
        } else if (watchedValues.appliesTo === APPLIES_TO.bycollection) {
            setValue('addToCartType.products', selectedCollection, { shouldDirty: true, shouldValidate: true });
        }

    }, [selectedProductsInd, selectedCollection, watchedValues.appliesTo, selectedProductsBulk, watchedValues.addToCartType.type]);

    const formHandleSubmit = (data) => {
        const updatedData = { ...data, addToCartType: JSON.stringify(data.addToCartType), buttonStyleSettings: JSON.stringify(data.buttonStyleSettings), productLayoutSettings: JSON.stringify(data.productLayoutSettings), shoppingCartSettings: JSON.stringify(data.shoppingCartSettings), componentSettings: JSON.stringify(data.componentSettings) };
        //console.log(updatedData);
        submit(updatedData, { method: 'post' });
    };

    const handleChooseProductsInd = async (query) => {
        const selected = await shopify.resourcePicker({
            type: 'product',
            multiple: disabledContentByPlan ? 3 : shopData?.maxAllowedComponents || 3,
            selectionIds: selectedProductsInd.length > 0 ? selectedProductsInd?.map(product => {
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
                const selectedProducts = selected?.map(product => {
                    return { id: product.id, title: product.title, handle: product.handle, image: product?.images[0]?.originalSrc ? product?.images[0]?.originalSrc : null };
                })
                return selectedProducts
            });
        }

    }

    const handleChooseProductsBulk = async (query) => {
        const selected = await shopify.resourcePicker({
            type: 'product',
            multiple: shopData?.maxAllowedComponents || 3,
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
            //console.log('selectedBulk:', selected);
            setSelectedProductsBulk(limitTotalVariants(selected, shopData?.maxAllowedComponents || 1));
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
                    return { id: item.id, title: item.title, handle: item.handle, image: item?.image?.originalSrc ? item?.image?.originalSrc : null };
                })
                return selectedCollection
            });

            //console.log(selected);
        }
    }

    useEffect(() => {
        if (selectedProductsBulk?.length > 0) {
            const totalVariants = selectedProductsBulk.reduce((sum, product) => {
                return sum + (product.variants?.length || 0);
            }, 0);
            setCheckMaxSelectedVariants(totalVariants >= Number(shopData?.maxAllowedComponents || 0));
            //console.log('selectedProductsBulk', selectedProductsBulk);
        }
    }, [selectedProductsBulk,shopData?.maxAllowedComponents]);

    const handleDeleteProductInd = (id) => {
        // console.log('id:',id);
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






    useEffect(() => {
        if (isDirty) {
            if (disabledContentByPlan && shopData?.components?.length > 0) {
                shopify.saveBar.hide('spc-save-bar');
            } else if (shopData?.components?.length >= shopData?.maxAllowedComponents && shopData?.plan?.planName === PLAN_NAME.growth) {
                shopify.saveBar.hide('spc-save-bar');
            } else {
                shopify.saveBar.show('spc-save-bar');
            }
        } else {
            shopify.saveBar.hide('spc-save-bar');
        }
    }, [isDirty]);




    const handleDiscard = () => {
        setSelectedProductsBulk([]);
        setSelectedProductsInd([]);
        setSelectedCollection([]);
        reset();
    }



    //Start webcomponents 




    const showViewMDF = [
        {
            id: 1,
            titele: 'Mobile view',
            view: 'mobile',
            icon: "mobile"

        },
        {
            id: 2,
            titele: 'Desktop view',
            view: 'desktop',
            icon: "desktop"
        },
        {
            id: 3,
            titele: 'Full view',
            view: 'full',
            icon: "viewport-wide"
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
                display: ${watchedValues.componentSettings.showComponentTitle === SHOW_COMPONENT_TITLE.no ? 'none' : 'block'}             
            }
            .shopcomponent_description{
                font-family: Inter;
                font-size: 14px;
                font-style: normal;
                font-weight: 450;
                line-height: 20px;
            }
            .spcProductCard_${watchedValues.tracking}{
                border-radius: 8px;
                max-width: 350px;
                border: 1.5px solid ${watchedValues.productLayoutSettings.productCardBorderColor};
                background-color: ${watchedValues.productLayoutSettings.productCardBgColor};
            }
            .spcProductCardTitle_${watchedValues.tracking}{
                font-size: ${watchedValues.productLayoutSettings.productTitleSize};
                font-weight: ${watchedValues.productLayoutSettings.productTitleWeight};
                color: ${watchedValues.productLayoutSettings.productTitleColor};
            }
            .spcProductCardPrice_${watchedValues.tracking}{
                font-size: ${watchedValues.productLayoutSettings.productPriceSize};
                font-weight: ${watchedValues.productLayoutSettings.productPriceWeight};
                color: ${watchedValues.productLayoutSettings.productPriceColor};
            }
            .spcProductCardBtn_${watchedValues.tracking}{
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


    const shoppingCartHtml = `
    
     <dialog class="spc_embedup_shadow spc_embedup_cart_dialog"${toogleOpen.shoppingCartOpen ? ' open' : ''} aria-modal="true" role="dialog">
    <div class="spc_embedup_cart_head_line">
    <span class="spc_embedup_cart_title">${watchedValues?.shoppingCartSettings?.heading}</span>
    <div style="display: flex; align-items: center; gap: 8px;">
    <div class="show_or_hide_empty_state_btn  spc_embedup_button spc_embedup_tertiary_button" onclick="showHideEmptyState(event)"><span class="show_empty_txt">Show Empty Cart View</span><span class="show_items_txt hide">Show Cart items View</span></div>
      <div class="spc_embedup_closeButton" onclick="openCartDialogSpcFnc('close')"><button aria-label="Close cart dialog"
          class="spc_embedup_button spc_embedup_tertiary_button"><svg viewBox="0 0 20 20" width="20" height="20">
            <path d="M9 5a1 1 0 1 1 2 0v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5z"
              style="transform: rotate(45deg); transform-origin: 10px 10px;"></path>
          </svg></button></div>

          </div>
         

        
    </div>
    <div class="spc_embedup_cart-contents">
    <div class="spc_embedup_cart_empty hide">${watchedValues?.shoppingCartSettings?.emptyCartText}</div>
      <div class="spc_embedup_line_items">
        <div class="spc_embedup_line_item_container">
          <div class="spc_embedup_line_item">
            <div class="spc_embedup_line_image spc_embedup_img_placeholder"><img
                src="https://cdn.shopify.com/s/files/1/0626/5189/1811/files/Main_d624f226-0a89-4fe1-b333-0d1548b43c06.jpg?v=1741881951&amp;width=216&amp;height=240"
                alt="Top and bottom view of a snowboard. The top view shows a stylized scene of water, trees, mountains, sky and a moon in blue colours. The bottom view has a blue liquid, drippy background with the text 'liquid' in a stylized script typeface."
                width="108"></div>
            <div class="spc_embedup_line_details">
              <div class="spc_embedup_line_header">
                <div class="spc_embedup_line_heading spc_embedup_placeholder">The Collection Snowboard: Oxygen</div>
                <span class="spc_embedup_line_price_column"><span class="spc_embedup_line_price">$9.0</span></span>
              </div>
              <div class="spc_embedup_line_options spc_embedup_truncate spc_embedup_placeholder"><span></span></div>
              <div class="spc_embedup_line_edits">
                <div class="spc_embedup_button spc_embedup_tertiary_button"><button class="spc_embedup_decrement"><svg
                      viewBox="0 0 20 20" class="w-4 h-4">
                      <path d="M5 9h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2"></path>
                    </svg></button><span data-testid="spc_embedup_quantity_label">1</span><button
                    class="spc_embedup_increment"><svg viewBox="0 0 20 20" class="w-4 h-4">
                      <path d="M9 5a1 1 0 1 1 2 0v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5z"></path>
                    </svg></button></div><span class="spc_embedup_line_remove"><button
                    class="spc_embedup_button spc_embedup_tertiary_button" aria-label="Remove item from cart"><svg
                      style="width: 14px; height: 16px;">
                      <path d="M6.31 7.18c0-.51-.4-.92-.9-.92s-.9.41-.9.92v4.63c0 .51.4.93.9.93s.9-.42.9-.93V7.18z"
                        style="transform: translateX(3px);"></path>
                      <path d="M6.31 7.18c0-.51-.4-.92-.9-.92s-.9.41-.9.92v4.63c0 .51.4.93.9.93s.9-.42.9-.93V7.18z">
                      </path>
                      <path
                        d="m7 0c-1.634 0-2.965 1.33-3.021 2.993H.902C.404 2.993 0 3.407 0 3.918c0 .511.404.926.902.926h.689v5.828c0 .91 0 1.599.044 2.148.043.551.132.971.314 1.338.315.635.818 1.151 1.437 1.474.358.187.766.278 1.303.323.535.045 1.207.045 2.094.045h.434c.887 0 1.558 0 2.093-.045.537-.045.946-.136 1.304-.323a3.3 3.3 0 0 0 1.437-1.474c.182-.367.27-.787.314-1.338.044-.55.044-1.239.044-2.148V4.844h.69c.497 0 .901-.415.901-.926 0-.511-.404-.925-.901-.925h-3.078C9.965 1.33 8.634 0 7 0zm-1.326 3.102h2.652a1.54 1.54 0 0 0-.387-.961c.215.222.357.521.383.852.002.036.004.073.004.109H5.674zM7 1.85c.638 0 1.161.503 1.215 1.143H5.785C5.839 2.353 6.362 1.85 7 1.85zM3.394 4.844h7.212v5.823c0 .943-.001 1.545-.038 2.003-.035.436-.093.585-.124.648a2.42 2.42 0 0 1-.649.666c-.061.032-.206.091-.632.127-.445.037-1.032.039-1.951.039h-.424c-.919 0-1.506-.002-1.952-.039-.426-.036-.57-.095-.631-.127a2.42 2.42 0 0 1-.649-.666c-.031-.063-.09-.212-.124-.648-.037-.458-.038-1.06-.038-2.003V4.844z">
                      </path>
                    </svg></button></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="spc_embedup_cart_actions">
        ${watchedValues?.shoppingCartSettings?.showDiscountCodeField === BoleanOptions.yes ? `<div class="spc_embedup_discount_section">
           <div class="spc_embedup_discount_header_row"><span
              class="spc_embedup_discount_header"><span>${watchedValues?.shoppingCartSettings?.discountCodeTitle}</span></span><button
              class="spc_embedup_discount_toggle_button" type="button">-</button>
            </div>
            <div class="spc_embedup_discount_expanded_ui"><div class="spc_embedup_discount_code_input"><input type="text" class="spc_embedup_discount_input_field" id="spc_embedup_discount_code_input" placeholder="${watchedValues?.shoppingCartSettings?.discountCodePlaceholder}" value=""><button class="spc_embedup_discount_apply_button spc_embedup_tertiary_button " type="button"><span>${watchedValues?.shoppingCartSettings?.discountApplyBtnTxt}</span></button></div></div>
        </div>` : ''
        }
        ${watchedValues?.shoppingCartSettings?.showOrderNote === BoleanOptions.yes ? `<div class="spc_embedup_discount_section spc_embedup_notes_section">
          <div class="spc_embedup_discount_header_row"><span class="spc_embedup_discount_header"><span>${watchedValues?.shoppingCartSettings?.orderNoteTitle}</span></span><button data-testid="discount-toggle-button"
              class="spc_embedup_discount_toggle_button" type="button">-</button></div>
              <div class="spc_embedup_discount_expanded_ui"><div class="spc_embedup_discount_code_input"><textarea class="spc_embedup_discount_input_field" id="spc_embedup_discount_code_input" placeholder="${watchedValues?.shoppingCartSettings?.orderNotePlaceholder}"></textarea></div></div>
        </div>` : ''

        }
        <div class="spc_embedup_cart_total"><span class="spc_embedup_cart_total_label">Estimate total </span><span
            class="spc_embedup_cart_total_amount_container "><span
              class="spc_embedup_cart_total_amount">$9.0</span></span></div>
        <div class="spc_embedup_additional_text"><span>${watchedValues?.shoppingCartSettings?.additionalInfo}</span></div>
        <div class="spc_embedup_primary_button_container"><button
            class="spc_embedup_button spc_embedup_primary_button product-card__add-button"><span>${watchedValues?.shoppingCartSettings?.shoppingCartBtnTxt}</span></button>
        </div>
      </div>
    </div>
    <style>
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
        background-color: ${watchedValues?.shoppingCartSettings?.shoppingCartBtnBgColor};
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
        padding: 0px 16px 0px 16px;
        box-sizing: border-box;
      }

      .spc_embedup_cart_title {
        font-size: 30px;
        font-weight: 700;
        color: ${watchedValues?.shoppingCartSettings?.shoppingCartTextColor};
      }

      .spc_embedup_cart_dialog {
        width: 480px;
        background-color: ${watchedValues?.shoppingCartSettings?.shoppingCartBgColor};
        color: #000;
        top: 32px;
        right: 32px;
        z-index: 10;
        position: fixed;
        gap: 12px;
        flex-direction: column;
        border: 0;
        border-radius: 12px;

        margin-right: 0;
        margin-top: 0;
        opacity: 0;
        transform: translateX(100%);

        box-sizing: border-box;
      }

      .spc_embedup_cart_dialog[open] {
        opacity: 1;
        transform: translateX(0%);
        z-index: 999;
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
        width: 100%;
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

      .spc_embedup_line_edits svg {
        width: 20px;
        height: 20px;
      }

      .spc_embedup_cart_actions {
        padding: 0px 16px 0px 16px;
        display: flex;
        flex-direction: column;
        align-items: end;
        gap: 0px;
        position: sticky;
        bottom: 0;
        background-color: ${watchedValues?.shoppingCartSettings?.shoppingCartBgColor};
      }

      .spc_embedup_cart_total_label {
        font-size: 0.875rem;
        font-weight: 400;
        color: #000000cf;
      }

      .spc_embedup_cart_total_amount_container {
        font-size: 18px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .spc_embedup_cart_total {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        width: 100%;
        padding: 0 12px;
        padding: 11px 12px 0 12px;
        border-top: 1px solid #e5e5e5;
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
        font-size: 14px;
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

      .spc_embedup_notes_section {
        margin-top: 0rem;
      }

      .spc_embedup_line_original_price {
        text-decoration: line-through;
        color: #888;
        font-size: 0.95em;
        margin-top: 2px;
      }

      .spc_embedup_additional_text {
        text-align: center;
        font-size: 12px;
        align-self: center;
      }

      .spc_embedup_primary_button_container,
      .spc_embedup_additional_text {
        width: 100%;
      }

      .spc_embedup_cart_sub_total_amount {
        text-decoration: line-through;
        color: #888;
      }

      .spc_embedup_discount_code_display {
        display: flex;
        align-items: center;
        gap: 3px;
        background: #efefef;
        max-width: max-content;
        padding: 6px;
        border-radius: 15px;

      }

      .spc_embedup_discount_remove_button {
        background: none;
        border: none;
        cursor: pointer;
      }

      .spc_embedup_discount_code_text {
        color: #867c7c;
        font-size: 14px;
      }

      .show_or_hide_empty_state_btn{
        font-size: 12px;
        padding: 10px 8px;
        cursor: pointer;
      }
      .spc_embedup_line_items.hide,
      .spc_embedup_cart_actions.hide,
      .spc_embedup_cart_empty.hide,
      .show_empty_txt.hide,
      .show_items_txt.hide {
        display: none;
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

        spc_embedup_line_details {
          width: 186px;

        }

        .spc_embedup_line_heading,
        .spc_embedup_line_price {
          font-size: 16px;
        }

        .spc_embedup_line_options {
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
    </style>
  </dialog>
    
    `;

    const pdAddToCartHtml = watchedValues.appliesTo === APPLIES_TO.byproduct && watchedValues.addToCartType.type === ADD_TO_CART_TYPE.bulk ? `
             <button
                class="product-card__add-button product-card__add-to-cart-button spcProductCardBtn_${watchedValues.tracking}"
                onclick="addToCartNcheckoutBulkProduct(event,'${shopData.scAccessToken}','${shopData.shopifyDomain}','${watchedValues.tracking}','${watchedValues.customerTracking}','${watchedValues.componentSettings.cartBehavior}',${watchedValues.enableQtyField})"
                shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale"
              >
               
                <span class="spcBtn_txt">${watchedValues.buttonStyleSettings.addToCartBtnTxt}</span>
                 <span class="spcBtn_outOfStock">Out of stock</span>
              </button>
    ` :
        `
             <button
                class="product-card__add-button product-card__add-to-cart-button spcProductCardBtn_${watchedValues.tracking}"
                onclick="addToCartNcheckoutIndProduct(event,'${shopData.scAccessToken}','${shopData.shopifyDomain}','${watchedValues.tracking}','${watchedValues.customerTracking}','${watchedValues.componentSettings.cartBehavior}')"
                shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale"
              >
                <span class="spcBtn_txt">${watchedValues.buttonStyleSettings.addToCartBtnTxt}</span>
                 <span class="spcBtn_outOfStock">Out of stock</span>
              </button>
    ` ;

    const pdCheckoutBtnHtml = watchedValues.appliesTo === APPLIES_TO.byproduct && watchedValues.addToCartType.type === ADD_TO_CART_TYPE.bulk ? `
             <button
                class="product-card__add-button product-card__checkout-button spcProductCardBtn_${watchedValues.tracking}"
                 onclick="addToCartNcheckoutBulkProduct(event,'${shopData.scAccessToken}','${shopData.shopifyDomain}','${watchedValues.tracking}','${watchedValues.customerTracking}','${watchedValues.componentSettings.cartBehavior}',${watchedValues.enableQtyField})"
                shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale"
              >
                
                <span class="spcBtn_txt">${watchedValues.buttonStyleSettings.checkoutBtnTxt}</span>
                 <span class="spcBtn_outOfStock">Out of stock</span>
              </button>
    ` :
        `
             <button
                class="product-card__add-button product-card__checkout-button spcProductCardBtn_${watchedValues.tracking}"
                onclick="addToCartNcheckoutIndProduct(event,'${shopData.scAccessToken}','${shopData.shopifyDomain}','${watchedValues.tracking}','${watchedValues.customerTracking}','${watchedValues.componentSettings.cartBehavior}')"
                shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale"
              >
                  <span class="spcBtn_txt">${watchedValues.buttonStyleSettings.checkoutBtnTxt}</span>
                 <span class="spcBtn_outOfStock">Out of stock</span>
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
              <shopify-variant-selector class="product-card__variant-selector" shopify-attr--data-variant-id="product.selectedOrFirstAvailableVariant.id"></shopify-variant-selector>

              <div class="product-modal__buttons product-card__buttons">
                    ${watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.cart ? pdAddToCartHtml : pdCheckoutBtnHtml}
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
                class="product-card__add-button product-card__view-button spcProductCardBtn_${watchedValues.tracking}"
                onclick="getElementById('shopcomponent-product-modal').showModal(); getElementById('shopcomponent-product-modal-context').update(event);"
              >
               ${watchedValues.buttonStyleSettings.viewBtnTxt}
              </button>

              ${productFullViewModalHtml}
    `;




    const productLayoutIndCardHtml = selectedProductsInd?.length > 0 ? selectedProductsInd.map((product) => (
        `
            <div class="product-card spcProductCard_${watchedValues.tracking}" id="shopcomponent-${watchedValues.tracking}">
    <!-- Set product you want to display -->
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
              <h2 class="product-card__title spcProductCardTitle_${watchedValues.tracking}">
                <shopify-data query="product.title"></shopify-data>
              </h2>
              <div class="product-card__price spcProductCardPrice_${watchedValues.tracking}">
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
            ? (watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.cart
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
        
        <shopify-store public-access-token="${shopData?.headlessAccessToken ? shopData?.headlessAccessToken : shopData?.scAccessToken}" store-domain="${shopData.shopifyDomain}" country="${watchedValues.market}" language="en"></shopify-store>


        <div class="shopcomponent_pd_container">
            ${watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.cart ? floatingCartCountBuble : ''}
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
            </div>
           
          
                 

            ${watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.cart ? shoppingCartHtml : ''}
        </div>

        
     
        ${stylesPdT1}
        ${globalStyles}
         <style>
            ${watchedValues.componentSettings.customCss}
        </style>

    `;
    const productLayoutBulkCardHtml = selectedProductsBulk?.length > 0 ? selectedProductsBulk.map((product) => (
        `
            <div class="product-card spcProductCard_${watchedValues.tracking}">
    <!-- Set product you want to display -->
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
              <h2 class="product-card__title spcProductCardTitle_${watchedValues.tracking}">
                <shopify-data query="product.title"></shopify-data>
              </h2>
              <div class="product-card__price spcProductCardPrice_${watchedValues.tracking}">
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
                                        <div
                                        onclick="updateQuantity(event,'dec')" 
                                        class="shopcomponent_variants_bulk_enable_quantity_dec">-</div>
                                        <input class="shopcomponent_variants_bulk_enable_quantity_input" type="number" min="0" value="0" data-variant-id="${variant.id}"/>
                                        <div 
                                        onclick="updateQuantity(event,'inc')"
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
      <!-- Placeholder -->
    </shopify-context>
  </div>
        `
    )).join('\n') : emptyStateHtml;

    const productLayoutBulkHtml = `

        <shopify-store public-access-token="${shopData?.headlessAccessToken ? shopData?.headlessAccessToken : shopData?.scAccessToken}" store-domain="${shopData.shopifyDomain}" country="${watchedValues.market}" language="en"></shopify-store>


        <div class="shopcomponent_pd_container">
            ${watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.cart ? floatingCartCountBuble : ''}
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
            </div>
           
          
                 <script class="shopcomponent_pd_bulk_script">
                    ${JSON.stringify(watchedValues.addToCartType.products)}
                 </script>

             ${watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.cart ? shoppingCartHtml : ''}

              <div class="product-card__buttons shopcomponent_pd_buttons_bulk">
              <!-- Add behavior to an existing button -->
               
              ${!watchedValues.componentSettings.fullView
            ? (watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.cart
                ? pdAddToCartHtml
                : pdCheckoutBtnHtml)
            : pdViewBtnHtml
        }
            </div>

        </div>

        
     
        ${stylesPdT1}
        ${globalStyles}
         <style>
            ${watchedValues.componentSettings.customCss}
        </style>
    
    `;
    const pdQuickViewBtnCollectionHtml = `
        <button
                class="product-card__add-button product-card__view-button spcProductCardBtn_${watchedValues.tracking}"
                onclick="getElementById('shopcomponent-product-modal').showModal(); getElementById('shopcomponent-product-modal-context').update(event);"
              >
                View product
              </button>
    `;
    const productLayoutCollectionCardHtml = selectedCollection?.length > 0 ?
        `
        <shopify-context type="collection" handle="${selectedCollection[0].handle}">
      <template>
           
    
       <shopify-list-context type="product" query="collection.products" first="${shopData?.plan?.planName === 'Free' ? 3 : 50}">
       <template>
        <div class="product-card spcProductCard_${watchedValues.tracking}">
        <div class="product-card__container">
          <div class="product-card__media">
            <div class="product-card__main-image">
              <shopify-media layout="fixed" width="200" height="200" query="product.selectedOrFirstAvailableVariant.image"></shopify-media>
            </div>
          </div>
          <div class="product-card__details shopcomponent_product_card__details">
            <div class="product-card__info">
              <h2 class="product-card__title spcProductCardTitle_${watchedValues.tracking}">
                <shopify-data query="product.title"></shopify-data>
              </h2>
              <div class="product-card__price spcProductCardPrice_${watchedValues.tracking}">
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
            ? (watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.cart
                ? pdAddToCartHtml
                : pdCheckoutBtnHtml)
            : pdQuickViewBtnCollectionHtml
        }
             


              <!-- Add buy button -->
            </div>

             </div>
          </div>
        </div>
        </template>
        </shopify-list-context>
    </template>
    </shopify-context>
    ${watchedValues.componentSettings.fullView ? productFullViewModalHtml : ''}

        `
        : emptyStateHtml;

    const collectionLayoutIndHtml = `
       
        <shopify-store public-access-token="${shopData?.headlessAccessToken ? shopData?.headlessAccessToken : shopData?.scAccessToken}" store-domain="${shopData.shopifyDomain}" country="${watchedValues.market}" language="en"></shopify-store>


        <div class="shopcomponent_pd_container">
            ${watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.cart ? floatingCartCountBuble : ''}
            <div class="shopcomponent_title_N_description">
                <div class="shopcomponent_title">${watchedValues.title}</div>
                <div class="shopcomponent_description">${watchedValues.description}</div>
            </div>

            <div class="shopcomponent_slider_container_${watchedValues.layout}">
                <button class="shopcomponent__slider-button next" onclick="moveSliderPrevNext('next')">❯</button>
                <div class="shopcomponent_products_flex shopcomponent_product_layout_${watchedValues.layout}">
                    ${productLayoutCollectionCardHtml}
                </div>
                <button class="shopcomponent__slider-button prev" onclick="moveSliderPrevNext('prev')">❮</button>
            </div>
           
          
                 
        <div class="shopcomponent_cart_container">
             ${watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.cart ? shoppingCartHtml : ''}
            </div>
        </div>

        
        ${stylesPdT1}
        ${globalStyles}
        <style>
            ${watchedValues.componentSettings.customCss}
        </style>

    `;



    useEffect(() => {
        if (watchedValues.appliesTo === APPLIES_TO.bycollection) {
            setEmbedPHtmlCode(collectionLayoutIndHtml)
        } else {
            if (watchedValues.appliesTo === APPLIES_TO.byproduct && watchedValues.addToCartType.type === ADD_TO_CART_TYPE.individual) {
                setEmbedPHtmlCode(productLayoutIndHtml)
            } else if (watchedValues.appliesTo === APPLIES_TO.byproduct && watchedValues.addToCartType.type === ADD_TO_CART_TYPE.bulk) {
                setEmbedPHtmlCode(productLayoutBulkHtml)
            }
        }

    }, [productLayoutBulkHtml, productLayoutIndHtml, watchedValues.addToCartType.type, watchedValues.appliesTo, collectionLayoutIndHtml]);

    const handleCopyHtmlCode = () => {
        navigator.clipboard.writeText(embedPHtmlCode);
        shopify.toast.show('Copied SuccessFully', {
            duration: 1000,
        });
    }



    const scriptsAll = `
         <script type="module" src="https://cdn.shopify.com/storefront/web-components.js"></script>
         <script src="/shopcomponent/js/shopcomponent.js?v2.11"></script>
    `;



    useEffect(() => {
        if (actionData?.success && actionData?.createCompData?.id && navigation.state === 'idle') {
            shopify.toast.show(actionData?.message || 'Component Created Successfully', { duration: 2000 });
            navigate(`/app/component/${actionData?.createCompData?.id}?new_created=true`, { replace: true });
        }
    }, [actionData, navigation.state]);

    // console.log('Cart behave:', watchedValues.componentSettings.cartBehavior);


    useEffect(() => {
        if (window) {
            window.addEventListener('popstate', function (event) {
                reset(getValues());
            });
        }
    }, []);

    const loadingHtml = `
    <html>
      <head>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            font-family: sans-serif;
            background: #f9f9f9;
          }
          .spinner {
            border: 6px solid #f3f3f3;
            border-top: 6px solid #555;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="spinner"></div>
      </body>
    </html>
  `;

    useEffect(() => {
        setDelayedSrcDoc(loadingHtml);
        const timer = setTimeout(() => {
            setDelayedSrcDoc(embedPHtmlCode);
        }, 600);
        return () => clearTimeout(timer);
    }, [embedPHtmlCode]);


    //console.log('PD TITLE: ', watchedValues.productLayoutSettings.productTitleColor);

    //console.log('Errors:',errors);
    return (
        navigation.state === "loading" ? <LoadingSkeleton pageSize="large" /> :
            <form method="post" onSubmit={handleSubmit(formHandleSubmit)} >
                <SaveBar id="spc-save-bar">
                    <button type="submit" variant="primary"
                        {...(navigation.state === 'submitting' ? { 'loading': '' } : {})}
                    ></button>
                    <button
                        type="button"
                        onClick={() => {
                            handleDiscard();
                        }}
                    >
                    </button>
                </SaveBar>

                <s-page
                    inlineSize="large"
                >
                    <s-query-container>

                        <s-stack
                            padding="large-100 none none none"
                            direction="inline"
                            gap="small"
                            justifyContent="start"
                            alignItems="center"
                        >
                            <s-button disabled={isDirty ? true : false} onClick={() => navigate('/app')} accessibilityLabel="Back to dashboard" icon="arrow-left" variant="tertiary"></s-button>
                            <s-text type="strong">Create component</s-text>
                        </s-stack>


                        {disabledContentByPlan && shopData?.components?.length > 0 === true &&
                            <s-banner
                                heading={"Upgrade to create another component"}
                                tone="warning"
                                dismissible
                            >
                                <s-stack
                                    gap="small-200"
                                >
                                    <s-text>The Free plan includes 1 component. Upgrade to add more.</s-text>
                                    <s-button variant="primary" href="/app/plans">Upgrade Plan</s-button>
                                </s-stack>
                            </s-banner>
                        }

                        {shopData?.components?.length >= shopData?.maxAllowedComponents && !disabledContentByPlan &&

                            <s-banner
                                heading={`Maximum Component Limit (${shopData?.maxAllowedComponents})`}
                                tone="info"
                                dismissible
                            >
                                <s-text>The maximum number of components you can create is {shopData?.maxAllowedComponents}. Once this limit is reached, no additional components can be added unless you delete or modify existing ones.</s-text>

                            </s-banner>

                        }


                        <s-grid
                            gridTemplateColumns="@container (inline-size < 600px) 1fr, 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr"
                            gap="base"
                            justifyContent="start"
                            alignItems="stretch"
                            paddingBlockStart="large-300"
                        >

                            <s-grid-item gridColumn="span 4">
                                <s-box>

                                    <s-stack>

                                        <s-box paddingBlockEnd={'large'}>
                                            <s-box background="base" borderRadius="base" paddingInline={'300'} paddingBlockStart={'200'} minInlineSize="350px">

                                                <s-clickable
                                                    padding="small"
                                                    background="base"
                                                    borderRadius="base"
                                                    minBlockSize="50px"
                                                    onClick={() => {
                                                        setToogleOpen({
                                                            ...toogleOpen,
                                                            titleAndDescToggleOpen: !toogleOpen.titleAndDescToggleOpen,
                                                        });
                                                    }}
                                                >
                                                    <s-stack
                                                        direction="inline"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        <s-stack
                                                            direction="inline"
                                                            gap="small-300"
                                                        >
                                                            <s-text type="strong">Title & Description*</s-text>


                                                        </s-stack>
                                                        <s-icon type={toogleOpen.titleAndDescToggleOpen ? "caret-up" : "caret-down"}></s-icon>
                                                    </s-stack>
                                                </s-clickable>

                                                {toogleOpen.titleAndDescToggleOpen &&

                                                    <s-box padding="none small small small">
                                                        <s-stack
                                                            gap="base"
                                                        >
                                                            <Controller
                                                                name="title"
                                                                control={control}
                                                                rules={{
                                                                    required: 'Title is required', minLength: { value: 4, message: 'Title must be at least 4 characters' },
                                                                    maxLength: {
                                                                        value: 100,
                                                                        message: 'Title cannot exceed 100 characters'
                                                                    }
                                                                }}
                                                                render={({ field, fieldState }) => (
                                                                    <s-text-field
                                                                        type="text"
                                                                        label={"Title"}
                                                                        name="title"
                                                                        value={field.value}
                                                                        onChange={field.onChange}
                                                                        error={fieldState.error?.message || actionData?.errors?.title}
                                                                        autoComplete="off"
                                                                        placeholder={"Enter title here"}
                                                                        maxLength={100}
                                                                        required
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
                                                                        message: 'Description cannot exceed 150 characters'
                                                                    }
                                                                }}
                                                                render={({ field, fieldState }) => (
                                                                    <s-text-area
                                                                        type="text"
                                                                        rows={2}
                                                                        label={'Description'}
                                                                        name="description"
                                                                        value={field.value}
                                                                        onChange={field.onChange}
                                                                        error={fieldState.error?.message || actionData?.errors?.description}
                                                                        autoComplete="off"
                                                                        placeholder={'Please summarize within 150 characters.'}
                                                                        maxLength={150}
                                                                    />
                                                                )}
                                                            />
                                                        </s-stack>
                                                    </s-box>

                                                }

                                            </s-box>
                                        </s-box>

                                        <s-box paddingBlockEnd={'large'}>
                                            <s-box background="base" borderRadius="base" paddingInline={'300'} paddingBlockStart={'200'} minInlineSize="350px">

                                                <s-clickable
                                                    padding="small"
                                                    background="base"
                                                    borderRadius="base"
                                                    minBlockSize="50px"
                                                    onClick={() => {
                                                        setToogleOpen({
                                                            ...toogleOpen,
                                                            cartBehaviorOpen: !toogleOpen.cartBehaviorOpen,
                                                        });
                                                    }}
                                                >
                                                    <s-stack
                                                        direction="inline"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        <s-stack
                                                            direction="inline"
                                                            gap="small-300"
                                                        >
                                                            <s-text type="strong">Cart behavior</s-text>


                                                        </s-stack>
                                                        <s-icon type={toogleOpen.cartBehaviorOpen ? "caret-up" : "caret-down"}></s-icon>
                                                    </s-stack>
                                                </s-clickable>

                                                {toogleOpen.cartBehaviorOpen &&

                                                    <s-box padding="none small small small">
                                                        <s-stack
                                                            gap="base"
                                                        >
                                                            <Controller
                                                                name="componentSettings.cartBehavior"
                                                                control={control}
                                                                defaultValue={CART_BEHAVIOR.checkout}
                                                                render={({ field, fieldState }) => (
                                                                    <s-choice-list
                                                                        label="Cart behavior"
                                                                        labelAccessibilityVisibility="exclusive"
                                                                        name={field.name}
                                                                        values={[field.value]}
                                                                        error={fieldState?.error?.message}
                                                                        onChange={(e) => {
                                                                            const selected = e.currentTarget.values[0] || CART_BEHAVIOR.checkout;
                                                                            field.onChange(selected);
                                                                        }}
                                                                    >
                                                                        <s-choice value={CART_BEHAVIOR.checkout}>
                                                                            Buy Now (Checkout)
                                                                        </s-choice>

                                                                        <s-choice value={CART_BEHAVIOR.cart}>
                                                                            Add to Cart (Open drawer)
                                                                        </s-choice>
                                                                    </s-choice-list>
                                                                )}
                                                            />

                                                        </s-stack>
                                                    </s-box>

                                                }

                                            </s-box>
                                        </s-box>

                                        <s-box paddingBlockEnd={'large'}>
                                            <s-box background="base" borderRadius="base" paddingInline={'300'} paddingBlockStart={'200'} minInlineSize="350px">

                                                <s-clickable
                                                    padding="small"
                                                    background="base"
                                                    borderRadius="base"
                                                    minBlockSize="50px"
                                                    onClick={() => {
                                                        setToogleOpen({
                                                            ...toogleOpen,
                                                            appliesToOpen: !toogleOpen.appliesToOpen,
                                                        });
                                                    }}
                                                >
                                                    <s-stack
                                                        direction="inline"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        <s-stack
                                                            direction="inline"
                                                            gap="small-300"
                                                        >
                                                            <s-text type="strong">Applies to*</s-text>


                                                        </s-stack>
                                                        <s-icon type={toogleOpen.appliesToOpen ? "caret-up" : "caret-down"}></s-icon>
                                                    </s-stack>
                                                </s-clickable>

                                                {toogleOpen.appliesToOpen &&

                                                    <s-box padding="none small small small">
                                                        <s-stack
                                                            gap="none"
                                                        >
                                                            <s-satck>
                                                                <Controller
                                                                    name="appliesTo"
                                                                    control={control}
                                                                    defaultValue={APPLIES_TO.byproduct}
                                                                    render={({ field, fieldState }) => (
                                                                        <s-choice-list
                                                                            label="Applies to"
                                                                            labelAccessibilityVisibility="exclusive"
                                                                            name={field.name}
                                                                            values={[field.value]}
                                                                            error={fieldState?.error?.message}
                                                                            onChange={(e) => {
                                                                                const selected = e.currentTarget.values[0] ?? "";
                                                                                field.onChange(selected);
                                                                            }}
                                                                        >
                                                                            <s-choice value={APPLIES_TO.bycollection}>Collection</s-choice>
                                                                            <s-choice value={APPLIES_TO.byproduct}>Product</s-choice>
                                                                        </s-choice-list>

                                                                    )}
                                                                />
                                                            </s-satck>

                                                            {watchedValues.appliesTo === APPLIES_TO.bycollection &&
                                                                <s-box>
                                                                    <s-stack
                                                                        direction="inline"
                                                                        alignItems="center"
                                                                        gap="small-200"
                                                                        paddingBlockStart="small"
                                                                    >
                                                                        <Controller
                                                                            name="addToCartType.products"
                                                                            control={control}
                                                                            rules={{
                                                                                validate: (value) => {
                                                                                    //console.log('v:', value);
                                                                                    return value?.length !== 0 ? true : "Collection is required";
                                                                                }
                                                                            }}
                                                                            render={({ field }) => (
                                                                                <input type="hidden"
                                                                                    name="addToCartType.products"
                                                                                    value={field.value}
                                                                                    onChange={field.onChange}
                                                                                />

                                                                            )}
                                                                        />

                                                                        <s-box inlineSize="78%">
                                                                            <s-text-field
                                                                                type="text"
                                                                                label="Search"
                                                                                labelAccessibilityVisibility="exclusive"
                                                                                placeholder="Search for collections"
                                                                                icon="search"
                                                                                onInput={(e) => { handleChooseCollection(e.target.value) }}
                                                                            />
                                                                        </s-box>
                                                                        <s-button onClick={() => { handleChooseCollection('') }} >Browse</s-button>
                                                                    </s-stack>

                                                                    {errors?.addToCartType?.products?.message && (
                                                                        <s-stack
                                                                            direction="inline"
                                                                            alignItems="center"
                                                                            gap="small-200"
                                                                            paddingBlockStart="small-300" >
                                                                            <s-icon type="info" tone="critical" />
                                                                            <s-text tone="critical">{errors.addToCartType.products.message}</s-text>
                                                                        </s-stack>
                                                                    )}
                                                                    {selectedCollection?.length > 0 && selectedCollection?.map((item) => {
                                                                        return <s-stack key={item.id} direction="inline" justifyContent="space-between" alignItems="center" paddingBlockStart="small"
                                                                        >
                                                                            <s-thumbnail
                                                                                src={item?.image ? item?.image : '/images/noImage.png'}
                                                                                alt={item?.handle + 'collection'}
                                                                                size="small"
                                                                            />
                                                                            <s-stack
                                                                                inlineSize="75%"
                                                                            >
                                                                                <s-text>{item?.title}</s-text>
                                                                            </s-stack>

                                                                            <s-button accessibilityLabel="Remove Collection" variant="tertiary" icon="delete" onClick={() => {
                                                                                setSelectedCollection([]);
                                                                            }} />
                                                                        </s-stack>
                                                                    })}
                                                                </s-box>
                                                            }

                                                            {watchedValues.appliesTo === APPLIES_TO.byproduct &&
                                                                <s-box>
                                                                    <s-stack paddingBlockStart="small">
                                                                        <Controller
                                                                            name="addToCartType.type"
                                                                            control={control}
                                                                            render={({ field, fieldState }) => (
                                                                                <s-select
                                                                                    label={watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.cart ? "Add to cart type" : 'Checkout type'}
                                                                                    error={fieldState.error?.message}
                                                                                    name={field.name}
                                                                                    value={field.value}
                                                                                    onChange={field.onChange}
                                                                                >
                                                                                    <s-option value={ADD_TO_CART_TYPE.individual}>{watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.cart ? "Individual add to cart" : 'Individual Checkout'}</s-option>

                                                                                    <s-option value={ADD_TO_CART_TYPE.bulk}
                                                                                    disabled={disabledContentByPlan ? true : false}
                                                                                    >{watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.cart ? "Bulk add to cart" : 'Bulk Checkout'}
                                                                                    </s-option>
                                                                                </s-select>
                                                                            )}
                                                                        />
                                                                    </s-stack>

                                                                    {watchedValues.appliesTo === APPLIES_TO.byproduct && watchedValues.addToCartType.type === ADD_TO_CART_TYPE.individual &&

                                                                        <s-box>

                                                                            <s-stack
                                                                                direction="inline"
                                                                                alignItems="center"
                                                                                gap="small-200"
                                                                                paddingBlockStart="large"
                                                                            >
                                                                                <Controller
                                                                                    name="addToCartType.products"
                                                                                    control={control}
                                                                                    rules={{
                                                                                        validate: (value) => {
                                                                                            //console.log('v:', value);
                                                                                            return value?.length !== 0 ? true : "Product is required";
                                                                                        }
                                                                                    }}
                                                                                    render={({ field }) => (
                                                                                        <input type="hidden"
                                                                                            name="addToCartType.products"
                                                                                            value={field.value}
                                                                                            onChange={field.onChange}
                                                                                        />

                                                                                    )}
                                                                                />

                                                                                <s-box inlineSize="78%">
                                                                                    <s-text-field
                                                                                        type="text"
                                                                                        label="Search"
                                                                                        labelAccessibilityVisibility="exclusive"
                                                                                        placeholder="Search for products"
                                                                                        icon="search"
                                                                                        onInput={(e) => { handleChooseProductsInd(e.target.value) }}
                                                                                    />
                                                                                </s-box>
                                                                                <s-button onClick={() => { handleChooseProductsInd('') }} >Browse</s-button>
                                                                            </s-stack>

                                                                            {errors?.addToCartType?.products?.message && (
                                                                                <s-stack
                                                                                    direction="inline"
                                                                                    alignItems="center"
                                                                                    gap="small-200"
                                                                                    paddingBlockStart="small-300" >
                                                                                    <s-icon type="info" tone="critical" />
                                                                                    <s-text tone="critical">{errors.addToCartType.products.message}</s-text>
                                                                                </s-stack>
                                                                            )}

                                                                            <DraggableProductInd
                                                                                handleDeleteProductInd={handleDeleteProductInd}
                                                                                setSelectedProductsInd={setSelectedProductsInd}
                                                                                selectedProductsInd={selectedProductsInd}
                                                                            />
                                                                        </s-box>
                                                                    }

                                                                    {watchedValues.appliesTo === APPLIES_TO.byproduct && watchedValues.addToCartType.type === ADD_TO_CART_TYPE.bulk &&
                                                                        <s-box>
                                                                            <s-stack
                                                                                direction="inline"
                                                                                alignItems="center"
                                                                                gap="small-200"
                                                                                paddingBlockStart="large"
                                                                            >
                                                                                <Controller
                                                                                    name="addToCartType.products"
                                                                                    control={control}
                                                                                    rules={{
                                                                                        validate: (value) => {
                                                                                            //console.log('v:', value);
                                                                                            return value?.length !== 0 ? true : "Product is required";
                                                                                        }
                                                                                    }}
                                                                                    render={({ field }) => (
                                                                                        <input type="hidden"
                                                                                            name="addToCartType.products"
                                                                                            value={field.value}
                                                                                            onChange={field.onChange}
                                                                                        />

                                                                                    )}
                                                                                />

                                                                                <s-box inlineSize="78%">
                                                                                    <s-text-field
                                                                                        type="text"
                                                                                        label="Search"
                                                                                        labelAccessibilityVisibility="exclusive"
                                                                                        placeholder="Search for products"
                                                                                        icon="search"
                                                                                        onInput={(e) => { handleChooseProductsBulk(e.target.value) }}
                                                                                    />
                                                                                </s-box>
                                                                                <s-button onClick={() => { handleChooseProductsBulk('') }} >Browse</s-button>
                                                                            </s-stack>

                                                                            {errors?.addToCartType?.products?.message && (
                                                                                <s-stack
                                                                                    direction="inline"
                                                                                    alignItems="center"
                                                                                    gap="small-200"
                                                                                    paddingBlockStart="small-300" >
                                                                                    <s-icon type="info" tone="critical" />
                                                                                    <s-text tone="critical">{errors.addToCartType.products.message}</s-text>
                                                                                </s-stack>
                                                                            )}

                                                                            {selectedProductsBulk?.length > 0 &&
                                                                                <s-box paddingBlockStart={'base'}>
                                                                                    <s-box borderRadius="small" padding={'small'} background="subdued">
                                                                                        <Controller
                                                                                            name="enableQtyField"
                                                                                            control={control}

                                                                                            render={({ field }) => (
                                                                                                <s-stack gap="none">
                                                                                                    <s-checkbox
                                                                                                        label='Set fixed quantity'
                                                                                                        checked={field.value === false}
                                                                                                        onChange={() => field.onChange(false)}
                                                                                                    />
                                                                                                    <s-checkbox
                                                                                                        label='Enable quantity field'
                                                                                                        checked={field.value === true}
                                                                                                        onChange={() => field.onChange(true)}
                                                                                                    />
                                                                                                </s-stack>
                                                                                            )}
                                                                                        />

                                                                                    </s-box>
                                                                                </s-box>
                                                                            }

                                                                            <DraggableProductBulk
                                                                                handleChangeQuantityDefault={handleChangeQuantityDefault}
                                                                                handleDeleteProductBulk={handleDeleteProductBulk}
                                                                                selectedProductsBulk={selectedProductsBulk}
                                                                                setSelectedProductsBulk={setSelectedProductsBulk}
                                                                                watchedValues={watchedValues}

                                                                            />

                                                                            <s-box paddingBlockStart={'small'}>
                                                                                <s-box background="subdued" borderRadius="base" padding={'small-300'}>
                                                                                    <s-text tone="warning">{`*The maximum limit is ${shopData?.maxAllowedComponents || 0} product variants per component.`}</s-text>
                                                                                </s-box>
                                                                            </s-box>
                                                                        </s-box>
                                                                    }
                                                                </s-box>
                                                            }

                                                        </s-stack>
                                                    </s-box>

                                                }

                                            </s-box>
                                        </s-box>

                                        <s-box paddingBlockEnd={'large'}>
                                            <s-box background="base" borderRadius="base" paddingInline={'300'} paddingBlockStart={'200'} minInlineSize="350px">

                                                <s-clickable
                                                    padding="small"
                                                    background="base"
                                                    borderRadius="base"
                                                    minBlockSize="50px"
                                                    onClick={() => {
                                                        setToogleOpen({
                                                            ...toogleOpen,
                                                            layoutOpen: !toogleOpen.layoutOpen,
                                                        });
                                                    }}
                                                >
                                                    <s-stack
                                                        direction="inline"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        <s-stack
                                                            direction="inline"
                                                            gap="small-300"
                                                        >
                                                            <s-text type="strong">Layout preview</s-text>


                                                        </s-stack>
                                                        <s-icon type={toogleOpen.layoutOpen ? "caret-up" : "caret-down"}></s-icon>
                                                    </s-stack>
                                                </s-clickable>

                                                {toogleOpen.layoutOpen &&

                                                    <s-box padding="none small small small">
                                                        <s-stack
                                                            gap="base"
                                                        >
                                                            <Controller
                                                                name="layout"
                                                                control={control}
                                                                defaultValue={LAYOUT.grid}
                                                                render={({ field, fieldState }) => (
                                                                    <s-choice-list
                                                                        label="Layout"
                                                                        labelAccessibilityVisibility="exclusive"
                                                                        name={field.name}
                                                                        values={[field.value]}
                                                                        error={fieldState?.error?.message}
                                                                        onChange={(e) => {
                                                                            const selected = e.currentTarget.values?.[0] ?? "";
                                                                            field.onChange(selected);
                                                                        }}
                                                                    >
                                                                        <s-choice value={LAYOUT.list}>
                                                                            List
                                                                        </s-choice>

                                                                        <s-choice value={LAYOUT.grid}>
                                                                            Grid
                                                                        </s-choice>

                                                                        <s-choice value={LAYOUT.grid_slider} disabled={disabledContentByPlan}>
                                                                            Grid slider
                                                                        </s-choice>
                                                                    </s-choice-list>
                                                                )}
                                                            />

                                                        </s-stack>
                                                    </s-box>

                                                }

                                            </s-box>
                                        </s-box>

                                        <s-box paddingBlockEnd={'large'}>
                                            <s-box background="base" borderRadius="base" paddingInline={'300'} paddingBlockStart={'200'} minInlineSize="350px">

                                                <s-clickable
                                                    padding="small"
                                                    background="base"
                                                    borderRadius="base"
                                                    minBlockSize="50px"
                                                    onClick={() => {
                                                        setToogleOpen({
                                                            ...toogleOpen,
                                                            statusOpen: !toogleOpen.statusOpen,
                                                        });
                                                    }}
                                                >
                                                    <s-stack
                                                        direction="inline"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        <s-stack
                                                            direction="inline"
                                                            gap="small-300"
                                                        >
                                                            <s-text type="strong">Status</s-text>


                                                        </s-stack>
                                                        <s-icon type={toogleOpen.statusOpen ? "caret-up" : "caret-down"}></s-icon>
                                                    </s-stack>
                                                </s-clickable>

                                                {toogleOpen.statusOpen &&

                                                    <s-box padding="none small small small">
                                                        <s-stack
                                                            gap="base"
                                                        >
                                                            <Controller
                                                                name="status"
                                                                control={control}
                                                                defaultValue={STATUS.activate}
                                                                render={({ field, fieldState }) => (
                                                                    <s-choice-list
                                                                        label="Status"
                                                                        labelAccessibilityVisibility="exclusive"
                                                                        name={field.name}
                                                                        values={[field.value]}
                                                                        error={fieldState?.error?.message}
                                                                        onChange={(e) => {
                                                                            const selected = e.currentTarget.values?.[0] ?? "";
                                                                            field.onChange(selected);
                                                                        }}
                                                                    >
                                                                        <s-choice value={STATUS.activate}>
                                                                            Activate
                                                                        </s-choice>

                                                                        <s-choice value={STATUS.deactivate}>
                                                                            Deactivate
                                                                        </s-choice>


                                                                    </s-choice-list>
                                                                )}
                                                            />

                                                        </s-stack>
                                                    </s-box>

                                                }

                                            </s-box>
                                        </s-box>

                                        <s-box paddingBlockEnd={'large'}>
                                            <s-box background="base" borderRadius="base" paddingInline={'300'} paddingBlockStart={'200'} minInlineSize="350px">

                                                <s-clickable
                                                    padding="small"
                                                    background="base"
                                                    borderRadius="base"
                                                    minBlockSize="50px"
                                                    onClick={() => {
                                                        setToogleOpen({
                                                            ...toogleOpen,
                                                            buttonStyleOpen: !toogleOpen.buttonStyleOpen,
                                                        });
                                                    }}
                                                >
                                                    <s-stack
                                                        direction="inline"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        <s-stack
                                                            direction="inline"
                                                            gap="small-300"
                                                        >
                                                            <s-text type="strong">Button style</s-text>


                                                        </s-stack>
                                                        <s-icon type={toogleOpen.buttonStyleOpen ? "caret-up" : "caret-down"}></s-icon>
                                                    </s-stack>
                                                </s-clickable>

                                                {toogleOpen.buttonStyleOpen &&

                                                    <s-box padding="none small small small">
                                                        <s-stack
                                                            gap="small"
                                                        >
                                                            {watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.cart &&
                                                                <Controller
                                                                    name="buttonStyleSettings.addToCartBtnTxt"
                                                                    control={control}
                                                                    defaultValue={"Add to Cart"}
                                                                    render={({ field, fieldState }) => (
                                                                        <s-text-field
                                                                            type="text"
                                                                            label={'Add to cart button label'}
                                                                            name="buttonStyleSettings.addToCartBtnTxt"
                                                                            value={field.value}
                                                                            onChange={field.onChange}
                                                                            error={fieldState.error?.message || actionData?.errors?.buttonStyleSettings?.addToCartBtnTxt}
                                                                            autoComplete="off"
                                                                            maxLength={100}
                                                                        />
                                                                    )}
                                                                />
                                                            }
                                                            {watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.checkout &&
                                                                <Controller
                                                                    name="buttonStyleSettings.checkoutBtnTxt"
                                                                    control={control}
                                                                    defaultValue="Checkout"
                                                                    render={({ field, fieldState }) => (
                                                                        <s-text-field
                                                                            type="text"
                                                                            label={'Checkout button label'}
                                                                            name="buttonStyleSettings.checkoutBtnTxt"
                                                                            value={field.value}
                                                                            onChange={field.onChange}
                                                                            error={fieldState.error?.message || actionData?.errors?.buttonStyleSettings?.checkoutBtnTxt}
                                                                            autoComplete="off"
                                                                            maxLength={100}
                                                                        />
                                                                    )}
                                                                />
                                                            }
                                                            {watchedValues.componentSettings.fullView &&
                                                                <Controller
                                                                    name="buttonStyleSettings.viewBtnTxt"
                                                                    control={control}
                                                                    defaultValue="View Product"
                                                                    render={({ field, fieldState }) => (
                                                                        <s-text-field
                                                                            type="text"
                                                                            label={'View product button label'}
                                                                            name="buttonStyleSettings.viewBtnTxt"
                                                                            value={field.value}
                                                                            onChange={field.onChange}
                                                                            error={fieldState.error?.message || actionData?.errors?.buttonStyleSettings?.viewBtnTxt}
                                                                            autoComplete="off"
                                                                            maxLength={100}
                                                                        />
                                                                    )}
                                                                />

                                                            }

                                                            <s-stack
                                                                direction="inline"
                                                                gap="small-300"
                                                                alignItems="center"
                                                                justifyContent="space-between"
                                                            >
                                                                <s-box inlineSize="48%">
                                                                    <Controller
                                                                        name="buttonStyleSettings.buttonFontWeight"
                                                                        control={control}
                                                                        defaultValue="600"
                                                                        render={({ field, fieldState }) => (
                                                                            <s-select
                                                                                label="Button font weight"
                                                                                error={fieldState.error?.message || actionData?.errors?.buttonStyleSettings?.viewBtnTxt}
                                                                                name="buttonStyleSettings.viewBtnTxt"
                                                                                value={field.value}
                                                                                onChange={field.onChange}
                                                                            >
                                                                                {fontWeight.map((option) => (
                                                                                    <s-option
                                                                                        key={option.value}
                                                                                        value={option.value}
                                                                                        selected={field.value === option.value}
                                                                                        onClick={() => field.onChange(option.value)}
                                                                                    >
                                                                                        {option.label}
                                                                                    </s-option>
                                                                                ))

                                                                                }

                                                                            </s-select>
                                                                        )}
                                                                    />
                                                                </s-box>
                                                                <s-box inlineSize="48%">
                                                                    <Controller
                                                                        name="buttonStyleSettings.buttonFontSize"
                                                                        control={control}
                                                                        defaultValue="14px"
                                                                        render={({ field, fieldState }) => (
                                                                            <s-select
                                                                                label="Button font size"
                                                                                error={fieldState.error?.message || actionData?.errors?.buttonStyleSettings?.buttonStyleSettings?.buttonFontSize}
                                                                                name="buttonStyleSettings.buttonFontSize"
                                                                                value={field.value}
                                                                                onChange={field.onChange}
                                                                            >
                                                                                {fontSize.map((option) => (
                                                                                    <s-option
                                                                                        key={option.value}
                                                                                        value={option.value}
                                                                                        selected={field.value === option.value}
                                                                                        onClick={() => field.onChange(option.value)}
                                                                                    >
                                                                                        {option.label}
                                                                                    </s-option>
                                                                                ))

                                                                                }

                                                                            </s-select>
                                                                        )}
                                                                    />
                                                                </s-box>
                                                            </s-stack>

                                                            <s-stack
                                                                gap="base"
                                                            >

                                                                <ColorFieldController
                                                                    control={control}
                                                                    name="buttonStyleSettings.buttonTextColor"
                                                                    defaultValue={'#FFFFFF'}
                                                                    label="Button font color"
                                                                />

                                                                <ColorFieldController
                                                                    control={control}
                                                                    name="buttonStyleSettings.buttonBackgroundColor"
                                                                    defaultValue={'#303030'}
                                                                    label="Button background color"
                                                                />

                                                                <ColorFieldController
                                                                    control={control}
                                                                    name="buttonStyleSettings.buttonBorderColor"
                                                                    defaultValue={'#E5E5E5'}
                                                                    label="Button border color"
                                                                />
                                                            </s-stack>

                                                            <s-stack gap="base">
                                                                <Controller
                                                                    name="buttonStyleSettings.buttonBorderRadius"
                                                                    control={control}
                                                                    defaultValue={4}
                                                                    render={({ field }) => (
                                                                        <s-number-field
                                                                            name={field.name}
                                                                            value={field.value}
                                                                            onChange={field.onChange}
                                                                            label="Border Radius"
                                                                            placeholder="e.g. 4"
                                                                            step={1}
                                                                            min={0}
                                                                            max={50}
                                                                            suffix="px"
                                                                            inputMode="numeric"
                                                                            details="Input value between 0 to 50"
                                                                        />
                                                                    )}
                                                                />

                                                                <s-stack
                                                                    paddingBlockEnd="small-300"
                                                                    direction="inline"
                                                                    gap="small-300"
                                                                    alignItems="center"
                                                                    justifyContent="space-between"
                                                                >
                                                                    <s-box inlineSize="48%">
                                                                        <Controller
                                                                            name="buttonStyleSettings.buttonTBPadding"
                                                                            control={control}
                                                                            defaultValue={14}
                                                                            render={({ field }) => (
                                                                                <s-number-field
                                                                                    name={field.name}
                                                                                    value={field.value}
                                                                                    onChange={field.onChange}
                                                                                    label="Top & Bottom Padding"
                                                                                    placeholder="e.g. 16"
                                                                                    step={1}
                                                                                    min={0}
                                                                                    max={100}
                                                                                    suffix="px"
                                                                                    inputMode="numeric"
                                                                                    details="Input value between 0 to 100"
                                                                                />
                                                                            )}
                                                                        />
                                                                    </s-box>
                                                                    <s-box inlineSize="48%">
                                                                        <Controller
                                                                            name="buttonStyleSettings.buttonLRPadding"
                                                                            control={control}
                                                                            defaultValue={10}
                                                                            render={({ field }) => (
                                                                                <s-number-field
                                                                                    name={field.name}
                                                                                    value={field.value}
                                                                                    onChange={field.onChange}
                                                                                    label="Right & left Padding"
                                                                                    placeholder="e.g. 10"
                                                                                    step={1}
                                                                                    min={0}
                                                                                    max={100}
                                                                                    suffix="px"
                                                                                    inputMode="numeric"
                                                                                    details="Input value between 0 to 100"
                                                                                />
                                                                            )}
                                                                        />
                                                                    </s-box>

                                                                </s-stack>

                                                            </s-stack>

                                                        </s-stack>
                                                    </s-box>

                                                }

                                            </s-box>
                                        </s-box>

                                        <div className={watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.checkout ? 'btncollapsibleHidden' : ''} aria-disabled={watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.checkout} aria-hidden={watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.checkout}>
                                            <s-box paddingBlockEnd={'large'}>
                                                <s-box background="base" borderRadius="base" paddingInline={'300'} paddingBlockStart={'200'} minInlineSize="350px">

                                                    <s-clickable
                                                        padding="small"
                                                        background="base"
                                                        borderRadius="base"
                                                        minBlockSize="50px"
                                                        onClick={() => {
                                                            setToogleOpen({
                                                                ...toogleOpen,
                                                                shoppingCartOpen: !toogleOpen.shoppingCartOpen,
                                                            });
                                                        }}
                                                    >
                                                        <s-stack
                                                            direction="inline"
                                                            justifyContent="space-between"
                                                            alignItems="center"
                                                        >
                                                            <s-stack
                                                                direction="inline"
                                                                gap="small-300"
                                                            >
                                                                <s-text type="strong">Shopping Cart</s-text>


                                                            </s-stack>
                                                            <s-icon type={toogleOpen.shoppingCartOpen ? "caret-up" : "caret-down"}></s-icon>
                                                        </s-stack>
                                                    </s-clickable>

                                                    {toogleOpen.shoppingCartOpen &&

                                                        <s-box padding="none small small small">
                                                            <s-stack
                                                                gap="small"
                                                            >
                                                                <Controller
                                                                    name="shoppingCartSettings.heading"
                                                                    control={control}
                                                                    defaultValue="Shopping Cart"
                                                                    rules={{
                                                                        required: false,
                                                                        maxLength: {
                                                                            value: 50,
                                                                            message: 'Heading must be less than 50 characters'
                                                                        }
                                                                    }}
                                                                    render={({ field, fieldState }) => (
                                                                        <s-text-field
                                                                            type="text"
                                                                            label={'Heading'}
                                                                            name="shoppingCartSettings.heading"
                                                                            value={field.value}
                                                                            onChange={field.onChange}
                                                                            error={fieldState.error?.message || actionData?.errors?.shoppingCartSettings?.heading}
                                                                            autoComplete="off"
                                                                            maxLength={50}
                                                                        />
                                                                    )}
                                                                />

                                                                <Controller
                                                                    name="shoppingCartSettings.emptyCartText"
                                                                    control={control}
                                                                    defaultValue="Your cart is empty"
                                                                    rules={{
                                                                        required: false,
                                                                        maxLength: {
                                                                            value: 50,
                                                                            message: 'Text must be less than 50 characters'
                                                                        }
                                                                    }}
                                                                    render={({ field, fieldState }) => (
                                                                        <s-text-field
                                                                            type="text"
                                                                            label='Empty cart text'
                                                                            name="shoppingCartSettings.emptyCartText"
                                                                            value={field.value}
                                                                            onChange={field.onChange}
                                                                            error={fieldState.error?.message || actionData?.errors?.shoppingCartSettings?.emptyCartText}
                                                                            autoComplete="off"
                                                                            maxLength={50}
                                                                        />
                                                                    )}
                                                                />

                                                                <Controller
                                                                    name="shoppingCartSettings.additionalInfo"
                                                                    control={control}
                                                                    defaultValue="Note: Shipping and taxes will be added at checkout."
                                                                    rules={{
                                                                        required: false,
                                                                        maxLength: {
                                                                            value: 100,
                                                                            message: 'Additional info must be less than 100 characters'
                                                                        }
                                                                    }}
                                                                    render={({ field, fieldState }) => (
                                                                        <s-text-field
                                                                            type="text"
                                                                            label='Additional information'
                                                                            name="shoppingCartSettings.additionalInfo"
                                                                            value={field.value}
                                                                            onChange={field.onChange}
                                                                            error={fieldState.error?.message || actionData?.errors?.shoppingCartSettings?.additionalInfo}
                                                                            autoComplete="off"
                                                                            maxLength={100}
                                                                        />
                                                                    )}
                                                                />

                                                                <Controller
                                                                    name="shoppingCartSettings.shoppingCartBtnTxt"
                                                                    control={control}
                                                                    defaultValue="CHECKOUT"
                                                                    rules={{
                                                                        required: false,
                                                                        maxLength: {
                                                                            value: 50,
                                                                            message: "Checkout button text should be less than 100 characters"
                                                                        }
                                                                    }}
                                                                    render={({ field, fieldState }) => (
                                                                        <s-text-field
                                                                            type="text"
                                                                            label={"Checkout button text"}
                                                                            name="shoppingCartSettings.shoppingCartBtnTxt"
                                                                            value={field.value}
                                                                            onChange={field.onChange}
                                                                            error={fieldState.error?.message || actionData?.errors?.shoppingCartSettings?.additionalInfo}
                                                                            autoComplete="off"
                                                                            maxLength={50}
                                                                        />
                                                                    )}
                                                                />

                                                                <ColorFieldController
                                                                    control={control}
                                                                    name="shoppingCartSettings.shoppingCartBgColor"
                                                                    defaultValue={'#FFFFFF'}
                                                                    label="Shopping cart background color"
                                                                />

                                                                <ColorFieldController
                                                                    control={control}
                                                                    name="shoppingCartSettings.shoppingCartTextColor"
                                                                    defaultValue={'#000000'}
                                                                    label="Shopping cart text color"
                                                                />

                                                                <ColorFieldController
                                                                    control={control}
                                                                    name="shoppingCartSettings.shoppingCartBtnBgColor"
                                                                    defaultValue={'#2563EB'}
                                                                    label="Shopping cart button BG color"
                                                                />

                                                                <s-stack gap="none">

                                                                    <s-stack>
                                                                        <s-stack direction="inline" gap="small-300" alignItems="center" justifyContent="start">
                                                                            <Controller
                                                                                name="shoppingCartSettings.showOrderNote"
                                                                                control={control}
                                                                                render={({ field }) => (
                                                                                    <s-checkbox
                                                                                        label="Show order note field"
                                                                                        checked={field.value === BoleanOptions.yes ? true : false}
                                                                                        onChange={(e) => {
                                                                                            const newValue = e.currentTarget.checked;
                                                                                            field.onChange(newValue ? BoleanOptions.yes : BoleanOptions.no);
                                                                                        }}
                                                                                        disabled={disabledContentByPlan}
                                                                                    />
                                                                                )}
                                                                            />
                                                                            {disabledContentByPlan &&
                                                                                <UpgradeTooltip />
                                                                            }
                                                                        </s-stack>

                                                                        {watchedValues.shoppingCartSettings.showOrderNote === BoleanOptions.yes &&
                                                                            <s-stack gap="small-300" paddingBlockStart="small-300">
                                                                                <Controller
                                                                                    name="shoppingCartSettings.orderNoteTitle"
                                                                                    control={control}
                                                                                    rules={{
                                                                                        required: false,
                                                                                        maxLength: {
                                                                                            value: 100,
                                                                                            message: "Order note title should be less than 100 characters"
                                                                                        }
                                                                                    }}
                                                                                    render={({ field, fieldState }) => (
                                                                                        <s-text-field
                                                                                            type="text"
                                                                                            label={'Order note title'}
                                                                                            name="shoppingCartSettings.orderNoteTitle"
                                                                                            value={field.value}
                                                                                            onChange={field.onChange}
                                                                                            error={fieldState.error?.message || actionData?.errors?.shoppingCartSettings?.orderNoteTitle}
                                                                                            autoComplete="off"
                                                                                            maxLength={100}
                                                                                        />
                                                                                    )}
                                                                                />

                                                                                <Controller
                                                                                    name="shoppingCartSettings.orderNotePlaceholder"
                                                                                    control={control}
                                                                                    rules={{
                                                                                        required: false,
                                                                                        maxLength: {
                                                                                            value: 100,
                                                                                            message: "Order note title should be less than 100 characters"
                                                                                        }
                                                                                    }}
                                                                                    render={({ field, fieldState }) => (
                                                                                        <s-text-field
                                                                                            type="text"
                                                                                            label={'Order note placeholder'}
                                                                                            name="shoppingCartSettings.orderNotePlaceholder"
                                                                                            value={field.value}
                                                                                            onChange={field.onChange}
                                                                                            error={fieldState.error?.message || actionData?.errors?.shoppingCartSettings?.orderNotePlaceholder}
                                                                                            autoComplete="off"
                                                                                            maxLength={100}
                                                                                        />
                                                                                    )}
                                                                                />
                                                                            </s-stack>
                                                                        }
                                                                    </s-stack>

                                                                    <s-stack>
                                                                        <s-stack direction="inline" gap="small-300" alignItems="center" justifyContent="start">
                                                                            <Controller
                                                                                name="shoppingCartSettings.showDiscountCodeField"
                                                                                control={control}
                                                                                render={({ field }) => (
                                                                                    <s-checkbox
                                                                                        label="Show order discount code field"
                                                                                        checked={field.value === BoleanOptions.yes ? true : false}
                                                                                        onChange={(e) => {
                                                                                            const newValue = e.currentTarget.checked;
                                                                                            field.onChange(newValue ? BoleanOptions.yes : BoleanOptions.no);
                                                                                        }}
                                                                                        disabled={disabledContentByPlan}
                                                                                    />
                                                                                )}
                                                                            />
                                                                            {disabledContentByPlan &&
                                                                                <UpgradeTooltip />
                                                                            }
                                                                        </s-stack>

                                                                        {watchedValues.shoppingCartSettings.showDiscountCodeField === BoleanOptions.yes &&
                                                                            <s-stack gap="small-300" paddingBlockStart="small-300">
                                                                                <Controller
                                                                                    name="shoppingCartSettings.discountCodeTitle"
                                                                                    control={control}
                                                                                    rules={{
                                                                                        required: false,
                                                                                        maxLength: {
                                                                                            value: 100,
                                                                                            message: "Discount code title should be less than 100 characters"
                                                                                        }
                                                                                    }}
                                                                                    render={({ field, fieldState }) => (
                                                                                        <s-text-field
                                                                                            type="text"
                                                                                            label={'Discount code title'}
                                                                                            name="shoppingCartSettings.discountCodeTitle"
                                                                                            value={field.value}
                                                                                            onChange={field.onChange}
                                                                                            error={fieldState.error?.message || actionData?.errors?.shoppingCartSettings?.discountCodeTitle}
                                                                                            autoComplete="off"
                                                                                            maxLength={100}
                                                                                        />
                                                                                    )}
                                                                                />

                                                                                <Controller
                                                                                    name="shoppingCartSettings.discountCodePlaceholder"
                                                                                    control={control}
                                                                                    rules={{
                                                                                        required: false,
                                                                                        maxLength: {
                                                                                            value: 100,
                                                                                            message: "Discount code placeholder should be less than 100 characters"
                                                                                        }
                                                                                    }}
                                                                                    render={({ field, fieldState }) => (
                                                                                        <s-text-field
                                                                                            type="text"
                                                                                            label={'Discount code placeholder text'}
                                                                                            name="shoppingCartSettings.discountCodePlaceholder"
                                                                                            value={field.value}
                                                                                            onChange={field.onChange}
                                                                                            error={fieldState.error?.message || actionData?.errors?.shoppingCartSettings?.discountCodePlaceholder}
                                                                                            autoComplete="off"
                                                                                            maxLength={100}
                                                                                        />
                                                                                    )}
                                                                                />

                                                                                <Controller
                                                                                    name="shoppingCartSettings.discountApplyBtnTxt"
                                                                                    control={control}
                                                                                    rules={{
                                                                                        required: false,
                                                                                        maxLength: {
                                                                                            value: 100,
                                                                                            message: "Discount apply button text should be less than 100 characters"
                                                                                        }
                                                                                    }}
                                                                                    render={({ field, fieldState }) => (
                                                                                        <s-text-field
                                                                                            type="text"
                                                                                            label={'Apply discount button text'}
                                                                                            name="shoppingCartSettings.discountApplyBtnTxt"
                                                                                            value={field.value}
                                                                                            onChange={field.onChange}
                                                                                            error={fieldState.error?.message || actionData?.errors?.shoppingCartSettings?.discountApplyBtnTxt}
                                                                                            autoComplete="off"
                                                                                            maxLength={100}
                                                                                        />
                                                                                    )}
                                                                                />
                                                                            </s-stack>
                                                                        }
                                                                    </s-stack>
                                                                </s-stack>

                                                            </s-stack>
                                                        </s-box>

                                                    }

                                                </s-box>
                                            </s-box>
                                        </div>

                                        <s-box paddingBlockEnd={'large'}>
                                            <s-box background="base" borderRadius="base" paddingInline={'300'} paddingBlockStart={'200'} minInlineSize="350px">

                                                <s-clickable
                                                    padding="small"
                                                    background="base"
                                                    borderRadius="base"
                                                    minBlockSize="50px"
                                                    onClick={() => {
                                                        setToogleOpen({
                                                            ...toogleOpen,
                                                            settingsOpen: !toogleOpen.settingsOpen,
                                                        });
                                                    }}
                                                >
                                                    <s-stack
                                                        direction="inline"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        <s-stack
                                                            direction="inline"
                                                            gap="small-300"
                                                        >
                                                            <s-text type="strong">Settings</s-text>


                                                        </s-stack>
                                                        <s-icon type={toogleOpen.settingsOpen ? "caret-up" : "caret-down"}></s-icon>
                                                    </s-stack>
                                                </s-clickable>

                                                {toogleOpen.settingsOpen &&

                                                    <s-box padding="none small small small">
                                                        <s-stack
                                                            gap="base"
                                                        >
                                                            <s-stack
                                                                direction="inline"
                                                                gap="small-300"
                                                                alignItems="center"
                                                                justifyContent="center"
                                                            >
                                                                <s-clickable
                                                                    padding="small-300"
                                                                    inlineSize="48%"
                                                                    borderRadius="base"
                                                                    onClick={() => {
                                                                        setSettingsTabSelected(0);
                                                                    }}
                                                                    background={settingsTabSelected === 0 ? "subdued" : "transparent"}
                                                                ><s-stack alignItems="center">Component settings </s-stack></s-clickable>

                                                                <s-clickable
                                                                    inlineSize="48%"
                                                                    padding="small-300"
                                                                    onClick={() => {
                                                                        setSettingsTabSelected(1);
                                                                    }}
                                                                    background={settingsTabSelected === 1 ? "subdued" : "transparent"}
                                                                    borderRadius="base"
                                                                >
                                                                    <s-stack alignItems="center">Product layout</s-stack>
                                                                </s-clickable>

                                                            </s-stack>
                                                            {settingsTabSelected === 0 &&
                                                                <s-stack>

                                                                    <s-stack display={watchedValues.appliesTo === APPLIES_TO.byproduct && watchedValues.addToCartType.type === ADD_TO_CART_TYPE.bulk ? 'none' : 'auto'}>
                                                                        <Controller
                                                                            name="componentSettings.fullView"
                                                                            control={control}
                                                                            render={({ field }) => (
                                                                                <s-checkbox
                                                                                    label='Enable "quick view" option'
                                                                                    checked={watchedValues.componentSettings?.fullView === true ? true : false}
                                                                                    onChange={(e) => {
                                                                                        const newValue = e.currentTarget.checked;
                                                                                        field.onChange(newValue);
                                                                                    }}
                                                                                />
                                                                            )}
                                                                        />
                                                                    </s-stack>

                                                                    <Controller
                                                                        name="componentSettings.showComponentTitle"
                                                                        control={control}
                                                                        render={({ field }) => (
                                                                            <s-checkbox
                                                                                label='Component title show'
                                                                                checked={watchedValues.showComponentTitle?.fullView === SHOW_COMPONENT_TITLE.yes ? true : false}
                                                                                onChange={(e) => {
                                                                                    const newValue = e.currentTarget.checked ? SHOW_COMPONENT_TITLE.yes : SHOW_COMPONENT_TITLE.no;
                                                                                    field.onChange(newValue);
                                                                                }}
                                                                            />
                                                                        )}
                                                                    />

                                                                </s-stack>
                                                            }
                                                            {settingsTabSelected === 1 &&
                                                                <s-stack gap="small">

                                                                    <s-stack
                                                                        direction="inline"
                                                                        gap="small-300"
                                                                        alignItems="center"
                                                                        justifyContent="space-between"
                                                                    >
                                                                        <s-box inlineSize="48%">
                                                                            <Controller
                                                                                name="productLayoutSettings.productTitleWeight"
                                                                                control={control}
                                                                                defaultValue="600"
                                                                                render={({ field, fieldState }) => (
                                                                                    <s-select
                                                                                        label="Product title font weight"
                                                                                        error={fieldState.error?.message}
                                                                                        name="productLayoutSettings.productTitleWeight"
                                                                                        value={field.value}
                                                                                        onChange={field.onChange}
                                                                                    >
                                                                                        {fontWeight.map((option) => (
                                                                                            <s-option
                                                                                                key={option.value}
                                                                                                value={option.value}
                                                                                                selected={field.value === option.value}
                                                                                                onClick={() => field.onChange(option.value)}
                                                                                            >
                                                                                                {option.label}
                                                                                            </s-option>
                                                                                        ))

                                                                                        }

                                                                                    </s-select>
                                                                                )}
                                                                            />
                                                                        </s-box>
                                                                        <s-box inlineSize="48%">
                                                                            <Controller
                                                                                name="productLayoutSettings.productTitleSize"
                                                                                control={control}
                                                                                defaultValue="20px"
                                                                                render={({ field, fieldState }) => (
                                                                                    <s-select
                                                                                        label="Product title font size"
                                                                                        error={fieldState.error?.message}
                                                                                        name="productLayoutSettings.productTitleSize"
                                                                                        value={field.value}
                                                                                        onChange={field.onChange}
                                                                                    >
                                                                                        {fontSize.map((option) => (
                                                                                            <s-option
                                                                                                key={option.value}
                                                                                                value={option.value}
                                                                                                selected={field.value === option.value}
                                                                                                onClick={() => field.onChange(option.value)}
                                                                                            >
                                                                                                {option.label}
                                                                                            </s-option>
                                                                                        ))

                                                                                        }

                                                                                    </s-select>
                                                                                )}
                                                                            />
                                                                        </s-box>
                                                                    </s-stack>

                                                                    <s-stack
                                                                        direction="inline"
                                                                        gap="small-300"
                                                                        alignItems="center"
                                                                        justifyContent="space-between"
                                                                    >
                                                                        <s-box inlineSize="48%">
                                                                            <Controller
                                                                                name="productLayoutSettings.productPriceWeight"
                                                                                control={control}
                                                                                defaultValue="600"
                                                                                render={({ field, fieldState }) => (
                                                                                    <s-select
                                                                                        label="Product price font weight"
                                                                                        error={fieldState.error?.message}
                                                                                        name="productLayoutSettings.productPriceWeight"
                                                                                        value={field.value}
                                                                                        onChange={field.onChange}
                                                                                    >
                                                                                        {fontWeight.map((option) => (
                                                                                            <s-option
                                                                                                key={option.value}
                                                                                                value={option.value}
                                                                                                selected={field.value === option.value}
                                                                                                onClick={() => field.onChange(option.value)}
                                                                                            >
                                                                                                {option.label}
                                                                                            </s-option>
                                                                                        ))

                                                                                        }

                                                                                    </s-select>
                                                                                )}
                                                                            />
                                                                        </s-box>
                                                                        <s-box inlineSize="48%">
                                                                            <Controller
                                                                                name="productLayoutSettings.productPriceSize"
                                                                                control={control}
                                                                                defaultValue="14px"
                                                                                render={({ field, fieldState }) => (
                                                                                    <s-select
                                                                                        label="Product price font size"
                                                                                        error={fieldState.error?.message}
                                                                                        name="productLayoutSettings.productPriceSize"
                                                                                        value={field.value}
                                                                                        onChange={field.onChange}
                                                                                    >
                                                                                        {fontSize.map((option) => (
                                                                                            <s-option
                                                                                                key={option.value}
                                                                                                value={option.value}
                                                                                                selected={field.value === option.value}
                                                                                                onClick={() => field.onChange(option.value)}
                                                                                            >
                                                                                                {option.label}
                                                                                            </s-option>
                                                                                        ))

                                                                                        }

                                                                                    </s-select>
                                                                                )}
                                                                            />
                                                                        </s-box>
                                                                    </s-stack>

                                                                    <ColorFieldController
                                                                        control={control}
                                                                        defaultValue="#303030"
                                                                        name="productLayoutSettings.productTitleColor"
                                                                        label="Product title font color"
                                                                    />

                                                                    <ColorFieldController
                                                                        control={control}
                                                                        defaultValue="#303030"
                                                                        name="productLayoutSettings.productPriceColor"
                                                                        label="Product price font color"
                                                                    />

                                                                    <ColorFieldController
                                                                        control={control}
                                                                        defaultValue="#FFFFFF"
                                                                        name="productLayoutSettings.productCardBgColor"
                                                                        label="Product card background color"
                                                                    />

                                                                    <ColorFieldController
                                                                        control={control}
                                                                        defaultValue="#E5E5E5"
                                                                        name="productLayoutSettings.productCardBorderColor"
                                                                        label="Product card border color"
                                                                    />

                                                                </s-stack>
                                                            }

                                                        </s-stack>
                                                    </s-box>

                                                }

                                            </s-box>
                                        </s-box>

                                        <s-box paddingBlockEnd={'large'}>
                                            <s-box background="base" borderRadius="base" paddingInline={'300'} paddingBlockStart={'200'} minInlineSize="350px">

                                                <s-clickable
                                                    padding="small"
                                                    background="base"
                                                    borderRadius="base"
                                                    minBlockSize="50px"
                                                    onClick={() => {
                                                        setToogleOpen({
                                                            ...toogleOpen,
                                                            customCssOpen: !toogleOpen.customCssOpen,
                                                        });
                                                    }}
                                                >
                                                    <s-stack
                                                        direction="inline"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        <s-stack
                                                            direction="inline"
                                                            gap="small-300"
                                                        >
                                                            <s-text type="strong">Custom CSS</s-text>
                                                            {disabledContentProPlan &&
                                                                <UpgradeTooltip />
                                                            }
                                                        </s-stack>
                                                        <s-icon type={toogleOpen.tranckingOpen ? "caret-up" : "caret-down"}></s-icon>
                                                    </s-stack>
                                                </s-clickable>

                                                {toogleOpen.customCssOpen &&
                                                    <s-box padding="none small small small">

                                                        <div className={disabledContentProPlan ? 'btncollapsibleHidden' : ''} aria-disabled={disabledContentProPlan}>
                                                            <s-stack
                                                                gap="base"
                                                            >
                                                                <Controller
                                                                    name="componentSettings.customCss"
                                                                    control={control}
                                                                    render={({ field }) => (
                                                                        <s-text-area
                                                                            name="componentSettings.customCss"
                                                                            label="Custom CSS"
                                                                            labelAccessibilityVisibility="exclusive"
                                                                            value={field.value}
                                                                            onChange={field.onChange}
                                                                            type="text"
                                                                            placeholder='Enter your custom CSS here'
                                                                            rows={7}
                                                                        />
                                                                    )}
                                                                />

                                                            </s-stack>
                                                        </div>

                                                    </s-box>

                                                }

                                            </s-box>
                                        </s-box>

                                        <s-box paddingBlockEnd={'large'}>
                                            <s-box background="base" borderRadius="base" paddingInline={'300'} paddingBlockStart={'200'} minInlineSize="350px">

                                                <s-clickable
                                                    padding="small"
                                                    background="base"
                                                    borderRadius="base"
                                                    minBlockSize="50px"
                                                    onClick={() => {
                                                        setToogleOpen({
                                                            ...toogleOpen,
                                                            tranckingOpen: !toogleOpen.tranckingOpen,
                                                        });
                                                    }}
                                                >
                                                    <s-stack
                                                        direction="inline"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        <s-stack
                                                            direction="inline"
                                                            gap="small-300"
                                                        >
                                                            <s-text type="strong">Tracking</s-text>
                                                            {disabledContentProPlan &&
                                                                <UpgradeTooltip />
                                                            }
                                                        </s-stack>
                                                        <s-icon type={toogleOpen.tranckingOpen ? "caret-up" : "caret-down"}></s-icon>
                                                    </s-stack>
                                                </s-clickable>

                                                {toogleOpen.tranckingOpen &&

                                                    <s-box padding="none small small small">
                                                        <div className={disabledContentProPlan ? 'btncollapsibleHidden' : ''} aria-disabled={disabledContentProPlan}>
                                                            <s-stack
                                                                gap="small"
                                                            >
                                                                <Controller
                                                                    name="customerTracking"
                                                                    control={control}
                                                                    // rules={{
                                                                    //     required: true,

                                                                    // }}
                                                                    render={({ field }) => (
                                                                        <s-text-field
                                                                            name="customerTracking"
                                                                            label={"Custom tracking code"}
                                                                            value={field.value}
                                                                            onChange={field.onChange}
                                                                            minLength={2}
                                                                            maxLength={20}
                                                                            showCharacterCount
                                                                            placeholder={'Enter tracking code'}
                                                                        />
                                                                    )}
                                                                />

                                                                <Controller
                                                                    name="utmSource"
                                                                    control={control}
                                                                    // rules={{
                                                                    //     required: true,

                                                                    // }}
                                                                    render={({ field }) => (
                                                                        <s-text-field
                                                                            name="utmSource"
                                                                            label={"UTM Source"}
                                                                            value={field.value}
                                                                            onChange={field.onChange}
                                                                            minLength={2}
                                                                            maxLength={20}
                                                                            showCharacterCount
                                                                            placeholder={"Enter utm source"}
                                                                        />
                                                                    )}
                                                                />

                                                                <Controller
                                                                    name="utmMedium"
                                                                    control={control}
                                                                    // rules={{
                                                                    //     required: true,

                                                                    // }}
                                                                    render={({ field }) => (
                                                                        <s-text-field
                                                                            name="utmMedium"
                                                                            label={"UTM Medium"}
                                                                            value={field.value}
                                                                            onChange={field.onChange}
                                                                            minLength={2}
                                                                            maxLength={20}
                                                                            showCharacterCount
                                                                            placeholder={"Enter utm medium"}
                                                                        />
                                                                    )}
                                                                />

                                                                <Controller
                                                                    name="utmCampaign"
                                                                    control={control}
                                                                    // rules={{
                                                                    //     required: true,

                                                                    // }}
                                                                    render={({ field }) => (
                                                                        <s-text-field
                                                                            name="utmCampaign"
                                                                            label={"UTM Campaign"}
                                                                            value={field.value}
                                                                            onChange={field.onChange}
                                                                            minLength={2}
                                                                            maxLength={20}
                                                                            showCharacterCount
                                                                            placeholder={"Enter utm campaign"}
                                                                        />
                                                                    )}
                                                                />

                                                            </s-stack>
                                                        </div>
                                                    </s-box>

                                                }

                                            </s-box>
                                        </s-box>


                                        <s-box paddingBlockEnd={'large'}>
                                            <s-box background="base" borderRadius="base" paddingInline={'300'} paddingBlockStart={'200'} minInlineSize="350px">

                                                <s-clickable
                                                    padding="small"
                                                    background="base"
                                                    borderRadius="base"
                                                    minBlockSize="50px"
                                                    onClick={() => {
                                                        setToogleOpen({
                                                            ...toogleOpen,
                                                            affiliateAssignOpen: !toogleOpen.affiliateAssignOpen,
                                                        });
                                                    }}
                                                >
                                                    <s-stack
                                                        direction="inline"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        <s-stack
                                                            direction="inline"
                                                            gap="small-300"
                                                        >
                                                            <s-text type="strong">Affiliates</s-text>
                                                            {disabledContentProPlan &&
                                                                <UpgradeTooltip />
                                                            }

                                                        </s-stack>
                                                        <s-icon type={toogleOpen.affiliateAssignOpen ? "caret-up" : "caret-down"}></s-icon>
                                                    </s-stack>
                                                </s-clickable>

                                                {toogleOpen.affiliateAssignOpen &&

                                                    <s-box padding="none small small small">
                                                        <div className={disabledContentProPlan ? 'btncollapsibleHidden' : ''} aria-disabled={disabledContentProPlan}>
                                                            {shopData?.affiliates?.length === 0 ?
                                                                <s-text type="auto" tone="critical">Please create a affiliate first to assign. <s-link href="/app/affiliate/new">Create Affiliate</s-link></s-text>
                                                                :
                                                                <Controller
                                                                    name="affiliateId"
                                                                    control={control}
                                                                    defaultValue={null}
                                                                    // rules={{
                                                                    //     required: "Please select a affiliate"
                                                                    // }}
                                                                    render={({ field, fieldState }) => (
                                                                        <s-select label="Assign affiliate" placeholder="Choose an affiliate"
                                                                            onChange={(event) => field.onChange(event.currentTarget.value)}
                                                                            value={field.value}
                                                                            error={fieldState?.error?.message}
                                                                        //required
                                                                        >
                                                                            <s-option defaultSelected={watchedValues.affiliateId === null} value={null}>{"Choose an affiliate"}</s-option>
                                                                            {shopData?.affiliates?.map((item) => {
                                                                                return (
                                                                                    <s-option key={item.id} disabled={item.isDefault === true} value={item.id}>{item.name}</s-option>
                                                                                )
                                                                            })
                                                                            }
                                                                        </s-select>
                                                                    )}
                                                                />
                                                            }
                                                        </div>
                                                    </s-box>

                                                }

                                            </s-box>
                                        </s-box>


                                        <s-box paddingBlockEnd={'large'}>
                                            <s-box background="base" borderRadius="base" paddingInline={'300'} paddingBlockStart={'200'} minInlineSize="350px">

                                                <s-clickable
                                                    padding="small"
                                                    background="base"
                                                    borderRadius="base"
                                                    minBlockSize="50px"
                                                    onClick={() => {
                                                        setToogleOpen({
                                                            ...toogleOpen,
                                                            marketAssignOpen: !toogleOpen.marketAssignOpen,
                                                        });
                                                    }}
                                                >
                                                    <s-stack
                                                        direction="inline"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        <s-stack
                                                            direction="inline"
                                                            gap="small-300"
                                                        >
                                                            <s-text type="strong">Markets</s-text>
                                                            {disabledContentProPlan &&
                                                                <UpgradeTooltip />
                                                            }

                                                        </s-stack>
                                                        <s-icon type={toogleOpen.marketAssignOpen ? "caret-up" : "caret-down"}></s-icon>
                                                    </s-stack>
                                                </s-clickable>

                                                {toogleOpen.marketAssignOpen &&

                                                    <s-box padding="none small small small">
                                                        <div className={disabledContentProPlan ? 'btncollapsibleHidden' : ''} aria-disabled={disabledContentProPlan}>
                                                            {marketRegions?.length === 0 ?
                                                                <s-text type="auto" tone="critical">Please create a Market first to assign. <s-link href={`https://admin.shopify.com/store/${shopData?.shopifyDomain.replace('.myshopify.com', '')}/markets`}>Create Market</s-link></s-text>
                                                                :
                                                                <Controller
                                                                    name="market"
                                                                    control={control}
                                                                    defaultValue={'US'}
                                                                    render={({ field, fieldState }) => (
                                                                        <s-select label="Assign Market" placeholder="Choose a market"
                                                                            onChange={(event) => field.onChange(event.currentTarget.value)}
                                                                            value={field.value}
                                                                            error={fieldState?.error?.message}
                                                                        >
                                                                            <s-option defaultSelected={watchedValues.market === 'US'} value={'US'}>{"Select a Market"}</s-option>
                                                                            {(marketRegions || []).map((item) => {
                                                                                return (
                                                                                    <s-option key={item.code} value={item.code}>{item.name}</s-option>
                                                                                )
                                                                            })
                                                                            }
                                                                        </s-select>
                                                                    )}
                                                                />
                                                            }
                                                        </div>
                                                    </s-box>

                                                }

                                            </s-box>
                                        </s-box>


                                    </s-stack>

                                    {disabledContentByPlan && shopData?.components?.length > 0 ?
                                        <s-stack
                                            alignItems="center"
                                            gap="small"
                                            direction="inline"
                                            justifyContent="end"
                                        >
                                            <UpgradeTooltip />
                                            <s-button loading={navigation.state === 'submitting'} disabled={true} variant="primary">
                                                Save Component
                                            </s-button>
                                        </s-stack>

                                        : shopData?.components?.length >= shopData?.maxAllowedComponents ?
                                            <s-stack
                                                alignItems="center"
                                                gap="small"
                                                direction="inline"
                                                justifyContent="end"
                                            >
                                                <s-button loading={navigation.state === 'submitting'} disabled={true} variant="primary">
                                                    Save Component
                                                </s-button>
                                            </s-stack>
                                            :
                                            <s-box paddingBlockEnd="large">
                                                <s-stack
                                                    alignItems="center"
                                                    gap="small"
                                                    direction="inline"
                                                    justifyContent="end"
                                                >
                                                    
                                                    <s-button disabled={!isDirty} loading={navigation.state === 'submitting'} variant="primary" type="submit">
                                                        Save Component
                                                    </s-button>
                                                </s-stack>
                                            </s-box>
                                    }

                                </s-box>

                            </s-grid-item>


                            <s-grid-item gridColumn="span 8" inlineSize="100%">
                                <Modal id="spc-modal" variant="max" onHide={() => {
                                    setSelectedViewMDF({ id: 2, view: 'desktop' })
                                }}>
                                    <iframe
                                        title="spc-iframe"
                                        srcDoc={
                                            `
                                        <!DOCTYPE html>
                                            <html>
                                            <head>
                                            ${scriptsAll}
                                            </head>
                                            <body>
                                               ${delayedSrcDoc}
                                            </body>
                                            </html>
                                        `
                                        }
                                        style={{ width: '100%', height: "100vh", border: 'none' }}
                                        sandbox="allow-scripts allow-same-origin allow-popups"
                                        className={`spc_iframe_view_${selectedViewMDF.view} spc_iframe spc-iframeModal`}
                                    ></iframe>
                                </Modal>
                                <div className="previewSectionSticky">
                                    <s-box>
                                        <s-box
                                            background="base"
                                            borderRadius="large"
                                            border="base"
                                        >
                                            <s-stack
                                                padding="small-300 base none none"
                                                direction="inline"
                                                justifyContent="space-between"
                                                alignItems="center"
                                                gap="large"
                                                border="none none base none"
                                            >
                                                <s-box></s-box>
                                                <s-stack
                                                    direction="inline"
                                                    background="subdued"
                                                    borderRadius="base"
                                                    gap="small-300"
                                                    padding="small-300 small-200"
                                                >
                                                    {showViewMDF?.length > 0 && showViewMDF.map((btn) => (

                                                        <s-button key={btn.id}
                                                            onClick={() => { handleShowViewMDF(btn.id, btn.view) }} accessibilityLabel={btn.view}
                                                            variant={selectedViewMDF.id === btn.id ? 'secondary' : 'tertiary'} icon={btn.icon}

                                                        />

                                                    ))}
                                                </s-stack>
                                                <s-button variant="primary" onClick={handleCopyHtmlCode} accessibilityLabel="Copy code" disabled>Copy code</s-button>
                                            </s-stack>

                                            <iframe
                                                title="spc-iframe"
                                                srcDoc={
                                                    `
                                        <!DOCTYPE html>
                                            <html>
                                            <head>
                                               ${scriptsAll}
                                            </head>
                                            <body>
                                               ${delayedSrcDoc}
                                            </body>
                                            </html>
                                        `
                                                }
                                                style={{ width: '100%', height: '100vh', border: 'none' }}
                                                sandbox="allow-scripts allow-same-origin allow-popups"
                                                className={`spc_iframe_view_${selectedViewMDF.view} spc_iframe`}


                                            ></iframe>
                                            <s-stack
                                                justifyContent="end"
                                                alignItems="end"
                                                padding="small-100 base small-100 none"
                                            >
                                                <s-button variant="primary" onClick={handleCopyHtmlCode} accessibilityLabel="Copy code" disabled>Copy code</s-button>
                                            </s-stack>
                                        </s-box>

                                        <s-box
                                            padding="large-200 small"
                                        >
                                            <s-text type="strong">Done configuring? Copy code → Paste into an HTML/Custom Code block → Publish. Your component is live.</s-text>
                                        </s-box>
                                    </s-box>
                                </div>
                            </s-grid-item>
                        </s-grid>

                    </s-query-container>
                </s-page >
            </form >
    )
}

export default CreateComponent

export const action = async ({ request }) => {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    const jsonFields = [
        "addToCartType",
        "componentSettings",
        "shoppingCartSettings",
        "productLayoutSettings",
        "buttonStyleSettings",
    ];

    for (const field of jsonFields) {
        if (data[field]) {
            try {
                data[field] = JSON.parse(data[field]);
            } catch {
                data[field] = {}; // fallback if parsing fails
            }
        }
    }
    let customerTracking = formData.get('customerTracking');
    const enableQtyField = formData.get('enableQtyField') === "true" ? true : false;
    const shopId = Number(formData.get('shopId'));
    if (customerTracking === '') {
        customerTracking = crypto.randomBytes(15).toString("base64url").slice(0, 10).toUpperCase();
    }
    const updatedData = { ...data, customerTracking: customerTracking, enableQtyField: enableQtyField, shopId: shopId, affiliateId: Number(data.affiliateId) };


    const createComp = await db.component.create({
        data: updatedData,
    });

    if (createComp?.id) {
        return {
            success: true,
            createCompData: createComp,
            message: "Component created successfully"
        };

    } else {
        return {
            success: false,
            error: "There was an error creating the component"
        };
    }


}