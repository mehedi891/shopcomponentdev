import { useActionData, useLoaderData, useNavigate, useNavigation, useSubmit } from "@remix-run/react";
import { Banner, BlockStack, Box, Button, Card, Checkbox, Collapsible, Icon, InlineError, InlineStack, Layout, Page, RadioButton, RangeSlider, Select, Tabs, Text, TextField, Thumbnail } from "@shopify/polaris"
import {
    DeleteIcon,
    DesktopIcon,
    MobileIcon,
    SearchIcon,
    ViewportWideIcon,
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
import db from "../db.server";
import UpgradeTooltip from "../components/UpgradeTooltip/UpgradeTooltip";
import PageTitle from "../components/PageTitle/PageTitle";
import DraggableProductInd from "../components/DragAblePd/DraggableProductInd";
import DraggableProductBulk from "../components/DragAblePd/DraggableProductBulk";
import { ADD_TO_CART_TYPE, APPLIES_TO, BoleanOptions, CART_BEHAVIOR, LAYOUT, PLAN_NAME, SHOW_COMPONENT_TITLE, STATUS } from "../constants/constants";
import redis from "../utilis/redis.init";
import { getRemainingTrialDays } from "../utilis/remainTrialDaysCount";




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
            components:{
                select:{id:true}
            }
        }
    });

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
    const [productLayoutSettings, setProductLayoutSettings] = useState({
        productTitleColor: '#303030',
        productPriceColor: '#303030',
        productCardBgColor: '#FFF',
        productCardBorderColor: '#E5E5E5',
    })
    const [buttonStyleSettings, setButtonStyleSettings] = useState({
        addToCartBtnTxt: 'Add to cart',
        checkoutBtnTxt: 'Checkout',
        viewBtnTxt: 'View product',
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
    const [disabledContentByPlan, setDisabledContentByPlan] = useState(false);
    const [disabledContentProPlan, setDisabledContentProPlan] = useState(false);
    const [delayedSrcDoc, setDelayedSrcDoc] = useState("");
    const [checkMaxSelectedVariants, setCheckMaxSelectedVariants] = useState(false);
    const navigation = useNavigation();
    const shopify = useAppBridge();

    const submit = useSubmit();
    const { t } = useTranslation();


    const { register, setError, getValues, handleSubmit, reset, formState: { errors, isDirty }, control, watch, setValue } = useForm({
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
                productTitleColor: productLayoutSettings.productTitleColor || '#000000',
                productPriceColor: productLayoutSettings.productPriceColor || '#000000',
                productCardBgColor: productLayoutSettings.productCardBgColor || '#ffffff',
                productCardBorderColor: productLayoutSettings.productCardBorderColor || '#e5e5e5',
            },
            buttonStyleSettings: {
                addToCartBtnTxt: 'Add to cart',
                checkoutBtnTxt: 'Buy now',
                viewBtnTxt: 'View product',
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


    //console.log('disable content by plan',shopData?.plan?.planName, disabledContentByPlan);
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
            multiple: disabledContentByPlan ? 3 : 10,
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
            multiple: 10,
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
            setSelectedProductsBulk(limitTotalVariants(selected, 10));
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
            setCheckMaxSelectedVariants(totalVariants >= 10);
            //console.log('selectedProductsBulk', selectedProductsBulk);
        }
    }, [selectedProductsBulk]);

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

    const settingsTab = [
        {
            id: 'component-settings',
            content: t("component_settings"),
            accessibilityLabel: t("component_settings"),
            panelID: 'settingsTab-content-1',
        },
        {
            id: disabledContentByPlan ? 'product-layout-disabled' : 'product-layout',
            content: disabledContentByPlan ?
                <InlineStack blockAlign="center" gap={'150'}>
                    {t("product_layout")}
                    <UpgradeTooltip />
                </InlineStack>
                : t("product_layout"),
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
    }, [productLayoutSettings.productTitleColor, productLayoutSettings.productPriceColor, productLayoutSettings.productCardBgColor, productLayoutSettings.productCardBorderColor]);


    useEffect(() => {
        setValue('buttonStyleSettings.buttonTextColor', buttonStyleSettings.buttonTextColor, { shouldDirty: true });
        setValue('buttonStyleSettings.buttonBackgroundColor', buttonStyleSettings.buttonBackgroundColor, { shouldDirty: true });
        setValue('buttonStyleSettings.buttonBorderColor', buttonStyleSettings.buttonBorderColor, { shouldDirty: true });
        setValue('buttonStyleSettings.buttonBorderRadius', buttonStyleSettings.buttonBorderRadius, { shouldDirty: true });
        setValue('buttonStyleSettings.buttonTBPadding', buttonStyleSettings.buttonTBPadding, { shouldDirty: true });
        setValue('buttonStyleSettings.buttonLRPadding', buttonStyleSettings.buttonLRPadding, { shouldDirty: true });
    }, [buttonStyleSettings.buttonTextColor, buttonStyleSettings.buttonBackgroundColor, buttonStyleSettings.buttonBorderRadius, buttonStyleSettings.buttonTBPadding, buttonStyleSettings.buttonLRPadding, buttonStyleSettings.buttonBorderColor]);

    useEffect(() => {
        setValue('shoppingCartSettings.shoppingCartBgColor', shoppingCartSettings.shoppingCartBgColor, { shouldDirty: true });
        setValue('shoppingCartSettings.shoppingCartTextColor', shoppingCartSettings.shoppingCartTextColor, { shouldDirty: true });
        setValue('shoppingCartSettings.shoppingCartBtnBgColor', shoppingCartSettings.shoppingCartBtnBgColor, { shouldDirty: true });
    }, [shoppingCartSettings.shoppingCartBgColor, shoppingCartSettings.shoppingCartTextColor, shoppingCartSettings.shoppingCartBtnBgColor]);

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



    useEffect(() => {
        if (watchedValues.appliesTo === APPLIES_TO.byproduct && watchedValues.addToCartType.type === ADD_TO_CART_TYPE.bulk) {
            setValue('componentSettings.fullView', false, { shouldValidate: true });
        }
    }, [watchedValues.appliesTo, watchedValues.addToCartType.type]);




    const handleDiscard = () => {
        reset();
        setProductLayoutSettings({
            productTitleColor: '#303030',
            productPriceColor: '#303030',
            productCardBgColor: '#FFF',
            productCardBorderColor: '#E5E5E5',
        });
        setButtonStyleSettings({
            ...buttonStyleSettings,
            buttonTextColor: '#FFFFFF',
            buttonBackgroundColor: '#000000',
            buttonBorderColor: '#E5E5E5',
        });

        setShoppingCartSettings({
            shoppingCartBgColor: '#ffffff',
            shoppingCartTextColor: '#000000',
            shoppingCartBtnBgColor: '#2563EB',
        });


    }



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
                            handleDiscard();
                        }}
                    >
                    </button>
                </SaveBar>
                <Page
                    fullWidth
                >

                    <PageTitle
                        btnDisabled={isDirty}
                        title={t("create_componet")}
                    />
                    {/* {shopData?.affiliates?.length === 0 &&
                        // <s-box paddingBlockEnd="large">
                        //     <s-banner heading="Affiliate not found" tone="warning" dismissible>
                        //         Please create a affiliate first.
                        //         <s-button
                        //             slot="secondary-actions"
                        //             variant="secondary"
                        //             href="/app/affiliate/new"
                        //         >
                        //             Create affiliate
                        //         </s-button>
                        //     </s-banner>
                        // </s-box>
                    } */}
                    <Layout>
                        {disabledContentByPlan && shopData?.components?.length > 0 === true &&
                            <Layout.Section variant="fullWidth">
                                <Banner
                                    title={"Upgrade to create another component"}
                                    tone="warning"
                                >
                                    <BlockStack gap={'300'} inlineAlign="start">
                                        <Text>The Free plan includes 1 component. Upgrade to add more.</Text>
                                        <Button fullWidth={false} variant="primary" onClick={() => navigate(`/app/plans`)}>Upgrade Plan</Button>
                                    </BlockStack>
                                </Banner>
                            </Layout.Section>
                        }

                        {shopData?.components?.length >= shopData?.maxAllowedComponents && !disabledContentByPlan &&
                            <Layout.Section variant="fullWidth">
                                <Banner
                                    title={`Maximum Component Limit (${shopData?.maxAllowedComponents})`}
                                    tone="info"

                                >
                                    <InlineStack gap={'300'} align="start">
                                        <Text>The maximum number of components you can create is {shopData?.maxAllowedComponents}. Once this limit is reached, no additional components can be added unless you delete or modify existing ones.</Text>
                                    </InlineStack>
                                </Banner>
                            </Layout.Section>
                        }



                        <Layout.Section variant="oneThird">

                            <BlockStack>
                                <Box paddingBlockEnd={'400'} >
                                    <Box background="bg-fill" borderRadius="200">
                                        <Box minHeight="50px">
                                            <div className="collapsibleButtonDiv">
                                                <Button onClick={() => {
                                                    setToogleOpen({
                                                        ...toogleOpen,
                                                        titleAndDescToggleOpen: !toogleOpen.titleAndDescToggleOpen,
                                                    });
                                                }}
                                                    textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={toogleOpen.titleAndDescToggleOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("titleAndDesc")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={toogleOpen.titleAndDescToggleOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box paddingBlockEnd={'300'} paddingInline={'300'}>
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
                                                <Button onClick={() => {
                                                    setToogleOpen({
                                                        ...toogleOpen,
                                                        cartBehaviorOpen: !toogleOpen.cartBehaviorOpen,
                                                    });
                                                }}
                                                    textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={toogleOpen.cartBehaviorOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("cart_behavior")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={toogleOpen.cartBehaviorOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box paddingInline={'300'} paddingBlockEnd={'300'}>
                                                <BlockStack gap={'100'}>
                                                    {/* <Text variant="bodyMd" fontWeight="regular">{t("cart_behavior")}</Text> */}
                                                    <Controller
                                                        name="componentSettings.cartBehavior"
                                                        control={control}
                                                        defaultValue="active"
                                                        render={({ field }) => (
                                                            <BlockStack gap={'200'}>
                                                                <RadioButton
                                                                    name="componentSettings.cartBehavior"
                                                                    // label={t("checkout")}
                                                                    label="Buy Now (Checkout)"
                                                                    checked={field.value === CART_BEHAVIOR.checkout}
                                                                    onChange={() => field.onChange(CART_BEHAVIOR.checkout)}

                                                                />
                                                                <RadioButton
                                                                    name="componentSettings.cartBehavior"
                                                                    label={t("open_to_cart")}
                                                                    checked={field.value === CART_BEHAVIOR.cart}
                                                                    onChange={() => field.onChange(CART_BEHAVIOR.cart)}

                                                                />
                                                            </BlockStack>
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
                                                <Button onClick={() => {
                                                    setToogleOpen({
                                                        ...toogleOpen,
                                                        appliesToOpen: !toogleOpen.appliesToOpen,
                                                    });
                                                }}
                                                    textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={toogleOpen.appliesToOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("applies_to")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={toogleOpen.appliesToOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box paddingBlockEnd={'300'} paddingInline={'300'}>
                                                <BlockStack gap={'100'}>
                                                    <Controller
                                                        name="appliesTo"
                                                        control={control}
                                                        defaultValue={APPLIES_TO.byproduct}
                                                        render={({ field }) => (
                                                            <>
                                                                <RadioButton
                                                                    name="appliesTo"
                                                                    label={t("applies_to_collection")}
                                                                    checked={field.value === 'collection'}
                                                                    onChange={() => field.onChange(APPLIES_TO.bycollection)}
                                                                />
                                                                <RadioButton
                                                                    name="appliesTo"
                                                                    label={t("applies_to_product")}
                                                                    checked={field.value === 'product'}
                                                                    onChange={() => field.onChange(APPLIES_TO.byproduct)}
                                                                />
                                                            </>
                                                        )}
                                                    />


                                                </BlockStack>
                                            </Box>

                                            {watchedValues.appliesTo === APPLIES_TO.bycollection &&
                                                <Box>
                                                    <Box padding={'300'}>
                                                        <InlineStack blockAlign="center" align="start" gap={'300'}>
                                                            <Controller
                                                                name="addToCartType.products"
                                                                control={control}
                                                                rules={{
                                                                    validate: (value) => {
                                                                        //console.log('v:', value);
                                                                        return value?.length !== 0 ? true : t("collection_required_msg");
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

                                                            <Box width="76%">
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

                                                    <Box paddingBlockStart={'400'} paddingBlockEnd={'0'} paddingInline={'300'}>
                                                        <BlockStack gap={'300'}>
                                                            {selectedCollection?.length > 0 && selectedCollection?.map((item) => {
                                                                return <InlineStack key={item.id} blockAlign="center" align="space-between">
                                                                    <InlineStack blockAlign="center" gap={'200'}>
                                                                        <Thumbnail
                                                                            source={item?.image ? item?.image : '/images/noImage.png'}
                                                                            alt={item?.handle + 'kkk'}
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
                                                </Box>
                                            }
                                            {watchedValues.appliesTo === APPLIES_TO.byproduct &&
                                                <Box paddingBlockStart={'100'} paddingInline={'300'} paddingBlockEnd={'300'}>
                                                    <Controller
                                                        name="addToCartType.type"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Select
                                                                label={watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.cart ? t("add_to_cart_type") : 'Checkout type'}
                                                                options={[
                                                                    { label: watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.cart ? t("individual_add_to_cart") : 'Individual Checkout', value: ADD_TO_CART_TYPE.individual },
                                                                    { label: watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.cart ? t("bulk_add_to_cart") : 'Bulk checkout', value: ADD_TO_CART_TYPE.bulk, disabled: disabledContentByPlan }]}
                                                                selected={field.value}
                                                                onChange={field.onChange}
                                                                value={field.value}
                                                            />
                                                        )}
                                                    />
                                                </Box>

                                            }
                                            {watchedValues.appliesTo === APPLIES_TO.byproduct && watchedValues.addToCartType.type === ADD_TO_CART_TYPE.individual &&
                                                <Box>
                                                    <Box padding={'300'}>
                                                        <InlineStack blockAlign="center" align="start" gap={'200'}>
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

                                                            <Box width="76%">
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

                                                    {/* <Box paddingBlock={'400'} paddingInline={'300'}>
                                                        <BlockStack gap={'300'}>
                                                            {selectedProductsInd?.length > 0 && selectedProductsInd?.map((product) => {
                                                                return <InlineStack key={product.id} blockAlign="center" align="space-between">
                                                                    <InlineStack blockAlign="center" gap={'200'}>
                                                                        <Thumbnail
                                                                            source={product?.image ? product?.image : '/images/noImage.png'}
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
                                                    </Box> */}

                                                    <DraggableProductInd
                                                        handleDeleteProductInd={handleDeleteProductInd}
                                                        setSelectedProductsInd={setSelectedProductsInd}
                                                        selectedProductsInd={selectedProductsInd}
                                                    />

                                                </Box>

                                            }
                                            {watchedValues.appliesTo === APPLIES_TO.byproduct && watchedValues.addToCartType.type === ADD_TO_CART_TYPE.bulk &&
                                                <Box>
                                                    <Box padding={'300'}>
                                                        <InlineStack blockAlign="center" align="start" gap={'300'}>
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

                                                            <Box width="76%">
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

                                                    {selectedProductsBulk?.length > 0 &&
                                                        <Box paddingInline={'300'} paddingBlockStart={'200'}>
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
                                                        </Box>
                                                    }

                                                    <Box paddingBlock={'400'} paddingInline={'300'}>


                                                        <DraggableProductBulk
                                                            handleChangeQuantityDefault={handleChangeQuantityDefault}
                                                            handleDeleteProductBulk={handleDeleteProductBulk}
                                                            selectedProductsBulk={selectedProductsBulk}
                                                            setSelectedProductsBulk={setSelectedProductsBulk}
                                                            watchedValues={watchedValues}

                                                        />



                                                        <Box paddingBlockStart={'200'}>
                                                            <Box background="bg-surface-caution" borderRadius="200" padding={'200'}>
                                                                <Text variant="bodySm">{t("product_max_limit_msg")}</Text>
                                                            </Box>
                                                        </Box>

                                                    </Box>
                                                </Box>
                                            }
                                        </Collapsible>
                                    </Box>
                                </Box>

                                <Box paddingBlockEnd={'400'}>
                                    <Box background="bg-fill" borderRadius="200">
                                        <Box minHeight="50px">
                                            <div className="collapsibleButtonDiv">
                                                <Button onClick={() => {
                                                    setToogleOpen({
                                                        ...toogleOpen,
                                                        layoutOpen: !toogleOpen.layoutOpen,
                                                    });
                                                }}
                                                    textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={toogleOpen.layoutOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("layout_preview")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={toogleOpen.layoutOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box paddingBlockEnd={'300'} paddingInline={'300'}>
                                                <BlockStack gap={'100'}>
                                                    <Controller
                                                        name="layout"
                                                        control={control}
                                                        defaultValue={LAYOUT.grid}
                                                        render={({ field }) => (
                                                            <>
                                                                <RadioButton
                                                                    name="layout"
                                                                    label={t("list")}
                                                                    checked={field.value === LAYOUT.list}
                                                                    onChange={() => field.onChange(LAYOUT.list)}

                                                                />
                                                                <RadioButton
                                                                    name="layout"
                                                                    label={t("grid")}
                                                                    checked={field.value === LAYOUT.grid}
                                                                    onChange={() => field.onChange(LAYOUT.grid)}

                                                                />
                                                                <InlineStack align="start" blockAlign="center" gap={'150'}>
                                                                    <RadioButton
                                                                        name="layout"
                                                                        label={t("grid_slider")}
                                                                        checked={field.value === LAYOUT.grid_slider}
                                                                        onChange={() => field.onChange(LAYOUT.grid_slider)}
                                                                        disabled={disabledContentByPlan}
                                                                    />
                                                                    {disabledContentByPlan &&
                                                                        <UpgradeTooltip />
                                                                    }
                                                                </InlineStack>
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
                                                <Button onClick={() => {
                                                    setToogleOpen({
                                                        ...toogleOpen,
                                                        statusOpen: !toogleOpen.statusOpen,
                                                    });
                                                }}
                                                    textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={toogleOpen.statusOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("status")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={toogleOpen.statusOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box paddingBlockEnd={'300'} paddingInline={'300'}>
                                                <BlockStack gap={'100'}>
                                                    <Controller
                                                        name="status"
                                                        control={control}
                                                        defaultValue={STATUS.activate}
                                                        render={({ field }) => (
                                                            <>
                                                                <RadioButton
                                                                    name="status"
                                                                    label={t("activate")}
                                                                    checked={field.value === STATUS.activate}
                                                                    onChange={() => field.onChange(STATUS.activate)}

                                                                />
                                                                <RadioButton
                                                                    name="status"
                                                                    label={t("deactivate")}
                                                                    checked={field.value === STATUS.deactivate}
                                                                    onChange={() => field.onChange(STATUS.deactivate)}

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
                                                <Button onClick={() => {
                                                    setToogleOpen({
                                                        ...toogleOpen,
                                                        buttonStyleOpen: !toogleOpen.buttonStyleOpen,
                                                    });
                                                }}
                                                    textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={toogleOpen.buttonStyleOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("button_style")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={toogleOpen.buttonStyleOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box paddingBlockEnd={'300'} paddingInline={'300'}>
                                                <BlockStack gap={'300'}>
                                                    <BlockStack gap={'300'}>
                                                        {watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.cart &&
                                                            <Controller
                                                                name="buttonStyleSettings.addToCartBtnTxt"
                                                                control={control}
                                                                render={({ field, fieldState }) => (
                                                                    <TextField
                                                                        type="text"
                                                                        label={t("add_to_cart_label")}
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
                                                                render={({ field, fieldState }) => (
                                                                    <TextField
                                                                        type="text"
                                                                        label={t("checkout_label")}
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
                                                                render={({ field, fieldState }) => (
                                                                    <TextField
                                                                        type="text"
                                                                        label={t("view_product_label")}
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
                                                    </BlockStack>
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

                                <Box paddingBlockEnd={'400'} className={watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.checkout ? 'Polaris-Box btncollapsibleHidden' : 'Polaris-Box'} aria-disabled={watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.checkout}
                                    aria-hidden={watchedValues.componentSettings.cartBehavior === CART_BEHAVIOR.checkout}
                                >
                                    <Box background="bg-fill" borderRadius="200">
                                        <Box minHeight="50px">
                                            <div className="collapsibleButtonDiv">
                                                <Button onClick={() => {
                                                    setToogleOpen({
                                                        ...toogleOpen,
                                                        shoppingCartOpen: !toogleOpen.shoppingCartOpen,
                                                    });
                                                }}

                                                    textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={toogleOpen.shoppingCartOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("shopping_cart")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={toogleOpen.shoppingCartOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box paddingBlockEnd={'300'} paddingInline={'300'}>

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

                                                    <Controller
                                                        name="shoppingCartSettings.shoppingCartBtnTxt"
                                                        control={control}
                                                        rules={{
                                                            required: false,
                                                            maxLength: {
                                                                value: 100,
                                                                message: "Checkout button text should be less than 100 characters"
                                                            }
                                                        }}
                                                        render={({ field, fieldState }) => (
                                                            <TextField
                                                                type="text"
                                                                label={"Checkout button text"}
                                                                name="shoppingCartSettings.shoppingCartBtnTxt"
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


                                                    <InlineStack gap={'300'} blockAlign="center" align="start">
                                                        <Box width={disabledContentByPlan ? 'max-content' : '100%'}>
                                                            <Controller
                                                                name="shoppingCartSettings.showOrderNote"
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Checkbox
                                                                        label="Show order note field"
                                                                        checked={field.value === BoleanOptions.yes ? true : false}
                                                                        onChange={(newValue) => {
                                                                            field.onChange(newValue ? BoleanOptions.yes : BoleanOptions.no);
                                                                        }}
                                                                        disabled={disabledContentByPlan}
                                                                    />
                                                                )}
                                                            />
                                                            {watchedValues.shoppingCartSettings.showOrderNote === BoleanOptions.yes &&
                                                                <Box paddingBlockStart={'200'}>

                                                                    <BlockStack gap={'300'}>

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
                                                                                <TextField
                                                                                    type="text"
                                                                                    label={'Order note title'}
                                                                                    name="shoppingCartSettings.orderNoteTitle"
                                                                                    value={field.value}
                                                                                    onChange={field.onChange}
                                                                                    error={fieldState.error?.message || actionData?.errors?.shoppingCartSettings?.orderNoteTitle}
                                                                                    autoComplete="off"
                                                                                    maxLength={100}
                                                                                    showCharacterCount
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
                                                                                <TextField
                                                                                    type="text"
                                                                                    label={'Order note placeholder'}
                                                                                    name="shoppingCartSettings.orderNotePlaceholder"
                                                                                    value={field.value}
                                                                                    onChange={field.onChange}
                                                                                    error={fieldState.error?.message || actionData?.errors?.shoppingCartSettings?.orderNotePlaceholder}
                                                                                    autoComplete="off"
                                                                                    maxLength={100}
                                                                                    showCharacterCount
                                                                                />
                                                                            )}
                                                                        />

                                                                    </BlockStack>

                                                                </Box>
                                                            }

                                                        </Box>

                                                        {disabledContentByPlan &&
                                                            <UpgradeTooltip />
                                                        }
                                                    </InlineStack>

                                                    <InlineStack gap={'300'} blockAlign="center" align="start">
                                                        <Box width={disabledContentByPlan ? 'max-content' : '100%'}>
                                                            <Controller
                                                                name="shoppingCartSettings.showDiscountCodeField"
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Checkbox
                                                                        label="Show order discount code field"
                                                                        checked={field.value === BoleanOptions.yes ? true : false}
                                                                        onChange={(newValue) => {
                                                                            field.onChange(newValue ? BoleanOptions.yes : BoleanOptions.no);
                                                                        }}
                                                                        disabled={disabledContentByPlan}
                                                                    />
                                                                )}
                                                            />
                                                            {watchedValues.shoppingCartSettings.showDiscountCodeField === BoleanOptions.yes &&
                                                                <Box paddingBlockStart={'200'}>

                                                                    <BlockStack gap={'300'}>

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
                                                                                <TextField
                                                                                    type="text"
                                                                                    label={'Discount code title'}
                                                                                    name="shoppingCartSettings.discountCodeTitle"
                                                                                    value={field.value}
                                                                                    onChange={field.onChange}
                                                                                    error={fieldState.error?.message || actionData?.errors?.shoppingCartSettings?.discountCodeTitle}
                                                                                    autoComplete="off"
                                                                                    maxLength={100}
                                                                                    showCharacterCount
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
                                                                                <TextField
                                                                                    type="text"
                                                                                    label={'Discount code placeholder text'}
                                                                                    name="shoppingCartSettings.discountCodePlaceholder"
                                                                                    value={field.value}
                                                                                    onChange={field.onChange}
                                                                                    error={fieldState.error?.message || actionData?.errors?.shoppingCartSettings?.discountCodePlaceholder}
                                                                                    autoComplete="off"
                                                                                    maxLength={100}
                                                                                    showCharacterCount
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
                                                                                <TextField
                                                                                    type="text"
                                                                                    label={'Apply discount button text'}
                                                                                    name="shoppingCartSettings.discountApplyBtnTxt"
                                                                                    value={field.value}
                                                                                    onChange={field.onChange}
                                                                                    error={fieldState.error?.message || actionData?.errors?.shoppingCartSettings?.discountApplyBtnTxt}
                                                                                    autoComplete="off"
                                                                                    maxLength={100}
                                                                                    showCharacterCount
                                                                                />
                                                                            )}
                                                                        />

                                                                    </BlockStack>

                                                                </Box>
                                                            }

                                                        </Box>
                                                        {disabledContentByPlan &&
                                                            <UpgradeTooltip />
                                                        }
                                                    </InlineStack>


                                                </BlockStack>
                                            </Box>
                                        </Collapsible>
                                    </Box>
                                </Box>

                                <Box paddingBlockEnd={'400'}>
                                    <Box background="bg-fill" borderRadius="200">
                                        <Box minHeight="50px">
                                            <div className="collapsibleButtonDiv">
                                                <Button onClick={() => {
                                                    setToogleOpen({
                                                        ...toogleOpen,
                                                        settingsOpen: !toogleOpen.settingsOpen,
                                                    });
                                                }}
                                                    textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={toogleOpen.settingsOpen ? 'up' : 'down'}
                                                >
                                                    <Text variant="bodyMd" fontWeight="medium">{t("settings")}</Text>
                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={toogleOpen.settingsOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box paddingBlockEnd={'300'} paddingInline={'300'}>
                                                <Tabs
                                                    selected={settingsTabSelected}
                                                    onSelect={handleSettingsTabChange}
                                                    tabs={settingsTab}
                                                    fitted
                                                >
                                                    {settingsTabSelected === 0 &&
                                                        <Box paddingInline={'300'} paddingBlock={'200'}>
                                                            <BlockStack gap={'300'}>
                                                                <Box visuallyHidden={watchedValues.appliesTo === APPLIES_TO.byproduct && watchedValues.addToCartType.type === ADD_TO_CART_TYPE.bulk}>
                                                                    <BlockStack gap={'100'}>
                                                                        {/* <Text variant="bodyMd" fontWeight="regular">{t("view_full_product")}</Text> */}
                                                                        <Text variant="bodyMd" fontWeight="regular">Enable "quick view" option</Text>
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

                                                                <Box>
                                                                    <BlockStack gap={'100'}>
                                                                        <Text variant="bodyMd" fontWeight="regular">{t("component_title_show")}</Text>
                                                                        <Controller
                                                                            name="componentSettings.showComponentTitle"
                                                                            control={control}
                                                                            defaultValue={SHOW_COMPONENT_TITLE.yes}
                                                                            render={({ field }) => (
                                                                                <InlineStack gap={'400'} blockAlign="center">
                                                                                    <RadioButton
                                                                                        name="componentSettings.showComponentTitle"
                                                                                        label={t("yes")}
                                                                                        checked={field.value === SHOW_COMPONENT_TITLE.yes}
                                                                                        onChange={() => field.onChange(SHOW_COMPONENT_TITLE.yes)}

                                                                                    />
                                                                                    <RadioButton
                                                                                        name="componentSettings.showComponentTitle"
                                                                                        label={t("no")}
                                                                                        checked={field.value === SHOW_COMPONENT_TITLE.no}
                                                                                        onChange={() => field.onChange(SHOW_COMPONENT_TITLE.no)}

                                                                                    />
                                                                                </InlineStack>
                                                                            )}
                                                                        />

                                                                    </BlockStack>
                                                                </Box>


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
                                                <Button onClick={() => {
                                                    setToogleOpen({
                                                        ...toogleOpen,
                                                        customCssOpen: !toogleOpen.customCssOpen,
                                                    });
                                                }}
                                                    textAlign="left"
                                                    variant="monochromePlain"
                                                    size="large"
                                                    fullWidth
                                                    disclosure={toogleOpen.customCssOpen ? 'up' : 'down'}

                                                >
                                                    {disabledContentByPlan ?
                                                        <InlineStack blockAlign="center" gap={"150"}>
                                                            <Text variant="bodyMd" fontWeight="medium">
                                                                {t("custom_css")}
                                                            </Text>
                                                            <UpgradeTooltip />
                                                        </InlineStack>
                                                        :
                                                        <Text variant="bodyMd" fontWeight="medium"> {t("custom_css")}</Text>
                                                    }

                                                </Button>
                                            </div>
                                        </Box>

                                        <Collapsible
                                            open={toogleOpen.customCssOpen}
                                            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                                            expandOnPrint
                                        >
                                            <Box paddingBlockEnd={'300'} paddingInline={'300'} className={disabledContentByPlan ? 'Polaris-Box btncollapsibleHidden' : 'Polaris-Box'} aria-disabled={disabledContentByPlan}>
                                                <BlockStack gap={'100'}>
                                                    <Controller
                                                        name="componentSettings.customCss"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <TextField
                                                                name="componentSettings.customCss"
                                                                label={t("custom_css_label")}
                                                                labelHidden
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                type="text"
                                                                placeholder={t("custom_css_placeholder")}
                                                                multiline={8}
                                                            />
                                                        )}
                                                    />
                                                </BlockStack>
                                            </Box>
                                        </Collapsible>
                                    </Box>
                                </Box>



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
                                                                    placeholder={t("enter_tracking_code")}
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
                                                                <s-select label="Assign affiliate" placeholder="Choose a affiliate"
                                                                    onChange={(event) => field.onChange(event.currentTarget.value)}
                                                                    value={field.value}
                                                                    error={fieldState?.error?.message}
                                                                //required
                                                                >
                                                                    <s-option defaultSelected={watchedValues.affiliateId === null} value={null}>{"Select a affiliate"}</s-option>
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


                            </BlockStack>

                            {disabledContentByPlan && shopData?.components?.length > 0 ?
                                <InlineStack align="end" blockAlign="center" gap={'150'}>
                                    <UpgradeTooltip />

                                    <InlineStack align="end">
                                        <Button loading={navigation.state === 'submitting'} disabled={true} size="large" variant="primary">
                                            Save Component
                                        </Button>
                                    </InlineStack>
                                </InlineStack>

                                : shopData?.components?.length >= shopData?.maxAllowedComponents ?
                                    <InlineStack align="end" blockAlign="center" gap={'150'}>
                                        {/* <UpgradeTooltip /> */}

                                        <InlineStack align="end">
                                            <Button loading={navigation.state === 'submitting'} disabled={true} size="large" variant="primary">
                                                Save Component
                                            </Button>
                                        </InlineStack>
                                    </InlineStack>
                                    :
                                    <Box paddingBlockEnd={'400'}>
                                        <InlineStack align="end">
                                            <Button loading={navigation.state === 'submitting'} disabled={!isDirty} size="large" variant="primary" submit>
                                                Save Component
                                            </Button>
                                        </InlineStack>
                                    </Box>
                            }

                        </Layout.Section>

                        <div className="Polaris-Layout__Section previewSectionSticky">
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
                                            <Button variant="primary" disabled onClick={handleCopyHtmlCode}>Copy code</Button>
                                        </Box>

                                    </InlineStack>
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
                                    <Box paddingBlock={'200'} paddingInlineEnd={'400'}>
                                        <InlineStack align="end">
                                            <Button variant="primary" disabled onClick={handleCopyHtmlCode}>Copy code</Button>
                                        </InlineStack>
                                    </Box>
                                </Card>
                                <Box paddingBlockStart={'1200'}>
                                    <Text alignment="center" fontWeight="medium" variant="bodyLg">Done configuring? Copy code → Paste into an HTML/Custom Code block → Publish. Your component is live.</Text>
                                </Box>
                            </Box>

                        </div>
                    </Layout>
                </Page >
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