(() => {
  const $$ = window.AffordAct.$$;
  const slugify = window.AffordAct.slugify;

  window.AffordAct.initAnchors = () => {
    const root = document.querySelector(".content");
    if (!root) return;

    const heads = $$("h2,h3,h4", root);
    heads.forEach(h => {
      if (h.closest("nav")) return;

      if (!h.id) h.id = slugify(h.textContent || "");
      if (h.querySelector(".hdr-anchor")) return;

      const a = document.createElement("a");
      a.className = "hdr-anchor";
      a.href = `#${h.id}`;
      a.setAttribute("aria-label", "Link to this section");
      a.textContent = "🔗";
      h.appendChild(a);
    });
  };
})();