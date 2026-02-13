(() => {
  "use strict";
  window.AffordAct = window.AffordAct || {};

  window.AffordAct.$ = (sel, root = document) => root.querySelector(sel);
  window.AffordAct.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  window.AffordAct.escapeHtml = (s) => String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  window.AffordAct.slugify = (s) => String(s || "")
    .trim().toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
})();