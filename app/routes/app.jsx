import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { useTranslation } from "react-i18next";
import SpcFooter from "../components/SpcFooter/SpcFooter";
import db from "../db.server";
export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shopData = await db.shop.findUnique({
    where: { shopifyDomain: session.shop },
    select: {
      id: true,
      plan: true,
    },
  });



  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shopData: shopData || {}
  };
};

export default function App() {
  const { apiKey, shopData } = useLoaderData();
  const { t } = useTranslation();
  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app">
          {t("components")}
        </Link>
        <Link to="/app/createcomponent">{t("create_componet")}</Link>
        <Link to="/app/settings">{t("settings")}</Link>
        <Link to="/app/plans">{t("subscription_plan")}</Link>
        <Link to="/app/getsupport">{t("get_support")}</Link>
      </NavMenu>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
        <div style={{ flexGrow: 1 }}>
          <Outlet />
        </div>
        <div style={{ flexFlow: 1 }}>
          <SpcFooter planName={shopData?.plan?.planName || ''} />
        </div>
      </div>



    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
