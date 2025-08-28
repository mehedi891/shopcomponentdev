import { Box, Button, InlineStack, Layout, Link, Text } from "@shopify/polaris"

const SpcFooter = ({planName}) => {
  return (

    <Box paddingInline={'300'} paddingBlockStart={'600'} className="spc-footer Polaris-Box">
      <Box borderBlockStartWidth="025" borderColor="border-tertiary" paddingBlockEnd={'200'} paddingBlockStart={'300'}>
      <InlineStack align="space-between" blockAlign="center" gap="200">
        <Box>
          <InlineStack gap={'200'} blockAlign="center">
            <Button url="https://shopcomponent.com/" target="_blank" variant="tertiary">
              <img className="spc-footer-img" src="/images/spcLogo.png" alt="Shopcomponent" />
            </Button>
            <Text>|</Text>
            <Button variant="tertiary">Get support</Button>
          </InlineStack>
        </Box>

        <Box>
          <InlineStack gap={'200'} blockAlign="center">
            <Button variant="tertiary" url="https://efoli.com" target="_blank"><InlineStack gap={'100'}>
              <Text>Powered By</Text><img className="spc-footer-img" src="/images/efoli_logo.svg" alt="efoli" />
            </InlineStack></Button>
            <Text>|</Text>
            <Text>Plan - <Text as="span" fontWeight="bold">{planName}</Text></Text>
          </InlineStack>
        </Box>
      </InlineStack>
      </Box>
    </Box>
  )
}

export default SpcFooter