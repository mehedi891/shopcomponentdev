
const TermsAndConditions = () => {
  return (
    <s-stack
      paddingBlockStart="large"
      gap="large"
    >
      <s-section>
        <s-stack

          gap="small-300"
        >
          <s-heading>Terms and Conditions</s-heading>
          <s-text>View EmbedUp terms and conditions here at anytime</s-text>
          <s-stack
            direction="inline"
            alignItems="center"
            gap="small-300"
          >
            <s-text>You have accepted the </s-text>
            <s-link target="_blank" href="https://embedup.com/terms-conditions/">EmbedUp terms and conditions</s-link>
            <s-icon type="transfer-internal" tone="info" />
          </s-stack>

        </s-stack>
      </s-section>

      <s-stack
      alignItems="center"
      >
        <s-box
          maxInlineSize="500px"
          alignSelf="center"
        >
          <s-section>
            <s-stack
              direction="inline"
              alignItems="center"
              gap="small-300"
            >
              <s-icon type="question-circle" tone="success" />
              <s-text>Learn more about</s-text>
              <s-link target="_blank" href="https://embedup.com/terms-conditions/">showing your products in EmbedUp</s-link>
            </s-stack>
          </s-section>
        </s-box>
      </s-stack>
    </s-stack>
  )
}

export default TermsAndConditions