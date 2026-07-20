import { authenticate } from '../shopify.server';
import db from '../db.server';

export const action = async ({ request }) => {
  const { session, cors } = await authenticate.admin(request);

  const shop = await db.shop.findUnique({
    where: { shopifyDomain: session.shop },
    select: {
      id: true,
      totalOrderCount: true,
      totalOrderValue: true,
      plan: {
        select: { planName: true, planStatus: true },
      },
    },
  });

  if (!shop) {
    return cors(Response.json({ error: 'Shop not found' }, { status: 404 }));
  }

  const { tool, ...params } = await request.json();

  switch (tool) {

    case 'get_top_components': {
      const { limit = 5, sort_by = 'revenue' } = params;
      const orderBy = sort_by === 'orders'
        ? { totalOrderCount: 'desc' }
        : { totalOrderValue: 'desc' };

      const components = await db.component.findMany({
        where: { shopId: shop.id, softDelete: false },
        orderBy,
        take: Number(limit),
        select: {
          id: true,
          title: true,
          status: true,
          layout: true,
          totalOrderCount: true,
          totalOrderValue: true,
          affiliate: { select: { name: true } },
        },
      });

      return cors(Response.json({
        results: components.map((c) => ({
          type: 'resource_link',
          uri: `gid://application/component/${c.id}`,
          name: c.title,
          mimeType: 'application/component',
          _meta: {
            status: c.status,
            layout: c.layout,
            totalOrders: c.totalOrderCount ?? 0,
            totalRevenue: `$${(c.totalOrderValue ?? 0).toFixed(2)}`,
            affiliate: c.affiliate?.name ?? 'No affiliate assigned',
          },
        })),
      }));
    }

    case 'get_component_stats': {
      const { query } = params;
      const isId = !isNaN(Number(query));

      const component = await db.component.findFirst({
        where: {
          shopId: shop.id,
          softDelete: false,
          ...(isId
            ? { id: Number(query) }
            : { title: { contains: query, mode: 'insensitive' } }),
        },
        select: {
          id: true,
          title: true,
          status: true,
          layout: true,
          appliesTo: true,
          totalOrderCount: true,
          totalOrderValue: true,
          createdAt: true,
          affiliate: {
            select: {
              name: true,
              commissionCiteria: true,
              fixedCommission: true,
            },
          },
        },
      });

      if (!component) {
        return cors(Response.json({ error: `No component found matching "${query}"` }));
      }

      return cors(Response.json({
        component: {
          id: component.id,
          title: component.title,
          status: component.status === 'actived' ? 'Active' : 'Inactive',
          layout: component.layout,
          appliesTo: component.appliesTo,
          totalOrders: component.totalOrderCount ?? 0,
          totalRevenue: `$${(component.totalOrderValue ?? 0).toFixed(2)}`,
          affiliate: component.affiliate?.name ?? 'No affiliate assigned',
          commissionType: component.affiliate?.commissionCiteria ?? null,
          createdAt: component.createdAt?.toISOString().slice(0, 10) ?? null,
        },
      }));
    }

    case 'get_top_affiliates': {
      const { limit = 5, sort_by = 'revenue' } = params;
      const orderBy =
        sort_by === 'orders'
          ? { totalOrderCount: 'desc' }
          : sort_by === 'commission'
          ? { totalCommission: 'desc' }
          : { totalOrderValue: 'desc' };

      const affiliates = await db.affiliate.findMany({
        where: { shopId: shop.id },
        orderBy,
        take: Number(limit),
        select: {
          id: true,
          name: true,
          email: true,
          totalOrderCount: true,
          totalOrderValue: true,
          totalCommission: true,
          status: true,
        },
      });

      return cors(Response.json({
        results: affiliates.map((a) => ({
          type: 'resource_link',
          uri: `gid://application/affiliate/${a.id}`,
          name: a.name ?? 'Unnamed affiliate',
          mimeType: 'application/affiliate',
          _meta: {
            status: a.status ?? 'unknown',
            totalOrders: a.totalOrderCount ?? 0,
            totalRevenue: `$${(a.totalOrderValue ?? 0).toFixed(2)}`,
            totalCommission: `$${(a.totalCommission ?? 0).toFixed(2)}`,
          },
        })),
      }));
    }

    case 'get_app_overview': {
      const [totalComponents, activeComponents, totalAffiliates] = await Promise.all([
        db.component.count({ where: { shopId: shop.id, softDelete: false } }),
        db.component.count({ where: { shopId: shop.id, softDelete: false, status: 'actived' } }),
        db.affiliate.count({ where: { shopId: shop.id } }),
      ]);

      return cors(Response.json({
        overview: {
          plan: shop.plan?.planName ?? 'Free',
          planStatus: shop.plan?.planStatus ?? 'N/A',
          totalOrders: shop.totalOrderCount ?? 0,
          totalRevenue: `$${(shop.totalOrderValue ?? 0).toFixed(2)}`,
          totalComponents,
          activeComponents,
          inactiveComponents: totalComponents - activeComponents,
          totalAffiliates,
        },
      }));
    }

    default:
      return cors(Response.json({ error: `Unknown tool: ${tool}` }, { status: 400 }));
  }
};
