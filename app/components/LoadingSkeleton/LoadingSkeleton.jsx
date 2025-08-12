import {
    SkeletonPage,
    Layout,
    SkeletonBodyText,
    SkeletonDisplayText,
    Card,
    BlockStack,
    Box,
  } from "@shopify/polaris";

const LoadingSkeleton = () => {
    return (
        <SkeletonPage primaryAction>
            <Layout>
                <Layout.Section>
                    <Card sectioned>
                        <SkeletonBodyText lines={4} />
                    </Card>
                    <Box paddingBlock={'500'}>
                        <Card sectioned>
                            <BlockStack>
                                <Box paddingBlockEnd={'400'}>
                                    <SkeletonDisplayText size="large" />
                                </Box>
                                <SkeletonBodyText />
                            </BlockStack>
                        </Card>
                    </Box>
                    <Card sectioned>
                        <BlockStack>
                            <Box paddingBlockEnd={'400'}>
                                <SkeletonDisplayText size="large" />
                            </Box>
                            <SkeletonBodyText />
                        </BlockStack>
                    </Card>
                </Layout.Section>
                <Layout.Section variant="oneThird">
                    <Card>
                        <Layout.Section>
                            <BlockStack>
                                <Box paddingBlockEnd={'400'}>
                                    <SkeletonDisplayText size="small" />
                                </Box>
                                <SkeletonBodyText lines={2} />
                            </BlockStack>
                        </Layout.Section>
                        <Layout.Section>
                            <SkeletonBodyText lines={1} />
                        </Layout.Section>
                    </Card>
                    <Box paddingBlock={'500'}>
                        <Card subdued>
                            <Layout.Section>
                                <BlockStack>
                                    <Box paddingBlockEnd={'400'}>
                                        <SkeletonDisplayText size="small" />
                                    </Box>
                                    <SkeletonBodyText lines={2} />
                                </BlockStack>
                            </Layout.Section>
                            <Layout.Section>
                                <SkeletonBodyText lines={2} />
                            </Layout.Section>
                        </Card>
                    </Box>
                </Layout.Section>
            </Layout>
        </SkeletonPage>
    )
}

export default LoadingSkeleton