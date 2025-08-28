import { Box, Icon, Tooltip } from "@shopify/polaris"
import { LockFilledIcon } from "@shopify/polaris-icons"


const UpgradeTooltip = () => {
  return (
    <Box maxWidth="30px">
      <Tooltip padding="300" preferredPosition="above" content={'Upgrade your plan to create more components'}>
        <Icon source={LockFilledIcon} />
      </Tooltip>
    </Box>
  )
}

export default UpgradeTooltip