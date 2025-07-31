import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
// i18next imports
import { useChangeLanguage } from "remix-i18next/react";
import { useTranslation } from "react-i18next";
import i18next from "./i18next.server";
import { existsSync } from "node:fs";
import styles from "./styles/global.css?url";
import { useEffect } from "react";

export const links = () => {
  return [{ rel: "stylesheet", href: styles }];
};

export async function loader({ request }) {
  // First get the language from the request using i18next
  let locale = await i18next.getLocale(request);
  // Parse the URL to get the search parameters
  let { searchParams } = new URL(request.url);
  // Setting the default namespace to 'common'
  let ns = "common";
  // Check if the 'locale' parameter is present in the URL
  if (searchParams.get("locale")) {
    const totalLocale = searchParams.get("locale");
    // Split the 'locale' parameter to get locale and namespace
    let locale_with_ns = searchParams.get("locale")?.split("-");
    // First part is the locale
    // locale = locale_with_ns[0];
    if (
      totalLocale === "zh-CN" ||
      totalLocale === "zh-TW" ||
      totalLocale === "pt-BR" ||
      totalLocale === "pt-PT"
    ) {
      locale = totalLocale;
    } else {
      // First part is the locale
      locale = locale_with_ns[0];
    }
    // Second part is the namespace, default to 'common' if not provided
    ns = (locale_with_ns[1] ? locale_with_ns[1] : "common").toLowerCase();
    // Check if the namespace file exists, default to 'common' if it doesn't
    ns = existsSync("public/locales/" + locale + "/" + ns + ".json")
      ? ns
      : "common";
    // Update the handle object with the new namespace and locale
    handle.i18n = ns;
    handle.lng = locale;
  } else {
    // If 'locale' parameter is not present, use the default values from handle
    locale = handle.lng;
    ns = handle.i18n;
  }
  return { locale: locale, ns: ns };
}

export let handle = {
  // In the handle export, we can add a i18n key with namespaces our route
  // will need to load. This key can be a single string or an array of strings.
  // TIP: In most cases, you should set this to your defaultNS from your i18n config
  // or if you did not set one, set it to the i18next default namespace "translation"
  i18n: "common",
  lng: "en",
};
export default function App() {
 // Get the locale from the loader
  let { locale, ns } = useLoaderData();
  let { i18n } = useTranslation(ns);
  let langShow = locale + (ns == "common" ? "" : ("-" + ns).toUpperCase());
  // This hook will change the i18n instance language to the current locale
  // detected by the loader, this way, when we do something to change the
  // language, this locale will change and i18next will load the correct
  // translation files
  useChangeLanguage(locale);
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);
  useEffect(() => {
    if (typeof shopify !== "undefined" && shopify.loading) {
      shopify.loading(isNavigating);
    }
  }, [isNavigating]);
  return (
    <html lang={langShow} ns={ns} dir={i18n.dir()}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
