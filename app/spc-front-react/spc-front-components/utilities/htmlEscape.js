const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

// Escape a value for HTML text or a quoted attribute; it renders exactly as typed
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

// Encode a value as a JavaScript string argument inside an inline event handler
// attribute, e.g. onclick="fn(event,${jsArg(value)})". The handler receives the
// same string the old '${value}' form passed, but the value can't break out.
export const jsArg = (value) => escapeHtml(JSON.stringify(String(value)));

// Keep custom CSS inside its <style> element: a closing </style> can't end it early
export const safeStyleText = (css) => String(css).replace(/<\/(style)/gi, "<\\/$1");
