import { BlockStack, Box, Button, Checkbox, Icon, InlineStack, Text, TextField } from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons"
import { useTranslation } from "react-i18next";


const BulkSelectPdSk = () => {
  const { t } = useTranslation();
  return (
    <Box className="Polaris-Box btncollapsibleHidden" aria-disabled="true">
    
        <Box padding={'300'}>
          <InlineStack blockAlign="center" align="space-between">
            

            <Box width="78%">
              <TextField
                type="text"
                autoSize
                name="productSearchQuery"
                value={''}
                onChange={(value) => { }}
                autoComplete="off"
                placeholder={t("browse_products")}
                prefix={<Icon source={SearchIcon} />}
              />
            </Box>

            <Button onClick={() => {}} size="large">Browse</Button>
          </InlineStack>

        </Box>

        

        <Box paddingBlockStart={'200'} paddingInline={'300'}>
          <Box background="bg-surface-caution" borderRadius="200" padding={'200'}>
            <Text variant="bodySm">{t("product_max_limit_msg")}</Text>
          </Box>
        </Box>

        <Box paddingBlock={'400'} paddingInline={'300'}>
          <BlockStack gap={'400'}>
            <Box borderRadius="100" padding={'400'} background="bg-surface-secondary">
              
                  <BlockStack gap="200">
                    <Checkbox
                      label={t("fixed_qty")}
                      
                    />
                    <Checkbox
                      label={t("enable_qty_field")}
                    
                    />
                  </BlockStack>
                
              

            </Box>
          </BlockStack>
        </Box>
      </Box>

  )
}

export default BulkSelectPdSk