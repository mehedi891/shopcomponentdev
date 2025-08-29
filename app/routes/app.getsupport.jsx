import { useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
import { Bleed, BlockStack, Box, Button, Card, Grid, Icon, Layout, Page, Text } from "@shopify/polaris"
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { ChatIcon, PhoneIcon, EmailIcon, LogoYoutubeIcon, NoteIcon } from "@shopify/polaris-icons";
import { Trans, useTranslation } from "react-i18next";
import { authenticate } from "../shopify.server";
import db from "../db.server";


export const loader = async ({ request }) => {
  const { session, redirect } = await authenticate.admin(request);

  const shop = await db.shop.findUnique({
    where: {
      shopifyDomain: session.shop
    },
    include: {
      plan: true
    }
  });

  if (!shop?.plan) {
    throw redirect('/app/plans')
  }

  return {
    shopData: shop
  };
}

const Getsupport = () => {
  const { shopData } = useLoaderData();
  //console.log(shopData);
  const navigation = useNavigation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (navigation.state === "loading" ? <LoadingSkeleton /> :
    <Page
      title={t("get_support")}
      backAction={{ onAction: () => navigate('/app') }}
      fullWidth={false}
    >
      <Layout>
        <Layout.Section>
          <Bleed>
            <BlockStack gap={600}>
              <Grid>
                <Grid.Cell columnSpan={{ xs: 6, lg: 10 }}>
                  <BlockStack gap={400}>
                    <Box padding={200}></Box>
                    <Text variant="headingXl" as="h4">{t("need_assistance_header")}</Text>
                    <Text variant="headingLg" as="h5" fontWeight="regular" tone="subdued">Whether you need a quick fix or detailed guidance, explore our range of support options to find what works best for you.</Text>
                    <Box padding={200}></Box>
                  </BlockStack>
                  <Grid>
                    <Grid.Cell columnSpan={{ xs: 6, md: 3, lg: 4 }}>
                      <Card padding={0}>
                        <BlockStack gap={400} inlineAlign="start">
                          <Box paddingBlock={600} paddingInline={300} width="100%" background="bg-surface-secondary">
                            <div className="supportIcon">
                              <Icon source={ChatIcon} />
                            </div>
                            <Text variant="headingLg" as="h5">{t("live_chat_support")}</Text>
                          </Box>
                          <Box paddingBlockEnd={600} paddingInline={300}>
                            <Box minHeight="6rem">
                              <Text variant="bodyLg" as="p">{t("live_chat_description")}</Text>
                            </Box>
                            <Button size="large" onClick={() => { }}>{t("start_chat")}</Button>
                          </Box>
                        </BlockStack>
                      </Card>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 6, md: 3, lg: 4 }}>
                      <Card padding={0}>
                        <BlockStack gap={400} inlineAlign="start">
                          <Box paddingBlock={600} paddingInline={300} width="100%" background="bg-surface-secondary">
                            <div className="supportIcon">
                              <Icon source={PhoneIcon} />
                            </div>
                            <Text variant="headingLg" as="h5">{t("call_schedule")}</Text>
                          </Box>
                          <Box paddingBlockEnd={600} paddingInline={300}>
                            <Box minHeight="6rem">
                              <Text variant="bodyLg" as="p">{t("call_schedule_description")}</Text>
                            </Box>
                            <Button size="large" url="https://calendly.com/efolisupport" target="_blank">{t("book_call")}</Button>
                          </Box>
                        </BlockStack>
                      </Card>
                    </Grid.Cell>
                    {/* <Grid.Cell columnSpan={{ xs: 6, md: 3, lg: 4 }}>
                        <Card padding={0}>
                          <BlockStack gap={400} inlineAlign="start">
                            <Box paddingBlock={600} paddingInline={300} width="100%" background="bg-surface-secondary">
                              <div className="supportIcon">
                                <Icon source={SendIcon} />
                              </div>
                              <Text variant="headingLg" as="h5">{t("create_a_ticket")}</Text>
                            </Box>
                            <Box paddingBlockEnd={600} paddingInline={300}>
                              <Box minHeight="6rem">
                                <Text variant="bodyLg" as="p">{t("create_ticket_description")}</Text>
                              </Box>
                              <Button size="large" url="/app/tickets">{t("create_support_ticket")}</Button>
                            </Box>
                          </BlockStack>
                        </Card>
                      </Grid.Cell> */}
                    <Grid.Cell columnSpan={{ xs: 6, md: 3, lg: 4 }}>
                      <Card padding={0}>
                        <BlockStack gap={400} inlineAlign="start">
                          <Box paddingBlock={600} paddingInline={300} width="100%" background="bg-surface-secondary">
                            <div className="supportIcon">
                              <Icon source={EmailIcon} />
                            </div>
                            <Text variant="headingLg" as="h5">{t("email_support")}</Text>
                          </Box>
                          <Box paddingBlockEnd={600} paddingInline={300}>
                            <Box minHeight="6rem">
                              <div id="supportEmailDescription">
                                <Trans
                                  i18nKey="email_support_description"
                                  values={{ email: "support@Shopcomponent.com" }}
                                  components={{ strong: <strong /> }}
                                />
                              </div>
                            </Box>
                            <Button onClick={() => { }} id="4" size="large" url={`mailto:support@shopcomponent.com`} target="_blank">{t("email_us")}</Button>
                          </Box>
                        </BlockStack>
                      </Card>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 6, md: 3, lg: 4 }}>
                      <Card padding={0}>
                        <BlockStack gap={400} inlineAlign="start">
                          <Box paddingBlock={600} paddingInline={300} width="100%" background="bg-surface-secondary">
                            <div className="supportIcon">
                              <Icon source={LogoYoutubeIcon} />
                            </div>
                            <Text variant="headingLg" as="h5">{t("youtube_tutorials")}</Text>
                          </Box>
                          <Box paddingBlockEnd={600} paddingInline={300}>
                            <Box minHeight="6rem">
                              <Text variant="bodyLg" as="p">{t("discover_our_wide_range_of_video_tutorials")}</Text>
                            </Box>
                            <Button size="large">{t("watch_videos")}</Button>
                          </Box>
                        </BlockStack>
                      </Card>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 6, md: 3, lg: 4 }}>
                      <Card padding={0}>
                        <BlockStack gap={400} inlineAlign="start">
                          <Box paddingBlock={600} paddingInline={300} width="100%" background="bg-surface-secondary">
                            <div className="supportIcon">
                              <Icon source={NoteIcon} />
                            </div>
                            <Text variant="headingLg" as="h5">{t("help_docs")}</Text>
                          </Box>
                          <Box paddingBlockEnd={600} paddingInline={300}>
                            <Box minHeight="6rem">
                              <Text variant="bodyLg" as="p">{t("explore_our_in_depth_help_documentation")}</Text>
                            </Box>
                            <Button size="large">{t("browse_docs")}</Button>
                          </Box>
                        </BlockStack>
                      </Card>
                    </Grid.Cell>
                  </Grid>
                </Grid.Cell>
              </Grid>
            </BlockStack>
          </Bleed>
        </Layout.Section>
      </Layout>
    </Page>
  )
}

export default Getsupport