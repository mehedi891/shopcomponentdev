import { capitalizeFirstCaracter } from "../../utilis/generalUtils"


const SpcFooter = ({ plan }) => {
  return (
    <s-box padding="large-300 small small small" className="spc-footer Polaris-Box">
      <s-stack
        direction="inline"
        gap="base"
        alignItems="center"
        justifyContent="space-between"
        border="base"
        borderWidth="base none none none"
        paddingBlockStart="small-300"
      >

        <s-stack direction="inline" gap="base" maxBlockSize="40px">
          <s-clickable padding="none small-300 none small-300" borderRadius="base" maxInlineSize="120px" minInlineSize="120px" href="https://embedup.com/" target="_blank">
            <s-image
              objectFit="contain"
              aspectRatio="1/0.4"
              loading="lazy"
              src="/images/spcLogonew.png"
              alt="EmbedUp"
              inlineSize="fill"
            />
          </s-clickable>
          <s-stack maxBlockSize="30px" paddingBlockStart="small-200"><s-divider direction="block" color="strong" /></s-stack>
          <s-button href="/app/getsupport/" variant="tertiary">Get support</s-button>
        </s-stack>

        <s-stack direction="inline" gap="base">
          <s-text>Plan-<s-text type="strong">{plan?.planName} ({capitalizeFirstCaracter(plan?.planType) + ' plan'})</s-text></s-text>
          <s-divider direction="block" color="strong" />
          <s-link padding="none small-300 none small-300" borderRadius="base" href="https://efoli.com/" target="_blank">
            <s-image
              objectFit="contain"
              aspectRatio="1/0.2"
              loading="lazy"
              src="/images/efoli_logo.svg"
              alt="Efoli"
              inlineSize="fill"
            />
          </s-link>
        </s-stack>
      </s-stack>
    </s-box>
  )
}

export default SpcFooter