import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { useTranslation } from "react-i18next";
import SpcFooter from "../components/SpcFooter/SpcFooter";
import db from "../db.server";
import TwakTo from "../components/TwakTo/TwakTo";
import { useEffect } from "react";
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
    shopData: shopData || {},
    isDev: process.env.NODE_ENV || "production"
  };
};

export default function App() {
  const { apiKey, shopData, isDev } = useLoaderData();
  const { t } = useTranslation();


  useEffect(() => {
    if (isDev === 'developemt') return;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", "t2ssobpnf1");
  }, []);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
        </Link>
        <Link to="/app" rel="home">
          {t("components")}
        </Link>
        <Link to="/app/createcomponent">{t("create_componet")}</Link>
        <Link to="/app/settings">{t("settings")}</Link>
        <Link rel="affiliate" to="/app/affiliate">Affiliate</Link>
        <Link to="/app/plans">{t("subscription_plan")}</Link>
        <Link to="/app/getsupport">{t("get_support")}</Link>
      </NavMenu>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
        <div style={{ flexGrow: 1 }}>
          <Outlet />
        </div>
        <div style={{ flexFlow: 1 }}>
          <SpcFooter plan={shopData?.plan || ''} />
          { isDev !== 'development' &&
            <TwakTo />
          }

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
