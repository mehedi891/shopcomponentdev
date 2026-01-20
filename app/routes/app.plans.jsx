import { useFetcher, useLoaderData, useNavigate, useNavigation } from "react-router";
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { authenticate } from "../shopify.server";
import crypto from "crypto";
import db from "../db.server";
import { useEffect, useState } from "react";
import { getRemainingTrialDays } from "../utilis/remainTrialDaysCount";
import { ADD_TO_CART_TYPE, BoleanOptions, DISCOUNT_TYPE, MAX_ALLOWED_COMPONENTS, PLAN_NAME, PLAN_PRICE, PLAN_STATUS, PLAN_TYPE } from "../constants/constants";
import redis from "../utilis/redis.init";
import TempPlanBannerShow from "../components/TempPlanBannerShow/TempPlanBannerShow";


export const loader = async ({ request }) => {
  const { session, admin, billing } = await authenticate.admin(request);
  const { appSubscriptions } = await billing.check();

  const shopResponse = await admin.graphql(
    `#graphql
            query shopInfo{
                shop{
                  id
                  plan{
                    partnerDevelopment
                  }
                }
        }`,

  );

  const shop = await shopResponse.json();

  //  const appId = await admin.graphql(
  //   `#graphql
  // query {
  //   appByHandle(handle: "embedupdev2") {
  //     title
  //     id
  //   }
  // }`,
  // );
  // const appIdJson = await appId.json();

  // console.log("AppId:", appIdJson?.data?.appByHandle?.id);


  const url = new URL(request.url);
  const isFirstInstall = url.searchParams.get('isFirstInstall');
  const upgrade = url.searchParams.get('upgrade');



  let shopData = {};


  shopData = await db.shop.findUnique({
    where: {
      shopifyDomain: session.shop
    },
    select: {
      id: true,
      planActivatedAt: true,
      plan: true,
      isFirstInstall: true,
      scAccessToken: true,
      coupon: true,
      trialDays: true,
      isAppliedCoupon: true,
      createdAt: true,
      affiliates: {
        where: {
          shop: {
            shopifyDomain: session.shop
          },
          isDefault: true,
        }
      }
    }
  });


  if (!shopData?.scAccessToken) {
    //console.log('creating sc token');
    const createStorefrontAccessToken = await admin.graphql(
      `#graphql
            mutation StorefrontAccessTokenCreate($input: StorefrontAccessTokenInput!) {
              storefrontAccessTokenCreate(input: $input) {
                userErrors {
                  field
                  message
                }
                shop {
                  id
                }
                storefrontAccessToken {
                  
                  accessToken

                }
              }
            }`,
      {
        variables: {
          "input": {
            "title": `sc${session.shop.replace('.myshopify.com', '')}`,
          }
        },
      },
    );

    const scToken = await createStorefrontAccessToken.json();
    shopData = await db.shop.upsert({
      where: {
        shopifyDomain: session.shop,
      },
      update: {
        shopifyDomain: session.shop,
      },
      create: {
        shopifyDomain: session.shop,
        scAccessToken: scToken.data?.storefrontAccessTokenCreate?.storefrontAccessToken?.accessToken,
        installationCount: 1,
        shopifyShopGid: shop.data.shop.id,
      },
      select: {
        id: true,
        planActivatedAt: true,
        plan: true,
        isFirstInstall: true,
        scAccessToken: true,
        coupon: true,
        trialDays: true,
        isAppliedCoupon: true,
      }
    });
  }

  // if (shopData?.affiliates.length === 0) {
  //   //console.log('if hitted......');
  //   await db.affiliate.upsert({
  //     where: {
  //       shop: {
  //         shopifyDomain: session.shop,
  //       },
  //       shopId: shopData?.id,
  //       isDefault: true,
  //       affTrackingCode: `spc_aff_${shopData?.id}`,
  //     },
  //     update: {},
  //     create: {
  //       name: 'EmbedUp Affiliate',
  //       email: 'app@efoli.com',
  //       phone: '',
  //       website: 'https://www.efoli.com',
  //       address: '',
  //       notes: '',
  //       commissionCiteria: "fixed",
  //       payoutMethods: {
  //         method: "others",
  //         value: 'app.efoli.com',
  //       },
  //       fixedCommission: {
  //         value: 0,
  //         type: "percentage",
  //       },
  //       tieredCommissionType: "",
  //       tieredCommission: [
  //         { from: 0, to: 1, rate: 0, type: 'percentage' }
  //       ],
  //       status: AFFILIATE_STATUS.active,
  //       affTrackingCode: `spc_aff_${shopData?.id}`,
  //       shopId: shopData?.id,
  //       isDefault: true,
  //     },
  //   });
  // }


  let couponData = {};
  const code = shopData.coupon || "";
  if (code && code != "") {
    // Create canonical string for signing
    const timestamp = Date.now().toString();

    const canonical = `${timestamp}:${"GET_COUPON_OFFER"}:${code}:${"EmbedUp"}:${session.shop}`;
    const appSecret = process.env.COUPON_CODE_API_SIGNATURE;
    const signature = crypto.createHmac("sha256", appSecret).update(canonical).digest("hex");

    const inputFormData = new FormData();
    inputFormData.set("target", "GET_COUPON_OFFER");
    inputFormData.set("code", code);
    inputFormData.set("app", "EmbedUp");
    inputFormData.set("shop", session.shop);

    const url = `${process.env.COUPON_CODE_API_URL}/check-coupon`;

    console.log("API URL Plans:", url);

    try {
      const couponResponse = await fetch(url, {
        method: "POST",
        headers: {
          "x-api-signature": signature,
          "x-api-timestamp": timestamp,
        },
        body: inputFormData,
      });
      if (couponResponse.ok) {
        couponData = await couponResponse.json();
      }
    } catch (error) { }
  }

  const remainTrialDays = getRemainingTrialDays(shopData?.createdAt, shopData?.trialDays);


  return {
    shopData: shopData,
    appSubscriptions: appSubscriptions?.length > 0 ? appSubscriptions[0] : {},
    shopInfo: shop?.data?.shop || {},
    paidRedirectInfo: { isFirstInstall, upgrade },
    remainTrialDays: remainTrialDays,
    node_env: process.env.NODE_ENV || '',
    couponData,
  }
}

const Plans = () => {
  const { shopData, shopInfo, appSubscriptions, couponData, node_env, remainTrialDays } = useLoaderData();
  const fetcher = useFetcher();
  //console.log('shopData:', shopData);
  const navigation = useNavigation();
  const navigate = useNavigate();
  const [planPriceAndDiscount, setPlanPriceAndDiscount] = useState({
    growth_monthly: {
      price: PLAN_PRICE.growth_monthly.price,
      discountedPrice: null,
      discountType: null,
      discountValue: null,
      discountDuration: null
    },
    growth_yearly: {
      price: PLAN_PRICE.growth_yearly.price,
      discountedPrice: PLAN_PRICE.growth_yearly.discountedPrice,
      discountType: PLAN_PRICE.growth_yearly.discountType,
      discountValue: PLAN_PRICE.growth_yearly.discountValue,
      discountDuration: PLAN_PRICE.growth_yearly.discountDuration,
    },
    pro_monthly: {
      price: PLAN_PRICE.pro_monthly.price,
      discountedPrice: null,
      discountType: null,
      discountValue: null,
      discountDuration: null
    },
    pro_yearly: {
      price: PLAN_PRICE.pro_yearly.price,
      discountedPrice: PLAN_PRICE.pro_yearly.discountedPrice,
      discountType: PLAN_PRICE.pro_yearly.discountType,
      discountValue: PLAN_PRICE.pro_yearly.discountValue,
      discountDuration: PLAN_PRICE.pro_yearly.discountDuration,
    }
  });

  const [isLoading, setIsLoading] = useState(null);
  const [isMonthlyPlanShow, setIsMonthlyPlanShow] = useState(true);
  const [showCouponApplySection, setShowCouponApplySection] = useState(false);
  const [couponCodeInpValue, setCouponCodeInpValue] = useState('');





  useEffect(() => {
    const offerType = ["discount-on-app-sub", "revenue-and-sub-discount"];
    if (couponData?.offer?.option && offerType.includes(couponData?.offer?.option)) {
      setPlanPriceAndDiscount(prevState => {
        return {
          ...prevState,
          growth_monthly: {
            ...prevState.growth_monthly,
            discountType: DISCOUNT_TYPE.percentage,
            discountValue: couponData?.offer?.value?.subDiscount,
            discountDuration: couponData?.offer?.value?.subDurationType === "recurring" ? couponData?.offer?.value?.subDiscountDuration : null,
            discountedPrice: (prevState.growth_monthly.price * (1 - (couponData?.offer?.value?.subDiscount / 100)))
          },
          growth_yearly: {
            ...prevState.growth_yearly,
            discountType: DISCOUNT_TYPE.percentage,
            discountValue: couponData?.offer?.value?.subDiscount,
            discountDuration: couponData?.offer?.value?.subDurationType === "recurring" ? couponData?.offer?.value?.subDiscountDuration : null,
            discountedPrice: (prevState.growth_yearly.price * (1 - (couponData?.offer?.value?.subDiscount / 100)))
          },
          pro_monthly: {
            ...prevState.pro_monthly,
            discountType: DISCOUNT_TYPE.percentage,
            discountValue: couponData?.offer?.value?.subDiscount,
            discountDuration: couponData?.offer?.value?.subDurationType === "recurring" ? couponData?.offer?.value?.subDiscountDuration : null,
            discountedPrice: (prevState.pro_monthly.price * (1 - (couponData?.offer?.value?.subDiscount / 100)))
          },
          pro_yearly: {
            ...prevState.pro_yearly,
            discountType: DISCOUNT_TYPE.percentage,
            discountValue: couponData?.offer?.value?.subDiscount,
            discountDuration: couponData?.offer?.value?.subDurationType === "recurring" ? couponData?.offer?.value?.subDiscountDuration : null,
            discountedPrice: (prevState.pro_yearly.price * (1 - (couponData?.offer?.value?.subDiscount / 100)))
          }
        }
      })
    }
  }, [couponData])

  const handleSubscriptionPlan = (planName, planType, planPriceAndDiscount) => {
    const data = {
      planName: planName,
      planType: planType,
      shopId: shopData?.id,
      isFirstInstall: `${shopData?.isFirstInstall}`,
      partnerDevelopment: shopInfo?.plan?.partnerDevelopment || false,
      remaingTrialDays: remainTrialDays,
      planPriceAndDiscount: JSON.stringify(planPriceAndDiscount)
    }

    //console.log('data:', data);
    fetcher.submit(data, { method: 'post' });

  }

  //console.log("couponData:", couponData);


  useEffect(() => {
    if (fetcher.data?.success && fetcher.data?.redirectUrl) {
      window.open(fetcher.data?.redirectUrl, '_top');
    }
  }, [fetcher]);



  useEffect(() => {
    if (shopData?.plan?.planName === PLAN_NAME.growth && shopData?.plan?.planType === PLAN_TYPE.yearly || shopData?.plan?.planName === PLAN_NAME.pro && shopData?.plan?.planType === PLAN_TYPE.yearly) {
      setIsMonthlyPlanShow(false);
    } else {
      setIsMonthlyPlanShow(true);
    }
  }, [shopData?.plan?.planName, shopData?.plan?.planType]);

  //console.log(shopData);

  const handleCancelSubscription = () => {
    fetcher.submit('', { method: 'get', action: '/api/plancancel' });
  }

  const handleShowCouponApplySection = () => {
    setShowCouponApplySection(prev => !prev);
  }

  const handleApplyCoupon = () => {
    //console.log('couponCodeInpValue', couponCodeInpValue);
    fetcher.submit({ couponCode: couponCodeInpValue }, { method: 'post', action: '/api/applycoupon' });
  }

  useEffect(() => {
    if (fetcher.data?.data?.offer) {
      shopify.toast.show('Applied coupon successfully', { duration: 2000 });
      setShowCouponApplySection(false);
      setCouponCodeInpValue('');
    }
  }, [fetcher.data?.data?.offer]);

  const planFeatures = {
    free: [
      "1 component with max 3 products",
      "Basic customization",
      "Copy embed code",
      "Individual product add to cart/ checkout",
      "Edit/update component",
      "Email support"
    ],
    growth: [
      "15 component with max 10 product variant limit per component.",
      "Inventory tracking before order",
      "Email component code",
      "Implement restrictions",
      "Add all products to cart at a single click",
      "Preset qty per product/variant",
      "Custom CSS",
      "Layout customization"
    ],
    pro: [
      "50 component with max 10 product variant limit per component. and unlimited product by selecting collection.",
      "UTM tracking",
      "Order tracking",
      "UTM campaign",
      "Affiliate: Create and manage your affiliates",
      "Affiliate Performance",
      "Assign components to affiliate",
      "Analytics: UTM tracking, campaign performance, visitor to conversion.",
      "Shopify Markets Pricing"
    ]
  }

  return (navigation.state === "loading" ? <LoadingSkeleton /> :
    <s-page inlineSize="base">
      <s-query-container>
        <s-stack
          padding="large-100 none large none"
          direction="inline"
          gap="small"
          justifyContent="start"
          alignItems="center"
        >
          <s-button onClick={() => navigate("/app")} accessibilityLabel="Back to affiliate" icon="arrow-left" variant="tertiary"></s-button>
          <s-text type="strong">Subscription plans</s-text>
        </s-stack>

        <s-stack
          justifyContent="center"
          alignItems="center"
          gap="small"
          padding="small"
        >
          <s-heading>Ready to start with EmbedUp?</s-heading>
          <s-paragraph>Choose the package that best suits your Business Needs</s-paragraph>
          {remainTrialDays > 0 &&
            <s-text>You have {remainTrialDays} Days Free Trial</s-text>
          }
          {shopData?.plan?.isTestPlan && remainTrialDays < 1 &&
            <TempPlanBannerShow
              //remaingTrialDays={remainTrialDays}
              title="Your free trial has ended"
              description="Thanks for trying EmbedUp! To keep your embedded products, bundles, and checkout live, please choose a plan below."
              subtitle="Your settings and embeds are saved."
              isBtnShow={false}
            />
          }
          {node_env === 'development' &&
            <s-button onClick={handleCancelSubscription}>Cancel Subscription {appSubscriptions?.name}</s-button>
          }
        </s-stack>

        <s-stack
          justifyContent="center"
          alignItems="center"
          padding="large none small none"
        >
          <s-stack
            direction="inline"
            alignItems="center"
            gap="small-200"
            borderRadius="large-100"
            border="large"
            padding="small-300"
          >
            <s-button
              variant={isMonthlyPlanShow ? 'primary' : 'tertiary'}
              onClick={() => setIsMonthlyPlanShow(true)}
            >Monthly Plan</s-button>
            <s-button
              variant={!isMonthlyPlanShow ? 'primary' : 'tertiary'}
              onClick={() => setIsMonthlyPlanShow(false)}
            >Save 20% on yearly plan</s-button>
          </s-stack>
        </s-stack>

        {isMonthlyPlanShow &&
          <s-grid
            gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))"
            gap="large-200"
            padding="large none large none"
          >
            <s-section>
              <s-stack
                gap="small-300"
              >
                <s-heading>Starter Plan</s-heading>
                {/* <s-text>Basic features for new businesses.</s-text> */}
                <s-text type="strong">Free</s-text>
              </s-stack>

              <s-stack
                padding="small none large none"
              >
                <s-clickable
                  minInlineSize="100%"
                  background="strong"
                  borderRadius="base"
                  padding="small"
                  loading={fetcher.state === 'submitting' && isLoading === 'freeBtn'}
                  onClick={() => { handleSubscriptionPlan(PLAN_NAME.free, PLAN_TYPE.monthly, {}); setIsLoading('freeBtn') }}
                  disabled={shopData?.plan?.planName === PLAN_NAME.free}
                >

                  <s-stack justifyContent="center" alignItems="center" minInlineSize="100%"><s-text
                    type="strong"
                  >{shopData?.plan?.planName === PLAN_NAME.free ? 'Current' : 'Get Started'}</s-text></s-stack >

                </s-clickable>
              </s-stack>

              <s-stack
                gap="small"
              >

                {planFeatures.free.map((feature, index) => (
                  <s-stack
                    key={index}
                    direction="inline"
                    gap="small-300"
                    alignItems="start"
                    justifyContent="start"
                  >
                    <s-stack
                      maxInlineSize="8%"
                    >
                      <s-icon type="check-circle" />
                    </s-stack>
                    <s-stack
                      maxInlineSize="90%"

                    >
                      <s-text>{feature}</s-text>
                    </s-stack>
                  </s-stack>
                ))

                }

              </s-stack>

            </s-section>

            <s-section>
              <s-stack
                gap="small-300"
              >
                <s-heading>Growth Plan</s-heading>
                {/* <s-text>Basic features for new businesses.</s-text> */}
                <s-stack direction="inline" alignItems="center" gap="none">
                  {planPriceAndDiscount.growth_monthly.discountedPrice ?
                    <s-stack paddingInlineEnd="small-300"><s-text type="redundant">${planPriceAndDiscount.growth_monthly.price.toFixed(2)}</s-text></s-stack>
                    :
                    <s-text type="strong">${planPriceAndDiscount.growth_monthly.price.toFixed(2)}</s-text>
                  }

                  {planPriceAndDiscount.growth_monthly.discountedPrice &&
                    <s-text type="strong">${planPriceAndDiscount.growth_monthly.discountedPrice.toFixed(2)}</s-text>
                  }

                  <s-text type="address">/per month</s-text>
                </s-stack>
              </s-stack>

              <s-stack
                padding="small none large none"
              >
                <s-clickable
                  minInlineSize="100%"
                  background="strong"
                  borderRadius="base"
                  padding="small"
                  onClick={() => {
                    handleSubscriptionPlan(
                      PLAN_NAME.growth,
                      PLAN_TYPE.monthly,
                      planPriceAndDiscount.growth_monthly
                    ); setIsLoading('growthBtn')
                  }}
                  loading={fetcher.state === 'submitting' && isLoading === 'growthBtn'}
                  disabled={shopData?.plan?.planName === PLAN_NAME.growth && shopData?.plan?.planType === PLAN_TYPE.monthly && shopData?.isAppliedCoupon}
                >

                  <s-stack justifyContent="center" alignItems="center" minInlineSize="100%"><s-text
                    type="strong"

                  >{shopData?.plan?.planName === PLAN_NAME.growth && shopData?.plan?.planType === PLAN_TYPE.monthly && shopData?.isAppliedCoupon ? 'Current' : remainTrialDays > 0 ? `Start ${remainTrialDays}-days Free Trial` : 'Get Started'}</s-text></s-stack>
                </s-clickable>
              </s-stack>

              <s-stack
                gap="small-200"
              >

                {planFeatures.growth.map((feature, index) => (
                  <s-stack
                    key={index}
                    direction="inline"
                    gap="small-300"
                    alignItems="start"
                    justifyContent="start"
                  >
                    <s-stack
                      maxInlineSize="8%"
                    >
                      <s-icon type="check-circle" />
                    </s-stack>
                    <s-stack
                      maxInlineSize="90%"

                    >
                      <s-text>{feature}</s-text>
                    </s-stack>
                  </s-stack>
                ))

                }

              </s-stack>

            </s-section>

            <s-section>
              <s-stack
                gap="small-300"
              >
                <s-heading>Pro Plan</s-heading>
                {/* <s-text>Basic features for new businesses.</s-text> */}
                <s-stack direction="inline" alignItems="center" gap="none">
                  {planPriceAndDiscount.pro_monthly.discountedPrice ?
                    <s-stack paddingInlineEnd="small-300"> <s-text type="redundant">${planPriceAndDiscount.pro_monthly.price.toFixed(2)}</s-text></s-stack>
                    :
                    <s-text type="strong">${planPriceAndDiscount.pro_monthly.price.toFixed(2)}</s-text>
                  }

                  {planPriceAndDiscount.pro_monthly.discountedPrice &&
                    <s-text type="strong">${planPriceAndDiscount.pro_monthly.discountedPrice.toFixed(2)}</s-text>
                  }

                  <s-text type="address">/per month</s-text>
                </s-stack>
              </s-stack>

              <s-stack
                padding="small none large none"
              >
                <s-clickable
                  minInlineSize="100%"
                  background="strong"
                  borderRadius="base"
                  padding="small"
                  onClick={() => {
                    handleSubscriptionPlan(
                      PLAN_NAME.pro,
                      PLAN_TYPE.monthly,
                      planPriceAndDiscount.pro_monthly
                    ); setIsLoading('proBtn')
                  }}
                  loading={fetcher.state === 'submitting' && isLoading === 'proBtn'}
                  disabled={shopData?.plan?.planName === PLAN_NAME.pro && shopData?.plan?.planType === PLAN_TYPE.monthly && shopData?.isAppliedCoupon}
                >

                  <s-stack justifyContent="center" alignItems="center" minInlineSize="100%"><s-text
                    type="strong"
                  >{shopData?.plan?.planName === PLAN_NAME.pro && shopData?.plan?.planType === PLAN_TYPE.monthly && shopData?.isAppliedCoupon ? 'Current' : remainTrialDays > 0 ? `Start ${remainTrialDays}-days Free Trial` : 'Get Started'}</s-text></s-stack>
                </s-clickable>
              </s-stack>

              <s-stack
                gap="small-200"
              >

                {planFeatures.pro.map((feature, index) => (
                  <s-stack
                    key={index}
                    direction="inline"
                    gap="small-300"
                    alignItems="start"
                    justifyContent="start"
                  >
                    <s-stack
                      maxInlineSize="8%"
                    >
                      <s-icon type="check-circle" />
                    </s-stack>
                    <s-stack
                      maxInlineSize="90%"

                    >
                      <s-text>{feature}</s-text>
                    </s-stack>
                  </s-stack>
                ))

                }

              </s-stack>

            </s-section>


          </s-grid>
        }

        {!isMonthlyPlanShow &&
          <s-grid
            gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))"
            gap="large-200"
            padding="large none large none"
          >
            <s-section>
              <s-stack
                gap="small-300"
              >
                <s-heading>Growth Plan</s-heading>
                {/* <s-text>Basic features for new businesses.</s-text> */}
                <s-stack direction="inline" alignItems="center" gap="none">
                  {planPriceAndDiscount.growth_yearly.discountedPrice ?
                    <s-stack paddingInlineEnd="small-300"><s-text type="redundant">${planPriceAndDiscount.growth_yearly.price.toFixed(2)}</s-text></s-stack>
                    :
                    <s-text type="strong">${planPriceAndDiscount.growth_yearly.price.toFixed(2)}</s-text>
                  }

                  {planPriceAndDiscount.growth_yearly.discountedPrice &&
                    <s-text type="strong">${planPriceAndDiscount.growth_yearly.discountedPrice.toFixed(2)}</s-text>
                  }

                  <s-text type="address">/per year</s-text>
                </s-stack>
              </s-stack>

              <s-stack
                padding="small none large none"
              >
                <s-clickable
                  minInlineSize="100%"
                  background="strong"
                  borderRadius="base"
                  padding="small"
                  onClick={() => {
                    handleSubscriptionPlan(
                      PLAN_NAME.growth,
                      PLAN_TYPE.yearly,
                      planPriceAndDiscount.growth_yearly
                    ); setIsLoading('growthBtn')
                  }}
                  loading={fetcher.state === 'submitting' && isLoading === 'growthBtn'}
                  disabled={shopData?.plan?.planName === PLAN_NAME.growth && shopData?.plan?.planType === PLAN_TYPE.yearly && shopData?.isAppliedCoupon}
                >

                  <s-stack justifyContent="center" alignItems="center" minInlineSize="100%"><s-text
                    type="strong"
                  >{shopData?.plan?.planName === PLAN_NAME.growth && shopData?.plan?.planType === PLAN_TYPE.yearly && shopData?.isAppliedCoupon ? 'Current' : remainTrialDays > 0 ? `Start ${remainTrialDays}-days Free Trial` : 'Get Started'}</s-text></s-stack>
                </s-clickable>
              </s-stack>

              <s-stack
                gap="small-200"
              >

                {planFeatures.growth.map((feature, index) => (
                  <s-stack
                    key={index}
                    direction="inline"
                    gap="small-300"
                    alignItems="start"
                    justifyContent="start"
                  >
                    <s-stack
                      maxInlineSize="8%"
                    >
                      <s-icon type="check-circle" />
                    </s-stack>
                    <s-stack
                      maxInlineSize="90%"

                    >
                      <s-text>{feature}</s-text>
                    </s-stack>
                  </s-stack>
                ))

                }

              </s-stack>

            </s-section>

            <s-section>
              <s-stack
                gap="small-300"
              >
                <s-heading>Pro Plan</s-heading>
                {/* <s-text>Basic features for new businesses.</s-text> */}
                <s-stack direction="inline" alignItems="center" gap="none">
                  {planPriceAndDiscount.pro_yearly.discountedPrice ?
                    <s-stack paddingInlineEnd="small-300"><s-text type="redundant">${planPriceAndDiscount.pro_yearly.price.toFixed(2)}</s-text></s-stack>
                    :
                    <s-text type="strong">${planPriceAndDiscount.pro_yearly.price.toFixed(2)}</s-text>
                  }

                  {planPriceAndDiscount.pro_yearly.discountedPrice &&
                    <s-text type="strong">${planPriceAndDiscount.pro_yearly.discountedPrice.toFixed(2)}</s-text>
                  }

                  <s-text type="address">/per year</s-text>
                </s-stack>
              </s-stack>

              <s-stack
                padding="small none large none"
              >
                <s-clickable
                  minInlineSize="100%"
                  background="strong"
                  borderRadius="base"
                  padding="small"
                  onClick={() => {
                    handleSubscriptionPlan(
                      PLAN_NAME.pro,
                      PLAN_TYPE.yearly,
                      planPriceAndDiscount.pro_yearly
                    ); setIsLoading('proBtn')
                  }}
                  loading={fetcher.state === 'submitting' && isLoading === 'proBtn'}
                  disabled={shopData?.plan?.planName === PLAN_NAME.pro && shopData?.plan?.planType === PLAN_TYPE.yearly && shopData?.isAppliedCoupon}
                >

                  <s-stack justifyContent="center" alignItems="center" minInlineSize="100%"><s-text
                    type="strong"
                  >{shopData?.plan?.planName === PLAN_NAME.pro && shopData?.plan?.planType === PLAN_TYPE.yearly && shopData?.isAppliedCoupon ? 'Current' : remainTrialDays > 0 ? `Start ${remainTrialDays}-days Free Trial` : 'Get Started'}</s-text></s-stack>
                </s-clickable>
              </s-stack>

              <s-stack
                gap="small-200"
              >

                {planFeatures.pro.map((feature, index) => (
                  <s-stack
                    key={index}
                    direction="inline"
                    gap="small-300"
                    alignItems="start"
                    justifyContent="start"
                  >
                    <s-stack
                      maxInlineSize="8%"
                    >
                      <s-icon type="check-circle" />
                    </s-stack>
                    <s-stack
                      maxInlineSize="90%"

                    >
                      <s-text>{feature}</s-text>
                    </s-stack>
                  </s-stack>
                ))

                }

              </s-stack>

            </s-section>

          </s-grid>
        }


        <s-stack
          justifyContent="center"
          alignItems="center"
          paddingBlockStart="large"
        >

          <s-link onClick={handleShowCouponApplySection}>Have a coupon code?</s-link>
          {showCouponApplySection &&
            <s-stack
              paddingBlockStart="small"
            >
              <s-section>
                <s-stack

                  direction="inline"
                  alignItems="center"

                  gap="small"
                >
                  <s-box
                    minInlineSize="200px"
                  >
                    <s-text-field
                      name="couponCode"
                      defaultValue={couponCodeInpValue}
                      onChange={(e) => { setCouponCodeInpValue(e.targetvalue) }}
                      label="Coupon Code"
                      labelAccessibilityVisibility="exclusive"
                      placeholder="Enter your coupon code"
                    />
                  </s-box>
                  <s-box
                    maxInlineSize="5%"
                  >
                    <s-button loading={fetcher.state === 'submitting'} variant="primary" onClick={handleApplyCoupon}>Apply</s-button>
                  </s-box>
                </s-stack>
                <s-box paddingBlockStart={"small-300"} paddingInlineStart={"small-300"}>
                  <s-text tone="critical">{fetcher?.data?.data?.errorCode === 77 ? 'Invalid Coupon Code' : fetcher?.data?.data?.errorCode === 66 ? 'Alreay Applied Coupon' : ''}</s-text>
                </s-box>
              </s-section>
            </s-stack>
          }
        </s-stack>

        <s-box paddingBlockEnd={"large-300"}></s-box>
      </s-query-container>
    </s-page>
  )
}

export default Plans


export const action = async ({ request }) => {
  const { session, admin, billing, redirect } = await authenticate.admin(request);
  const { appSubscriptions } = await billing.check();
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  // redis invalided the cache if exist start
  const pattern = `analytics:${session.shop}:*`;
  let cursor = "0";
  do {
    const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
    cursor = nextCursor;
    if (keys.length) await redis.del(...keys);
  } while (cursor !== "0");
  // redis invalided the cache if exist end

  if (data.planName === PLAN_NAME.growth || data.planName === PLAN_NAME.pro) {

    if (appSubscriptions?.length > 0) {
      for (let i = 0; i < appSubscriptions.length; i++) {
        const subscription = appSubscriptions[i];
        await billing.cancel({
          subscriptionId: subscription.id,
          isTest: data.partnerDevelopment === 'true',
          prorate: true,
        });
      }

    }

    const { price, discountType, discountValue, discountDuration } = JSON.parse(data?.planPriceAndDiscount);

    let discountObj = {}
    if (discountType === DISCOUNT_TYPE.percentage) {
      discountObj = {
        value: { percentage: discountValue / 100 },
        ...(discountDuration > 0 && { durationLimitInIntervals: discountDuration })
      }

    } else if (discountType === DISCOUNT_TYPE.fixed) {
      discountObj = {
        value: { amount: discountValue },
        ...(discountDuration > 0 && { durationLimitInIntervals: discountDuration })
      }
    }


    let returnURL = `https://admin.shopify.com/store/${session.shop.replace('.myshopify.com', '')}/apps/${process.env.APP_HANDLE}/app/plan-purchase/?upgrade=true&planType=${data.planType}&planName=${data.planName}`;

    if (data?.isFirstInstall === 'false') {
      returnURL = `https://admin.shopify.com/store/${session.shop.replace('.myshopify.com', '')}/apps/${process.env.APP_HANDLE}/app/plan-purchase/?upgrade=true&planType=${data.planType}&planName=${data.planName}`;
    } else if (data?.isFirstInstall === 'true') {
      returnURL = `https://admin.shopify.com/store/${session.shop.replace('.myshopify.com', '')}/apps/${process.env.APP_HANDLE}/app/?isFirstInstall=true&planType=${data.planType}&planName=${data.planName}`;
    }



    const priceAmount = price;
    console.log('priceAmount:', priceAmount);

    const interval = data.planType === PLAN_TYPE.monthly ? "EVERY_30_DAYS" : data.planType === PLAN_TYPE.yearly ? "ANNUAL" : "EVERY_30_DAYS";

    const currencyCode = "USD";


    const isDiscount = Number(discountValue ?? 0);

    const appRecurringPricingDetails = {
      price: { amount: priceAmount, currencyCode },
      interval: interval,
      ...(isDiscount > 0 && {
        discount: discountObj,
      }),
    };

    console.log("appRecurringPricingDetails", appRecurringPricingDetails,
      JSON.stringify(appRecurringPricingDetails)
    );

    console.log("isDiscount:", isDiscount, "discountValue:", discountValue);

    const variables = {
      name: data.planName,
      returnUrl: returnURL,
      trialDays:
        data?.remaingTrialDays
          ? parseInt(data.remaingTrialDays, 10)
          : parseInt(process.env.TRIAL_DAYS ?? "5", 10),
      test: data.partnerDevelopment === "true",
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails,
          },
        },
      ],
    };


    const response = await admin.graphql(
      `#graphql
  mutation AppSubscriptionCreate(
    $name: String!,
    $test: Boolean!,
    $lineItems: [AppSubscriptionLineItemInput!]!,
    $returnUrl: URL!,
    $trialDays: Int
  ) {
    appSubscriptionCreate(
      name: $name,
      test: $test,
      returnUrl: $returnUrl,
      lineItems: $lineItems,
      trialDays: $trialDays
    ) {
      userErrors { field message }
      appSubscription { id }
      confirmationUrl
    }
  }`,
      { variables }
    );


    const plan = await response.json();


    if (plan?.data?.userErrors?.length > 0) {
      return {
        success: false,
        errors: plan.data.userErrors,
      }
    }

    return {
      success: true,
      redirectUrl: plan.data.appSubscriptionCreate.confirmationUrl || '',


    }
  } else if (data.planName === PLAN_NAME.free) {


    if (appSubscriptions?.length > 0) {
      for (let i = 0; i < appSubscriptions.length; i++) {
        const subscription = appSubscriptions[i];
        await billing.cancel({
          subscriptionId: subscription.id,
          isTest: data.partnerDevelopment === 'true',
          prorate: true,
        });
      }

    }

    const shopData = await db.shop.update({
      where: { id: Number(data.shopId) },
      data: {
        appPlan: data.planName,
        maxAllowedComponents: MAX_ALLOWED_COMPONENTS.free,
        isFirstInstall: data?.isFirstInstall === 'true' ? false : JSON.parse(data?.isFirstInstall),
        plan: {
          upsert: {
            create: {
              planId: null,
              planName: data.planName,
              price: 0.0,
              planStatus: PLAN_STATUS.active,
              planType: PLAN_TYPE.monthly,
              isTestPlan: false,
            },
            update: {
              planId: null,
              planName: data.planName,
              price: 0.0,
              planType: PLAN_TYPE.monthly,
              isTestPlan: false,
            },
          },
        },
      },
      include: { plan: true, components: true }
    });



    if (shopData?.components?.length > 0) {
      const shoppingCartSettings = {
        ...shopData?.components[0]?.shoppingCartSettings,
        showOrderNote: BoleanOptions.no,
        showDiscountCodeField: BoleanOptions.no,
      }

      if (shopData?.components[0]?.addToCartType?.type === ADD_TO_CART_TYPE.bulk || shopData?.components[0]?.shoppingCartSettings?.showOrderNote === BoleanOptions.yes || shopData?.components[0]?.shoppingCartSettings?.showDiscountCodeField === BoleanOptions.yes) {
        await db.component.update({
          where: {
            id: shopData?.components[0]?.id
          },
          data: {
            addToCartType: {
              type: ADD_TO_CART_TYPE.individual,
              products: shopData?.components[0]?.addToCartType?.products
            },
            shoppingCartSettings
          }
        });
      }
      await db.component.updateMany({
        where: {
          shopId: shopData.id,
          id: { not: shopData?.components[0]?.id }
        },
        data: {
          softDelete: true
        }
      });
    }

    if (data?.isFirstInstall === 'true' && shopData?.plan?.planName === PLAN_NAME.free) {
      //console.log('from ifBlock');
      throw redirect('/app');
    } else if (data?.isFirstInstall === 'false' && shopData?.plan?.planName === PLAN_NAME.free) {
      throw redirect('/app/plan-purchase?downgrade=true');
    }

    return {
      success: true,
      message: "Free Plan acitivated successfully",
      redirectUrlFree: data.isFirstInstall === 'true' ? '/app?isFirstInstall=true' : '/app/plan-purchase',
    }
  } else {
    return {
      message: "Something went wrong",
    }
  }


}