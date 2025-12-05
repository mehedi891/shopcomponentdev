
const EmptyStateGeneric = () => {
  return (
    <s-section accessibilityLabel="Empty state section">
      <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
        <s-box maxInlineSize="200px" maxBlockSize="200px">
          {/* aspectRatio should match the actual image dimensions (width/height) */}
          <s-image
            aspectRatio="1/0.5"
            src="https://cdn.shopify.com/static/images/polaris/patterns/callout.png"
            alt="A stylized graphic of four characters, each holding a puzzle piece"
          />
        </s-box>
        <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
          <s-stack alignItems="center">
            <s-heading>Opps!!! No affiliate found</s-heading>
            <s-paragraph>
              Create a new affiliate to get started
            </s-paragraph>
          </s-stack>
          <s-button-group>
            <s-button slot="primary-action" icon="plus" href="/app/affiliate/new" aria-label="Create a new affiliate">
              {" "}
              Create a affiliate{" "}
            </s-button>
          </s-button-group>
        </s-grid>
      </s-grid>
    </s-section>
  )
}

export default EmptyStateGeneric