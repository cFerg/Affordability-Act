(() => {
  const $ = window.AffordAct.$;
  const $$ = window.AffordAct.$$;

  window.AffordAct.initHome = () => {
    const home = $("#home-sections");
    if (!home) return;

    const blocks = $$("[data-cat-block]", home);

    blocks.forEach((block) => {
      const body = $("[data-cat-body]", block);
      if (!body) return;

      const links = $$("a.section-btn", body);
      const count = links.length;

      const meta = block.querySelector(".cat-meta");
      const chev = block.querySelector(".cat-chevron");
      const header = block.querySelector("[data-cat-toggle]");

      if (count === 1) {
        const onlyHref = links[0].getAttribute("href") || "#";

        if (header) {
          if (header.tagName.toLowerCase() === "a") {
            header.href = onlyHref;
            header.classList.add("cat-header--link");
          } else {
            const a = document.createElement("a");
            a.href = onlyHref;
            a.className = header.className + " cat-header--link";
            a.innerHTML = header.innerHTML;
            header.replaceWith(a);
          }
        }

        meta?.remove();
        chev?.remove();

        const h = block.querySelector(".cat-header, .cat-header--link");
        if (h) h.innerHTML = h.innerHTML.replace(/[▾▼]/g, "");

        body.hidden = true;
        body.style.display = "none";
        return;
      }

      if (meta) meta.textContent = `${count} sections`;
      if (chev) chev.style.display = "";

      if (!header || header.tagName.toLowerCase() === "a") return;

      header.setAttribute("aria-expanded", "false");
      body.hidden = true;

      header.addEventListener("click", (e) => {
        e.preventDefault();
        const open = header.getAttribute("aria-expanded") === "true";
        header.setAttribute("aria-expanded", String(!open));
        body.hidden = open;
      });
    });
  };
})();