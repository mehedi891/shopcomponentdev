import { useFetcher, useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
import { BlockStack, Box, Button, Card, Icon, InlineStack, Layout, Page, Text } from "@shopify/polaris";
import {
  CheckCircleIcon
} from '@shopify/polaris-icons';
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { useEffect, useState } from "react";
import { getRemainingTrialDays } from "../utilis/remainTrialDaysCount";


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
    include: {
      plan: true
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
        installationCount: {
          increment: 1,
        },
      },
      create: {
        shopifyDomain: session.shop,
        scAccessToken: scToken.data?.storefrontAccessTokenCreate?.storefrontAccessToken?.accessToken,
        installationCount: 1,
        shopifyShopGid: shop.data.shop.id,
      },
      include: {
        plan: true,
      },
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
  const { shopData, shopInfo, appSubscriptions, trialDaysOffer,node_env } = useLoaderData();
  const fetcher = useFetcher();
  console.log('appSubscriptions:', appSubscriptions);
  const navigation = useNavigation();
  const navigate = useNavigate();
  const [remainTrialDays,setRemainTrialDays]  = useState(0);
  const [isLoading, setIsLoading] = useState(null);

  useEffect(()=>{
    setRemainTrialDays(getRemainingTrialDays(shopData?.planActivatedAt,trialDaysOffer))
  },[shopData,trialDaysOffer]);


  const handleSubscriptionPlan = (planName, planType) => {
    const data = {
      planName: planName,
      planType: planType,
      shopId: shopData?.id,
      isFirstInstall: `${shopData?.isFirstInstall}`,
      partnerDevelopment: shopInfo?.plan?.partnerDevelopment || false,
      remaingTrialDays: remainTrialDays,
    }

   // console.log('data:', data);

    fetcher.submit(data, { method: 'post' });

  }



  useEffect(() => {
    if (fetcher.data?.success && fetcher.data?.redirectUrl) {
      window.open(fetcher.data?.redirectUrl, '_top');
    }
  }, [fetcher]);





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
              <Text alignment="center" fontWeight="bold" variant="headingLg">Ready to start with ShopComponent?</Text>
              <Text alignment="center" variant="headingLg" tone="subdued" fontWeight="regular">Choose the package that best suits your Business Needs</Text>
              {remainTrialDays > 0 &&
                <Box>
                  <Text variant="headingMd" alignment="center">You have {remainTrialDays} Days Free Trial</Text>
                </Box>

              }
              { node_env === 'development' &&
              <Button onClick={handleCancelSubscription}>Cancel Subscription {appSubscriptions?.name}</Button>
              }
            </BlockStack>
          </Box>
        </Layout.Section>
        <Layout.Section variant="oneHalf">
          <Box>
            <Card padding={"500"}>
              <Box>
                <BlockStack gap={'300'}>
                  <Text variant="headingLg">Starter Plan</Text>
                  <Text variant="headingLg" tone="subdued" fontWeight="regular">Basic features for new businesses.</Text>
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
                  onClick={() => { handleSubscriptionPlan('Free', 'monthly'); setIsLoading('freeBtn') }}
                  disabled={shopData?.plan?.planName === 'Free'}
                >
                  <Box padding={'150'}><Text>{shopData?.plan?.planName === 'Free' ? 'Subscribed' : 'Get Started'}</Text></Box>
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
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Box>
            <Card padding={"500"}>
              <Box>
                <BlockStack gap={'300'}>
                  <Text variant="headingLg">Growth Plan</Text>
                  <Text variant="headingLg" tone="subdued" fontWeight="regular">Advanced tools to boost sales and AOV.</Text>
                </BlockStack>
              </Box>
              <Box paddingBlock={'600'}>
                <InlineStack blockAlign="center" gap={"100"}>
                  <Text variant="heading2xl">$29</Text>
                  <Text variant="headingLg" fontWeight="regular" tone="subdued">/per month</Text>
                </InlineStack>
              </Box>
              <Box>
                <Button
                  onClick={() => { handleSubscriptionPlan('Growth', 'monthly'); setIsLoading('growthBtn') }}
                  fullWidth
                  variant="primary"
                  size="large"
                  loading={fetcher.state === 'submitting' && isLoading === 'growthBtn'}
                  disabled={shopData?.plan?.planName === 'Growth'}
                >
                  <Box padding={'150'}><Text> {shopData?.plan?.planName === 'Growth' ? 'Current' : remainTrialDays > 0 ? `Start ${remainTrialDays}-days Free Trial` : 'Subscribe'}</Text></Box>
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
        </Layout.Section>
      </Layout>
      <Box paddingBlockEnd={'600'}></Box>
    </Page>

  )
}

export default Plans

export const action = async ({ request }) => {
  const { session, admin, billing ,redirect } = await authenticate.admin(request);
  const formData = await request.formData();
  const data = Object.fromEntries(formData);



  if (data.planName === 'Growth') {
    let returnURL = `https://admin.shopify.com/store/${session.shop.replace('.myshopify.com', '')}/apps/${process.env.APP_NAME}/app/plan-purchase/?upgrade=true`;

    if (data?.isFirstInstall === 'false') {
      returnURL = `https://admin.shopify.com/store/${session.shop.replace('.myshopify.com', '')}/apps/${process.env.APP_NAME}/app/plan-purchase/?upgrade=true`;
    } else if (data?.isFirstInstall === 'true') {
      returnURL = `https://admin.shopify.com/store/${session.shop.replace('.myshopify.com', '')}/apps/${process.env.APP_NAME}/app/?isFirstInstall=true`;
    }

    console.log('returnURL:',returnURL);



    const response = await admin.graphql(
      `#graphql
  mutation AppSubscriptionCreate($name: String!,$test: Boolean!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!,$trialDays: Int) {
    appSubscriptionCreate(name: $name,test: $test, returnUrl: $returnUrl, lineItems: $lineItems,trialDays: $trialDays) {
      userErrors {
        field
        message
      }
      appSubscription {
        id
      }
      confirmationUrl
    }
  }`,
      {
        variables: {
          "name": data.planName,
          "returnUrl": returnURL,
          "trialDays": data?.remaingTrialDays ? parseInt(data?.remaingTrialDays) : parseInt(process.env.TRIAL_DAYS) || 5,
          "test": data.partnerDevelopment === 'true' ? true : false,
          "lineItems": [
            {
              "plan": {
                "appRecurringPricingDetails": {
                  "price": {
                    "amount": 29.00,
                    "currencyCode": "USD"
                  },
                  "discount": {
                    "value": {
                      "percentage": 0
                    },
                    "durationLimitInIntervals": 1
                  },
                  "interval": "EVERY_30_DAYS"
                }
              }
            }
          ]
        },
      },
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
  } else if (data.planName === 'Free') {
    const { appSubscriptions } = await billing.check();
    if (appSubscriptions?.length > 0) {
      const subscription = appSubscriptions[0];
      await billing.cancel({
        subscriptionId: subscription.id,
        isTest: data.partnerDevelopment === 'true' ? true : false,
        prorate: true,
      });
    }

    const shopData = await db.shop.update({
      where: { id: Number(data.shopId) },
      data: {
        appPlan: data.planName,
        maxAllowedComponents: 1,
        isFirstInstall: data?.isFirstInstall === 'true' ? false : JSON.parse(data?.isFirstInstall),
        plan: {
          upsert: {
            create: {
              planId: null,
              planName: data.planName,
              price: 0.0,
              planStatus: 'active',
            },
            update: {
              planId: null,
              planName: data.planName,
              price: 0.0,
            },
          },
        },
      },
      include:{plan:true}
    });

    if (data?.isFirstInstall === 'true' && shopData?.plan?.planName === 'Free') {
      //console.log('from ifBlock');
      throw redirect('/app');
    } else if (data?.isFirstInstall === 'false' && shopData?.plan?.planName === 'Free') {
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