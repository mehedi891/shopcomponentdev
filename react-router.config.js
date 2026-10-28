/** @type {import('@react-router/dev/config').Config} */
export default {
  // React Router 7.12+ rejects UI-route actions whose Origin header doesn't match
  // the URL the server sees. Behind the dev tunnel and TLS-terminating proxies
  // they differ (rewritten Host, http vs https), so every form submission would
  // fail with 400 Bad Request. List each host the embedded app is served from:
  // production, then the dev tunnel.
  allowedActionOrigins: ["app.embedup.com", "apptest.netcave.me"],
};
