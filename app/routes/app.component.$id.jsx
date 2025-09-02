import { useActionData, useLoaderData, useLocation, useNavigate, useNavigation, useSubmit } from "@remix-run/react";
import { Banner, BlockStack, Box, Button, Card, Checkbox, Collapsible, Divider, Icon, InlineError, InlineStack, Layout, Link, Page, RadioButton, RangeSlider, Select, Tabs, Text, TextField, Thumbnail } from "@shopify/polaris"
import {
  ArrowLeftIcon,
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
import { fontSize, fontWeight } from "../utilis/staticData";
import CustomColorPicker from "../components/CustomColorPicker/CustomColorPicker";
import { emptyStateHtml } from "../webcomponentsHtml/emptyState";
import { stylesPdT1 } from "../webcomponentsHtml/stylesProduct";
import { floatingCartCountBuble } from "../webcomponentsHtml/generalHTML";
import db from "../db.server";
import HeadlessVerify from "../components/HeadlessVerify/HeadlessVerify";
import UpgradeTooltip from "../components/UpgradeTooltip/UpgradeTooltip";
import PageTitle from "../components/PageTitle/PageTitle";

export const loader = async ({ request, params }) => {
  const { id } = params;
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

  const shopData = await shopResponse.json();
  const component = await db.Component.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      shop: {
        include: {
          plan: true
        }
      }
    }
  })

  return {
    shopData: shopData.data.shop,
    component: component,
    appUrl: process.env.SHOPIFY_APP_URL || '',
  }
}
const UpdateComponent = () => {
  const { component, shopData, appUrl } = useLoaderData();
  //console.log(component);
  const actionData = useActionData();
  const navigate = useNavigate();
  const location = useLocation();
  const [toogleBtnDisabled, setToogleBtnDisabled] = useState(false);
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
  });
  const [selectedCollection, setSelectedCollection] = useState([]);
  const [selectedProductsInd, setSelectedProductsInd] = useState([]);
  const [selectedProductsBulk, setSelectedProductsBulk] = useState([]);
  const [settingsTabSelected, setSettingsTabSelected] = useState(0);
  const [productLayoutSettings, setProductLayoutSettings] = useState({
    productTitleColor: component?.productLayoutSettings?.productTitleColor || '#303030',
    productPriceColor: component?.productLayoutSettings?.productPriceColor || '#303030',
    productCardBgColor: component?.productLayoutSettings?.productCardBgColor || '#ffffff',
    productCardBorderColor: component?.productLayoutSettings?.productCardBorderColor || '#E5E5E5',
  })
  const [buttonStyleSettings, setButtonStyleSettings] = useState({
    addToCartBtnTxt: component?.buttonStyleSettings?.addToCartBtnTxt || 'Add to cart',
    checkoutBtnTxt: component?.buttonStyleSettings?.checkoutBtnTxt || 'Checkout',
    viewBtnTxt: component?.buttonStyleSettings?.viewBtnTxt || 'View product',
    buttonTextColor: component?.buttonStyleSettings?.buttonTextColor || '#FFFFFF',
    buttonBackgroundColor: component?.buttonStyleSettings?.buttonBackgroundColor || '#000000',
    buttonBorderColor: component?.buttonStyleSettings?.buttonBorderColor || '#000000',
    buttonBorderRadius: component?.buttonStyleSettings?.buttonBorderRadius || '8',
    buttonTBPadding: component?.buttonStyleSettings?.buttonTBPadding || '16',
    buttonLRPadding: component?.buttonStyleSettings?.buttonLRPadding || '10',

  });
  const [shoppingCartSettings, setShoppingCartSettings] = useState({
    shoppingCartBgColor: component?.shoppingCartSettings?.shoppingCartBgColor || '#FFFFFF',
    shoppingCartTextColor: component?.shoppingCartSettings?.shoppingCartTextColor || '#000000',
    shoppingCartBtnBgColor: component?.shoppingCartSettings?.shoppingCartBtnBgColor || '#000000',
  });
  const [selectedViewMDF, setSelectedViewMDF] = useState({
    id: 2,
    view: 'desktop'
  });
  const [embedPHtmlCode, setEmbedPHtmlCode] = useState('');
  const [disabledContentByPlan, setDisabledContentByPlan] = useState(false);
  const [delayedSrcDoc, setDelayedSrcDoc] = useState("");
  const [checkMaxSelectedVariants, setCheckMaxSelectedVariants] = useState(false);
  const params = new URLSearchParams(location.search);
  const [showNewCreatedBanner, setShowNewCreatedBanner] = useState(params.get("new_created") === "true");
  const navigation = useNavigation();
  const shopify = useAppBridge();

  const submit = useSubmit();
  const { t } = useTranslation();


  const { register, setError, getValues, handleSubmit, reset, formState: { errors, isDirty }, control, watch, setValue } = useForm({
    defaultValues: {
      title: component?.title || '',
      description: component?.description || '',
      appliesTo: component?.appliesTo || 'product',
      addToCartType: {
        type: component?.addToCartType?.type || 'individual',
        products: component?.addToCartType?.products || [],
      },
      enableQtyField: component?.enableQtyField || false,
      layout: component?.layout || 'grid',
      status: component?.status || 'activate',
      componentSettings: {
        fullView: component?.componentSettings?.fullView || false,
        cartBehavior: component?.componentSettings?.cartBehavior || 'cart',
        customCss: component?.componentSettings?.customCss || '',
        showComponentTitle: component?.componentSettings?.showComponentTitle || 'yes'
      },
      shoppingCartSettings: {
        heading: component?.shoppingCartSettings?.heading || 'Shopping cart',
        emptyCartText: component?.shoppingCartSettings?.emptyCartText || 'Your cart is empty',
        additionalInfo: component?.shoppingCartSettings?.additionalInfo || 'Additional information',
        shoppingCartBgColor: component?.shoppingCartSettings?.shoppingCartBgColor || '#ffffff',
        shoppingCartTextColor: component?.shoppingCartSettings?.shoppingCartTextColor || '#000000',
        shoppingCartBtnBgColor: component?.shoppingCartSettings?.shoppingCartBtnBgColor || '#2563EB',
      },
      productLayoutSettings: {
        productTitleWeight: component?.productLayoutSettings?.productTitleWeight || '600',
        productTitleSize: component?.productLayoutSettings?.productTitleSize || '16px',
        productPriceWeight: component?.productLayoutSettings?.productPriceWeight || '600',
        productPriceSize: component?.productLayoutSettings?.productPriceSize || '14px',
        productTitleColor: component?.productLayoutSettings.productTitleColor || '#000000',
        productPriceColor: component?.productLayoutSettings.productPriceColor || '#000000',
        productCardBgColor: component?.productLayoutSettings.productCardBgColor || '#ffffff',
        productCardBorderColor: component?.productLayoutSettings.productCardBorderColor || '#e5e5e5',
      },
      buttonStyleSettings: {
        addToCartBtnTxt: component?.buttonStyleSettings?.addToCartBtnTxt || 'Add to cart',
        checkoutBtnTxt: component?.buttonStyleSettings?.checkoutBtnTxt || 'Checkout',
        viewBtnTxt: component?.buttonStyleSettings?.viewBtnTxt || 'View product',
        buttonFontWeight: component?.buttonStyleSettings?.buttonFontWeight || '600',
        buttonFontSize: component?.buttonStyleSettings?.buttonFontSize || '14px',
        buttonTextColor: component?.buttonStyleSettings.buttonTextColor || '#FFFFFF',
        buttonBackgroundColor: component?.buttonStyleSettings.buttonBackgroundColor || '#303030',
        buttonBorderColor: component?.buttonStyleSettings.buttonBorderColor || '#e5e5e5',
        buttonBorderRadius: component?.buttonStyleSettings.buttonBorderRadius || '8',
        buttonTBPadding: component?.buttonStyleSettings.buttonTBPadding || '8',
        buttonLRPadding: component?.buttonStyleSettings.buttonLRPadding || '16',
      },
      tracking: component.tracking,
      customerTracking: component.customerTracking,
      shopId: component.shopId,
      compHtml: ''
    }
  });
  const watchedValues = watch();
  //console.log('component:', component);

  useEffect(() => {
    setDisabledContentByPlan(component?.shop?.plan?.planName === 'Free' ? true : false)
  }, [component]);

  useEffect(() => {
    if (actionData?.success) {
      reset(getValues());
      shopify.toast.show('Updated component SuccessFully', {
        duration: 1000,
      });
    }
  }, [actionData]);

  useEffect(() => {
    if (component?.appliesTo === 'product') {
      if (component?.addToCartType?.type === 'individual') {
        setSelectedProductsInd(component?.addToCartType?.products);
      } else if (component?.addToCartType?.type === 'bulk') {
        setSelectedProductsBulk(component?.addToCartType?.products);
      }
    } else if (component?.appliesTo === 'collection') {
      setSelectedCollection(component?.addToCartType?.products);
    }
  }, [component]);

  //console.log('selectedCollection', selectedCollection);

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

  }, [selectedProductsInd, selectedCollection, watchedValues.appliesTo, selectedProductsBulk, watchedValues.addToCartType.type]);

  const formHandleSubmit = (data) => {
    if (data.componentSettings.cartBehavior === "cart" && !component?.shop?.headlessAccessToken) {
      setError("componentSettings.cartBehavior", {
        type: "manual",
        message: t("headless_token_required_msg"),
      });
      shopify.toast.show(t("headless_token_required_msg"), { duration: 2000 });
      return;
    }
    const updatedData = { ...data, addToCartType: JSON.stringify(data.addToCartType), buttonStyleSettings: JSON.stringify(data.buttonStyleSettings), productLayoutSettings: JSON.stringify(data.productLayoutSettings), shoppingCartSettings: JSON.stringify(data.shoppingCartSettings), componentSettings: JSON.stringify(data.componentSettings), compHtml: embedPHtmlCode };
    console.log(updatedData);
    submit(updatedData, { method: 'patch' });
    setShowNewCreatedBanner(false);
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
      //console.log('selected', selected);
      setSelectedProductsBulk(limitTotalVariants(selected, 10));
    }

  }

  const handleChooseCollection = async (query) => {
    const selected = await shopify.resourcePicker({
      type: 'collection',
      multiple: false,
      selectionIds: selectedCollection.length > 0 ? selectedCollection?.map(item => {
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
        const selectedCollection = selected?.map(item => {
          return { id: item.id, title: item.title, handle: item.handle, image: item?.image?.originalSrc ? item.image.originalSrc : null };
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
      return prevSelectedProducts?.map((product) => {
        const updatedVariants = product?.variants?.map((variant) => {
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
      shopify.saveBar.show('spc-save-bar');
    } else {
      shopify.saveBar.hide('spc-save-bar');
    }
  }, [isDirty]);

  useEffect(() => {
    if (watchedValues.appliesTo === 'product' && watchedValues.addToCartType.type === 'bulk') {
      setValue('componentSettings.fullView', false, { shouldValidate: true });
    }
  }, [setValue, watchedValues.appliesTo, watchedValues.addToCartType.type]);


  const handleDiscard = () => {
    reset();
    watchedValues.appliesTo === 'collection' ? setSelectedCollection(component?.addToCartType?.products) : watchedValues.addToCartType?.type === 'individual' ? setSelectedProductsInd(component?.addToCartType?.products) : setSelectedProductsBulk(component?.addToCartType?.products);

    setProductLayoutSettings({
      productTitleColor: component?.productLayoutSettings?.productTitleColor || '#303030',
      productPriceColor: component?.productLayoutSettings?.productPriceColor || '#303030',
      productCardBgColor: component?.productLayoutSettings?.productCardBgColor || '#ffffff',
      productCardBorderColor: component?.productLayoutSettings?.productCardBorderColor || '#E5E5E5',
    });
    setButtonStyleSettings({
      ...buttonStyleSettings,
      buttonTextColor: component?.buttonStyleSettings?.buttonTextColor || '#FFFFFF',
      buttonBackgroundColor: component?.buttonStyleSettings?.buttonBackgroundColor || '#000000',
      buttonBorderColor: component?.buttonStyleSettings?.buttonBorderColor || '#000000',
    });

    setShoppingCartSettings({
      shoppingCartBgColor: component?.shoppingCartSettings?.shoppingCartBgColor || '#FFFFFF',
      shoppingCartTextColor: component?.shoppingCartSettings?.shoppingCartTextColor || '#000000',
      shoppingCartBtnBgColor: component?.shoppingCartSettings?.shoppingCartBtnBgColor || '#000000',
    });
  }

  useEffect(() => {
    if (watchedValues.componentSettings.cartBehavior === "cart" && !component?.shop?.headlessAccessToken) {
      setToogleBtnDisabled(true);
    } else {
      setToogleBtnDisabled(false);
    }
  }, [watchedValues, component]);

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
                display: ${watchedValues.componentSettings.showComponentTitle === 'no' ? 'none' : 'block'}             
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

  const pdAddToCartHtml = watchedValues.appliesTo === 'product' && watchedValues.addToCartType.type === 'bulk' ? `
             <button
                class="product-card__add-button product-card__add-to-cart-button spcProductCardBtn_${watchedValues.tracking}"
                onclick="addToCartNcheckoutBulkProduct(event,'${component.shop.scAccessToken}','${shopData.myshopifyDomain}','${watchedValues.tracking}','${watchedValues.customerTracking}','${watchedValues.componentSettings.cartBehavior}',${watchedValues.enableQtyField})"
                shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale"
              >
                ${watchedValues.buttonStyleSettings.addToCartBtnTxt}
              </button>
    ` :
    `
             <button
                class="product-card__add-button product-card__add-to-cart-button spcProductCardBtn_${watchedValues.tracking}"
                onclick="addToCartNcheckoutIndProduct(event,'${component.shop.scAccessToken}','${shopData.myshopifyDomain}','${watchedValues.tracking}','${watchedValues.customerTracking}','${watchedValues.componentSettings.cartBehavior}')"
                shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale"
              >
                ${watchedValues.buttonStyleSettings.addToCartBtnTxt}
              </button>
    ` ;

  const pdCheckoutBtnHtml = watchedValues.appliesTo === 'product' && watchedValues.addToCartType.type === 'bulk' ? `
             <button
                class="product-card__add-button product-card__checkout-button spcProductCardBtn_${watchedValues.tracking}"
                 onclick="addToCartNcheckoutBulkProduct(event,'${component.shop.scAccessToken}','${shopData.myshopifyDomain}','${watchedValues.tracking}','${watchedValues.customerTracking}','${watchedValues.componentSettings.cartBehavior}',${watchedValues.enableQtyField})"
                shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale"
              >
                 ${watchedValues.buttonStyleSettings.checkoutBtnTxt}
              </button>
    ` :
    `
             <button
                class="product-card__add-button product-card__checkout-button spcProductCardBtn_${watchedValues.tracking}"
                onclick="addToCartNcheckoutIndProduct(event,'${component.shop.scAccessToken}','${shopData.myshopifyDomain}','${watchedValues.tracking}','${watchedValues.customerTracking}','${watchedValues.componentSettings.cartBehavior}')"
                shopify-attr--disabled="!product.selectedOrFirstAvailableVariant.availableForSale"
              >
                ${watchedValues.buttonStyleSettings.checkoutBtnTxt}
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
                class="product-card__add-button product-card__view-button spcProductCardBtn_${watchedValues.tracking}"
                onclick="getElementById('shopcomponent-product-modal').showModal(); getElementById('shopcomponent-product-modal-context').update(event);"
              >
                ${watchedValues.buttonStyleSettings.viewBtnTxt}
              </button>

              ${productFullViewModalHtml}
    `;




  const productLayoutIndCardHtml = selectedProductsInd?.length > 0 ? selectedProductsInd?.map((product) => (
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
        <shopify-store public-access-token="${component?.shop?.headlessAccessToken ? component?.shop?.headlessAccessToken : component?.shop?.scAccessToken}" store-domain="${shopData.myshopifyDomain}" country="US" language="en"></shopify-store>


        <div class="shopcomponent_pd_container">
            ${watchedValues.componentSettings.cartBehavior === 'cart' ? floatingCartCountBuble : ''}
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
         <style>
            ${watchedValues.componentSettings.customCss}
        </style>

    `;
  const productLayoutBulkCardHtml = selectedProductsBulk?.length > 0 ? selectedProductsBulk?.map((product) => (
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
                    ${product?.variants?.map((variant) => (
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
        <shopify-store public-access-token="${component?.shop?.headlessAccessToken ? component?.shop?.headlessAccessToken : component?.shop?.scAccessToken}" store-domain="${shopData.myshopifyDomain}" country="US" language="en"></shopify-store>


        <div class="shopcomponent_pd_container">
            ${watchedValues.componentSettings.cartBehavior === 'cart' ? floatingCartCountBuble : ''}
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
           
    
       <shopify-list-context type="product" query="collection.products" first="${component?.shop?.plan?.planName === 'Free' ? 3 : 50}">
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
      ? (watchedValues.componentSettings.cartBehavior === 'cart'
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
        <shopify-store public-access-token="${component?.shop?.headlessAccessToken ? component?.shop?.headlessAccessToken : component?.shop?.scAccessToken}" store-domain="${shopData.myshopifyDomain}" country="US" language="en"></shopify-store>


        <div class="shopcomponent_pd_container">
            ${watchedValues.componentSettings.cartBehavior === 'cart' ? floatingCartCountBuble : ''}
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
        </div>

        
        ${stylesPdT1}
        ${globalStyles}
        <style>
            ${watchedValues.componentSettings.customCss}
        </style>

    `;

  useEffect(() => {
    if (watchedValues.appliesTo === 'collection') {
      setEmbedPHtmlCode(collectionLayoutIndHtml)
    } else {
      if (watchedValues.appliesTo === 'product' && watchedValues.addToCartType.type === 'individual') {
        setEmbedPHtmlCode(productLayoutIndHtml)
      } else if (watchedValues.appliesTo === 'product' && watchedValues.addToCartType.type === 'bulk') {
        setEmbedPHtmlCode(productLayoutBulkHtml)
      }
    }

  }, [productLayoutBulkHtml, productLayoutIndHtml, watchedValues.addToCartType.type, watchedValues.appliesTo, collectionLayoutIndHtml]);



  const scriptsAll = `
         <script type="module" src="https://cdn.shopify.com/storefront/web-components.js"></script>
         <script src="/shopcomponent/js/shopcomponent.js"></script>
    `;

  const copyCode = `
    <!-------------- ShopComponent [https://shopcomponent.com/] app code start ---------->

  <div id="shopcomponent-${watchedValues.tracking}"></div>
  <script type="module">
    window.addEventListener('DOMContentLoaded', async () => {
      const isExistWebcomJs = document.querySelector('script[src="https://cdn.shopify.com/storefront/web-components.js"]');
      const isExistWebcomJs2 = document.querySelector('script[src="${appUrl}/api/webcompjs"]');

      if (!isExistWebcomJs2) {
        const scriptTag2 = document.createElement('script');
        scriptTag2.type = 'text/javascript';
        scriptTag2.id = 'shopcomponents-js';
        scriptTag2.src = '${appUrl}/api/webcompjs';
        document.head.appendChild(scriptTag2);
      }
      if (!isExistWebcomJs) {
        const scriptTag = document.createElement('script');
        scriptTag.type = 'module';
        scriptTag.id = 'shopcomponents-webcomJs';
        scriptTag.src = 'https://cdn.shopify.com/storefront/web-components.js';
        document.body.appendChild(scriptTag);
      }
      const holder = document.getElementById('shopcomponent-${watchedValues.tracking}');
      if (holder) {
        const response = await fetch('${appUrl}/api/component?id=${component?.id}');
        const data = await response.json();
        if (data?.data?.compHtml) {
          holder.innerHTML = data.data.compHtml;
          localStorage.setItem('shopcomponentData', JSON.stringify({ plan: data?.data?.shop?.plan?.planName, shop: data?.data?.shop?.shopifyDomain }));
        }
      }
     
    })
  </script>
  <!-------------- ShopComponent app code end -------------->
    `;

  const handleCopyHtmlCode = () => {
    navigator.clipboard.writeText(copyCode);
    shopify.toast.show('Copied SuccessFully', {
      duration: 1000,
    });
  }

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
      setDelayedSrcDoc( embedPHtmlCode);
    }, 600);
    return () => clearTimeout(timer);
  }, [ embedPHtmlCode]);

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
        //title={t("updated_componet")+" " +component?.title}
        //backAction={{ onAction: () => { navigate('/app'); reset(getValues()); } }}
        >

          {/* <Box paddingBlockEnd={'400'}>
              <InlineStack align="start" blockAlign="center" gap={'200'}>
                <Button
                  icon={ArrowLeftIcon}
                  disabled={isDirty}
                  variant="tertiary"
                  onClick={()=>{navigate('/app'); reset(getValues());}}
                />
                  <Text variant="headingLg">{t("updated_componet")+" " +component?.title}</Text>
              </InlineStack>
          </Box> */}

          <PageTitle
            btnDisabled={isDirty}
            title={t("updated_componet") + " " + component?.title}
          />
          <Layout>
            {showNewCreatedBanner &&
              <Layout.Section variant="fullWidth">
                <Banner
                  title={t("component_created_msg")}
                  tone="success"
                  onDismiss={() => {
                    setShowNewCreatedBanner(false);
                  }}
                >

                  <InlineStack gap={'300'}>
                    <Button variant="plain" onClick={() => navigate(`/app/createcomponent`)}><Link>Create another component</Link>
                    </Button>
                    <Button variant="plain" onClick={() => navigate(`/app`)}><Link>Component list</Link>
                    </Button>
                    <Button variant="plain" disabled={isDirty || (watchedValues.componentSettings.cartBehavior === 'cart' && !component?.shop?.headlessAccessToken)} onClick={handleCopyHtmlCode}><Link>Copy code</Link>
                    </Button>

                  </InlineStack>
                </Banner>
              </Layout.Section>
            }

            <Layout.Section variant="oneThird">
              <BlockStack>
                <Box paddingBlockEnd={'400'} className={toogleBtnDisabled ? 'Polaris-Box btncollapsibleHidden' : 'Polaris-Box'} aria-disabled={toogleBtnDisabled}>
                  <Box background="bg-fill" borderRadius="200">
                    <Box minHeight="50px">
                      <div className="collapsibleButtonDiv">
                        <Button
                          onClick={() => {
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
                      <Box paddingInlineEnd={'300'} paddingInlineStart={'300'} paddingBlockEnd={'300'}>
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
                                  checked={field.value === 'checkout'}
                                  onChange={() => field.onChange('checkout')}

                                />
                                <RadioButton
                                  name="componentSettings.cartBehavior"
                                  label={t("open_to_cart")}
                                  checked={field.value === 'cart'}
                                  onChange={() => field.onChange('cart')}

                                />
                              </BlockStack>
                            )}

                          />


                        </BlockStack>
                        {watchedValues.componentSettings.cartBehavior === 'cart' && !component?.shop?.headlessAccessToken &&
                          <Box paddingBlockStart={'200'}>
                            <HeadlessVerify />
                          </Box>
                        }
                      </Box>
                    </Collapsible>
                  </Box>
                </Box>

                <Box paddingBlockEnd={'400'} className={toogleBtnDisabled ? 'Polaris-Box btncollapsibleHidden' : 'Polaris-Box'} aria-disabled={toogleBtnDisabled}>
                  <Box background="bg-fill" borderRadius="200">
                    <Box minHeight="50px">
                      <div className="collapsibleButtonDiv">
                        <Button
                          onClick={() => {
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


                        </BlockStack>
                      </Box>

                      {watchedValues.appliesTo === "collection" &&
                        <Box>
                          <Box padding={'300'}>
                            <InlineStack blockAlign="center" align="space-between">
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
                              {selectedCollection?.length > 0 && selectedCollection?.map((item) => {
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
                        </Box>
                      }
                      {watchedValues.appliesTo === "product" &&
                        <Box paddingBlockStart={'100'} paddingInline={'300'} paddingBlockEnd={'300'}>
                          <Controller
                            name="addToCartType.type"
                            control={control}
                            render={({ field }) => (
                              <Select
                                label={t("add_to_cart_type")}
                                options={[
                                  { label: watchedValues.componentSettings.cartBehavior === 'cart' ? t("individual_add_to_cart") : 'Individual Checkout', value: 'individual' },
                                  { label: watchedValues.componentSettings.cartBehavior === 'cart' ? t("bulk_add_to_cart") : 'Bulk checkout', value: 'bulk', disabled: disabledContentByPlan }]}
                                selected={field.value}
                                onChange={field.onChange}
                                value={field.value}
                              />
                            )}
                          />
                        </Box>

                      }
                      {watchedValues.appliesTo === "product" && watchedValues.addToCartType.type === "individual" &&
                        <Box>
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
                              {selectedProductsInd?.length > 0 && selectedProductsInd?.map((product) => {
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

                        </Box>

                      }
                      {watchedValues.appliesTo === "product" && watchedValues.addToCartType.type === "bulk" &&
                        <Box>
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

                              {selectedProductsBulk?.length > 0 && selectedProductsBulk?.map((product) => (
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

                                  {product?.variants?.length > 0 && product?.variants?.map((variant) => (
                                    <Box key={variant.id} paddingBlockStart={'200'} paddingBlockEnd={'200'} paddingInlineStart={'400'} >

                                      <InlineStack align="start" blockAlign="center" gap={'200'}>
                                        <Thumbnail size="small" source={variant?.image ? variant.image : 'https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png'}
                                          alt={variant.title} />

                                        <BlockStack gap={'100'}>

                                          <Box paddingInline={'100'}>
                                            <InlineStack gap={'200'} align="space-between" blockAlign="center">
                                              <Text variant="bodySm">{variant.title}</Text>

                                              <Button size="medium" variant="monochromePlain" onClick={() => { handleDeleteProductBulk(variant.id, 'variant') }} >
                                                <Icon tone="subdued" source={XIcon} />
                                              </Button>
                                            </InlineStack>
                                          </Box>
                                          {!watchedValues.enableQtyField &&
                                            <Box maxWidth="100px">
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
                                            </Box>

                                          }

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
                        </Box>
                      }
                    </Collapsible>
                  </Box>
                </Box>

                <Box paddingBlockEnd={'400'} className={toogleBtnDisabled ? 'Polaris-Box btncollapsibleHidden' : 'Polaris-Box'} aria-disabled={toogleBtnDisabled}>
                  <Box background="bg-fill" borderRadius="200">
                    <Box minHeight="50px">
                      <div className="collapsibleButtonDiv">
                        <Button
                          onClick={() => {
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
                                <InlineStack align="start" blockAlign="center" gap={'150'}>
                                  <RadioButton
                                    name="layout"
                                    label={t("grid_slider")}
                                    checked={field.value === 'gridSlider'}
                                    onChange={() => field.onChange('gridSlider')}
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

                <Box paddingBlockEnd={'400'} className={toogleBtnDisabled ? 'Polaris-Box btncollapsibleHidden' : 'Polaris-Box'} aria-disabled={toogleBtnDisabled}>
                  <Box background="bg-fill" borderRadius="200">
                    <Box minHeight="50px">
                      <div className="collapsibleButtonDiv">
                        <Button
                          onClick={() => {
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

                <Box paddingBlockEnd={'400'} className={toogleBtnDisabled ? 'Polaris-Box btncollapsibleHidden' : 'Polaris-Box'} aria-disabled={toogleBtnDisabled}>
                  <Box background="bg-fill" borderRadius="200">
                    <Box minHeight="50px">
                      <div className="collapsibleButtonDiv">
                        <Button
                          onClick={() => {
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
                      <Box padding={'300'}>
                        <BlockStack gap={'300'}>
                          <BlockStack gap={'300'}>
                            {watchedValues.componentSettings.cartBehavior === 'cart' &&
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
                            {watchedValues.componentSettings.cartBehavior === 'checkout' &&
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

                <Box paddingBlockEnd={'400'} className={toogleBtnDisabled || watchedValues.componentSettings.cartBehavior === 'checkout' ? 'Polaris-Box btncollapsibleHidden' : 'Polaris-Box'} aria-disabled={toogleBtnDisabled || watchedValues.componentSettings.cartBehavior === 'checkout'}>
                  <Box background="bg-fill" borderRadius="200">
                    <Box minHeight="50px">
                      <div className="collapsibleButtonDiv">
                        <Button
                          onClick={() => {
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

                <Box paddingBlockEnd={'400'} className={toogleBtnDisabled ? 'Polaris-Box btncollapsibleHidden' : 'Polaris-Box'} aria-disabled={toogleBtnDisabled}>
                  <Box background="bg-fill" borderRadius="200">
                    <Box minHeight="50px">
                      <div className="collapsibleButtonDiv">
                        <Button
                          onClick={() => {
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
                      <Box padding={'300'}>


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
                                      defaultValue="active"
                                      render={({ field }) => (
                                        <InlineStack gap={'400'} blockAlign="center">
                                          <RadioButton
                                            name="componentSettings.showComponentTitle"
                                            label={t("yes")}
                                            checked={field.value === 'yes'}
                                            onChange={() => field.onChange('yes')}

                                          />
                                          <RadioButton
                                            name="componentSettings.showComponentTitle"
                                            label={t("no")}
                                            checked={field.value === 'no'}
                                            onChange={() => field.onChange('no')}

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

                <Box paddingBlockEnd={'400'} className={toogleBtnDisabled ? 'Polaris-Box btncollapsibleHidden' : 'Polaris-Box'} aria-disabled={toogleBtnDisabled}>
                  <Box background="bg-fill" borderRadius="200">
                    <Box minHeight="50px">
                      <div className="collapsibleButtonDiv">
                        <Button
                          onClick={() => {
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
                      <Box padding={'300'} className={disabledContentByPlan ? 'Polaris-Box btncollapsibleHidden' : 'Polaris-Box'} aria-disabled={disabledContentByPlan}>
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

                <Box paddingBlockEnd={'400'} className={toogleBtnDisabled ? 'Polaris-Box btncollapsibleHidden' : 'Polaris-Box'} aria-disabled={toogleBtnDisabled}>
                  <Box background="bg-fill" borderRadius="200">
                    <Box minHeight="50px">
                      <div className="collapsibleButtonDiv">
                        <Button
                          onClick={() => {
                            setToogleOpen({
                              ...toogleOpen,
                              tranckingOpen: !toogleOpen.tranckingOpen,
                            });
                          }}
                          textAlign="left"
                          variant="monochromePlain"
                          size="large"
                          fullWidth
                          disclosure={toogleOpen.tranckingOpen ? 'up' : 'down'}
                        >
                          {disabledContentByPlan ?
                            <InlineStack blockAlign="center" gap={"150"}>
                              <Text variant="bodyMd" fontWeight="medium">{t("trancking")}</Text>
                              <UpgradeTooltip />
                            </InlineStack>
                            :
                            <Text variant="bodyMd" fontWeight="medium">{t("trancking")}</Text>
                          }

                        </Button>
                      </div>
                    </Box>

                    <Collapsible
                      open={toogleOpen.tranckingOpen}
                      transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                      expandOnPrint
                    >
                      <Box padding={'300'} className={disabledContentByPlan ? 'Polaris-Box btncollapsibleHidden' : 'Polaris-Box'} aria-disabled={disabledContentByPlan}>
                        <BlockStack gap={'100'}>
                          <Controller
                            name="customerTracking"
                            control={control}
                            // rules={{
                            //     required: true,

                            // }}
                            render={({ field }) => (
                              <TextField
                                name="customerTracking"
                                label={t("tracking_code")}
                                value={field.value}
                                onChange={field.onChange}
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

              <Box paddingBlockEnd={'400'} className={toogleBtnDisabled ? 'Polaris-Box btncollapsibleHidden' : 'Polaris-Box'} aria-disabled={toogleBtnDisabled}>

                <InlineStack align="end" gap={'200'}>
                  <Button variant="secondary" tone="critical" onClick={() => {
                    handleDiscard();
                  }}
                    disabled={!isDirty}>
                    Discard
                  </Button>
                  <Button variant="primary" size="large" loading={navigation.state === 'submitting'} disabled={!isDirty} submit={true}>Update</Button>

                </InlineStack>

              </Box>

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
                      <Button disabled={isDirty || (watchedValues.componentSettings.cartBehavior === 'cart' && !component?.shop?.headlessAccessToken)} variant="primary" size="large" onClick={handleCopyHtmlCode}>Copy code</Button>
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
                      <Button variant="primary" disabled={isDirty || (watchedValues.componentSettings.cartBehavior === 'cart' && !component?.shop?.headlessAccessToken)} size="large" onClick={handleCopyHtmlCode}>Copy code</Button>
                    </InlineStack>
                  </Box>
                </Card>
                <Box paddingBlockStart={'200'}>
                  <Text alignment="center" fontWeight="medium" variant="bodyLg">Done configuring? Copy code → Paste into an HTML/Custom Code block → Publish. Your component is live.</Text>
                </Box>
              </Box>

            </div>
          </Layout>
        </Page >
      </form >
  )
}

export default UpdateComponent



export const action = async ({ request, params }) => {
  const { id } = params;
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  if (request.method === 'PATCH') {
    try {
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
      const updatedData = { ...data, customerTracking: customerTracking, enableQtyField: enableQtyField, shopId: shopId };


      const createComp = await db.component.update({
        where: {
          id: Number(id),
        },
        data: updatedData,
      });

      if (createComp?.id) {
        return {
          success: true,
          createCompData: createComp,
          message: "Component updated successfully"
        };

      } else {
        return {
          success: false,
          error: "There was an error creating the component"
        };
      }
    } catch (error) {
      return {
        success: false,
        error: "There was an error creating the component"
      };
    }

  } else if (request.method === 'PUT') {
    try {
      await db.component.update({
        where: {
          id: Number(id),
        },
        data: {
          status: data.status
        },
      });
    } catch (error) {
      return {
        success: false,
        message: "There was an error updating the component status",
        error: error
      }
    }

    return {
      success: true,
      message: `Component ${data.status} successfully`,
    }
  } else if (request.method === 'DELETE') {
    try {
      await db.component.delete({
        where: {
          id: Number(id),
        },
      });
    } catch (error) {
      return {
        success: false,
        message: "There was an error deleting the component",
        error: error
      }
    }
    return {
      success: true,
      message: "Component deleted successfully"
    }
  } else if (request.method === 'POST') {
    try {
      const original = await db.component.findUnique({
        where: {
          id: Number(id),
        },
      });

      if (!original) {
        return {
          success: false,
          message: 'Original component not found',
        };
      }
      // Destructure to exclude non-writable fields
      const {
        id: _,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        ...clonableData
      } = original;

      const newComponentData = {
        ...clonableData,
        title: 'Copy ' + original.title,
        status: 'deactivate',
        customerTracking: (original.customerTracking || '') + '_DP',
        tracking: (original.tracking || '') + '_DP',
      };
      await db.component.create({
        data: newComponentData,
      });
      return {
        success: true,
        message: "Component duplicated successfully"
      };
    } catch (error) {
      return {
        success: false,
        message: "There was an error duplicating the component",
        error: error
      }
    }

  }



}