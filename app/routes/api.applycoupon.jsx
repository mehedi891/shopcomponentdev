
import db from "../db.server";
import crypto from "crypto";

import { authenticate } from "../shopify.server";
export const action = async ({ request }) => {
  const {session} = await authenticate.admin(request);
  const formData = await request.formData();

  const timestamp = Date.now().toString();
            const code = formData.get("couponCode");

            const canonical = `${timestamp}:${"COUPON_CHECK"}:${code}:${"EmbedUp"}:${session.shop}`;
            
            const appSecret = process.env.COUPON_CODE_API_SIGNATURE;
            const signature = crypto.createHmac("sha256", appSecret).update(canonical).digest("hex");
            const inputFormData = new FormData();
            inputFormData.set("target", "COUPON_CHECK");
            inputFormData.set("code", code);
            inputFormData.set("app", "EmbedUp");
            inputFormData.set("shop", session.shop);

            const url = `${process.env.COUPON_CODE_API_URL}/check-coupon`;

            console.log("API URL", process.env.COUPON_CODE_API_URL);

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "x-api-signature": signature,
                    "x-api-timestamp": timestamp,
                },
                body: inputFormData,
            });
            if (!response.ok) {
                return {
                    //target: target,
                    message: "error",
                    data: null,
                };
            }

            const resData = await response.json();
            if(resData?.offer?.option && resData?.offer?.option != "") {
                const updateData = {
                    coupon: code,
                    isAppliedCoupon:false,
                };
                if (resData?.offer?.option == "trial") {
                    updateData.trialDays = parseInt(resData?.offer?.value?.trialDays) || 0;
                    updateData.planActivatedAt = new Date().toISOString();
                }
                else {
                    updateData.trialDays = 0;
                    updateData.planActivatedAt = new Date().toISOString();
                }
                await db.shop.update({
                    where: { shopifyDomain: session?.shop },
                    data: updateData
                });
            }

            return {
                //target: target,
                message: "success",
                data: resData
            };

}