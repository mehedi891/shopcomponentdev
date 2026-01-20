 const capitalizeFirstCaracter = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : "";



 function buildUtmParams({ source, medium, campaign }) {
  return Object.entries({
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
  })
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
}


 export { capitalizeFirstCaracter,buildUtmParams }