import { authenticate } from "../shopify.server";
import db from "../db.server";
import redis from "../utilis/redis.init";

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const days = Number(data?.days) || 0;
  const componentId = data?.componentId ? JSON.parse(data?.componentId) : null;
  console.log("componentID:",componentId);
  const dateRange =
    new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0] + 'T00:00:00.000Z';


  const isExist = await redis.get(`analytics:${session.shop}:${dateRange}:${componentId}`);
  if (isExist) {
    const result = JSON.parse(isExist);
    return result || {};
  };

  const shopData = await db.shop.findUnique({
    where: {
      shopifyDomain: session.shop
    },
    select: {
      id: true,
      plan: true,
      shopifyDomain: true,
      currencyCode: true,
      orders: {
        where: {
          createdAt: {
            gte: dateRange,
          },
          // isCancelled: false,
          shop: {
            shopifyDomain: session.shop,
          },
          ...(componentId ? { componentId: Number(componentId) } : {}),
        },
        select: {
          id: true,
          totalValue: true,
          createdAt: true,
          subTotalValue: true,
          componentId: true
        },
      },
      affiliates: {
        where: {
          shop: {
            shopifyDomain: session.shop,
          },
        },
        orderBy: {
          totalOrderValue: 'desc',
        },
        select: {
          id: true,
          name: true,
          totalOrderValue: true
        }
      },
      components: {
        select: {
          id: true,
          title: true,
        }
      }
    }
  });


  const summary = (shopData?.orders ?? []).reduce(
    (acc, item) => {
      const totalValue = Number(item.totalValue || 0);
      const dayKey = new Date(item.createdAt).toISOString().slice(0, 10);

      // totals
      acc.totalSales += totalValue;
      acc.count += 1;

      // ✅ sales total by day
      acc.salesByDayMap[dayKey] = (acc.salesByDayMap[dayKey] || 0) + totalValue;

      // ✅ count by day
      acc.countByDayMap[dayKey] = (acc.countByDayMap[dayKey] || 0) + 1;

      return acc;
    },
    {
      totalSales: 0,
      count: 0,
      salesByDayMap: {},
      countByDayMap: {},
    }
  );

  // ✅ chart data (sorted)
  const salesByDayChartData = Object.entries(summary.salesByDayMap)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => a.key.localeCompare(b.key));

  const countByDayChartData = Object.entries(summary.countByDayMap)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => a.key.localeCompare(b.key));


  const averageOrderValue = summary.totalSales / summary.count;

  let analuticsFromServer = {};
  try {
    const url = `${process.env.DATA_API}/shop/shopData/?shopifyDomain=${session.shop}&dateRange=${dateRange}&componentId=${componentId}`;
    const analytics = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    analuticsFromServer = await analytics.json();

  } catch (error) {
    console.log("error:::", error);
  }

  const result = {
    shopData: {
      plan: shopData?.plan,
      id: shopData?.id,
      shopifyDomain: shopData?.shopifyDomain,
      currencyCode: shopData?.currencyCode,
      components: shopData?.components || [],
    },
    affiliateDataFirstFive: shopData?.affiliates || [],
    totalOrderCount: summary?.count || 0,
    countByDayMapCartData: countByDayChartData || [],
    orderdataChart: salesByDayChartData || [],
    totalSales: summary?.totalSales || 0,
    dateRange,
    analyticsData: analuticsFromServer.result || {},
    averageOrderValue: averageOrderValue || 0,
  }

  await redis.set(`analytics:${session.shop}:${dateRange}:${componentId}`, JSON.stringify(result), 'EX', 60 * 4);


  return result || {};
};