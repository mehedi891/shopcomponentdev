import Backend from "i18next-fs-backend";
import { resolve } from "node:path";
import { RemixI18Next } from "remix-i18next/server";
import i18n from "./i18n"; // your i18n configuration file

let i18next = new RemixI18Next({
  detection: {
    supportedLanguages: i18n.supportedLngs,
    fallbackLanguage: i18n.fallbackLng,
  },
  // This is the configuration for i18next used
  // when translating messages server-side only
  i18next: {
    ...i18n,
    backend: {
      loadPath: resolve("./public/locales/{{lng}}/{{ns}}.json"),
    },
  },
  // The i18next plugins you want RemixI18next to use for `i18n.getFixedT` inside loaders and actions.
  // E.g. The Backend plugin for loading translations from the file system
  // Tip: You could pass `resources` to the `i18next` configuration and avoid a backend here
  plugins: [Backend],
});


// From Rabby Vai -- Not Sure BUG: Use/Remove  
// let i18next = new RemixI18Next({
//   // detection: { supportedLanguages: ["es", "en"], fallbackLanguage: "en" },
//   detection: {
//     supportedLanguages: i18n.supportedLngs,
//     fallbackLanguage: i18n.fallbackLng,
//   },
//   // The config here will be used for getFixedT
//   i18next: {
//     backend: { loadPath: resolve("./public/locales/{{lng}}/{{ns}}.json") },
//   },
//   // This backend will be used by getFixedT
//   backend: Backend,
// });

export default i18next;
