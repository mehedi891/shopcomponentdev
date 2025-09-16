import db from "../db.server"
import { cors } from "remix-utils/cors"


export const loader = async ({ request }) => {
  let jsonResponse = {};
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || "";

    const component = await db.component.findUnique({
      where: {
        id: Number(id),
        softDelete: false,
        status: 'activate',
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        appliesTo: true,
        addToCartType: true,
        enableQtyField: true,
        layout: true,
        componentSettings: true,
        shoppingCartSettings: true,
        productLayoutSettings: true,
        buttonStyleSettings: true,
        tracking: true,
        customerTracking: true,
        shop: {
          select: {
            appDisabled: true,
            shopifyDomain:true,
            scAccessToken: true,
            headlessAccessToken: true,
            plan: {
              select: {
                planName: true,
                planStatus: true,
              }
            }
          }
        }
      },
    });
    if (!component?.id) {
      jsonResponse = new Response(JSON.stringify({
        data: {},
        success: false,
        message: "Component data Not Found",
        status: 404
      }));
    }
    if ( component?.status === 'activate') {
      jsonResponse = new Response(JSON.stringify({
        data: component,
        success: true,
        message: "Component data fetched successfully",
        status: 200
      }));
    } else {
      jsonResponse = new Response(JSON.stringify({
        data: {},
        success: false,
        message: "ShopComponent is disabled",
        status: 401
      }));
    }

    return cors(request, jsonResponse);
  } else {
    return jsonResponse = new Response(JSON.stringify({
      data: {},
      success: false,
      message: "Method Not Allowed",
      status: 405
    }));
  }

};