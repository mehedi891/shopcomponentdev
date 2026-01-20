import { useLoaderData, useNavigate, useNavigation, useSearchParams } from 'react-router';
import LoadingSkeleton from '../components/LoadingSkeleton/LoadingSkeleton';
import { authenticate } from '../shopify.server';
import db from "../db.server";
import { useEffect } from 'react';
import { MAX_ALLOWED_COMPONENTS, PLAN_NAME, PLAN_STATUS } from '../constants/constants';

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
  const planName = url.searchParams.get('planName');

  if (appSubscriptions?.length > 0 && shopData?.plan?.planId !== appSubscriptions[0]?.id) {
    shopData = await db.shop.update({
      where: { id: Number(shopData.id) },
      data: {
        maxAllowedComponents: planName === PLAN_NAME.growth ? MAX_ALLOWED_COMPONENTS.growth : MAX_ALLOWED_COMPONENTS.pro,
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
              isTestCharge: appSubscriptions[0].test,
              planType,
              chargeId,
              isTestPlan: false,
            },
            update: {
              planId: appSubscriptions[0].id,
              planName: appSubscriptions[0].name,
              price: appSubscriptions[0]?.lineItems[0]?.plan?.pricingDetails?.price?.amount || 29,
              planStatus: appSubscriptions[0].status,
              isTestCharge: appSubscriptions[0].test,
              planType,
              chargeId,
              isTestPlan: false,
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
    const components = await db.component.findMany({
      where: {
        shopId: shopData.id,
      },
      select: {
        id: true,
      },
      orderBy: {
        id: 'asc'
      }
    });

    if (planName === PLAN_NAME.growth) {
      const cmpIdsArr = components.map(c => c.id);
      const allowedIds = cmpIdsArr.slice(0, MAX_ALLOWED_COMPONENTS.growth);
      const notAllowedIds = cmpIdsArr.slice(MAX_ALLOWED_COMPONENTS.growth, cmpIdsArr.length);

      await db.component.updateMany({
        where: {
          shopId: shopData.id,
          id: {
            in: allowedIds
          }
        },
        data: {
          softDelete: false
        }
      });

      if (notAllowedIds.length > 0) {
        await db.component.updateMany({
          where: {
            shopId: shopData.id,
            id: {
              in: notAllowedIds
            }
          },
          data: {
            softDelete: true
          }
        });
      }


    } else if (planName === PLAN_NAME.pro) {
      const cmpIdsArr = components.map(c => c.id);
      const allowedIds = cmpIdsArr.slice(0, MAX_ALLOWED_COMPONENTS.pro);
      const notAllowedIds = cmpIdsArr.slice(MAX_ALLOWED_COMPONENTS.pro, cmpIdsArr.length);

      await db.component.updateMany({
        where: {
          shopId: shopData.id,
          id: {
            in: allowedIds
          }
        },
        data: {
          softDelete: false
        }
      });

      if (notAllowedIds.length > 0) {
        await db.component.updateMany({
          where: {
            shopId: shopData.id,
            id: {
              in: notAllowedIds
            }
          },
          data: {
            softDelete: true
          }
        });
      }

    }

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

  const navigation = useNavigation();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.toString()) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);


  return (navigation.state === "loading" ? <LoadingSkeleton /> :

    <s-page>
      <s-query-container>
        <s-stack
          padding="large-100 none large none"
          direction="inline"
          gap="small"
          justifyContent="start"
          alignItems="center"
        >
          <s-button onClick={() => navigate("/app")} accessibilityLabel="Back to affiliate" icon="arrow-left" variant="tertiary"></s-button>
          <s-heading>Subscription Confirmed</s-heading>
        </s-stack>
        <s-section>
          <s-stack
            gap="large"
            alignItems="center"
            justifyContent="center"
            paddingBlockEnd="large"
          >
            <s-image aspectRatio="1/0.3" src="/images/subscription_success.svg" alt='Subscribed Successful' />
            <s-stack
              gap="small-300"
              alignItems="center"
              justifyContent="center"
            >
              <s-heading>Congratulations! Your EmbedUp subscription is now activated.</s-heading>
              <s-text>Start selling beyond your store.</s-text>
              <s-text>Create component &#62; Copy & embed anywhere &#62; Boost sales.</s-text>
            </s-stack>
            <s-button onClick={() => navigate("/app")} variant="primary">Continue</s-button>
          </s-stack>
        </s-section>
      </s-query-container>
    </s-page>

  )
}

export default PlanPurchase