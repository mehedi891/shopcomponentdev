const BASE_URL = '/api/sidekick-tools';

async function fetchTool(tool, params = {}) {
  const headers = { 'Content-Type': 'application/json' };

  try {
    const token = await shopify.auth.sessionToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {
    // sessionToken not available in this context, App Bridge may inject it automatically
  }

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tool, ...params }),
  });

  if (!res.ok) {
    return { error: `Request failed: ${res.status}` };
  }
  return res.json();
}

export default async function extension() {
  shopify.tools.register('get_top_components', async ({ limit = 5, sort_by = 'revenue' }) => {
    return fetchTool('get_top_components', { limit: Math.min(Number(limit), 10), sort_by });
  });

  shopify.tools.register('get_component_stats', async ({ query }) => {
    return fetchTool('get_component_stats', { query });
  });

  shopify.tools.register('get_top_affiliates', async ({ limit = 5, sort_by = 'revenue' }) => {
    return fetchTool('get_top_affiliates', { limit: Math.min(Number(limit), 10), sort_by });
  });

  shopify.tools.register('get_app_overview', async () => {
    return fetchTool('get_app_overview');
  });

  shopify.tools.register('how_to_create_component', async () => {
    return {
      guide: {
        title: 'How to create an affiliate buy button in EmbedUp',
        steps: [
          { step: 1, action: 'Open Components', detail: 'In EmbedUp, click "Components" in the left navigation menu.' },
          { step: 2, action: 'Click Create Component', detail: 'Click the "Create Component" button in the top right corner.' },
          { step: 3, action: 'Set a title', detail: 'Give your buy button a clear name, e.g. "Homepage Hero Button".' },
          { step: 4, action: 'Choose a layout', detail: 'Pick a layout: Grid, List, or Grid Slider.' },
          { step: 5, action: 'Select products or collection', detail: 'Choose which products or collections this buy button will show.' },
          { step: 6, action: 'Assign an affiliate (optional)', detail: 'Assign an affiliate to automatically track commissions for sales it drives.' },
          { step: 7, action: 'Set UTM tracking (optional)', detail: 'Add UTM source, medium, and campaign values for analytics.' },
          { step: 8, action: 'Save the component', detail: 'Click Save. The component is created but inactive by default.' },
          { step: 9, action: 'Activate it', detail: 'Toggle the status to Active to make the buy button live.' },
          { step: 10, action: 'Copy the embed code', detail: 'Copy the embed code and paste it into your website or landing page.' },
        ],
        tip: 'Create separate components for different pages or affiliates to track performance individually.',
      },
    };
  });
}
