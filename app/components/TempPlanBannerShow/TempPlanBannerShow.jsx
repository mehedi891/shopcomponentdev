
const TempPlanBannerShow = ({remaingTrialDays = 0}) => {
  
  return (
    <s-stack paddingBlockEnd="large">
      <s-banner heading={remaingTrialDays > 0 ? ` Your trial period ends in ${remaingTrialDays} day(s).` : ' Your trial period has ended.'} tone="info">
        You are currently on a temporary plan. To continue enjoying all the features, please choose a plan.
        <s-button
          slot="secondary-actions"
          variant="secondary"
          href="/app/plans/"
        >
          Choose plan
        </s-button>

      </s-banner>
    </s-stack>
  )
}

export default TempPlanBannerShow