import { Modal, TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import { Banner, BlockStack, Box, Button, InlineStack, Link, List, MediaCard, Text, TextField, VideoThumbnail } from '@shopify/polaris';
import {
  CheckIcon,
  ClipboardIcon,
} from '@shopify/polaris-icons';
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';
import { useFetcher } from 'react-router-dom';

const HeadlessVerify = ({ showBanner = true, defaultToken = '' }) => {
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [headlessAccessToken, setHeadlessAccessToken] = useState(defaultToken);
  const [progressCondition, setProgressCondition] = useState({
    plan: true,
    headlessTokenInsert: false,
    headlessTokenVerified: false
  });

  const handleVerifyToken = () => {
    const data = {
      headlessAccessToken: headlessAccessToken
    }
    if (headlessAccessToken) {
      fetcher.submit(data, { method: "post", action: "/api/verifytoken" });
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


  const handlePasteToken = async () => {
    const text = await navigator.clipboard.readText();
    setHeadlessAccessToken(text);
    setProgressCondition({
      ...progressCondition,
      headlessTokenInsert: text ? true : false
    });

  }
  const handleShowVideoModal = () => {
    shopify.modal.show('video-tutorial-modal');
  }
  return (
    <Box maxWidth="700px">
      <Box paddingBlockStart={'100'}>
        {showBanner &&
          <Box paddingBlockEnd={'300'}>
            <Banner
              title='Enable native cart drawer'
              tone="warning"
            >
              <Box>
                <BlockStack gap={'200'}>
                  <Text>{t("headless_token_required_msg")}</Text>

                  <InlineStack gap={'400'} blockAlign="center" align='start'>
                    <Button variant="secondary" url="https://apps.shopify.com/headless?utm_source=shopcomponent" target="_blank">Install Headless by Shopify</Button>
                    <Text tone='magic'><Link removeUnderline onClick={handleShowVideoModal}>Learn more</Link></Text>

                    <Modal id="video-tutorial-modal">
                      <TitleBar title="Video Tutorial">
                      </TitleBar>
                      <Box>
                        <InlineStack>
                          <iframe width="100%" height="400px" src="https://www.youtube.com/embed/YcgdmX0iWVk?si=7_HS2qDgbBzXuvKR" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                        </InlineStack>
                      </Box>
                    </Modal>

                  </InlineStack>
                </BlockStack>
              </Box>
            </Banner>
          </Box>
        }

        <Box paddingBlockStart={'0'}>
          <Box background="bg" borderRadius="100" paddingInlineStart={'200'} paddingBlock={'200'}>
            <Box paddingBlockStart={'200'} paddingInlineStart={'200'}>
              <Box paddingBlockEnd={'100'}>
                <Text>Public Access Token</Text>
              </Box>
              <InlineStack align="start" blockAlign="start" gap="200">
                <Box minWidth="75%">
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
                  <Button onClick={handleVerifyToken} variant='primary' loading={fetcher.state === 'loading'} disabled={!headlessAccessToken} size="large">{fetcher.state === 'loading' ? 'Verify' : defaultToken === '' ? 'Verify' : 'Change'}</Button>
                  :
                  <Button size="large" variant="primary" tone="success" icon={CheckIcon}>Verified</Button>
                }
              </InlineStack>
            </Box>
            { defaultToken === '' || fetcher.data?.error  &&
              <Box paddingInlineStart={'200'} paddingInlineEnd={'200'} paddingBlockStart={'300'}>
                <Box paddingBlockEnd={'150'} paddingBlockStart={'400'}>
                  <Text fontWeight="medium">{t("installation_instructions")}:</Text>
                </Box>
                <List type="number">
                  <List.Item><Text>Get started with headless. <Link target="_blank" url="https://apps.shopify.com/headless?utm_source=shopcomponent" removeUnderline>Click Here</Link> to Install</Text></List.Item>
                  <List.Item>
                    <Text>After installation click <Text as='span' fontWeight="medium"> Create Storefront</Text> </Text>
                  </List.Item>
                  <List.Item>
                    <Text>Then click<Text as='span' fontWeight="medium"> Manage </Text> storefront API</Text>
                  </List.Item>
                  <List.Item>
                    <Text>Then<Text as='span' fontWeight="medium"> Copy </Text>'Public access token' and enter above for verify</Text>
                  </List.Item>
                </List>
              </Box>
            }
          </Box>
        </Box>
      </Box>

    </Box>
  )
}

export default HeadlessVerify