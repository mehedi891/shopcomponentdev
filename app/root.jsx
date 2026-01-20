import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import polarisVizStyles from "./styles/polaris-viz.css?url";
import styles from "./styles/global.css?url";
export const links = () => {
  return [
    { rel: "stylesheet", href: styles },
    { rel: "stylesheet", href: polarisVizStyles },
  ];
};
export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="shopify-debug" content="web-vitals" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body style={{
        height:'100%',
        minHeight:'100vh'
      }}>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
