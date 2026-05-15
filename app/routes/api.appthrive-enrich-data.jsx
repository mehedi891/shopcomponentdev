import db from "../db.server";
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
import process from 'node:process';

const APPTHRIVE_WEBHOOK_SECRET = process.env.APPTHRIVE_WEBHOOK_SECRET;

function verifyAppThriveSignature(body, sig, ts, secret) {
  if (!secret) return false;
  // 5-minute window — reject stale timestamps to prevent replay.
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(ts)) > 300) return false;
  const expected = createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

function toAppThriveShape(row) {

  return {
    shopId: row.shopifyShopGid,
    shopDomain: row.shopifyDomain,
    shopName: row.name,
    shopOwnerName:row.shopOwnerName,
    shopOwnerEmail: row.email,
    shopOwnerPhone: row.shopOwnerPhone,
    shopifyPlan: row.shopifyPlan,
    currency: row.currencyCode,
    address1:row.billingAddress,
    tags:[row?.isInstalled ? `${row.plan.isTestPlan ? "Pro_trial" : row?.plan?.planName}_Plan` : "uninstalled"],
    customAttributes: {
        currentAppPlan: row?.isInstalled ? `${row.plan.isTestPlan ? "Pro_trial" : row?.plan?.planName}_Plan` : "uninstalled"
      },
      // notes:[
      //   {
      //     content: 'Enrolled in Free plan on 2026-05-12',
      //     isPinned: true}
      // ]
  };
}

export const action = async ({ request }) => {
  const body = await request.text();
  const sig = request.headers.get('X-AppThrive-Signature');
  const ts = request.headers.get('X-AppThrive-Timestamp');

  if (!sig || !ts || !verifyAppThriveSignature(body, sig, ts, APPTHRIVE_WEBHOOK_SECRET)) {
    return new Response('bad signature', { status: 401 });
  }

  const { cursor, limit } = JSON.parse(body);

  // Keyset pagination — stable under concurrent writes.
  // cursor is the numeric DB id returned as nextCursor from the previous page.
  const rows = await db.shop.findMany({
    where: cursor ? { id: { gt: Number(cursor) } } : undefined,
    orderBy: { id: 'asc' },
    take: limit,
    select: {
      id: true,
      shopifyShopGid: true,
      shopifyDomain: true,
      name: true,
      shopOwnerName: true,
      email: true,
      shopOwnerPhone: true,
      shopifyPlan: true,
      currencyCode: true,
      plan: true,
    },
  });

  return Response.json({
    merchants: rows.map(toAppThriveShape),
    nextCursor: rows.length === limit ? String(rows[rows.length - 1].id) : null,
  });
};
