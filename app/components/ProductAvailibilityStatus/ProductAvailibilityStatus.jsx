
const ProductAvailibilityStatus = ({manageUrl="",totalPublishProductCount=0,publishPdUrl="",notPublishPdCount=0,notPublishPdUrl=""}) => {
  return (
    <s-section>
      <s-stack
        direction="inline"
        gap="base"
        alignItems="center"
        justifyContent="space-between"
        paddingBlockEnd="small"
      >
        <s-heading>Product Availibility Status</s-heading>
        <s-link href={manageUrl} target="_blank">Manage availability</s-link>
      </s-stack>

      <s-banner heading="" dismissible tone="info">
        Product publishing to EmbedUp can take 30 minutes to update. Once your products are successfully published your products will be visible on EmbedUp
      </s-banner>

      <s-stack 
        paddingBlockStart="small-300"
        gap="small-100"
      >
        <s-text>{totalPublishProductCount} products are available to EmbedUp</s-text>
        <s-stack
          direction="inline"
          gap="base"
          alignItems="center"
          justifyContent="start"
        >
          <s-badge icon="bolt-filled" tone="success">Published</s-badge>
          <s-link href={publishPdUrl} target="_blank">{totalPublishProductCount} products</s-link>
        </s-stack>

        <s-stack
          direction="inline"
          gap="base"
          alignItems="center"
          justifyContent="start"
        >
          <s-badge icon="in-progress" tone="critical">Not published</s-badge>
          <s-link href={notPublishPdUrl} target="_blank">{notPublishPdCount} products</s-link>
        </s-stack>

      </s-stack>
    </s-section>
  )
}

export default ProductAvailibilityStatus