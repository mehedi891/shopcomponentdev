import { useFetcher, useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
import { BlockStack, Box, Button, ButtonGroup, Card, Icon, InlineStack, Layout, Page, Text } from "@shopify/polaris";
import {
  CheckCircleIcon
} from '@shopify/polaris-icons';
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { useEffect, useState } from "react";
import { getRemainingTrialDays } from "../utilis/remainTrialDaysCount";
import { ADD_TO_CART_TYPE, MAX_ALLOWED_COMPONENTS, PLAN_NAME, PLAN_STATUS, PLAN_TYPE } from "../constants/constants";


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
      isFirstInstall:true,
      scAccessToken: true
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
        isFirstInstall:true,
        scAccessToken: true
      }
    });
  }




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






  return {
    shopData: shopData,
    appSubscriptions: appSubscriptions?.length > 0 ? appSubscriptions[0] : {},
    shopInfo: shop?.data?.shop || {},
    paidRedirectInfo: { isFirstInstall, upgrade },
    trialDaysOffer: process.env.TRIAL_DAYS ? parseInt(process.env.TRIAL_DAYS) : 5,
    node_env: process.env.NODE_ENV || '',
  }
}
const Plans = () => {
  const { shopData, shopInfo, appSubscriptions, trialDaysOffer, node_env } = useLoaderData();
  const fetcher = useFetcher();
  //console.log('appSubscriptions:', appSubscriptions);
  const navigation = useNavigation();
  const navigate = useNavigate();
  const [remainTrialDays, setRemainTrialDays] = useState(0);
  const [isLoading, setIsLoading] = useState(null);
  const [isMonthlyPlanShow, setIsMonthlyPlanShow] = useState(true);

  useEffect(() => {
    setRemainTrialDays(getRemainingTrialDays(shopData?.planActivatedAt, trialDaysOffer))
  }, [shopData, trialDaysOffer]);


  const handleSubscriptionPlan = (planName, planType) => {
    const data = {
      planName: planName,
      planType: planType,
      shopId: shopData?.id,
      isFirstInstall: `${shopData?.isFirstInstall}`,
      partnerDevelopment: shopInfo?.plan?.partnerDevelopment || false,
      remaingTrialDays: remainTrialDays,
      discountPercent: 0
    }

    // console.log('data:', data);

    fetcher.submit(data, { method: 'post' });

  }



  useEffect(() => {
    if (fetcher.data?.success && fetcher.data?.redirectUrl) {
      window.open(fetcher.data?.redirectUrl, '_top');
    }
  }, [fetcher]);



  useEffect(() => {
    if (shopData?.plan?.planName === PLAN_NAME.growth && shopData?.plan?.planType === PLAN_TYPE.yearly) {
      setIsMonthlyPlanShow(false);
    } else {
      setIsMonthlyPlanShow(true);
    }
  }, [shopData?.plan?.planName, shopData?.plan?.planType]);

  //console.log(shopData);
  
  const handleCancelSubscription = () => {
    fetcher.submit('', { method: 'get', action: '/api/plancancel' });
  }

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
                      <Box paddingBlock={'100'}><Text variant="headingMd">Save 20% (Yearly)</Text></Box>
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
                      onClick={() => { handleSubscriptionPlan(PLAN_NAME.free, PLAN_TYPE.monthly); setIsLoading('freeBtn') }}
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
                      <Text variant="heading2xl">$29.00</Text>
                      <Text variant="headingLg" fontWeight="regular" tone="subdued">/per month</Text>
                    </InlineStack>
                  </Box>
                  <Box>
                    <Button
                      onClick={() => { handleSubscriptionPlan(PLAN_NAME.growth, PLAN_TYPE.monthly); setIsLoading('growthBtn') }}
                      fullWidth
                      variant="primary"
                      size="large"
                      loading={fetcher.state === 'submitting' && isLoading === 'growthBtn'}
                      disabled={shopData?.plan?.planName === PLAN_NAME.growth && shopData?.plan?.planName === PLAN_NAME.growth && shopData?.plan?.planType === PLAN_TYPE.monthly}
                    >
                      <Box padding={'150'}><Text> {shopData?.plan?.planName === PLAN_NAME.growth && shopData?.plan?.planName === PLAN_NAME.growth && shopData?.plan?.planType === PLAN_TYPE.monthly ? 'Current' : remainTrialDays > 0 ? `Start ${remainTrialDays}-days Free Trial` : 'Get Started'}</Text></Box>
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
                      <Text variant="heading2xl"><Text as="span" textDecorationLine="line-through" tone="subdued">$348.00</Text> $278.40</Text>
                      <Text variant="headingLg" fontWeight="regular" tone="subdued">/per year</Text>
                    </InlineStack>
                  </Box>
                  <Box>
                    <Button
                      onClick={() => { handleSubscriptionPlan(PLAN_NAME.growth, PLAN_TYPE.yearly); setIsLoading('growthBtn') }}
                      fullWidth
                      variant="primary"
                      size="large"
                      loading={fetcher.state === 'submitting' && isLoading === 'growthBtn'}
                      disabled={shopData?.plan?.planName === PLAN_NAME.growth && shopData?.plan?.planType === PLAN_TYPE.yearly}
                    >
                      <Box padding={'150'}><Text> {
                        shopData?.plan?.planName === PLAN_NAME.growth && shopData?.plan?.planType === PLAN_TYPE.yearly ? 'Current' : remainTrialDays > 0 ? `Start ${remainTrialDays}-days Free Trial` : 'Get Started'}</Text></Box>
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
            </InlineStack>
          }
        </Layout.Section>






      </Layout>
      <Box paddingBlockEnd={'600'}></Box>
    </Page>

  )
}

export default Plans

export const action = async ({ request }) => {
  const { session, admin, billing, redirect } = await authenticate.admin(request);
  const formData = await request.formData();
  const data = Object.fromEntries(formData);



  if (data.planName === PLAN_NAME.growth) {
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

    const priceAmount = data.planType === PLAN_TYPE.monthly ? 29 : data.planType === PLAN_TYPE.yearly ? 278.40 : 29.00;
    const interval = data.planType === PLAN_TYPE.monthly ? "EVERY_30_DAYS" : data.planType === PLAN_TYPE.yearly ? "ANNUAL" : "EVERY_30_DAYS";

    const currencyCode = "USD";


    const discountPercent = Number(data?.discountPercent ?? 0);

    const appRecurringPricingDetails = {
      price: { amount: priceAmount, currencyCode },
      interval: interval,
      ...(discountPercent > 0 && {
        discount: {
          value: { percentage: discountPercent },
          durationLimitInIntervals: 1,
        },
      }),
    };

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
    const { appSubscriptions } = await billing.check();
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
      if (shopData?.components[0]?.addToCartType?.type === ADD_TO_CART_TYPE.bulk) {
        await db.component.update({
          where: {
            id: shopData?.components[0]?.id
          },
          data: {
            addToCartType: {
              type: ADD_TO_CART_TYPE.individual,
              products: shopData?.components[0]?.addToCartType?.products
            }
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