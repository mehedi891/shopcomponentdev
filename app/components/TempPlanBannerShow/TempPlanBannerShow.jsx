
const TempPlanBannerShow = ({title="",subtitle="",description="",isBtnShow=true,btnText=""}) => {
  
  return (
    <s-stack paddingBlockEnd="large">
      <s-banner heading={title} tone="info">
        <s-stack gap="small-300">
          {description && <s-paragrapg>{description}</s-paragrapg>}
          {subtitle && <s-heading>{subtitle}</s-heading>}
          {isBtnShow && <s-button href="/app/plans" variant="secondary" >{btnText || 'Choose a plan'}</s-button>}
        </s-stack>
      </s-banner>
    </s-stack>
  )
}

export default TempPlanBannerShow