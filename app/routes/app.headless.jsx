import { useFetcher, useLoaderData, useNavigate, useNavigation } from "@remix-run/react"
import { authenticate } from "../shopify.server"
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton"
import { BlockStack, Box, Button, Card, Divider, Icon, InlineStack, Layout, Link, List, Page, ProgressBar, Text, TextField, Tooltip } from "@shopify/polaris"
import {
  CheckIcon,
  ClipboardIcon,
  InfoIcon
} from '@shopify/polaris-icons';
import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import db from "../db.server"


export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shopData = await db.shop.findUnique({
    where: {
      shopifyDomain: session.shop
    },
    select: {
      id: true,
      shopifyDomain: true,
      headlessAccessToken: true,
    }
    
  });
  if (shopData){
    return {
      shopData: shopData
    }
  }
  return {
    shopData: {}
  }
}




const CheckHeadlessToken = () => {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const {shopData} = useLoaderData();
  //console.log('shopData', shopData);
  const shopify = useAppBridge();
  const [headlessAccessToken, setHeadlessAccessToken] = useState('');
  const [progressCondition, setProgressCondition] = useState({
    plan: true,
    headlessTokenInsert: false,
    headlessTokenVerified: false
  });

  const checkIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512"><g><path d="M256 0C115.39 0 0 115.39 0 256s115.39 256 256 256 256-115.39 256-256S396.61 0 256 0zm-30.981 372.44L112.914 260.336l42.422-42.422 71.646 71.646 143.833-130.752 40.371 44.385L225.019 372.44z" fill="#000000" opacity="1" data-original="#000000"></path></g></svg>;

  const uncheckCircle = <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.625" y="0.625" width="16.75" height="16.75" rx="8.375" fill="none" stroke="#616161" strokeWidth="1.25" strokeDasharray="2 2" />
  </svg>;

  const handleVerifyToken = () => {
    const data = {
      headlessAccessToken: headlessAccessToken
    }
    if (headlessAccessToken) {
      fetcher.submit(data, { method: "post" });
    }

  }

  useEffect(() => {
    if (fetcher.data?.success) {
      setProgressCondition({
        ...progressCondition,
        headlessTokenVerified: true
      });
      shopify.toast.show(t("headless_token_verified_successfully"), { duration: 2000 });
    } else if (fetcher.data?.error) {
      shopify.toast.show(t("headless_token_not_verified"), { duration: 2000 })
    }
  }, [fetcher]);
 

  useEffect(() => {
    if (shopData?.headlessAccessToken) {
      navigate('/app/createcomponent');
    }
  },[shopData])
  const handlePasteToken = async () => {
    const text = await navigator.clipboard.readText();
    setHeadlessAccessToken(text);
    setProgressCondition({
      ...progressCondition,
      headlessTokenInsert: text ? true : false
    });

  }
  return (navigation.state === "loading" ? <LoadingSkeleton /> :
    <Page>
      <Layout>
        <Layout.Section>
          <BlockStack gap={"200"}>
            <Text alignment="center" variant="headingLg">{t("let_take_this_step_by_step")}</Text>
            <Text alignment="center" variant="bodyLg">{t("boost_conversions")}</Text>
          </BlockStack>
        </Layout.Section>
        <Layout.Section>
          <InlineStack align="center">
            <Box maxWidth="700px">
              <Card>
                <Box paddingBlockEnd={"400"}>
                  <InlineStack align="start" blockAlign="center" gap="200">
                    <Text>{progressCondition.plan ? (progressCondition.headlessTokenInsert ? (progressCondition.headlessTokenVerified ? 3 : 2) : 1) : 0}  of 3 {t("tasks_completed")}</Text>
                    <Box width="450px">
                      <ProgressBar
                        tone="primary"
                        progress={progressCondition.plan ? (progressCondition.headlessTokenInsert ? (progressCondition.headlessTokenVerified ? 100 : 66) : 33) : 0}
                        size="small" />
                    </Box>
                  </InlineStack>
                </Box>
                <Divider />

                <Box paddingBlockStart={'400'}>
                  <Box paddingInlineStart={'200'}>
                    <InlineStack align="start" blockAlign="center">
                      <Box width="30px">
                        <span className="Polaris-Icon">
                          {checkIcon}
                        </span>
                      </Box>
                      <Text variant="bodyMd" fontWeight="medium">{t("choose_plan")}</Text>
                    </InlineStack>
                  </Box>
                  <Box paddingBlockStart={'300'}>
                    <Box background="bg" borderRadius="100" paddingInlineStart={'200'} paddingBlock={'200'}>
                      <InlineStack align="start" blockAlign="center">
                        <Box width="30px">
                          <span className="Polaris-Icon">
                            {progressCondition.headlessTokenInsert ? checkIcon : uncheckCircle}
                          </span>
                        </Box>
                        <Text variant="bodyMd" fontWeight="medium">{t("enable_headless")} </Text>
                         <Tooltip active content="Headless app from shopify developer to get Storefront API" padding="300" >
                          <Icon source={InfoIcon} />
                        </Tooltip>
                      </InlineStack>
                      <Box paddingBlockStart={'200'} paddingInlineStart={'200'}>
                        <Box paddingBlockEnd={'100'}>
                          <Text>Public Access Token</Text>
                        </Box>
                        <InlineStack align="start" blockAlign="start" gap="200">
                          <Box minWidth="80%">
                            <TextField
                              type="text"
                              name="accessToken"
                              label="Public Access Token"
                              labelHidden
                              autoComplete="off"
                              value={headlessAccessToken}
                              onChange={(value) => {
                                setHeadlessAccessToken(value);
                                setProgressCondition({
                                  ...progressCondition,
                                  headlessTokenInsert: value ? true : false
                                });
                              }}
                              error={fetcher.data?.error ? t("headless_token_not_verified") : false}
                              placeholder="Enter public access token"
                              size="large"
                              suffix={<Button onClick={handlePasteToken} icon={ClipboardIcon} variant="monochromePlain" />}
                            />
                          </Box>
                          {!fetcher?.data?.sucess ?
                            <Button onClick={handleVerifyToken} loading={fetcher.state === 'loading'} disabled={!headlessAccessToken} size="large">{fetcher.state === 'loading' ? 'Verifying' : 'Verify'}</Button>
                            :
                            <Button size="large" variant="primary" tone="success" icon={CheckIcon}>Verified</Button>
                          }
                        </InlineStack>
                      </Box>
                      <Box paddingInlineStart={'200'} paddingBlockStart={'300'}>
                        <Box paddingBlockEnd={'150'}>
                          <Text fontWeight="medium">{t("installation_instructions")}:</Text>
                        </Box>
                        <List type="number">
                          <List.Item>Get started with headless. <Link target="_blank" url="https://apps.shopify.com/headless?utm_source=shopcomponent" removeUnderline>Click Here</Link> to Install</List.Item>
                          <List.Item>
                            <InlineStack align="start" blockAlign="center" gap="100">
                              <Text>After installation click </Text>
                              <Text fontWeight="medium"> Create Storefront</Text>
                            </InlineStack>
                          </List.Item>
                          <List.Item>
                            <InlineStack align="start" blockAlign="center" gap="100">
                              <Text>Then click</Text><Text fontWeight="medium"> Manage</Text> <Text>storefront API </Text>
                            </InlineStack>
                          </List.Item>
                          <List.Item>
                            <InlineStack align="start" blockAlign="center" gap="100">
                              <Text>Then</Text><Text fontWeight="medium"> Copy</Text> <Text>public access storefront API and enter above for verify</Text>
                            </InlineStack>
                          </List.Item>
                        </List>
                      </Box>
                    </Box>

                    <Box paddingBlock={'300'} paddingInlineStart={'200'}>
                      <InlineStack align="start" blockAlign="center">
                        <Box width="30px">
                          <span className="Polaris-Icon">
                            {progressCondition.headlessTokenVerified ? checkIcon : uncheckCircle}
                          </span>
                        </Box>
                        <Text variant="bodyMd" fontWeight="medium">Create a component</Text>
                      </InlineStack>
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Box>
          </InlineStack>
        </Layout.Section>
      </Layout>
    </Page>
  )
}

export default CheckHeadlessToken


export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const formData = await request.formData();
  const headlessAccessToken = formData.get("headlessAccessToken");

  try {
    const response = await fetch(`https://${session.shop}/api/${process.env.api_version}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': headlessAccessToken,
      },
      body: JSON.stringify({
        query: `
          {
            shop {
              name
            }
          }
        `,
      }),
    });

    const data = await response.json();

    if (data.errors) {
      return {
        success: false,
        data: {},
        error: true
      }
    } else {
      await db.shop.update({
        where: {
          shopifyDomain: session.shop
        },
        data: {
          headlessAccessToken: headlessAccessToken
        }
      });
      return {
        success: true,
        data: {
          shop: data.data.shop.name,
          token: headlessAccessToken
        },
        error: false
      }
    }
  } catch (error) {
    return {
      success: false,
      data: {},
      error: true
    }
  }

}

