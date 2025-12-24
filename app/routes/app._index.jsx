import { useTranslation } from "react-i18next";
import { authenticate } from "../shopify.server";
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { useFetcher, useLoaderData, useNavigate, useNavigation, useSearchParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import db from "../db.server";
import { useAppBridge } from "@shopify/app-bridge-react";
import UpgradeTooltip from "../components/UpgradeTooltip/UpgradeTooltip";
import Instruction from "../components/Instruction/Instruction";
import { MAX_ALLOWED_COMPONENTS, PLAN_NAME } from "../constants/constants";
import EmptyStateGeneric from "../components/EmptyStateGeneric/EmptyStateGeneric";
import ProductAvailibilityStatus from "../components/ProductAvailibilityStatus/ProductAvailibilityStatus";
import TermsAndConditions from "../components/TermsAndConditions/TermsAndConditions";


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
    include: {
      components: {
        orderBy: {
          id: 'desc',
        },
      },
      plan: true
    }
  });



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
      include: {
        components: {
          orderBy: {
            id: 'desc',
          },
        },
        plan: true
      }
    });
  }

  const url = new URL(request.url);
  const isFirstInstall = url.searchParams.get('isFirstInstall');
  const planType = url.searchParams.get('planType');
  const chargeId = url.searchParams.get('charge_id');
  const planName = url.searchParams.get('planName');


  if (isFirstInstall && appSubscriptions?.length > 0) {
    shopData = await db.shop.update({
      where: {
        shopifyDomain: session.shop,
      },
      data: {
        isFirstInstall: isFirstInstall === 'true' ? false : true,
        maxAllowedComponents: planName === PLAN_NAME.growth ? MAX_ALLOWED_COMPONENTS.growth : MAX_ALLOWED_COMPONENTS.pro,
        appPlan: appSubscriptions[0].name,
        trialDays: appSubscriptions[0].trialDays,
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
            },
            update: {
              planId: appSubscriptions[0].id,
              planName: appSubscriptions[0].name,
              price: appSubscriptions[0]?.lineItems[0]?.plan?.pricingDetails?.price?.amount || 29,
              isTestCharge: appSubscriptions[0].test,
              planType,
              chargeId,
            },
          },
        },
      },
      include: {
        plan: true
      }
    });
  }


  const components = await db.component.findMany({
    where: {
      shopId: shopData.id,
      softDelete: false,
    },
    orderBy: {
      id: 'desc',
    }
  });


  const totalPdJson = await admin.graphql(
    `#graphql
            query {
                productsCount(query:null) {
                count
                }
            }`,
  );
  const totalproduct = await totalPdJson.json();


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
      include: {
        components: {
          orderBy: {
            id: 'desc',
          },
        },
        plan: true
      }
    });

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
        "publicationId": shopData?.publicationId
      },
    },
  );
  const totalPublishSpcJson = await totalPublishSpc.json();



  if (!shopData?.plan) {
    throw redirect('/app/plans');
  }




  return {
    shopData: shopData,
    components: components || [],
    hasActivePayment,
    totalPd: totalproduct?.data?.productsCount?.count ?? 0,
    totalPublishProduct: totalPublishSpcJson?.data?.publishedProductsCount?.count ?? 0,
    cataglogId: shopData?.appCatalogId ? shopData?.appCatalogId.replace('gid://shopify/AppCatalog/', '') : '',
    success: true,
    appSubscriptions: appSubscriptions[0]
  };
};

export default function Index() {
  const shopify = useAppBridge();
  const { shopData, components, totalPd, totalPublishProduct, cataglogId } = useLoaderData();
  //console.log('components:', components);
  const navigate = useNavigate();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();



  useEffect(() => {
    if (searchParams.toString()) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

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
            <s-text type="strong">Bring your products to where your audience already is</s-text>
            <s-text>Create a component → Copy & embed it on any site → Sell where people scroll. Turn any page into a storefront.</s-text>
          </s-stack>

          <s-stack
            paddingBlockEnd="large"
          >
            <Instruction />
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
                  loading={fetcher.state !== 'idle'}
                >
                  <s-table-header-row>
                    <s-table-header listSlot="primary">Component Name</s-table-header>
                    <s-table-header listSlot="inline">Applies to</s-table-header>
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
                          <s-text>{appliesTo === 'product' ? t("applies_to_product") : t("applies_to_collection")}</s-text>
                        </s-table-cell>
                        <s-table-cell>
                          <s-text>{addToCartType?.type === 'individual' && componentSettings?.cartBehavior === 'cart' ? t("individual_add_to_cart") : addToCartType?.type === 'individual' && componentSettings?.cartBehavior === 'bulk' ? t("bulk_add_to_cart") : addToCartType?.type === 'individual' && componentSettings?.cartBehavior === 'checkout' ? 'Individual checkout' : 'Bulk checkout'}</s-text>
                        </s-table-cell>
                        <s-table-cell>
                          {shopData?.currencyCode + ' '}
                          {
                            totalOrderValue ?? 0
                          }
                        </s-table-cell>
                        <s-table-cell>
                          {status === 'activate' ? <s-badge tone="success">{t("activate")}</s-badge> : <s-badge tone="critical-strong">{t("deactivate")}</s-badge>}
                        </s-table-cell>
                        <s-table-cell>
                          <s-button accessibilityLabel="More" variant="tertiary" icon="menu-horizontal"
                            commandFor={`component-popover_` + id}
                            command='--show'
                          />
                          <s-popover id={`component-popover_` + id} inlineSize="8">
                            <s-stack slots="children" direction="block" padding="small small">
                              <s-button href={`/app/component/${id}`} accessibilityLabel="See details" icon="edit" variant="tertiary"
                              >
                                View/Edit
                              </s-button>

                              <s-button
                                icon={status === 'activate' ? 'disabled' : 'check-circle'}
                                variant="tertiary"
                                accessibilityLabel="Status Change"
                                onClick={() => {
                                  handleDisableStatus(id, status);
                                }}
                                commandFor={`component-popover_` + id}
                                command='--hide'
                              >{status === 'activate' ? 'Deactivate' : 'Activate'}</s-button>

                              <s-button
                                icon={'duplicate'}
                                variant="tertiary"
                                accessibilityLabel="Duplicate"
                                disabled={shopData?.plan?.planName === PLAN_NAME.free && components?.length > 0 ? true : false}
                                commandFor={`component-popover_` + id}
                                command='--hide'
                                onClick={() => {
                                  handleDuplicateComponent(id);
                                }}
                              >{'Duplicate'}</s-button>

                              <s-button
                                icon="delete"
                                tone="critical"
                                variant="tertiary"
                                accessibilityLabel="Delete"
                                commandFor={`component_delete_modal_` + id}
                                command='--show'
                              >Delete</s-button>
                            </s-stack>
                          </s-popover>

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
            notPublishPdCount = {totalPd - totalPublishProduct >= 0 ? totalPd - totalPublishProduct : 0}
          />

          <TermsAndConditions/>

        </s-query-container>
      </s-page>
  );
}
