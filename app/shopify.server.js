import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
export const MONTHLY_PLAN = 'Growth Monthly';
export const ANNUAL_PLAN = 'Growth Annual';
export const FREE_PLAN = 'Free';
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.July25,
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
                  name
                  url
                  shopOwnerName
                  myshopifyDomain
                  email
                  currencyCode
                  weightUnit
                  billingAddress{
                     id
                                company
                                phone
                                city
                                country
                                countryCodeV2
                                province
                                provinceCode
                                zip
                                coordinatesValidated
                                latitude
                                longitude
                  }
              plan{
                partnerDevelopment
                publicDisplayName
                shopifyPlus
              }
  
                  storefrontAccessTokens(first: 100) {
        edges {
          node {
            id
            accessToken
            accessScopes {
              handle
            }
            createdAt
            title
          }
        }
      }
                }
        }`,

      );

      const shopJson = await shopResponse.json();
      const shop = shopJson.data.shop;

      let storefrontAccessToken = shop?.storefrontAccessTokens?.edges[0]?.node?.accessToken;




      if (!storefrontAccessToken) {
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
        storefrontAccessToken = scToken?.data?.storefrontAccessTokenCreate?.storefrontAccessToken?.accessToken;
      }


      //console.log('Token Created From ServerShopify:', storefrontAccessToken);
      await prisma.shop.upsert({
        where: {
          shopifyDomain: session.shop,
        },
        update: {
          installationCount: {
            increment: 1,
          },
          scAccessToken: storefrontAccessToken,
          url: shop?.url || '',
          name: shop?.name || '',
          partnerDevelopment: shop?.plan?.partnerDevelopment,
          shopOwnerName: shop?.shopOwnerName,
          email: shop?.email,
          shopOwnerPhone: shop?.billingAddress?.phone || '',
          currencyCode: shop?.currencyCode,
          weightUnit: shop?.weightUnit,
          billingAddress: JSON.stringify(shop?.billingAddress || {}),
          shopifyPlan: shop?.plan?.publicDisplayName,
          shopifyPlus: shop?.plan?.shopifyPlus,
          appDisabled: false,
        },
        create: {
          shopifyDomain: session.shop,
          myshopifyDomain: session.shop,
          url: shop?.url || '',
          name: shop?.name || '',
          scAccessToken: storefrontAccessToken,
          installationCount: 1,
          shopifyShopGid: shop?.id,
          partnerDevelopment: shop?.plan?.partnerDevelopment,
          shopOwnerName: shop?.shopOwnerName,
          email: shop?.email,
          shopOwnerPhone: shop?.billingAddress?.phone || '',
          currencyCode: shop?.currencyCode,
          weightUnit: shop?.weightUnit,
          billingAddress: JSON.stringify(shop?.billingAddress || {}),
          shopifyPlan: shop?.plan?.publicDisplayName,
          shopifyPlus: shop?.plan?.shopifyPlus,
          appDisabled: false,
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
