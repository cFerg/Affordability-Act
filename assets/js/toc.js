(() => {
  const $ = window.AffordAct.$;
  const $$ = window.AffordAct.$$;
  const slugify = window.AffordAct.slugify;

  window.AffordAct.initTOC = () => {
    const topbar = $("#section-topbar");
    if (!topbar) return;

    const root = $(".content");
    if (!root) return;

    const headings = $$("h2,h3,h4", root).filter(h => (h.textContent || "").trim());
    if (headings.length < 2) return;

    headings.forEach(h => { if (!h.id) h.id = slugify(h.textContent); });

    const items = headings.map(h => ({
      id: h.id,
      level: h.tagName.toLowerCase(),
      text: (h.textContent || "").replace("🔗", "").trim()
    }));

    // Mobile dropdown
    topbar.innerHTML = "";
    const inner = document.createElement("div");
    inner.className = "topbar-inner";

    const select = document.createElement("select");
    select.className = "toc-select";
    select.setAttribute("aria-label", "On this page");
    select.innerHTML = `<option value="">On this page…</option>` +
      items.map(it => {
        const prefix = it.level === "h3" ? "  ↳ " : it.level === "h4" ? "    • " : "";
        return `<option value="${it.id}">${prefix}${it.text}</option>`;
      }).join("");

    select.addEventListener("change", () => {
      const id = select.value;
      if (!id) return;
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
      select.value = "";
    });

    inner.appendChild(select);
    topbar.appendChild(inner);

    // Desktop floating
    const panel = document.createElement("aside");
    panel.className = "toc-float";
    panel.innerHTML = `
      <button class="toc-toggle" type="button" aria-expanded="true" aria-label="Toggle page navigation">☰</button>
      <div class="toc-panel" data-toc-panel>
        <div class="toc-title">On this page</div>
        <nav class="toc-list" aria-label="Table of contents"></nav>
      </div>
    `;
    const list = $(".toc-list", panel);
    const toggle = $(".toc-toggle", panel);
    const panelInner = panel.querySelector("[data-toc-panel]");

    items.forEach(it => {
      const a = document.createElement("a");
      a.href = `#${it.id}`;
      a.className = `toc-link toc-${it.level}`;
      a.textContent = it.text;
      list.appendChild(a);
    });

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      panelInner.hidden = open;
    });

    document.body.appendChild(panel);

    const links = $$("a.toc-link", panel);
    function setActive(id) {
      let activeEl = null;
      links.forEach(a => {
        const on = a.getAttribute("href") === `#${id}`;
        a.classList.toggle("is-active", on);
        if (on) activeEl = a;
      });
      activeEl?.scrollIntoView({ block: "nearest" });
    }

    const obs = new IntersectionObserver((entries) => {
      const visible = entries.filter(e => e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
      if (visible.length) setActive(visible[0].target.id);
    }, { rootMargin: "-20% 0px -70% 0px", threshold: [0, 1] });

    headings.forEach(h => obs.observe(h));
  };
})();