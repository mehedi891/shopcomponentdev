
const AnalyticsUpgrade = () => {
  return (
    <div style={{
      gridArea: '1/1', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.35)',
      backdropFilter: 'blur(2px)',
      WebkitBackdropFilter: 'blur(3px)',
      borderRadius: '30px'
    }}>

      <s-stack
        gap="small-300"
        alignItems="center"
        background="base"
        border="small"
        borderRadius="large"
        inlineSize="250px"
        padding="small small"
      >
        <s-heading type="strong">Unlock features</s-heading>
        <s-text>Upgrade your plan to unlock and continue using advanced analytics features. Please <s-link href="/app/plans/" tone="auto">Upgrade Plan</s-link></s-text>
      </s-stack>
    </div>
  )
}

export default AnalyticsUpgrade