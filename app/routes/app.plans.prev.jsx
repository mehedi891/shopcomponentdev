import { useFetcher, useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
import { BlockStack, Box, Button, ButtonGroup, Card, Icon, InlineError, InlineStack, Layout, Link, Page, Text, TextField } from "@shopify/polaris";
import crypto from "crypto";
import {
  CheckCircleIcon
} from '@shopify/polaris-icons';
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { useEffect, useState } from "react";
import { getRemainingTrialDays } from "../utilis/remainTrialDaysCount";
import { ADD_TO_CART_TYPE, AFFILIATE_STATUS, BoleanOptions, DISCOUNT_TYPE, MAX_ALLOWED_COMPONENTS, PLAN_NAME, PLAN_PRICE, PLAN_STATUS, PLAN_TYPE } from "../constants/constants";


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




  // if (appSubscriptions?.length >  0 && shopData?.plan?.planId !== appSubscriptions[0]?.id) {
  //   shopData = await db.shop.update({
  //     where: { id: Number(shopData.id) },
  //     data: {
  //       maxAllowedComponents:10,
  //       appPlan: appSubscriptions[0].name,
  //       trialDays: appSubscriptions[0].trialDays,
  //       planActivatedAt: isFirstInstall === 'true' ? appSubscriptions[0]?.createdAt : shopData?.planActivatedAt,
  //       plan: {
  //         upsert: {
  //           create: {
  //             planId: appSubscriptions[0].id,
  //             planName: appSubscriptions[0].name,
  //             price: 29.0,
  //             planStatus: 'active',
  //           },
  //           update: {
  //             planId: appSubscriptions[0].id,
  //             planName: appSubscriptions[0].name,
  //             price: 29.00,
  //           },
  //         },
  //       },
  //     },
  //     include: {
  //       plan: true,
  //     },
  //   });

  // }



  // coupon code get details

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




  return {
    shopData: shopData,
    appSubscriptions: appSubscriptions?.length > 0 ? appSubscriptions[0] : {},
    shopInfo: shop?.data?.shop || {},
    paidRedirectInfo: { isFirstInstall, upgrade },
    trialDaysOffer: shopData?.trialDays ? shopData?.trialDays : parseInt(process.env.TRIAL_DAYS),
    node_env: process.env.NODE_ENV || '',
    couponData,
  }
}
const Plans = () => {
  const { shopData, shopInfo, appSubscriptions, trialDaysOffer, couponData, node_env } = useLoaderData();
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
  const [remainTrialDays, setRemainTrialDays] = useState(0);
  const [isLoading, setIsLoading] = useState(null);
  const [isMonthlyPlanShow, setIsMonthlyPlanShow] = useState(true);
  const [showCouponApplySection, setShowCouponApplySection] = useState(false);
  const [couponCodeInpValue, setCouponCodeInpValue] = useState('');


  useEffect(() => {
    setRemainTrialDays(getRemainingTrialDays(shopData?.planActivatedAt, trialDaysOffer))
  }, [shopData, trialDaysOffer]);


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

  //console.log('featcherData', fetcher.data);


  return (navigation.state === "loading" ? <LoadingSkeleton /> :
    <Page
      title={"Subscription Plan"}
      backAction={{ onAction: () => navigate('/app') }}
    >
      <Layout>
        <Layout.Section variant="fullWidth">
          <Box paddingBlockEnd={'600'}>
            <BlockStack gap={"200"}>
              <Text alignment="center" fontWeight="bold" variant="headingLg">Ready to start with EmbedUp?</Text>
              <Text alignment="center" variant="headingLg" tone="subdued" fontWeight="regular">Choose the package that best suits your Business Needs</Text>
              {remainTrialDays > 0 &&
                <Box>
                  <Text variant="headingMd" alignment="center">You have {remainTrialDays} Days Free Trial</Text>
                </Box>

              }
              {node_env === 'development' &&
                <Button onClick={handleCancelSubscription}>Cancel Subscription {appSubscriptions?.name}</Button>
              }
            </BlockStack>
          </Box>
        </Layout.Section>
        <Layout.Section>
          <Box paddingBlock={'300'}>
            <BlockStack inlineAlign="center">
              <Box
                maxWidth="max-content"
                borderWidth="100"
                borderColor="input-border-active"
                paddingBlock={'100'}
                paddingInline={'100'}
                borderRadius="400"
              >
                <ButtonGroup>

                  <Button
                    size="large"
                    variant={isMonthlyPlanShow ? 'primary' : 'tertiary'}
                    onClick={() => setIsMonthlyPlanShow(true)}
                  >
                    <Box paddingBlock={'100'}><Text variant="headingMd">Monthly</Text></Box>
                  </Button>

                  <Box>
                    <Button
                      size="large"
                      variant={!isMonthlyPlanShow ? 'primary' : 'tertiary'}
                      onClick={() => setIsMonthlyPlanShow(false)}
                    >
                      <Box paddingBlock={'100'}><Text variant="headingMd">Save {planPriceAndDiscount.growth_monthly.discountValue ?? 20}% (Yearly)</Text></Box>
                    </Button>
                  </Box>
                </ButtonGroup>
              </Box>
            </BlockStack>
          </Box>
        </Layout.Section>


        <Layout.Section variant="fullWidth">
          {isMonthlyPlanShow &&
            <InlineStack gap={'300'} align="center" blockAlign="start">
              <Box>
                <Card padding={"500"}>
                  <Box>
                    <BlockStack gap={'300'}>
                      <Text variant="headingLg">Starter Plan</Text>
                      <Text variant="headingMd" tone="subdued" fontWeight="regular">Basic features for new businesses.</Text>
                    </BlockStack>
                  </Box>
                  <Box paddingBlock={'600'}>
                    <Text variant="heading2xl">Free</Text>
                  </Box>
                  <Box>
                    <Button
                      fullWidth
                      variant="secondary"
                      size="large"
                      loading={fetcher.state === 'submitting' && isLoading === 'freeBtn'}
                      onClick={() => { handleSubscriptionPlan(PLAN_NAME.free, PLAN_TYPE.monthly, {}); setIsLoading('freeBtn') }}
                      disabled={shopData?.plan?.planName === PLAN_NAME.free}
                    >
                      <Box padding={'150'}><Text>{shopData?.plan?.planName === PLAN_NAME.free ? 'Current' : 'Get Started'}</Text></Box>
                    </Button>
                  </Box>

                  <Box paddingBlock={'400'}>
                    {/* <Text variant="headingXl" fontWeight="medium">FEATURES</Text> */}
                  </Box>
                  <Box>
                    <BlockStack gap={"300"}>
                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">1 component with max 3 products</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Basic customization</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Copy embed code</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Individual product add to cart/ checkout</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Edit/update component</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Email support</Text>
                      </InlineStack>
                    </BlockStack>

                  </Box>
                </Card>
              </Box>

              <Box>
                <Card padding={"500"}>
                  <Box>
                    <BlockStack gap={'300'}>
                      <Text variant="headingLg">Growth Plan</Text>
                      <Text variant="headingMd" tone="subdued" fontWeight="regular">Advanced tools to boost sales and AOV.</Text>
                    </BlockStack>
                  </Box>
                  <Box paddingBlock={'600'}>
                    <InlineStack align="start" blockAlign="center" gap={"100"}>
                      {planPriceAndDiscount.growth_monthly.discountedPrice ?
                        <Text variant="heading2xl" textDecorationLine="line-through" tone="subdued">${planPriceAndDiscount.growth_monthly.price.toFixed(2)}</Text>
                        :
                        <Text variant="heading2xl">${planPriceAndDiscount.growth_monthly.price.toFixed(2)}</Text>
                      }

                      {planPriceAndDiscount.growth_monthly.discountedPrice &&
                        <Text variant="heading2xl">${planPriceAndDiscount.growth_monthly.discountedPrice.toFixed(2)}</Text>
                      }

                      <Text variant="headingLg" fontWeight="regular" tone="subdued">/per month</Text>
                    </InlineStack>


                  </Box>
                  <Box>
                    <Button
                      onClick={() => {
                        handleSubscriptionPlan(
                          PLAN_NAME.growth,
                          PLAN_TYPE.monthly,
                          planPriceAndDiscount.growth_monthly
                        ); setIsLoading('growthBtn')
                      }}
                      fullWidth
                      variant="primary"
                      size="large"
                      loading={fetcher.state === 'submitting' && isLoading === 'growthBtn'}
                      disabled={shopData?.plan?.planName === PLAN_NAME.growth && shopData?.plan?.planType === PLAN_TYPE.monthly && shopData?.isAppliedCoupon}
                    >
                      <Box padding={'150'}><Text> {shopData?.plan?.planName === PLAN_NAME.growth && shopData?.plan?.planType === PLAN_TYPE.monthly && shopData?.isAppliedCoupon ? 'Current' : remainTrialDays > 0 ? `Start ${remainTrialDays}-days Free Trial` : 'Get Started'}</Text></Box>
                    </Button>
                  </Box>

                  <Box paddingBlock={'400'}>
                    {/* <Text variant="headingXl" fontWeight="medium">FEATURES</Text> */}
                  </Box>
                  <Box>
                    <BlockStack gap={"300"}>
                      <InlineStack gap={"200"} align="start" blockAlign="start">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Box maxWidth="90%">
                          <Text variant="bodyLg">10 component with max 10 product variant limit per component.</Text>
                        </Box>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Inventory tracking before order</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Email component code</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Implement restrictions</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Add all products to cart at a single click</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Preset qty per product/variant</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Layout customization</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Custom CSS</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Layout customization</Text>
                      </InlineStack>


                    </BlockStack>

                  </Box>
                </Card>
              </Box>

              <Box>
                <Card padding={"500"}>
                  <Box>
                    <BlockStack gap={'300'}>
                      <Text variant="headingLg">Pro Plan</Text>
                      <Text variant="headingMd" tone="subdued" fontWeight="regular">Advanced tools to boost sales and AOV.</Text>
                    </BlockStack>
                  </Box>
                  <Box paddingBlock={'600'}>
                    <InlineStack align="start" blockAlign="center" gap={"100"}>
                      {planPriceAndDiscount.pro_monthly.discountedPrice ?
                        <Text variant="heading2xl" textDecorationLine="line-through" tone="subdued">${planPriceAndDiscount.pro_monthly.price.toFixed(2)}</Text>
                        :
                        <Text variant="heading2xl">${planPriceAndDiscount.pro_monthly.price.toFixed(2)}</Text>
                      }

                      {planPriceAndDiscount.pro_monthly.discountedPrice &&
                        <Text variant="heading2xl">${planPriceAndDiscount.pro_monthly.discountedPrice.toFixed(2)}</Text>
                      }

                      <Text variant="headingLg" fontWeight="regular" tone="subdued">/per month</Text>
                    </InlineStack>


                  </Box>
                  <Box>
                    <Button
                      onClick={() => {
                        handleSubscriptionPlan(
                          PLAN_NAME.pro,
                          PLAN_TYPE.monthly,
                          planPriceAndDiscount.pro_monthly
                        ); setIsLoading('proBtn')
                      }}
                      fullWidth
                      variant="primary"
                      size="large"
                      loading={fetcher.state === 'submitting' && isLoading === 'proBtn'}
                      disabled={shopData?.plan?.planName === PLAN_NAME.pro && shopData?.plan?.planType === PLAN_TYPE.monthly && shopData?.isAppliedCoupon}
                    >
                      <Box padding={'150'}><Text> {shopData?.plan?.planName === PLAN_NAME.pro && shopData?.plan?.planType === PLAN_TYPE.monthly && shopData?.isAppliedCoupon ? 'Current' : remainTrialDays > 0 ? `Start ${remainTrialDays}-days Free Trial` : 'Get Started'}</Text></Box>
                    </Button>
                  </Box>

                  <Box paddingBlock={'400'}>
                    {/* <Text variant="headingXl" fontWeight="medium">FEATURES</Text> */}
                  </Box>
                  <Box>
                    <BlockStack gap={"300"}>
                      <InlineStack gap={"200"} align="start" blockAlign="start">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Box maxWidth="90%">
                          <Text variant="bodyLg">50 component with max 10 product variant limit per component. and unlimited product by selecting collection.</Text>
                        </Box>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">UTM tracking</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Order tracking</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">UTM campaign</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Affiliate: Create and manage your affiliates </Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Affiliate Performance</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Assign Affiliate to component</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Analytics: UTM tracking, campaign performance, visitor to conversion.</Text>
                      </InlineStack>


                    </BlockStack>

                  </Box>
                </Card>
              </Box>
            </InlineStack>
          }
          {!isMonthlyPlanShow &&
            <InlineStack align="center">
              <Box>
                <Card padding={"500"}>
                  <Box>
                    <BlockStack gap={'300'}>
                      <Text variant="headingLg">Growth Plan</Text>
                      <Text variant="headingMd" tone="subdued" fontWeight="regular">Advanced tools to boost sales and AOV.</Text>
                    </BlockStack>
                  </Box>
                  <Box paddingBlock={'600'}>
                    <InlineStack align="start" blockAlign="center" gap={"100"}>
                      {planPriceAndDiscount.growth_yearly.discountedPrice ?
                        <Text variant="heading2xl" textDecorationLine="line-through" tone="subdued">${planPriceAndDiscount.growth_yearly.price.toFixed(2)}</Text>
                        :
                        <Text variant="heading2xl">${planPriceAndDiscount.growth_yearly.price.toFixed(2)}</Text>
                      }

                      {planPriceAndDiscount.growth_yearly.discountedPrice &&
                        <Text variant="heading2xl">${planPriceAndDiscount.growth_yearly.discountedPrice.toFixed(2)}</Text>
                      }

                      <Text variant="headingLg" fontWeight="regular" tone="subdued">/per year</Text>
                    </InlineStack>
                  </Box>
                  <Box>
                    <Button
                      onClick={() => {
                        handleSubscriptionPlan(
                          PLAN_NAME.growth,
                          PLAN_TYPE.yearly,
                          planPriceAndDiscount.growth_yearly
                        );
                        setIsLoading('growthBtn')
                      }}
                      fullWidth
                      variant="primary"
                      size="large"
                      loading={fetcher.state === 'submitting' && isLoading === 'growthBtn'}
                      disabled={shopData?.plan?.planName === PLAN_NAME.growth && shopData?.plan?.planType === PLAN_TYPE.yearly && shopData?.isAppliedCoupon}
                    >
                      <Box padding={'150'}><Text> {
                        shopData?.plan?.planName === PLAN_NAME.growth && shopData?.plan?.planType === PLAN_TYPE.yearly && shopData?.isAppliedCoupon ? 'Current' : remainTrialDays > 0 ? `Start ${remainTrialDays}-days Free Trial` : 'Get Started'}</Text></Box>
                    </Button>
                  </Box>

                  <Box paddingBlock={'400'}>
                    {/* <Text variant="headingXl" fontWeight="medium">FEATURES</Text> */}
                  </Box>


                  <Box>
                    <BlockStack gap={"300"}>
                      <InlineStack gap={"200"} align="start" blockAlign="start">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Box maxWidth="90%">
                          <Text variant="bodyLg">10 component with max 10 product variant limit per component.</Text>
                        </Box>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Inventory tracking before order</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Email component code</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Implement restrictions</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Add all products to cart at a single click</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Preset qty per product/variant</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Layout customization</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Custom CSS</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Layout customization</Text>
                      </InlineStack>


                    </BlockStack>

                  </Box>
                </Card>
              </Box>

               <Box>
                <Card padding={"500"}>
                  <Box>
                    <BlockStack gap={'300'}>
                      <Text variant="headingLg">Pro Plan</Text>
                      <Text variant="headingMd" tone="subdued" fontWeight="regular">Advanced tools to boost sales and AOV.</Text>
                    </BlockStack>
                  </Box>
                  <Box paddingBlock={'600'}>
                    <InlineStack align="start" blockAlign="center" gap={"100"}>
                      {planPriceAndDiscount.pro_yearly.discountedPrice ?
                        <Text variant="heading2xl" textDecorationLine="line-through" tone="subdued">${planPriceAndDiscount.pro_yearly.price.toFixed(2)}</Text>
                        :
                        <Text variant="heading2xl">${planPriceAndDiscount.pro_yearly.price.toFixed(2)}</Text>
                      }

                      {planPriceAndDiscount.pro_yearly.discountedPrice &&
                        <Text variant="heading2xl">${planPriceAndDiscount.pro_yearly.discountedPrice.toFixed(2)}</Text>
                      }

                      <Text variant="headingLg" fontWeight="regular" tone="subdued">/per year</Text>
                    </InlineStack>


                  </Box>
                  <Box>
                    <Button
                      onClick={() => {
                        handleSubscriptionPlan(
                          PLAN_NAME.pro,
                          PLAN_TYPE.yearly,
                          planPriceAndDiscount.pro_yearly
                        ); setIsLoading('proBtn')
                      }}
                      fullWidth
                      variant="primary"
                      size="large"
                      loading={fetcher.state === 'submitting' && isLoading === 'proBtn'}
                      disabled={shopData?.plan?.planName === PLAN_NAME.pro && shopData?.plan?.planType === PLAN_TYPE.yearly && shopData?.isAppliedCoupon}
                    >
                      <Box padding={'150'}><Text> {shopData?.plan?.planName === PLAN_NAME.pro && shopData?.plan?.planType === PLAN_TYPE.yearly && shopData?.isAppliedCoupon ? 'Current' : remainTrialDays > 0 ? `Start ${remainTrialDays}-days Free Trial` : 'Get Started'}</Text></Box>
                    </Button>
                  </Box>

                  <Box paddingBlock={'400'}>
                    {/* <Text variant="headingXl" fontWeight="medium">FEATURES</Text> */}
                  </Box>
                  <Box>
                    <BlockStack gap={"300"}>
                      <InlineStack gap={"200"} align="start" blockAlign="start">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Box maxWidth="90%">
                          <Text variant="bodyLg">50 component with max 10 product variant limit per component. and unlimited product by selecting collection.</Text>
                        </Box>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">UTM tracking</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Order tracking</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">UTM campaign</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Affiliate: Create and manage your affiliates </Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Affiliate Performance</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Assign Affiliate to component</Text>
                      </InlineStack>

                      <InlineStack gap={"200"} align="start" blockAlign="center">
                        <Box maxWidth="30px" >
                          <Icon
                            source={CheckCircleIcon}
                          />
                        </Box>
                        <Text variant="bodyLg">Analytics: UTM tracking, campaign performance, visitor to conversion.</Text>
                      </InlineStack>


                    </BlockStack>

                  </Box>
                </Card>
              </Box>
            </InlineStack>
          }
        </Layout.Section>


        <Layout.Section variant="fullWidth">
          <InlineStack align="center">
            <Box paddingBlock={"500"}>
              <BlockStack inlineAlign="center">
                <Box>
                  <Button variant="plain" onClick={handleShowCouponApplySection}>
                    <Text fontWeight="semibold" variant="bodyLg">Have a coupon code?</Text>
                  </Button>
                </Box>
                {showCouponApplySection &&
                  <Box paddingBlock={'400'} minWidth="350px">
                    <Card>
                      <InlineStack gap={'200'}>
                        <Box minWidth="75%">
                          <TextField
                            name="couponCode"
                            value={couponCodeInpValue}
                            onChange={(value) => { setCouponCodeInpValue(value) }}
                            autoComplete="off"
                            label="Coupon Code"
                            labelHidden
                            placeholder="Enter your coupon code"
                          />
                        </Box>
                        <Button loading={fetcher.state === 'submitting'} variant="primary" onClick={handleApplyCoupon}>Apply</Button>
                      </InlineStack>
                      <Box paddingBlockStart={"200"} paddingInlineStart={"100"}>
                        <InlineError message={fetcher?.data?.data?.errorCode === 77 ? 'Invalid Coupon Code' : fetcher?.data?.data?.errorCode === 66 ? 'Alreay Applied Coupon' : ''} />
                      </Box>
                    </Card>
                  </Box>
                }
              </BlockStack>
            </Box>
          </InlineStack>
        </Layout.Section>

      </Layout>

      <Box paddingBlockEnd={'600'}></Box>
    </Page>

  )
}

export default Plans

export const action = async ({ request }) => {
  const { session, admin, billing, redirect } = await authenticate.admin(request);
  const { appSubscriptions } = await billing.check();
  const formData = await request.formData();
  const data = Object.fromEntries(formData);



  if (data.planName === PLAN_NAME.growth || data.planName ===  PLAN_NAME.pro) {

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


    let returnURL = `https://admin.shopify.com/store/${session.shop.replace('.myshopify.com', '')}/apps/${process.env.APP_HANDLE}/app/plan-purchase/?upgrade=true&planType=${data.planType}`;

    if (data?.isFirstInstall === 'false') {
      returnURL = `https://admin.shopify.com/store/${session.shop.replace('.myshopify.com', '')}/apps/${process.env.APP_HANDLE}/app/plan-purchase/?upgrade=true&planType=${data.planType}`;
    } else if (data?.isFirstInstall === 'true') {
      returnURL = `https://admin.shopify.com/store/${session.shop.replace('.myshopify.com', '')}/apps/${process.env.APP_HANDLE}/app/?isFirstInstall=true&planType=${data.planType}`;
    }

    //console.log('returnURL:', returnURL);



    //   const response = await admin.graphql(
    //     `#graphql
    // mutation AppSubscriptionCreate($name: String!,$test: Boolean!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!,$trialDays: Int) {
    //   appSubscriptionCreate(name: $name,test: $test, returnUrl: $returnUrl, lineItems: $lineItems,trialDays: $trialDays) {
    //     userErrors {
    //       field
    //       message
    //     }
    //     appSubscription {
    //       id
    //     }
    //     confirmationUrl
    //   }
    // }`,
    //     {
    //       variables: {
    //         "name": data.planName,
    //         "returnUrl": returnURL,
    //         "trialDays": data?.remaingTrialDays ? parseInt(data?.remaingTrialDays) : parseInt(process.env.TRIAL_DAYS) || 5,
    //         "test": data.partnerDevelopment === 'true' ? true : false,
    //         "lineItems": [
    //           {
    //             "plan": {
    //               "appRecurringPricingDetails": {
    //                 "price": {
    //                   "amount": 29.00,
    //                   "currencyCode": "USD"
    //                 },
    //                 "discount": {
    //                   "value": {
    //                     "percentage": 0
    //                   },
    //                   "durationLimitInIntervals": 1
    //                 },
    //                 "interval": "EVERY_30_DAYS"
    //               }
    //             }
    //           }
    //         ]
    //       },
    //     },
    //   );

    // const priceAmount = data.planType === PLAN_TYPE.monthly ? 29 : data.planType === PLAN_TYPE.yearly ? 278.40 : 29.00;

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
              planType: PLAN_TYPE.monthly
            },
            update: {
              planId: null,
              planName: data.planName,
              price: 0.0,
              planType: PLAN_TYPE.monthly
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