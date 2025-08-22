import {
  ActionList,
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  EmptySearchResult,
  EmptyState,
  Icon,
  IndexTable,
  InlineStack,
  Layout,
  Page,
  Popover,
  Spinner,
  Text,
} from "@shopify/polaris";
import { CheckCircleIcon, DeleteIcon, DisabledIcon, DuplicateIcon, EditIcon, MenuHorizontalIcon, StatusActiveIcon } from '@shopify/polaris-icons';
import { useTranslation } from "react-i18next";
import { authenticate } from "../shopify.server";
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { useFetcher, useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
import { useCallback, useEffect, useState } from "react";
import db from "../db.server";
import { useAppBridge } from "@shopify/app-bridge-react";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const shopResponse = await admin.graphql(
    `#graphql
            query shopInfo{
                shop{
                  id
                }
        }`,

  );

  const shop = await shopResponse.json();
  const shopData = await db.shop.findUnique({
    where: {
      shopifyDomain: session.shop
    },
    include: {
      components: {
        orderBy: {
          id: 'desc',
        },
      }
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
    //console.log('Token:', scToken.data.storefrontAccessTokenCreate.storefrontAccessToken.accessToken);
    await db.shop.upsert({
      where: {
        shopifyDomain: session.shop,
      },
      update: {
        installationCount: {
          increment: 1,
        },
        scAccessToken: scToken.data.storefrontAccessTokenCreate.storefrontAccessToken.accessToken,
        shopifyShopGid: shop.data.shop.id,
      },
      create: {
        shopifyDomain: session.shop,
        scAccessToken: scToken.data.storefrontAccessTokenCreate.storefrontAccessToken.accessToken,
        installationCount: 1,
        shopifyShopGid: shop.data.shop.id,
      },
    });
  }





  return {
    shopData: shopData,
    success: true
  };
};

export default function Index() {
  const shopify = useAppBridge();
  const { shopData } = useLoaderData();
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
  const rowMarkup = shopData?.components?.length > 0 && shopData?.components?.map(
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

                    <Button
                      icon={DuplicateIcon}
                      variant="tertiary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateComponent(id);
                      }}
                    >{'Duplicate'}</Button>

                    <Button
                      icon={DeleteIcon}
                      tone="critical"
                      variant="tertiary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteComponent(id);
                      }}
                    >Delete</Button>
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
        title={t("components")}
        // backAction={{ onAction: () => navigate('/app') }}
      >
        <Layout>
          <Layout.Section>
            <Box>
              <Card>
                {shopData && shopData?.components?.length > 0 ?
                  <Box>
                    <Box paddingBlockEnd={'200'}>
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="headingLg">
                    {''}
                  </Text>
                  <InlineStack align="end" blockAlign="center">
                    {isLoading &&
                      <Spinner
                        accessibilityLabel="Loading form field"
                        hasFocusableParent={true}
                        size="small"
                      />
                    }
                  </InlineStack>
                </InlineStack>
              </Box>
                    <IndexTable
                      selectable={false}
                      resourceName={{ singular: 'component', plural: 'components' }}
                      itemCount={shopData?.components?.length}
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
                      heading="Create a component to get started"
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
                        Create a shareable product component that you can embed on any website, blog, or landing page.
                        Customize the layout, design, and behavior to match your brand — and start selling beyond your Shopify store.
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
