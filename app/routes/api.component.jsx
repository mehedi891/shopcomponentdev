import db from "../db.server"
import { cors } from "remix-utils/cors"


export const loader = async ({ request }) => {

  let jsonResponse = {};
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || "";
    const component = await db.component.findUnique({
      where: {
        id: Number(id)
      },
      select: {
        title: true,
        description: true,
        status: true,
        compHtml: true
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
    if (component?.status === "activate") {
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
        message: "Something went wrong",
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