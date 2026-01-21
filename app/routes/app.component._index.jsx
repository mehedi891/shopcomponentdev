
import { authenticate } from "../shopify.server";
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { useFetcher, useLoaderData, useNavigate, useNavigation } from "react-router";
import { useEffect, useRef, useState } from "react";
import db from "../db.server";
import { useAppBridge } from "@shopify/app-bridge-react";
import UpgradeTooltip from "../components/UpgradeTooltip/UpgradeTooltip";
import { PLAN_NAME } from "../constants/constants";
import EmptyStateGeneric from "../components/EmptyStateGeneric/EmptyStateGeneric";
import getSymbolFromCurrency from "currency-symbol-map";
import { getRemainingTrialDays } from "../utilis/remainTrialDaysCount";



export const loader = async ({ request }) => {

  const { session, admin, billing, redirect } = await authenticate.admin(request);
  const { hasActivePayment, appSubscriptions } = await billing.check();


  let shopData = await db.shop.findUnique({
    where: {
      shopifyDomain: session.shop
    },
    select: {
      id: true,
      shopifyDomain: true,
      currencyCode: true,
      createdAt: true,
      trialDays: true,
      plan: {
        select: {
          id: true,
          planName: true,
          isTestPlan: true,
        }
      },
      scAccessToken: true,
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

        }
      }
    }
  });


  if (!shopData?.plan) {
    throw redirect('/app/plans');
  }

  //  const components = await db.component.findMany({
  //   where: {
  //     shopId: shopData.id,
  //     softDelete: false,
  //   },
  //   orderBy: {
  //     id: 'desc',
  //   },
  //   select: {
  //     id: true,
  //     title: true,
  //     addToCartType: true,
  //     status: true,
  //     appliesTo: true,
  //     componentSettings: true,
  //     totalOrderCount: true,
  //     totalOrderValue: true,

  //   }
  // });


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
        shopifyDomain: true,
        currencyCode: true,
        createdAt: true,
        trialDays: true,
        plan: {
          select: {
            id: true,
            planName: true,
            isTestPlan: true,
          }
        },
        scAccessToken: true,
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

          }
        }
      }
    });
  }

  if (shopData?.plan?.isTestPlan) {
    const remaingTrialDays = getRemainingTrialDays(shopData?.createdAt, shopData?.trialDays);

    if (!shopData?.plan || (shopData?.plan?.isTestPlan && remaingTrialDays < 1)) {
      throw redirect('/app/plans');
    }
  }






  return {
    shopData: shopData,
    success: true,
    appSubscriptions: appSubscriptions[0]
  };
};

export default function Component() {
  const shopify = useAppBridge();
  const { shopData } = useLoaderData();

  const [components, setComponents] = useState(shopData.components || []);
  const navigate = useNavigate();
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const [isLoading, setIsLoading] = useState(false);
  const tableRef = useRef(null);

  useEffect(() => {
    setComponents(shopData.components);
  }, [shopData.components]);

  // const nextPageFnc = () => {
  //   console.log("Next page click");
  // }

  // const prevPageFnc = () => {
  //   console.log("Prev page click");
  // }

  // useEffect(() => {
  //   const el = tableRef.current;
  //   if (!el) return;
  //   el.addEventListener("nextpage", nextPageFnc);
  //   el.addEventListener("previouspage", prevPageFnc);
  //   return () => {
  //     el.removeEventListener("nextpage", nextPageFnc);
  //     el.removeEventListener("previouspage", prevPageFnc);
  //   };
  // }, []);

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


  //  useEffect(() => {

  //     shopify.webVitals.onReport((metric) => {
  //       console.log("Web Vitals CMP LIST:", metric);
  //     });

  //   }, [shopify]);
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
            <s-text type="strong">Showcase your products exactly where your audience already spends their time.</s-text>
            <s-text>Create a component → Copy & embed it on any site → Sell where people scroll. Turn any page into a storefront.</s-text>
          </s-stack>

          <s-stack
            paddingBlockEnd="large"
          >


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
                  <s-text type="strong">Componets</s-text>
                  <s-stack
                    direction="inline"
                    gap="small"
                    alignItems="center"
                  >
                    {isLoading &&
                      <s-spinner accessibilityLabel="Loading" size="base" />
                    }
                    {shopData?.plan.planName === PLAN_NAME.free && components?.length > 0 &&
                      <UpgradeTooltip />
                    }
                    <s-button icon="plus" accessibilityLabel="Create Component" variant="primary" onClick={() => navigate('/app/createcomponent')}>Create Component</s-button>
                  </s-stack>
                </s-stack>
                <s-table
                  ref={tableRef}
                  loading={fetcher.state !== 'idle'}
                // hasPreviousPage
                // hasNextPage
                // paginate
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
                            <s-button icon="edit" accessibilityLabel="Edit Component" href={`/app/component/${id}`}>View/Edit</s-button>
                            <s-button
                              icon={status === 'activate' ? 'disabled' : 'check-circle'} accessibilityLabel="Status Change"
                              onClick={() => {
                                handleDisableStatus(id, status);
                              }}
                            >
                              {status === 'activate' ? 'Deactivate' : 'Activate'}</s-button>

                            <s-button
                              icon="duplicate" accessibilityLabel="Duplicate Component"
                              onClick={() => {
                                handleDuplicateComponent(id);
                              }}
                            >
                              Duplicate</s-button>

                            <s-button
                              icon="delete" accessibilityLabel="Delete Component"
                              commandFor={`component_delete_modal_` + id}
                              command='--show'
                              tone="critical"
                            >
                              Delete</s-button>
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
          <s-box paddingBlockEnd="large-300"></s-box>
        </s-query-container>
      </s-page>
  );
}

export const action = async ({ request }) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);



  return data;
}
