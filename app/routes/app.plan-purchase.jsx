import { useLoaderData, useNavigate, useNavigation, useSearchParams } from '@remix-run/react';
import LoadingSkeleton from '../components/LoadingSkeleton/LoadingSkeleton';
import { useTranslation } from 'react-i18next';
import { BlockStack, Box, Button, Card, InlineStack, Layout, Page, Text } from '@shopify/polaris';
import { authenticate } from '../shopify.server';
import db from "../db.server";
import { useEffect } from 'react';
import PageTitle from '../components/PageTitle/PageTitle';
import { MAX_ALLOWED_COMPONENTS, PLAN_STATUS } from '../constants/constants';

export const loader = async ({ request }) => {

  const { session, billing, admin } = await authenticate.admin(request);
  const { appSubscriptions } = await billing.check();


  let shopData = {};

  const subscriptionQuery = `#graphql
                query subscriptions {
                    app {
                        installation {
                            activeSubscriptions {
                                id
                                status
                            }
                        }
                    }
                }
            `;
  const subscriptionResponse = await admin.graphql(subscriptionQuery);
  const subscriptionResponseJson = await subscriptionResponse.json();

  shopData = await db.shop.findUnique({
    where: {
      shopifyDomain: session.shop
    },
    include: {
      plan: true,
      components: true,
    }
  });

  const url = new URL(request.url);
  const isFirstInstall = url.searchParams.get('isFirstInstall');
  const upgrade = url.searchParams.get('upgrade');
  const downgrade = url.searchParams.get('downgrade');
  const planType = url.searchParams.get('planType');
  const chargeId = url.searchParams.get('charge_id');

  if (appSubscriptions?.length > 0 && shopData?.plan?.planId !== appSubscriptions[0]?.id) {
    shopData = await db.shop.update({
      where: { id: Number(shopData.id) },
      data: {
        maxAllowedComponents: MAX_ALLOWED_COMPONENTS.growth,
        appPlan: appSubscriptions[0].name,
        trialDays: appSubscriptions[0].trialDays,
        planActivatedAt: isFirstInstall === 'true' ? appSubscriptions[0]?.createdAt : shopData?.planActivatedAt,
        isAppliedCoupon: true,
        plan: {
          upsert: {
            create: {
              planId: appSubscriptions[0].id,
              planName: appSubscriptions[0].name,
              price: appSubscriptions[0]?.lineItems[0]?.plan?.pricingDetails?.price?.amount || 29,
              planStatus: appSubscriptions[0].status,
              isTestCharge:appSubscriptions[0].test,
              planType,
              chargeId
            },
            update: {
              planId: appSubscriptions[0].id,
              planName: appSubscriptions[0].name,
              price: appSubscriptions[0]?.lineItems[0]?.plan?.pricingDetails?.price?.amount || 29,
              planStatus: appSubscriptions[0].status,
              isTestCharge:appSubscriptions[0].test,
              planType,
              chargeId
            },
          },
        },
      },
      include: {
        plan: true,

      },
    });

  }


  if (upgrade === 'true' && subscriptionResponseJson?.data?.app?.installation?.activeSubscriptions?.length > 0 && subscriptionResponseJson?.data?.app?.installation?.activeSubscriptions[0]?.status === PLAN_STATUS.active) {
   
    await db.component.updateMany({
      where: {
        shopId: shopData.id,
      },
      data: {
        softDelete: false
      }
    });
  }

  return {
    success: true,
    shopData: shopData || {},
    upgrade: upgrade ? true : false,
    subscriptionResponseJson
  }
}

const PlanPurchase = () => {
  const { shopData } = useLoaderData();
 
  const { t } = useTranslation();
  const navigation = useNavigation();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.toString()) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);


  return (navigation.state === "loading" ? <LoadingSkeleton /> :
    <Page>
      <PageTitle

        title='EmbedUp - Subscription Confirmed'

      />
      <Layout>
        <Layout.Section>
          <Card>
            <Box paddingBlock={1200} width="100%">
              <BlockStack inlineAlign="center">
                <img width={'250px'} height={'250px'} src="/images/subscription_success.svg" alt='Subscribed Successful' />
                <Box paddingBlockEnd={800} paddingInline={{ sm: 200, lg: 1600, xl: 2400 }}>
                  <BlockStack inlineAlign="center">
                    <Box paddingBlockEnd={150}>
                      {/* <Text variant="headingMd" as="h6" alignment="center">{t('Thanks', { plan: 'Free' })}</Text> */}
                      <Text variant="headingLg" as="h2" alignment="center">{"Congratulations! Your EmbedUp subscription is now activated."}</Text>
                    </Box>
                    {/* <Box maxWidth="24rem">
                      <Text variant="bodySm" as="p" alignment="center">{t("enjoy_app_message")}</Text>
                      
                    </Box> */}

                    <BlockStack gap={'100'}>
                      <Text alignment='center' variant='bodyLg'>Start selling beyond your store.</Text>
                      <Text alignment='center' variant='bodyLg'>Create component &gt; Copy & embed anywhere &gt; Boost sales.</Text>
                    </BlockStack>
                  </BlockStack>
                </Box>
                <InlineStack gap={200} align="center">
                  <Button variant="primary" onClick={() => navigate('/app')}>{t("continue")}</Button>
                </InlineStack>
              </BlockStack>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>

  )
}

export default PlanPurchase