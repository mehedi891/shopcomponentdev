import '@shopify/ui-extensions';

//@ts-ignore
declare module './src/index.js' {
  interface GetTopComponentsInput {
    /**
     * Number of components to return. Default is 5, maximum is 10.
     */
    limit?: number;
    /**
     * Sort by total revenue (default) or total order count.
     */
    sort_by?: 'revenue' | 'orders';
    [k: string]: unknown;
  }

  type GetTopComponentsOutput = unknown;
  interface GetComponentStatsInput {
    /**
     * The component name or numeric ID to look up.
     */
    query: string;
    [k: string]: unknown;
  }

  type GetComponentStatsOutput = unknown;
  interface GetTopAffiliatesInput {
    /**
     * Number of affiliates to return. Default is 5, maximum is 10.
     */
    limit?: number;
    /**
     * Sort by total revenue (default), total orders, or total commission earned.
     */
    sort_by?: 'revenue' | 'orders' | 'commission';
    [k: string]: unknown;
  }

  type GetTopAffiliatesOutput = unknown;
  interface GetAppOverviewInput {
    [k: string]: unknown;
  }

  type GetAppOverviewOutput = unknown;
  interface HowToCreateComponentInput {
    [k: string]: unknown;
  }

  type HowToCreateComponentOutput = unknown;
  interface ShopifyTools {
    /**
     * Get the top performing affiliate buy button components sorted by total sales revenue or order count. Use this when the merchant asks about best performing, top selling, or most popular buy buttons.
     */
    register(
      name: 'get_top_components',
      handler: (
        input: GetTopComponentsInput,
      ) => GetTopComponentsOutput | Promise<GetTopComponentsOutput>,
    ): () => void;
    /**
     * Get detailed sales stats for a specific buy button component by its name or ID. Use this when the merchant asks about a specific buy button by name.
     */
    register(
      name: 'get_component_stats',
      handler: (
        input: GetComponentStatsInput,
      ) => GetComponentStatsOutput | Promise<GetComponentStatsOutput>,
    ): () => void;
    /**
     * Get the top performing affiliates sorted by revenue, order count, or commission earned. Use this when the merchant asks about best affiliates, top partners, or affiliate performance.
     */
    register(
      name: 'get_top_affiliates',
      handler: (
        input: GetTopAffiliatesInput,
      ) => GetTopAffiliatesOutput | Promise<GetTopAffiliatesOutput>,
    ): () => void;
    /**
     * Get a summary of the EmbedUp app performance including total orders, total revenue, number of active buy buttons, number of affiliates, and current plan. Use this when the merchant asks for a general overview, summary, or dashboard.
     */
    register(
      name: 'get_app_overview',
      handler: (
        input: GetAppOverviewInput,
      ) => GetAppOverviewOutput | Promise<GetAppOverviewOutput>,
    ): () => void;
    /**
     * Get step-by-step instructions for creating a new affiliate buy button component in EmbedUp. Use this when the merchant asks how to create, set up, or add a new buy button.
     */
    register(
      name: 'how_to_create_component',
      handler: (
        input: HowToCreateComponentInput,
      ) => HowToCreateComponentOutput | Promise<HowToCreateComponentOutput>,
    ): () => void;
  }

  const shopify: import('@shopify/ui-extensions/admin').WithGeneratedTools<
    import('@shopify/ui-extensions/admin.app.tools.data').Api,
    ShopifyTools
  >;
  const globalThis: { shopify: typeof shopify };
}
