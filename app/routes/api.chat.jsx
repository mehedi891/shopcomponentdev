import {
  streamText,
  convertToModelMessages,
  tool,
  stepCountIs,
} from 'ai';
import { openai } from "@ai-sdk/openai";
import { z } from 'zod';
import { authenticate } from '../shopify.server';
import db from '../db.server';
import redis from '../utilis/redis.init';

export async function action({ request }) {

  const { session } = await authenticate.admin(request);
  const { shop } = session;

  let shopData = {};
  const cachedShopData = await redis.get(`${session.shop}:aiShopData`);
  if (cachedShopData) {
    shopData = JSON.parse(cachedShopData);
  } else {
    shopData = await db.shop.findUnique({
      where: { shopifyDomain: session.shop },
      select: {
        id: true,
        shopifyDomain: true,
        currencyCode: true
      }
    });
    await redis.set(`${session.shop}:aiShopData`, JSON.stringify(shopData), 'EX', 60 * 60 * 24);
  }

  const { messages } = await request.json();

  const SYSTEM_PROMPT = `
You are a technical assistant for the EmbedUp Shopify app.

EmbedUp is a Shopify embedded app that lets merchants create and manage embeddable web components, track analytics, manage affiliates, use in-app chat, and handle subscriptions and plans.
Today's Date: ${new Date().toLocaleString('sv-SE')}
You have access to the following tools:

 1. getComponentCount: This tool is used to get component count from database.
 2. getComponentList: This tool is used to get component list from database.
 3. getSalesSummary: This tool is used to get sales/orders summary from database.
 4. getAffiliatePerformance: This tool is used to get affiliate performance from database.
 5. getAffiliateList: This tool is used to get affiliate list from database.

Current shop shopifyDomain is:
"${shop}"

Current Shop currency is : 
"${shopData?.currencyCode}"

Rules:
- Never query data for other shops
- Do NOT guess shop domain
- Do NOT return data without filtering by shopifyDomain
- if you don't know the answer, just say you don't know
- if the tool-getSalesSummary , then response with table view in HTML 
- if the tool-getComponentList , then response with table view in HTML
- if the tool-getAffiliatePerformance , then response with table view in HTML
- if the tool-getAffiliateList , then response with table view in HTML


IMPORTANT:
- Only use tools to get the data.
- Only response message that are related to EmbedUp app.
- When displaying dates, format them to show only the day, month, and year.
- If the response includes HTML and table tags, design the table with a modern look and ensure the text color is white.
- Do not include personal information in the response like email, address, etc.
- If the message is not related to EmbedUp app, then response with a message 'Please ask a question related to EmbedUp app'.


 Always response in a friendly and helpful manner.
`;


  const RangeSchema = z.object({
    // ISO strings are simplest for tools
    start: z.string().describe("Start date-time ISO, inclusive"),
    end: z.string().describe("End date-time ISO, exclusive"),
  });

  const result = streamText({
    model: openai("gpt-4.1-nano"),
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    messages: await convertToModelMessages(messages),
    system: SYSTEM_PROMPT,
    stopWhen: stepCountIs(5),
    tools: {
      getComponentCount: tool({
        description: 'Call this tool to get component count from database',
        inputSchema: z.object({}),
        title: 'getComponentCount',

        execute: async () => {

          const count = await db.component.count({
            where: {
              shop: {
                shopifyDomain: session.shop
              },
              softDelete: false
            },
          });

          return { count };
        },

      }),

      getComponentList: tool({
        description: 'Call this tool to get component list from database',
        inputSchema: z.object({}),
        title: 'getComponentList',
        execute: async () => {

          const components = await db.component.findMany({
            where: {
              shop: {
                shopifyDomain: session.shop
              },
              softDelete: false
            },
            orderBy: {
              createdAt: 'desc'
            }
          });

          return { components };
        },

      }),

      getSalesSummary: tool({
        title: "getSalesSummary",
        description: "Orders and sales totals for the current shop in a date range",
        inputSchema: RangeSchema,
        execute: async ({ start, end }) => {
          console.log("Start:", start, 'End::', end);
          const where = {
            shop: {
              shopifyDomain: session.shop
            },
            isDeleted: false,
            createdAt: { gte: new Date(start), lte: new Date(end) },
          };

          // count orders
          const orderCount = await db.order.count({ where });

          // sums (Prisma aggregate)
          const agg = await db.order.aggregate({
            where,
            _sum: {
              totalValue: true,
              subTotalValue: true,
              refundValue: true,
              fulFilledValue: true,
              commission: true,
            },
          });
          console.log('AGGG:', agg);

          return {
            orderCount,
            totalSales: agg._sum.totalValue ?? 0,
            subTotal: agg._sum.subTotalValue ?? 0,
            refunds: agg._sum.refundValue ?? 0,
            fulfilledValue: agg._sum.fulFilledValue ?? 0,
            commissionTotal: agg._sum.commission ?? 0,
          };
        },
      }),

      getAffiliateList: tool({
        title: "getAffiliateList",
        description: "Affiliate list for current shop",
        inputSchema: z.object({}),
        execute: async () => {
          const affiliates = await db.affiliate.findMany({
            where: {
              shop: {
                shopifyDomain: session.shop
              }
            },
            orderBy: { totalOrderValue: "desc" }
          });

          return { affiliates };
        },
      }),

      getAffiliatePerformance: tool({
        title: "getAffiliatePerformance",
        description: "Affiliate performance summary for current shop in a date range",
        inputSchema: RangeSchema.extend({
          limit: z.number().min(1).max(50).default(10),
        }),
        execute: async ({ start, end, limit }) => {



          const grouped = await db.order.groupBy({
            by: ["affiliateId"],
            where: {
              shop: {
                shopifyDomain: session.shop
              },
              isDeleted: false,
              affiliateId: { not: null },
              createdAt: { gte: new Date(start), lt: new Date(end) },
            },
            _count: { _all: true },
            _sum: { totalValue: true, commission: true },
            orderBy: { _sum: { totalValue: "desc" } },
            take: limit,
          });

          const affiliateIds = grouped.map(g => g.affiliateId).filter(Boolean);
          const affiliates = await db.affiliate.findMany({
            where: { id: { in: affiliateIds }, shop: { shopifyDomain: session.shop } },
            select: { id: true, name: true, email: true },
          });
          const aById = new Map(affiliates.map(a => [a.id, a]));

          const totals = grouped.reduce(
            (acc, g) => ({
              sales: acc.sales + (g._sum.totalValue ?? 0),
              commission: acc.commission + (g._sum.commission ?? 0),
            }),
            { sales: 0, commission: 0 }
          );

          return {
            totals,
            items: grouped.map(g => ({
              affiliateId: g.affiliateId,
              name: aById.get(g.affiliateId)?.name ?? "Unknown",
              email: aById.get(g.affiliateId)?.email ?? null,
              orderCount: g._count._all,
              sales: g._sum.totalValue ?? 0,
              commission: g._sum.commission ?? 0,
            })),
          };
        },
      }),



    },

  });


  return result.toUIMessageStreamResponse();
}
