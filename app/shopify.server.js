import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  hooks: {
    afterAuth: async ({ session, admin }) => {
      const shopResponse = await admin.graphql(
        `#graphql
            query shopInfo{
                shop{
                  id
                }
        }`,

      );

      const shop = await shopResponse.json();


      const createStorefrontAccessToken = await admin.graphql(
        `#graphql
            mutation StorefrontAccessTokenCreate($input: StorefrontAccessTokenInput!) {
              storefrontAccessTokenCreate(input: $input) {
                userErrors {
                  field
                  message
                }
                shop {
                  id
                }
                storefrontAccessToken {
                  
                  accessToken

                }
              }
            }`,
        {
          variables: {
            "input": {
              "title": `sc${session.shop.replace('.myshopify.com', '')}`,
            }
          },
        },
      );

      const scToken = await createStorefrontAccessToken.json();
      console.log('Token:', scToken.data.storefrontAccessTokenCreate.storefrontAccessToken.accessToken);
      await prisma.shop.upsert({
        where: {
          shopifyDomain: session.shop,
        },
        update: {
          installationCount: {
            increment: 1,
          },
        },
        create: {
          shopifyDomain: session.shop,
          scAccessToken: scToken.data.storefrontAccessTokenCreate.storefrontAccessToken.accessToken,
          installationCount: 1,
          shopifyShopGid: shop.data.shop.id,
        },
      });



    }
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
