import {
  Page,
  Text,
} from "@shopify/polaris";
import { useTranslation } from "react-i18next";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};

export default function Index() {
const {t} = useTranslation()

  return (
    <Page>
      <Text>{t("welcome")}</Text>
    </Page>
  );
}
