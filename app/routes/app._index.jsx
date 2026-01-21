
import { authenticate } from "../shopify.server";
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { useFetcher, useLoaderData, useNavigate, useNavigation, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import db from "../db.server";
import { useAppBridge } from "@shopify/app-bridge-react";
import UpgradeTooltip from "../components/UpgradeTooltip/UpgradeTooltip";
import Instruction from "../components/Instruction/Instruction";
import { MAX_ALLOWED_COMPONENTS, PLAN_NAME } from "../constants/constants";
import EmptyStateGeneric from "../components/EmptyStateGeneric/EmptyStateGeneric";
import ProductAvailibilityStatus from "../components/ProductAvailibilityStatus/ProductAvailibilityStatus";
import TermsAndConditions from "../components/TermsAndConditions/TermsAndConditions";
import getSymbolFromCurrency from "currency-symbol-map";
import redis from "../utilis/redis.init";
import TempPlanBannerShow from "../components/TempPlanBannerShow/TempPlanBannerShow";
import { getRemainingTrialDays } from "../utilis/remainTrialDaysCount";


export const loader = async ({ request }) => {

  const { session, admin, billing, redirect } = await authenticate.admin(request);
  const { hasActivePayment, appSubscriptions } = await billing.check();

  // const shopResponse = await admin.graphql(
  //   `#graphql
  //           query shopInfo{
  //               shop{
  //                 id
  //               }
  //       }`,

  // );

  // const shop = await shopResponse.json();


  let shopData = await db.shop.findUnique({
    where: {
      shopifyDomain: session.shop
    },
    select: {
      id: true,
      scAccessToken: true,
      shopifyDomain: true,
      currencyCode: true,
      createdAt: true,
      trialDays: true,
      appCatalogId: true,
      publicationId: true,
      plan: {
        select: {
          id: true,
          planName: true,
          isTestPlan: true,
        }
      },
      components: {
        where: {
          shop: {
            shopifyDomain: session.shop
          },
          softDelete: false,
        },
        orderBy: {
          id: 'desc',
        },
        select: {
          id: true,
          title: true,
          addToCartType: true,
          status: true,
          appliesTo: true,
          componentSettings: true,
          totalOrderCount: true,
          totalOrderValue: true,

        },
        take: 5,
      }
    }
  });

  if (!shopData?.plan) {
    throw redirect('/app/plans');
  }

  let remaingTrialDays = 0;

  if (shopData?.plan?.isTestPlan) {
    remaingTrialDays = getRemainingTrialDays(shopData?.createdAt, shopData?.trialDays);

    if (!shopData?.plan || (shopData?.plan?.isTestPlan && remaingTrialDays < 1)) {
      throw redirect('/app/plans');
    }
  }

  if (!shopData?.scAccessToken) {
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
    //console.log('Token AppIndex:', scToken?.data?.storefrontAccessTokenCreate?.storefrontAccessToken?.accessToken);
    shopData = await db.shop.upsert({
      where: {
        shopifyDomain: session.shop,
      },
      update: {
        installationCount: {
          increment: 1,
        },
        scAccessToken: scToken?.data?.storefrontAccessTokenCreate?.storefrontAccessToken?.accessToken,
        shopifyShopGid: scToken?.data?.storefrontAccessTokenCreate?.shop?.id,
      },
      create: {
        shopifyDomain: session.shop,
        scAccessToken: scToken?.data?.storefrontAccessTokenCreate?.storefrontAccessToken?.accessToken,
        installationCount: 1,
        shopifyShopGid: scToken?.data?.storefrontAccessTokenCreate?.shop?.id,
      },
      select: {
        id: true,
        scAccessToken: true,
        shopifyDomain: true,
        currencyCode: true,
        publicationId: true,
        createdAt: true,
        trialDays: true,
        plan: {
          select: {
            id: true,
            planName: true,
            isTestPlan: true,
          }
        },
        components: {
          where: {
            shop: {
              shopifyDomain: session.shop
            },
            softDelete: false,
          },
          orderBy: {
            id: 'desc',
          },
          select: {
            id: true,
            title: true,
            addToCartType: true,
            status: true,
            appliesTo: true,
            componentSettings: true,
            totalOrderCount: true,
            totalOrderValue: true,

          },
          take: 5,
        }
      }
    });
  }

  // const url = new URL(request.url);
  // const isFirstInstall = url.searchParams.get('isFirstInstall');
  // const planType = url.searchParams.get('planType');
  // const chargeId = url.searchParams.get('charge_id');
  // const planName = url.searchParams.get('planName');


  // if (isFirstInstall && appSubscriptions?.length > 0) {
  //   shopData = await db.shop.update({
  //     where: {
  //       shopifyDomain: session.shop,
  //     },
  //     data: {
  //       isFirstInstall: isFirstInstall === 'true' ? false : true,
  //       maxAllowedComponents: planName === PLAN_NAME.growth ? MAX_ALLOWED_COMPONENTS.growth : MAX_ALLOWED_COMPONENTS.pro,
  //       appPlan: appSubscriptions[0].name,
  //       trialDays: appSubscriptions[0].trialDays,
  //       isAppliedCoupon: true,
  //       plan: {
  //         upsert: {
  //           create: {
  //             planId: appSubscriptions[0].id,
  //             planName: appSubscriptions[0].name,
  //             price: appSubscriptions[0]?.lineItems[0]?.plan?.pricingDetails?.price?.amount || 29,
  //             planStatus: appSubscriptions[0].status,
  //             isTestCharge: appSubscriptions[0].test,
  //             planType,
  //             chargeId,
  //           },
  //           update: {
  //             planId: appSubscriptions[0].id,
  //             planName: appSubscriptions[0].name,
  //             price: appSubscriptions[0]?.lineItems[0]?.plan?.pricingDetails?.price?.amount || 29,
  //             isTestCharge: appSubscriptions[0].test,
  //             planType,
  //             chargeId,
  //           },
  //         },
  //       },
  //     },
  //     select: {
  //       id: true,
  //       scAccessToken: true,
  //       shopifyDomain: true,
  //       currencyCode: true,
  //       publicationId: true,
  //       plan: {
  //         select: {
  //           id: true,
  //           planName: true
  //         }
  //       },
  //       components: {
  //         where: {
  //           shop: {
  //             shopifyDomain: session.shop
  //           },
  //           softDelete: false,
  //         },
  //         orderBy: {
  //           id: 'desc',
  //         },
  //         select: {
  //           id: true,
  //           title: true,
  //           addToCartType: true,
  //           status: true,
  //           appliesTo: true,
  //           componentSettings: true,
  //           totalOrderCount: true,
  //           totalOrderValue: true,

  //         },
  //         take: 5,
  //       }
  //     }
  //   });
  // }





  let totalPd = 0;
  const isExistTotalPd = await redis.get(`totalPd:${session.shop}`);

  if (isExistTotalPd) {
    totalPd = JSON.parse(isExistTotalPd);
  } else {
    const totalPdJson = await admin.graphql(
      `#graphql
            query {
                productsCount(query:null) {
                count
                }
            }`,
    );
    const totalproduct = await totalPdJson.json();

    totalPd = totalproduct?.data?.productsCount?.count ?? 0;
    await redis.set(`totalPd:${session.shop}`, JSON.stringify(totalPd), 'EX', 60 * 2);
  }

  if (!shopData?.publicationId) {
    const appResponse = await admin.graphql(
      `#graphql
            query ($apiKey: String!) {
              appByKey(apiKey: $apiKey) {
                id
                title
                installation {
                  publication {
                    id
                  }
                }
              }
            }
  `,
      {
        variables: { apiKey: process.env.SHOPIFY_API_KEY },
      }
    );

    const appResponseJson = await appResponse.json();

    const publication = await admin.graphql(
      `#graphql
  query publication($id: ID!) {
    publication(id: $id) {
      id
    catalog{
      id
    }
    }
  }`,
      {
        variables: {
          "id": appResponseJson?.data?.appByKey?.installation?.publication?.id
        },
      },
    );

    const publicationjson = await publication.json();


    shopData = await db.shop.upsert({
      where: {
        shopifyDomain: session.shop,
      },
      update: {
        publicationId: publicationjson?.data?.publication?.id,
        appCatalogId: publicationjson?.data?.publication?.catalog?.id,
        isInstalled: true,
      },
      create: {
        shopifyDomain: session.shop,
        publicationId: publicationjson?.data?.publication?.id,
        appCatalogId: publicationjson?.data?.publication?.catalog?.id,
        isInstalled: false,
      },
      select: {
        id: true,
        scAccessToken: true,
        shopifyDomain: true,
        currencyCode: true,
        publicationId: true,
        createdAt: true,
        trialDays: true,
        plan: {
          select: {
            id: true,
            planName: true,
            isTestPlan: true,
          }
        },
        components: {
          where: {
            shop: {
              shopifyDomain: session.shop
            },
            softDelete: false,
          },
          orderBy: {
            id: 'desc',
          },
          select: {
            id: true,
            title: true,
            addToCartType: true,
            status: true,
            appliesTo: true,
            componentSettings: true,
            totalOrderCount: true,
            totalOrderValue: true,

          },
          take: 5,
        }
      }
    });

  }

  let totalPublishProduct = 0;

  const isExistTotalPublishProduct = await redis.get(`totalPublishProduct:${session.shop}`);

  if (isExistTotalPublishProduct) {
    totalPublishProduct = JSON.parse(isExistTotalPublishProduct);
  } else {
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
          "publicationId": shopData?.publicationId
        },
      },
    );
    const totalPublishSpcJson = await totalPublishSpc.json();

    totalPublishProduct = totalPublishSpcJson?.data?.publishedProductsCount?.count ?? 0;
    await redis.set(`totalPublishProduct:${session.shop}`, JSON.stringify(totalPublishProduct), 'EX', 60 * 2);
  }
  const components = shopData?.components || [];


  return {
    shopData: shopData,
    components: components || [],
    hasActivePayment,
    totalPd: totalPd,
    totalPublishProduct: totalPublishProduct,
    cataglogId: shopData?.appCatalogId ? shopData?.appCatalogId.replace('gid://shopify/AppCatalog/', '') : '',
    success: true,
    appSubscriptions: appSubscriptions[0],
    remaingTrialDays,
  };
};

export default function Index() {
  const shopify = useAppBridge();
  const { shopData, components, totalPd, totalPublishProduct, cataglogId, remaingTrialDays } = useLoaderData();
  //console.log('cataglogId:', {totalPd, totalPublishProduct, cataglogId ,remaingTrialDays});
  const navigate = useNavigate();
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const [isLoading, setIsLoading] = useState(false);
  const [showInstructionBanner, setShowInstructionBanner] = useState(false);

  const [searchParams] = useSearchParams();



  useEffect(() => {
    if (searchParams.toString()) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  useEffect(() => {
    const isShowBanner = localStorage.getItem('showInstructionBanner');
    if (isShowBanner === 'false') {
      setShowInstructionBanner(false);
    } else {
      setShowInstructionBanner(true);
    }
  }, []);





  const handleDisableStatus = async (id, status) => {
    setIsLoading(true);
    const updatedData = { id, status: status === 'activate' ? 'deactivate' : 'activate' };
    fetcher.submit(updatedData, { method: 'put', action: `/app/component/${id}` });
    //console.log(id, status);
  }

  const handleDeleteComponent = async (id) => {
    setIsLoading(true);
    const updatedData = { id };
    fetcher.submit(updatedData, { method: 'delete', action: `/app/component/${id}` });
    shopify.modal.show('delete-confirmation-modal');
  }


  const handleDuplicateComponent = async (id) => {
    setIsLoading(true);
    const updatedData = { id };
    fetcher.submit(updatedData, { method: 'post', action: `/app/component/${id}` });
  }
  useEffect(() => {
    if (fetcher.data?.success) {
      setIsLoading(false);
      shopify.toast.show(fetcher.data.message, {
        duration: 2000,
      });
    }
  }, [fetcher?.data]);




  return (
    navigation.state === "loading" ? <LoadingSkeleton /> :

      <s-page
        inlineSize="base"
      >
        <s-query-container>
          <s-stack
            gap="small-300"
            paddingBlockEnd="base"
            paddingBlockStart="large"
          >
            <s-heading type="strong">Bring your products to where your audience already is</s-heading>
            <s-text>Create a component → Copy & embed it on any site → Sell where people scroll. Turn any page into a storefront.</s-text>
          </s-stack>

          <s-stack
            paddingBlockEnd="large"
          >

            {shopData?.plan?.isTestPlan &&
              <TempPlanBannerShow
                btnText="Choose a plan anytime"
                title="Full access unlocked — free for 7 days"
                subtitle={`Trial ends in ${remaingTrialDays} days`}
                description="All premium EmbedUp features are unlocked. Explore embedded products, bundles, and affiliate buy buttons — no payment needed during the trial."
              //remaingTrialDays={remaingTrialDays}
              />
            }
            {showInstructionBanner &&
            
                <div
                  style={{ minHeight: '310px' }}
                >
                  <Instruction
                    setShowInstructionBanner={setShowInstructionBanner}
                  />
                </div>
            
            }

          </s-stack>

          <s-box paddingBlockEnd="large">
            {components?.length > 0 ?
              <s-section padding="none">
                <s-stack
                  direction="inline"
                  justifyContent="space-between"
                  alignItems="center"
                  padding="small small"
                >
                  <s-heading>Componets</s-heading>
                  <s-stack
                    direction="inline"
                    gap="small"
                    alignItems="center"
                  >
                    {isLoading &&
                      <s-spinner accessibilityLabel="Loading" size="base" />
                    }
                    <s-button accessibilityLabel="Show all components" href={`/app/componentslist`} variant="secondary">Show all components</s-button>
                    {shopData?.plan.planName === PLAN_NAME.free && components?.length > 0 &&
                      <UpgradeTooltip />
                    }
                    <s-button icon="plus" accessibilityLabel="Create Component" variant="primary" onClick={() => navigate('/app/createcomponent')}>Create Component</s-button>
                  </s-stack>
                </s-stack>
                <s-table
                  loading={fetcher.state !== 'idle'}
                >
                  <s-table-header-row>
                    <s-table-header listSlot="primary">Component Name</s-table-header>
                    <s-table-header listSlot="inline">Applies to</s-table-header>
                    <s-table-header listSlot="inline">Add to cart type</s-table-header>
                    <s-table-header listSlot="labeled">Total orders</s-table-header>
                    <s-table-header listSlot="labeled">Value</s-table-header>
                    <s-table-header listSlot="labeled">Status</s-table-header>
                    <s-table-header listSlot="labeled">Actions</s-table-header>
                  </s-table-header-row>

                  <s-table-body>
                    {components.map((
                      { id, title, addToCartType, status, appliesTo, componentSettings, totalOrderCount, totalOrderValue },
                      index,
                    ) => (
                      <s-table-row key={id}
                        clickDelegate={'spc_cmp_' + id}
                      >
                        <s-table-cell><s-link id={'spc_cmp_' + id} accessibilityLabel="Edit Component" onClick={() => navigate(`/app/component/${id}`)} /> {title}</s-table-cell>
                        <s-table-cell>
                          <s-text>{appliesTo === 'product' ? 'Product' : 'Collection'}</s-text>
                        </s-table-cell>

                        <s-table-cell>
                          <s-text>{addToCartType?.type === 'individual' && componentSettings?.cartBehavior === 'cart' ? 'Individual add to cart' : addToCartType?.type === 'individual' && componentSettings?.cartBehavior === 'bulk' ? 'Bulk add to cart' : addToCartType?.type === 'individual' && componentSettings?.cartBehavior === 'checkout' ? 'Individual checkout' : 'Bulk checkout'}</s-text>
                        </s-table-cell>
                        <s-table-cell>{totalOrderCount}</s-table-cell>
                        <s-table-cell>
                          {getSymbolFromCurrency(shopData?.currencyCode) + (totalOrderValue || 0).toFixed(2)}
                        </s-table-cell>
                        <s-table-cell>
                          {status === 'activate' ? <s-badge tone="success">Activate</s-badge> : <s-badge tone="critical-strong">Deactivate</s-badge>}
                        </s-table-cell>
                        <s-table-cell>
                          <s-button accessibilityLabel="More" variant="tertiary" icon="menu-horizontal"
                            commandFor={`component-popover_` + id}
                            command='--show'
                          />
                          <s-menu id={`component-popover_` + id} inlineSize="8">
                            <s-button accessibilityLabel="View component" icon="edit" href={`/app/component/${id}`}>View/Edit</s-button>
                            <s-button
                              icon={status === 'activate' ? 'disabled' : 'check-circle'}
                              accessibilityLabel="Component Status change"
                              onClick={() => {
                                handleDisableStatus(id, status);
                              }}>{status === 'activate' ? 'Deactivate' : 'Activate'}</s-button>
                            <s-button
                              icon="duplicate"
                              accessibilityLabel="Duplicate component"
                              disabled={shopData?.plan?.planName === PLAN_NAME.free && components?.length > 0 ? true : false}
                              onClick={() => {
                                handleDuplicateComponent(id);
                              }}
                            >Duplicate</s-button>

                            <s-button
                              icon="delete"
                              tone="critical"
                              accessibilityLabel="Delete component"
                              commandFor={`component_delete_modal_` + id}
                              command='--show'
                            >Delete</s-button>
                          </s-menu>

                          <s-modal id={`component_delete_modal_` + id} heading="Delete component — This action cannot be undone" accessibilityLabel="Delete Component">
                            <s-text>If this component is embedded on any website, those embeds will stop working immediately. This action can’t be undone.</s-text>
                            <s-button accessibilityLabel="Cancel" commandFor={`component_delete_modal_` + id} command='--hide' slot="secondary-actions">Cancel</s-button>
                            <s-button
                              slot="primary-action"
                              variant="primary"
                              tone="critical"
                              accessibilityLabel="Delete"
                              onClick={() => handleDeleteComponent(id)}
                              commandFor={`component_delete_modal_` + id}
                              command='--hide'
                            >Delete</s-button>
                          </s-modal>
                        </s-table-cell>
                      </s-table-row>
                    ))}
                  </s-table-body>
                </s-table>
              </s-section> :
              <EmptyStateGeneric
                title="Create a component"
                text=" Create a component from products or a collection and embed it on any website, blog, or landing page."
                btnText="Create component"
                btnHref="/app/createcomponent"
              />
            }
          </s-box>

          <ProductAvailibilityStatus
            manageUrl={`https://admin.shopify.com/store/${shopData.shopifyDomain.replace('.myshopify.com', '')}/bulk/product?resource_name=Product&edit=status`}
            totalPublishProductCount={totalPublishProduct}
            publishPdUrl={`https://admin.shopify.com/store/${shopData.shopifyDomain.replace('.myshopify.com', '')}/products?catalogs_ids_all=${cataglogId}`}
            notPublishPdUrl={`https://admin.shopify.com/store/${shopData.shopifyDomain.replace('.myshopify.com', '')}/products?catalogs_ids_not=${cataglogId}`}
            notPublishPdCount={totalPd - totalPublishProduct >= 0 ? totalPd - totalPublishProduct : 0}
          />

          <TermsAndConditions />

        </s-query-container>
      </s-page>
  );
}
