// app/utils/ShopifyCurrencyData.js

const SHOPIFY_CURRENCY_CDN_URL =
  "https://cdn.shopify.com/s/javascripts/currencies.js";

// Main function to call CDN and get the latest rates as a JS object
export async function getShopifyCurrencyRates() {
  const res = await fetch(SHOPIFY_CURRENCY_CDN_URL);

  if (!res.ok) {
    throw new Error(
      "Failed to fetch Shopify currencies.js " +
        res.status +
        " " +
        res.statusText
    );
  }

  const scriptText = await res.text();

  // Turn the JS file text into a plain rates object
  const rates = extractRatesFromCurrencyScript(scriptText);

  //console.log("Fetched Shopify currency rates:", rates);

  return rates; // { USD: 1, EUR: 1.17434, ... }
}

// Same logic as Currency.convert in your snippet
export function convertCurrency(amount, from, to, rates) {
  const fromRate = rates[from];
  const toRate = rates[to];

  if (!fromRate) {
    throw new Error("Unknown from currency " + from);
  }
  if (!toRate) {
    throw new Error("Unknown to currency " + to);
  }

  // From your CDN code:
  // return (amount * this.rates[from]) / this.rates[to];
  return (amount * fromRate) / toRate;
}

// Internal helper that extracts `rates: { ... }` from the CDN script text
function extractRatesFromCurrencyScript(scriptText) {
  // Match:
  // rates: { ... },
  //     convert: function(...)
  const match = scriptText.match(/rates\s*:\s*({[\s\S]*?})\s*,\s*convert\s*:/);

  if (!match) {
    throw new Error("Could not find Currency.rates in currencies.js");
  }

  const ratesLiteral = match[1]; // "{ \"USD\":1.0, \"EUR\":1.17434, ... }"

  // It is valid JSON (quoted keys, numeric values)
  const rates = JSON.parse(ratesLiteral);

  return rates;
}

