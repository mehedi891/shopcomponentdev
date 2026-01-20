
const EmptyStateGeneric = ({
  title="Opps!!! No affiliate found",
  text=" Create a new affiliate to get started",
  btnText="Create a affiliate",
  btnHref="/app/affiliate/new"
}) => {
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
            <s-heading>{title}</s-heading>
            <s-paragraph >{text}</s-paragraph>
          </s-stack>
          <s-button-group>
            <s-button slot="primary-action" variant="primary" icon="plus" href={btnHref} aria-label="Create a new">
              {" "}
              {btnText}{" "}
            </s-button>
          </s-button-group>
        </s-grid>
      </s-grid>
    </s-section>
  )
}

export default EmptyStateGeneric