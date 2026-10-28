import crypto from "crypto";

// Signed GET_COUPON_OFFER lookup against the coupon service.
// Returns null when the service isn't configured, {} on a non-OK response,
// the parsed body otherwise; throws on network errors and timeouts.
export async function fetchCouponOffer(shopDomain, code = "") {
  const appSecret = process.env.COUPON_CODE_API_SIGNATURE;
  const apiUrl = process.env.COUPON_CODE_API_URL;

  if (!appSecret || !apiUrl) return null;

  const timestamp = Date.now().toString();
  const canonical = `${timestamp}:${"GET_COUPON_OFFER"}:${code}:${"embedup"}:${shopDomain}`;
  const signature = crypto.createHmac("sha256", appSecret).update(canonical).digest("hex");

  const inputFormData = new FormData();
  inputFormData.set("target", "GET_COUPON_OFFER");
  inputFormData.set("code", code);
  inputFormData.set("app", "embedup");
  inputFormData.set("shop", shopDomain);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  let couponResponse;
  try {
    couponResponse = await fetch(`${apiUrl}/check-coupon`, {
      method: "POST",
      headers: { "x-api-signature": signature, "x-api-timestamp": timestamp },
      body: inputFormData,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!couponResponse?.ok) return {};
  return couponResponse.json().catch(() => ({}));
}
