import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
   const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const headlessAccessToken = formData.get('headlessAccessToken') || "";
  try {
    const response = await fetch(`https://${session.shop}/api/${process.env.api_version}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': headlessAccessToken,
      },
      body: JSON.stringify({
        query: `
          {
            shop {
              name
            }
          }
        `,
      }),
    });

    const data = await response.json();

    if (data.errors) {
      return {
        success: false,
        isTokenValid: false,
        data: {},
        error: true
      }
    } else {
      await db.shop.update({
        where: {
          shopifyDomain: session.shop
        },
        data: {
          headlessAccessToken: headlessAccessToken
        }
      });
      return {
        success: true,
        isTokenValid: true,
        data: {
          shop: data.data.shop.name,
          token: headlessAccessToken
        },
        error: false
      }
    }
  } catch (error) {
    return {
      success: false,
      isTokenValid: false,
      data: {},
      error: true
    }
  }
}