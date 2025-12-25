import { useFetcher, useLoaderData, useNavigation } from "@remix-run/react";
import { BlockStack, Box, Card, InlineStack, Layout, Page, RadioButton, Text } from "@shopify/polaris"
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";


import { authenticate } from "../shopify.server";
import db from "../db.server";
import HeadlessVerify from "../components/HeadlessVerify/HeadlessVerify";
import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
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
        shopData: shop,

    };
}

const Settings = () => {
    const { shopData } = useLoaderData();
    const shopify = useAppBridge();
    const navigation = useNavigation();
    const fetcher = useFetcher();
    const [disableApp, setDisableApp] = useState(
        shopData?.appDisabled ? "yes" : "no"
    );

    //console.log('totalproduct', totalproduct);

    //console.log('PD:', totalPd, 'PB:', totalPublishProduct);

    useEffect(() => {
        if (fetcher?.data?.success) {
            shopify.toast.show('App Status updted Successfully', { duration: 2000 });
        }

    }, [fetcher]);

    const handlechangeAppDisabled = (data) => {
        setDisableApp(data)
        const formData = { appDisabled: data === 'yes' ? true : false };
        fetcher.submit(formData, { method: 'post' });
    }


    return (navigation.state === "loading" ? <LoadingSkeleton /> :
        // <Page narrowWidth>
        //     <Layout>
        //         <Layout.Section>
        //             <BlockStack gap={'300'} align="center" inlineAlign="center">

        //                 <Box width="100%">
        //                     <Card>
        //                         <BlockStack gap={'200'}>
        //                             <Text>Disable App</Text>
        //                             <Box>
        //                                 <InlineStack gap={'150'} blockAlign="center">
        //                                     <RadioButton
        //                                         name="appDisable"
        //                                         value="no"
        //                                         label="No"
        //                                         checked={disableApp === "no"}
        //                                         onChange={() => handlechangeAppDisabled('no')}
        //                                     />

        //                                     <RadioButton
        //                                         name="appDisable"
        //                                         value="yes"
        //                                         label="Yes"
        //                                         checked={disableApp === "yes"}
        //                                         onChange={() => handlechangeAppDisabled('yes')}
        //                                     />

        //                                 </InlineStack>
        //                             </Box>
        //                         </BlockStack>
        //                     </Card>
        //                 </Box>
        //             </BlockStack>
        //         </Layout.Section>
        //     </Layout>
        // </Page>

        <s-page
        inlineSize="small"
        >
            <s-query-container>
                <s-stack padding="large-100 none large none">
                    <s-section>
                        <s-choice-list
                            label="Disable App"
                            name="appDisable"
                            details="Warning: Disabling the app will stop all components from working and remove them from all embedded locations."
                            onChange={(e) => handlechangeAppDisabled(e.target.values[0])}
                        >
                            
                            <s-choice defaultSelected={disableApp === "no"} value="no">No</s-choice>
                            <s-choice defaultSelected={disableApp === "yes"}  value="yes">Yes</s-choice>
                        </s-choice-list>
                    </s-section>
                </s-stack>
            </s-query-container>
        </s-page>
    )
}

export default Settings


export const action = async ({ request }) => {
    const formData = await request.formData();
    const appDisabled = formData.get('appDisabled') === 'true' ? true : false;
    const { session } = await authenticate.admin(request);

    const shopData = await db.shop.update({
        where: {
            shopifyDomain: session.shop
        },
        data: {
            appDisabled
        }
    });

    if (shopData?.id) {
        return {
            success: true,
        }
    }
    return {
        success: false,
    }
}