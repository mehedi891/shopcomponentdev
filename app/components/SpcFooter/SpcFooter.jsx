import { Box, Button, InlineStack, Text } from "@shopify/polaris"
import { capitalizeFirstCaracter } from "../../spc-front-react/spc-front-components/utilities/utilisFnc"

const SpcFooter = ({plan}) => {
  return (

    <Box paddingInline={'300'} paddingBlockStart={'600'} className="spc-footer Polaris-Box">
      <Box borderBlockStartWidth="025" borderColor="border-tertiary" paddingBlockEnd={'200'} paddingBlockStart={'300'}>
      <InlineStack align="space-between" blockAlign="center" gap="200">
        <Box>
          <InlineStack gap={'200'} blockAlign="center">
            <Button url="https://embedup.com/" target="_blank" variant="tertiary">
              <img className="spc-footer-img" src="/images/spcLogonew.png" alt="EmbedUp" />
            </Button>
            <Text>|</Text>
            <Button  url="/app/getsupport/" variant="tertiary">Get support</Button>
          </InlineStack>
        </Box>

        <Box>
          <InlineStack gap={'200'} blockAlign="center">
            <Text>Plan - <Text as="span" fontWeight="bold">{plan?.planName} ({capitalizeFirstCaracter(plan?.planType) + ' plan'})</Text></Text>
            <Text>|</Text>
            <Button variant="tertiary" url="https://efoli.com" target="_blank"><InlineStack gap={'100'}>
              <Text>Powered By</Text><img className="spc-footer-img" src="/images/efoli_logo.svg" alt="efoli" />
            </InlineStack></Button>
          </InlineStack>
        </Box>
      </InlineStack>
      </Box>
    </Box>
  )
}

export default SpcFooter