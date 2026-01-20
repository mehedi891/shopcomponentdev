import { useNavigate, useNavigation } from "react-router";
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";

const AffiliateAnalytics = () => {
  const navigation = useNavigation();
  const navigate = useNavigate();
  return (
    navigation.state === "loading" ? <LoadingSkeleton /> :
      <s-page inlineSize="base">
        <s-query-container>
         <s-stack
            padding="large-100 none large none"
            direction="inline"
            gap="small"
            justifyContent="start"
            alignItems="center"
          >
            <s-button onClick={() => navigate(-1)} accessibilityLabel="Back to affiliate" icon="arrow-left" variant="tertiary"></s-button>
            <s-text type="strong">Back to Affiliate</s-text>
          </s-stack>

        </s-query-container>
      </s-page>
  )
}

export default AffiliateAnalytics