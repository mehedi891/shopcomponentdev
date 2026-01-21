
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import SpcFooter from "../components/SpcFooter/SpcFooter";
import db from "../db.server";
import TwakTo from "../components/TwakTo/TwakTo";
import { useEffect } from "react";


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
    // eslint-disable-next-line no-undef
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shopData: shopData || {},
    // eslint-disable-next-line no-undef
    isDev: process.env.NODE_ENV || "production"
  };
};

export default function App() {
    const { apiKey, shopData, isDev } = useLoaderData();



  useEffect(() => {
    if (isDev === 'developemt') return;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", "t2ssobpnf1");
  }, [isDev]);

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app" rel="home">Home</s-link>
        <s-link href="/app/component">Components</s-link>
        <s-link href="/app/createcomponent">Create Component</s-link>
        <s-link href="/app/settings">Settings</s-link>
        <s-link href="/app/affiliate">Affiliate</s-link>
        <s-link href="/app/analytics">Analytics</s-link>
        <s-link href="/app/plans">Subscription Plan</s-link>
        <s-link href="/app/getsupport">Get support</s-link>
      </s-app-nav>
      
      <div style={{ height: "100%",minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
        <div style={{ flexGrow: 1 }}>
          <Outlet />
        </div>
        <div style={{ flexGrow: 1,display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <SpcFooter plan={shopData?.plan || ''} />
          {isDev !== 'development' &&
            <TwakTo />
          }

        </div>
      </div>
     
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
// export function ErrorBoundary() {
//   const error = useRouteError();
//   console.error("error", error);
//   return (
//     <AppProvider isEmbeddedApp>
//       <s-page>
//         <s-query-container>
//           <s-box
//             paddingBlockStart="large-200"
//           >
//             <s-section>
//               <s-stack
//                 gap="large"
//                 alignItems="center"
//                 justifyContent="center"
//                 paddingBlockEnd="large"
//               >
//                 <s-image aspectRatio="1/0.3" src="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png" alt='Error' />
//                 <s-stack
//                   gap="small-300"
//                   alignItems="center"
//                   justifyContent="center"
//                 >
//                   <s-heading>Unexpected error</s-heading>
//                   <s-text>We have encountered an unexpected technical issue.</s-text>
//                 </s-stack>
//                 <s-button href="/app" variant="primary">Refresh window</s-button>
//               </s-stack>
//             </s-section>
//           </s-box>
//         </s-query-container>
//       </s-page>
//     </AppProvider>
//   )

// }

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
