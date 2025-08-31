import { useNavigate } from "@remix-run/react";
import { BlockStack, Box, Button, InlineStack, Text } from "@shopify/polaris";
import { ArrowLeftIcon } from "@shopify/polaris-icons";


const PageTitle = ({ btnDisabled = false, title = '', backBtnShow = true, subtitle = '' }) => {
  const navigate = useNavigate();
  return (
    <Box paddingBlockEnd={'400'}>
      <InlineStack align="start" blockAlign="center" gap={'200'}>
        {backBtnShow &&
          <Button
            icon={ArrowLeftIcon}
            disabled={btnDisabled}
            variant="tertiary"
            onClick={() => { navigate('/app'); }}
          />
        }
        <BlockStack gap={'150'}>
          <Text variant="headingLg">{title}</Text>
          { subtitle === '' ||
            <Text variant="bodyLg">{subtitle}</Text>
          }

        </BlockStack>
      </InlineStack>
    </Box>
  )
}

export default PageTitle