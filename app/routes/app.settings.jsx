import { useNavigation } from "@remix-run/react";
import { BlockStack, Box, Button, Card, Layout, Page, Text, TextField } from "@shopify/polaris"
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import {
  ViewIcon,
  HideIcon
} from '@shopify/polaris-icons';
import { useState } from "react";


const Settings = () => {
   const [showAccessToken, setShowAccessToken] = useState(false);
    const navigation = useNavigation();
    return (navigation.state === "loading" ? <LoadingSkeleton /> :
        <Page>
            <Layout>
                <Layout.Section>
                    <Box paddingBlock={'500'} maxWidth="500px">
                        <Card>
                            <BlockStack gap="400">
                                <Text variant="headingMd">Change Access Token</Text>
                                <TextField
                                    type={showAccessToken ? "text" : "password"}
                                    name="accessToken"
                                    autoComplete="off"
                                    value="123456789"
                                    onChange={() => {}}
                                    suffix={ <Button variant="plain" onClick={() => setShowAccessToken(!showAccessToken)} size="large" icon={!showAccessToken ? ViewIcon : HideIcon}></Button> }
                                />
                                <Box>
                                    <Button size="large" variant="primary">Update Now</Button>
                                </Box>
                            </BlockStack>
                        </Card>
                    </Box>
                </Layout.Section>
            </Layout>
        </Page>
    )
}

export default Settings