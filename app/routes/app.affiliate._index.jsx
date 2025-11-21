import { useNavigation } from "@remix-run/react";
import { Button, Layout, Page } from "@shopify/polaris";
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";

const Aff = () => {
   const navigation = useNavigation();
  
     return  (navigation.state === "loading" ? <LoadingSkeleton /> :
     <Page>
      <Layout>
        <Layout.Section>
          <Button url="/app/affiliate/new">Create New</Button>
        </Layout.Section>
      </Layout>
     </Page>
     );
}

export default Aff