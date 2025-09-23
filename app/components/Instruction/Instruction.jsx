import { Modal, TitleBar, useAppBridge } from "@shopify/app-bridge-react"
import { BlockStack, Box, Card, InlineStack, Link, List, Text, VideoThumbnail } from "@shopify/polaris"

const Instruction = () => {
  const shopify = useAppBridge();
  const handleInstructionModal = () => {
    shopify.modal.show("video-tutorial-modal-instruction");
  }
  return (
    <Box>
      <Modal id="video-tutorial-modal-instruction">
        <TitleBar title="Video Tutorial">
        </TitleBar>
        <Box>
          <InlineStack>
            <iframe width="100%" height="400px" src="https://www.youtube.com/embed/j3Br-xr-mps" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
          </InlineStack>
        </Box>
      </Modal>
      <Card>
        <Text variant="headingMd">How to Create & Embed Your Component</Text>
        <InlineStack align="space-between" gap={'200'} blockAlign="center">
          <Box minWidth="49%">
            <Card background="bg-surface-secondary">
              <Box paddingBlock={'300'}>
                <List type="number" gap="loose">
                  <List.Item>
                    <BlockStack gap={"50"}>
                      <Text variant="headingSm">Create a component</Text>
                      <Text variant="bodyMd">Select your desired products,collections,and layout. <Text as="span"><Link removeUnderline url="https://embedup.com/academy/how-to-display-your-store-products-on-other-websites-outside-of-shopify/" target="_blank"> [See how →]</Link></Text></Text>
                    </BlockStack>
                  </List.Item>
                  <List.Item>
                    <BlockStack gap={"50"}>
                      <Text variant="headingSm">Customize settings</Text>
                      <Text variant="bodyMd">Adjust design, and options to match your store’s needs. </Text>
                    </BlockStack>
                  </List.Item>
                  <List.Item>
                    <BlockStack gap={"50"}>
                      <Text variant="headingSm">Save your component</Text>
                      <Text variant="bodyMd">Your component is now ready to use.</Text>
                    </BlockStack>
                  </List.Item>
                  <List.Item>
                    <BlockStack gap={"50"}>
                      <Text variant="headingSm">Copy the embed code</Text>
                      <Text variant="bodyMd">One click to copy your unique code snippet.</Text>
                    </BlockStack>
                  </List.Item>
                  <List.Item>
                    <BlockStack gap={"50"}>
                      <Text variant="headingSm">Embed anywhere</Text>
                      <Text variant="bodyMd">Paste the code into your external website, blog, or landing page.
                        {/* <Text as="span"><Link url="#" target="_blank"> See Guideline</Link></Text> */}
                        </Text>
                    </BlockStack>
                  </List.Item>
                </List>
              </Box>
            </Card>
          </Box>
          <Box className="Polaris-Box spc_videoThumbnail" minWidth="49%">

            <VideoThumbnail
              // videoLength={222}
              onClick={handleInstructionModal}
              thumbnailUrl={"/images/demo_video.webp"}
            />
          </Box>
        </InlineStack>

      </Card>
    </Box>
  )
}

export default Instruction