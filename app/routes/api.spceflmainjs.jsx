import fs from 'fs/promises';
import path from 'path';
import { cors } from 'remix-utils/cors';

export const loader = async ({ request }) => {
  const filePath = path.resolve('public/shopcomponent/js/spceflmain.js');
  try {
    const jsFile = await fs.readFile(filePath, 'utf8');

    const response = new Response(jsFile, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

    return cors(request, response);

  } catch (err) {
    return new Response('Not found', { status: 404 });
  }
};
