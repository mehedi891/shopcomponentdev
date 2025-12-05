

const UpgradeTooltip = () => {
  return (
    <s-box maxInlineSize="30px">
      <s-tooltip id="spc-tooltip">Upgrade your plan to use this feature</s-tooltip>
      <s-icon
        interestFor="spc-tooltip"
        accessibilityLabel="tooltip"
        type="lock"
      />
    </s-box>
  )
}

export default UpgradeTooltip