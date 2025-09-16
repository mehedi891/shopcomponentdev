import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Divider,
  Icon,
  IndexTable,
  InlineStack,
  Layout,
  Link,
  Page,
  Popover,
  Spinner,
  Text,
} from "@shopify/polaris";
import { DeleteIcon, DisabledIcon, DuplicateIcon, EditIcon, ExternalSmallIcon, LockFilledIcon, MenuHorizontalIcon, QuestionCircleIcon, StatusActiveIcon } from '@shopify/polaris-icons';
import { useTranslation } from "react-i18next";
import { authenticate } from "../shopify.server";
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { useFetcher, useLoaderData, useNavigate, useNavigation, useSearchParams } from "@remix-run/react";
import { useCallback, useEffect, useState } from "react";
import db from "../db.server";
import { TitleBar, useAppBridge, Modal } from "@shopify/app-bridge-react";
import UpgradeTooltip from "../components/UpgradeTooltip/UpgradeTooltip";
import PageTitle from "../components/PageTitle/PageTitle";

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


  if (isFirstInstall && appSubscriptions?.length > 0) {
    shopData = await db.shop.update({
      where: {
        shopifyDomain: session.shop,
      },
      data: {
        isFirstInstall: isFirstInstall === 'true' ? false : true,
        maxAllowedComponents: 10,
        appPlan: appSubscriptions[0].name,
        trialDays: appSubscriptions[0].trialDays,
        plan: {
          upsert: {
            create: {
              planId: appSubscriptions[0].id,
              planName: appSubscriptions[0].name,
              price: appSubscriptions[0]?.lineItems[0]?.plan?.pricingDetails?.price?.amount || 29,
              planStatus: 'active',
            },
            update: {
              planId: appSubscriptions[0].id,
              planName: appSubscriptions[0].name,
              price: appSubscriptions[0]?.lineItems[0]?.plan?.pricingDetails?.price?.amount || 29,
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
        shopifyDomain:session.shop,
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
    success: true
  };
};

export default function Index() {
  const shopify = useAppBridge();
  const { shopData, components, totalPd, totalPublishProduct, cataglogId } = useLoaderData();
  //console.log('components', components);
  const navigate = useNavigate();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const [activePopoverId, setActivePopoverId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showProductStatusBanner, setShowProductStatusBanner] = useState(true);
  const [searchParams] = useSearchParams();
  const togglePopoverActive = useCallback((id) => {
    setActivePopoverId((prevId) => (prevId === id ? null : id));
  }, []);


  useEffect(() => {
    if (searchParams.toString()) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  const handleDisableStatus = async (id, status) => {
    setIsLoading(true);
    setActivePopoverId(null);
    const updatedData = { id, status: status === 'activate' ? 'deactivate' : 'activate' };
    fetcher.submit(updatedData, { method: 'put', action: `/app/component/${id}` });
    //console.log(id, status);
  }

  const handleDeleteComponent = async (id) => {
    setIsLoading(true);
    setActivePopoverId(null);
    const updatedData = { id };
    fetcher.submit(updatedData, { method: 'delete', action: `/app/component/${id}` });
    shopify.modal.show('delete-confirmation-modal');
  }


  const handleDuplicateComponent = async (id) => {
    setIsLoading(true);
    setActivePopoverId(null);
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



  const rowMarkup = components?.length > 0 && components?.map(
    (
      { id, title, addToCartType, status, appliesTo, componentSettings, totalOrderCount, totalOrderValue },
      index,
    ) => (
      <IndexTable.Row
        id={id}
        key={id}
        onClick={() => navigate(`/app/component/${id}`)}
        position={index}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="semibold">
            {title}
          </Text>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="semibold"> {appliesTo === 'product' ? t("applies_to_product") : t("applies_to_collection")}</Text>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="semibold"> {addToCartType?.type === 'individual' && componentSettings?.cartBehavior === 'cart' ? t("individual_add_to_cart") : addToCartType?.type === 'individual' && componentSettings?.cartBehavior === 'bulk' ? t("bulk_add_to_cart") : addToCartType?.type === 'individual' && componentSettings?.cartBehavior === 'checkout' ? 'Individual checkout' : 'Bulk checkout'}</Text>
        </IndexTable.Cell>


        {/* <IndexTable.Cell className="sc-addToCartType">
          <Box paddingInlineStart={'400'}><Text>{totalOrderCount}</Text></Box>
        </IndexTable.Cell>

        <IndexTable.Cell className="sc-addToCartType">
          <Box paddingInlineStart={'300'}><Text>
            {shopData?.currencyCode + ' '

            }
            {
              // orders?.reduce((sum, r) => {
              //   try {
              //     const v = Number(JSON.parse(r.orderObj)?.current_total_price ?? 0);
              //     return sum + (Number.isFinite(v) ? v : 0);
              //   } catch {
              //     return sum;
              //   }
              // }, 0)
              //   .toFixed(2)

              totalOrderValue
            }
          </Text></Box>
        </IndexTable.Cell> */}

        <IndexTable.Cell className="sc-addToCartType">
          {status === 'activate' ? <Badge tone="success">{t("activate")}</Badge> : <Badge tone="critical-strong">{t("deactivate")}</Badge>

          }
        </IndexTable.Cell>

        <IndexTable.Cell>
          <BlockStack inlineAlign="center">
            <Popover
              active={activePopoverId === id}
              activator={
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePopoverActive(id);
                  }}
                  variant="tertiary"
                  size="large"
                  icon={MenuHorizontalIcon}
                >

                </Button>
              }
              autofocusTarget="first-node"
              onClose={togglePopoverActive}
            >
              <Popover.Pane>
                <Box paddingBlockEnd={'0'}>
                  <Card padding={'300'}>
                    <BlockStack align="start" inlineAlign="start" gap={'100'}>
                      <Button
                        icon={EditIcon}
                        tone="success"
                        variant="tertiary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/app/component/${id}`);
                        }}
                      >View/Edit</Button>

                      <Button
                        icon={status === 'activate' ? DisabledIcon : StatusActiveIcon}
                        variant="tertiary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDisableStatus(id, status);
                        }}
                      >{status === 'activate' ? 'Deactivate' : 'Activate'}</Button>


                      {shopData?.plan?.planName === 'Free' && components?.length > 0 ?
                        <Button
                          icon={LockFilledIcon}
                          variant="tertiary"
                          disabled
                          onClick={(e) => {
                            e.stopPropagation();
                            //handleDuplicateComponent(id);
                          }}
                        >{'Duplicate'}</Button>
                        :
                        <Button
                          icon={DuplicateIcon}
                          variant="tertiary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateComponent(id);
                          }}
                        >{'Duplicate'}</Button>
                      }



                      <Box>
                        <Button
                          icon={DeleteIcon}
                          tone="critical"
                          variant="tertiary"
                          onClick={(e) => {
                            e.stopPropagation();
                            //handleDeleteComponent(id);

                            shopify.modal.show(`delete-confirmation-modal_${id}`);

                          }}
                        >Delete</Button>
                        <Modal id={`delete-confirmation-modal_${id}`}>
                          <Box paddingInline={'300'} paddingBlock={'500'} onClick={(e) => { e.stopPropagation() }}>
                            <Text variant="bodyLg">If this component is embedded on any website, those embeds will stop working immediately. This action can’t be undone.</Text>

                          </Box>

                          <Divider />

                          <Box paddingInline={'300'} paddingBlock={'300'}>
                            <InlineStack gap={'200'} align="end">
                              <Button variant="tertiary" onClick={(e) => {
                                e.stopPropagation();
                                shopify.modal.hide(`delete-confirmation-modal_${id}`);
                              }}>Cancel</Button>

                              {status === 'activate' &&
                                <Button
                                  size="slim"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDisableStatus(id, status);
                                  }}
                                  variant="secondary">Disable instead</Button>
                              }
                              <Button tone={"critical"}
                                size="slim"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteComponent(id);
                                }}
                                variant="primary">Delete component</Button>

                            </InlineStack>
                          </Box>

                          <TitleBar title="Delete component? Embeds may break" />



                        </Modal>
                      </Box>

                    </BlockStack>
                  </Card>
                </Box>

              </Popover.Pane>
            </Popover>
          </BlockStack>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );


  return (
    navigation.state === "loading" ? <LoadingSkeleton /> :

      <Page
        fullWidth
      //   title="Bring your products to where your audience already is"
      //   subtitle="Create a component → Copy & embed it on any site → Sell where people scroll. Turn any page into a storefront."
      // backAction={{ onAction: () => navigate('/app') }}
      >

        <PageTitle
          title="Bring your products to where your audience already is"
          subtitle="Create a component → Copy & embed it on any site → Sell where people scroll. Turn any page into a storefront."
          btnDisabled={false}
          backBtnShow={false}
        />



        <Layout>
          <Layout.Section>
            <Box>
              <Card>
                {components && components?.length > 0 ?
                  <Box>
                    <Box paddingBlockEnd={'200'} paddingInlineEnd={'200'}>
                      <InlineStack align="space-between" blockAlign="center">
                        <Text variant="headingLg">
                          {t("components")}
                        </Text>
                        <InlineStack align="end" blockAlign="center">
                          {isLoading &&
                            <Spinner
                              accessibilityLabel="Loading form field"
                              hasFocusableParent={true}
                              size="small"
                            />
                          }

                          {shopData?.plan.planName === 'Free' && components?.length > 0 ?
                            <InlineStack blockAlign="center" gap={'150'}>
                              <UpgradeTooltip />
                              <Button
                                disabled
                                size="large"
                                variant="primary"
                                onClick={() => {
                                  navigate('/app/createcomponent');
                                }}
                              >{t("create_componet")}</Button>
                            </InlineStack>
                            :
                            <Button
                              size="large"
                              variant="primary"
                              onClick={() => {
                                navigate('/app/createcomponent');
                              }}
                            >{t("create_componet")}</Button>
                          }
                        </InlineStack>
                      </InlineStack>
                    </Box>

                    <IndexTable
                      selectable={false}
                      resourceName={{ singular: 'component', plural: 'components' }}
                      itemCount={components?.length}
                      headings={[
                        { title: 'Component Name' },
                        { title: 'Applies to' },
                        { title: 'Add to cart type' },
                        // { title: 'Total orders', alignment: 'start' },
                        // { title: 'Value', alignment: 'start' },
                        { title: 'Status' },
                        { title: 'Actions', alignment: 'center' },
                      ]}
                    >
                      {rowMarkup}
                    </IndexTable>
                  </Box>
                  :
                  <Box>
                    <BlockStack align="center" gap={'100'} inlineAlign="center">
                      <img src="/images/emptyState.png" alt="No Components Found" width={'250'} height={'250'} />

                      <Text>
                        Create a component from products or a collection and embed it on any website, blog, or landing page.
                      </Text>

                      <Box paddingBlockStart={'400'} paddingBlockEnd={'500'}>
                        <Button variant="primary" url="/app/createcomponent">{t("create_componet")}</Button>
                      </Box>
                    </BlockStack>
                  </Box>
                }



              </Card>
            </Box>

            <Box paddingBlock={'400'}>
              <Box width="100%">
                <Card>
                  <BlockStack gap={'300'}>
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="headingMd">Product status</Text>
                      <Link removeUnderline target="_blank" url={`https://admin.shopify.com/store/${shopData.shopifyDomain.replace('.myshopify.com', '')}/bulk/product?resource_name=Product&edit=status`}>Manage availability</Link>
                    </InlineStack>
                    {showProductStatusBanner &&
                      <Banner
                        tone="info"
                        onDismiss={() => { setShowProductStatusBanner(false) }}
                      >
                        <Text>Product publishing to EmbedUp can take 30 minutes to update. Once your products are successfully published your products will be visible on EmbedUp</Text>
                      </Banner>
                    }
                    <Text><Text as="span" fontWeight="bold">{totalPd}</Text> products are available to EmbedUp</Text>

                    <BlockStack gap={'300'} align="start">
                      <InlineStack gap={'400'} blockAlign="center">
                        <Badge
                          tone="success"
                          progress="complete"
                          size="medium"
                        >
                          Published
                        </Badge>
                        <Link removeUnderline target="_blank" url={`https://admin.shopify.com/store/${shopData.shopifyDomain.replace('.myshopify.com', '')}/products?catalogs_ids_all=${cataglogId}`}>{totalPublishProduct} products</Link>
                      </InlineStack>
                      {totalPd - totalPublishProduct >= 0 &&
                        <InlineStack gap={'400'} blockAlign="center">
                          <Badge
                            tone="critical-strong"
                            progress="incomplete"
                            size="medium"
                          >
                            Not published
                          </Badge>
                          <Link removeUnderline target="_blank" url={`https://admin.shopify.com/store/${shopData.shopifyDomain.replace('.myshopify.com', '')}/products?catalogs_ids_not=${cataglogId}`}>{totalPd - totalPublishProduct} products</Link>
                        </InlineStack>
                      }

                    </BlockStack>
                  </BlockStack>
                </Card>
              </Box>
            </Box>

            <Box paddingBlockEnd={'400'}>
              <Card>
                <BlockStack gap={'100'}>
                  <Text variant="headingMd">Terms and conditions</Text>
                  <Text variant="bodyLg">View EmbedUp terms and conditions here at anytime</Text>

                </BlockStack>
                <Box paddingBlockStart={'400'}>

                  <InlineStack gap={'100'}>
                    <Text>You have accepted the</Text>
                    <Link removeUnderline target="_blank" url="https://embedup.com/terms-conditions/">EmbedUp terms and conditions
                    </Link>
                    <Box maxWidth="20px"><Icon tone="interactive" source={ExternalSmallIcon} /></Box>
                  </InlineStack>
                </Box>
              </Card>
            </Box>

            <InlineStack align="center">
              <Box paddingBlockEnd={'400'} maxWidth="max-content">
                <Card>
                  <InlineStack gap={'100'}>
                    <Box maxWidth="20px">
                      <Icon
                        tone="success"
                        source={QuestionCircleIcon}
                      />
                    </Box>
                    <Text>Learn more about</Text>
                    <Link removeUnderline target="_blank" url="https://embedup.com/terms-conditions/">showing your products in EmbedUp</Link>
                  </InlineStack>
                </Card>
              </Box>
            </InlineStack>
          </Layout.Section>
        </Layout>
      </Page>
  );
}
