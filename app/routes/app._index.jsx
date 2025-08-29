import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  EmptyState,
  Icon,
  IndexTable,
  InlineStack,
  Layout,
  Link,
  Page,
  Popover,
  Spinner,
  Text,
  Tooltip,
} from "@shopify/polaris";
import { DeleteIcon, DisabledIcon, DuplicateIcon, EditIcon, LockFilledIcon, MenuHorizontalIcon, StatusActiveIcon } from '@shopify/polaris-icons';
import { useTranslation } from "react-i18next";
import { authenticate } from "../shopify.server";
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { useFetcher, useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
import { useCallback, useEffect, useState } from "react";
import db from "../db.server";
import { useAppBridge } from "@shopify/app-bridge-react";
import UpgradeTooltip from "../components/UpgradeTooltip/UpgradeTooltip";

export const loader = async ({ request }) => {

  const { session, admin, billing, redirect } = await authenticate.admin(request);
  const { hasActivePayment } = await billing.check();

  const shopResponse = await admin.graphql(
    `#graphql
            query shopInfo{
                shop{
                  id
                }
        }`,

  );

  const shop = await shopResponse.json();
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

  if (!shopData?.plan) {
    throw redirect('/app/plans');
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
    console.log('Token AppIndex:', scToken?.data?.storefrontAccessTokenCreate?.storefrontAccessToken?.accessToken);
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


  if (isFirstInstall) {
    shopData = await db.shop.update({
      where: {
        shopifyDomain: session.shop,
      },
      data: {
        isFirstInstall: isFirstInstall === 'true' ? false : true,
      },
      include: {
        // components: {
        //   orderBy: {
        //     id: 'desc',
        //   },
        // },
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


  return {
    shopData: shopData,
    components: components || [],
    hasActivePayment,
    success: true
  };
};

export default function Index() {
  const shopify = useAppBridge();
  const { shopData, components } = useLoaderData();
  //console.log('shopData', shopData);
  const navigate = useNavigate();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const [activePopoverId, setActivePopoverId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const togglePopoverActive = useCallback((id) => {
    setActivePopoverId((prevId) => (prevId === id ? null : id));
  }, []);


  // useEffect(()=>{
  //   if(!shopData?.plan){
  //     navigate('/app/plans');
  //   }
  // },[shopData]);

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
        duration: 3000,
      });
    }
  }, [fetcher?.data]);
  const rowMarkup = components?.length > 0 && components?.map(
    (
      { id, title, addToCartType, status, appliesTo },
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
          <Text variant="bodyMd" fontWeight="semibold"> {addToCartType?.type === 'individual' ? t("individual_add_to_cart") : t("bulk_add_to_cart")}</Text>
        </IndexTable.Cell>

        <IndexTable.Cell className="sc-addToCartType">
          {status === 'activate' ? <Badge tone="success">{t("activate")}</Badge> : <Badge tone="critical-strong">{t("deactivate")}</Badge>

          }
        </IndexTable.Cell>
        <IndexTable.Cell flush>
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


                    {shopData?.plan?.planName === 'Free' && components?.length > 0 ?
                      <Button
                        icon={LockFilledIcon}
                        tone="critical"
                        variant="tertiary"
                        disabled
                        onClick={(e) => {
                          e.stopPropagation();
                          //handleDeleteComponent(id);
                        }}
                      >Delete</Button>
                      :
                      <Button
                        icon={DeleteIcon}
                        tone="critical"
                        variant="tertiary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteComponent(id);
                        }}
                      >Delete</Button>
                    }
                  </BlockStack>
                </Card>
              </Box>

            </Popover.Pane>
          </Popover>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );


  return (
    navigation.state === "loading" ? <LoadingSkeleton /> :

      <Page
        fullWidth
      // title={t("components")}
      // backAction={{ onAction: () => navigate('/app') }}
      >
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
                        { title: 'Status' },
                        { title: '' },
                      ]}
                    >
                      {rowMarkup}
                    </IndexTable>
                  </Box>
                  :
                  <Box>

                    <EmptyState
                      heading="Create an embeddable storefront widget"
                      action={{
                        content: t("create_componet"),
                        onAction: () => {
                          navigate('/app/createcomponent');
                        }
                      }}
                      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                      fullWidth
                    >
                      <Text>
                        Create a component from products or a collection and embed it on any website, blog, or landing page.
                      </Text>
                    </EmptyState>

                  </Box>
                }
              </Card>
            </Box>
          </Layout.Section>
        </Layout>
      </Page>
  );
}
