(() => {
  "use strict";

  // ----------------------------
  // Helpers
  // ----------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function slugify(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/&amp;/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90);
  }

  // ----------------------------
  // Theme: system default, two-button toggle
  // - Default: follow system (no saved pref)
  // - Click: toggle light/dark and save
  // - Shift-click: reset to system (clear saved)
  // ----------------------------
  const THEME_KEY = "affordact_theme"; // "light" | "dark" | null

  function systemIsLight() {
    return window.matchMedia?.("(prefers-color-scheme: light)")?.matches ?? false;
  }

  function applyTheme(mode) {
    // We use body.theme-light as the only explicit override.
    if (mode === "light") document.body.classList.add("theme-light");
    else document.body.classList.remove("theme-light");
  }

  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") {
      applyTheme(saved);
      return saved;
    }
    applyTheme(null);
    return null; // system
  }

  function saveTheme(mode) {
    if (!mode) localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, mode);
  }

  function initThemeToggle() {
    const btn = $("#theme-toggle");
    if (!btn) return;

    let mode = loadTheme(); // "light" | "dark" | null

    function effectiveMode() {
      if (mode === "light" || mode === "dark") return mode;
      return systemIsLight() ? "light" : "dark";
    }

    btn.addEventListener("click", (e) => {
      if (e.shiftKey) {
        mode = null;
        saveTheme(mode);
        applyTheme(mode);
        return;
      }
      const eff = effectiveMode();
      mode = eff === "light" ? "dark" : "light";
      saveTheme(mode);
      applyTheme(mode);
    });

    const mq = window.matchMedia?.("(prefers-color-scheme: light)");
    mq?.addEventListener?.("change", () => {
      if (!mode) applyTheme(null);
    });
  }

  // ----------------------------
  // Sticky footer nav actions
  // - Back to top
  // - Search button (bill only) focuses header page search input
  // ----------------------------
  function initStickyNavActions() {
    const nav = $("[data-sticky-nav]");
    if (!nav) return;

    const topBtn = $("[data-nav-top]", nav);
    if (topBtn) {
      topBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    const searchBtn = $("[data-nav-search]", nav);
    if (searchBtn) {
      searchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const input = $("input[data-page-search]");
        if (input) input.focus();
      });
    }
  }

  // ----------------------------
  // Home: category cards
  // - Only show chevron + “X sections” if >1 sections
  // - If exactly 1, turn the header into a direct link and remove chevron/meta
  // ----------------------------
  function initCategoryCards() {
    const home = $("#home-sections");
    if (!home) return;

    const blocks = $$("[data-cat-block]", home);

    blocks.forEach((block) => {
      const body = $("[data-cat-body]", block);
      if (!body) return;

      const links = $$("a.section-btn", body);
      const count = links.length;

      const meta = $(".cat-meta", block);
      const chev = $(".cat-chevron", block);

      if (count === 1) {
        const onlyHref = links[0].getAttribute("href") || "#";

        const header = $("[data-cat-toggle]", block);
        if (header) {
          if (header.tagName.toLowerCase() === "a") {
            header.setAttribute("href", onlyHref);
            header.classList.add("cat-header--link");
          } else {
            const a = document.createElement("a");
            a.href = onlyHref;
            a.className = header.className + " cat-header--link";
            a.innerHTML = header.innerHTML;
            header.replaceWith(a);
          }
        }

        if (meta) meta.remove();
        if (chev) chev.remove();

        body.hidden = true;
        body.style.display = "none";
        return;
      }

      // multi-section: true accordion
      if (meta) meta.textContent = `${count} sections`;
      if (chev) chev.style.display = "";

      const header = $("[data-cat-toggle]", block);
      if (!header) return;

      header.setAttribute("aria-expanded", "false");
      body.hidden = true;

      header.addEventListener("click", (e) => {
        // only if it's still a button
        if (header.tagName.toLowerCase() === "a") return;
        e.preventDefault();
        const open = header.getAttribute("aria-expanded") === "true";
        header.setAttribute("aria-expanded", String(!open));
        body.hidden = open;
      });
    });
  }

  // ----------------------------
  // Global search modal (Home)
  // Uses /search.json (B-style: {documents:[...]})
  // Searches content first, title second, category last.
  // ----------------------------
  function initGlobalSearchModal() {
    const trigger = $("input[data-global-search]");
    const modal = $("#global-search-modal");
    const modalInput = $("#global-search-modal-input");
    const resultsEl = $("#global-search-results");
    if (!trigger || !modal || !modalInput || !resultsEl) return;

    let docs = null;
    let loading = false;

    async function ensureLoaded() {
      if (docs || loading) return;
      loading = true;
      try {
        const res = await fetch("/search.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`search.json fetch failed: ${res.status}`);
        const json = await res.json();
        docs = Array.isArray(json) ? json : (json.documents || []);
      } catch (e) {
        console.error(e);
        docs = [];
      } finally {
        loading = false;
      }
    }

    function lockScroll(lock) {
      document.documentElement.classList.toggle("modal-lock", lock);
    }

    function open(prefill) {
      lockScroll(true);
      modal.hidden = false;
      modalInput.value = prefill || "";
      modalInput.focus();
      render();
    }

    function close() {
      lockScroll(false);
      modal.hidden = true;
      resultsEl.innerHTML = "";
      resultsEl.classList.remove("has-results");
    }

    function snippet(content, qLower) {
      const text = String(content || "").replace(/\s+/g, " ").trim();
      if (!text) return "";
      const low = text.toLowerCase();
      const i = low.indexOf(qLower);
      if (i < 0) return text.slice(0, 160) + (text.length > 160 ? "…" : "");
      const start = Math.max(0, i - 60);
      const end = Math.min(text.length, i + 90);
      return (start ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
    }

    function highlight(sn, rawQ) {
      if (!rawQ) return escapeHtml(sn);
      const re = new RegExp(rawQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
      const parts = String(sn).split(re);
      const matches = String(sn).match(re) || [];
      let out = "";
      for (let i = 0; i < parts.length; i++) {
        out += escapeHtml(parts[i]);
        if (i < matches.length) out += `<mark class="search-hit">${escapeHtml(matches[i])}</mark>`;
      }
      return out;
    }

    async function render() {
      const rawQ = modalInput.value.trim();
      const q = rawQ.toLowerCase();

      if (!q) {
        resultsEl.innerHTML = "";
        resultsEl.classList.remove("has-results");
        return;
      }

      await ensureLoaded();

      const hits = [];
      for (const d of docs) {
        const title = String(d.title || "");
        const cat = String(d.category || "");
        const body = String(d.content || d.body || "");

        const lt = title.toLowerCase();
        const lc = cat.toLowerCase();
        const lb = body.toLowerCase();

        let score = 0;
        if (lb.includes(q)) score += 10;
        if (lt.includes(q)) score += 3;
        if (lc.includes(q)) score += 1;

        if (score > 0) hits.push({ d, score });
      }

      hits.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const ao = Number(a.d.order ?? 9999);
        const bo = Number(b.d.order ?? 9999);
        return ao - bo;
      });

      resultsEl.innerHTML = hits.slice(0, 40).map(({ d }) => {
        const catHtml = d.category
          ? `<div class="muted global-search-result__cat">${escapeHtml(d.category)}</div>`
          : "";
        const sn = snippet(d.content || d.body || "", q);
        const snHtml = sn
          ? `<p class="global-search-result__snippet">${highlight(sn, rawQ)}</p>`
          : "";
        return `
          <div class="global-search-result">
            <a class="global-search-result__title" href="${escapeHtml(d.url || "#")}">${escapeHtml(d.title || "Untitled")}</a>
            ${catHtml}
            ${snHtml}
          </div>
        `;
      }).join("");

      resultsEl.classList.toggle("has-results", hits.length > 0);
    }

    // open on focus/typing
    trigger.addEventListener("focus", () => open(trigger.value));
    trigger.addEventListener("input", () => open(trigger.value));

    modal.addEventListener("click", (e) => {
      const t = e.target;
      if (t && (t.matches("[data-search-modal-close]") || t.closest("[data-search-modal-close]"))) close();
    });

    window.addEventListener("keydown", (e) => {
      if (!modal.hidden && e.key === "Escape") close();
    });

    modalInput.addEventListener("input", render);
  }

  // ----------------------------
  // Heading anchors: add 🔗 to h2/h3/h4
  // ----------------------------
  function initHeadingAnchors() {
    const root = $(".content");
    if (!root) return;

    const heads = $$("h2,h3,h4", root);
    heads.forEach((h) => {
      if (h.closest("nav")) return;
      if (!h.id) h.id = slugify(h.textContent);
      if ($(".hdr-anchor", h)) return;

      const a = document.createElement("a");
      a.className = "hdr-anchor";
      a.href = `#${h.id}`;
      a.setAttribute("aria-label", "Link to this section");
      a.textContent = "🔗";
      h.appendChild(a);
    });
  }

  // ----------------------------
  // TOC for bill/section pages (uses #section-topbar)
  // - Mobile: dropdown inside topbar
  // - Desktop: fixed right-side panel (does not push page down)
  // - Includes a small hide/show toggle
  // ----------------------------
  function initTocNav() {
    const topbar = $("#section-topbar");
    if (!topbar) return; // only on bill/sections per your layout :contentReference[oaicite:6]{index=6}

    const root = $(".content");
    if (!root) return;

    const headings = $$("h2,h3,h4", root).filter(h => (h.textContent || "").trim().length > 0);
    if (headings.length < 2) return;

    headings.forEach(h => { if (!h.id) h.id = slugify(h.textContent); });

    const items = headings.map(h => ({
      id: h.id,
      level: h.tagName.toLowerCase(), // h2/h3/h4
      text: (h.textContent || "").replace("🔗", "").trim()
    }));

    // Mobile dropdown
    const select = document.createElement("select");
    select.className = "toc-select";
    select.setAttribute("aria-label", "On this page");

    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "On this page…";
    select.appendChild(opt0);

    for (const it of items) {
      const opt = document.createElement("option");
      opt.value = it.id;
      opt.textContent =
        (it.level === "h3" ? "  ↳ " : it.level === "h4" ? "    • " : "") + it.text;
      select.appendChild(opt);
    }

    select.addEventListener("change", () => {
      const id = select.value;
      if (!id) return;
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
      select.value = "";
    });

    topbar.innerHTML = "";
    const inner = document.createElement("div");
    inner.className = "topbar-inner";
    inner.appendChild(select);
    topbar.appendChild(inner);

    // Desktop sidebar panel (fixed)
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
    const panelInner = $("[data-toc-panel]", panel);

    for (const it of items) {
      const a = document.createElement("a");
      a.href = `#${it.id}`;
      a.className = `toc-link toc-${it.level}`;
      a.textContent = it.text;
      list.appendChild(a);
    }

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      panelInner.hidden = open;
    });

    document.body.appendChild(panel);

    const links = $$("a.toc-link", panel);
    function setActive(id) {
      links.forEach(a => a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
    }

    const obs = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) setActive(visible[0].target.id);
    }, { rootMargin: "-20% 0px -70% 0px", threshold: [0, 1] });

    headings.forEach(h => obs.observe(h));
  }

  // ----------------------------
  // Page search highlight (header input data-page-search)
  // ----------------------------
  function initPageSearchHighlight() {
    const input = $("input[data-page-search]");
    const root = $(".content");
    if (!input || !root) return;

    let marks = [];

    function clearMarks() {
      marks.forEach(m => {
        const parent = m.parentNode;
        if (!parent) return;
        parent.replaceChild(document.createTextNode(m.textContent), m);
        parent.normalize();
      });
      marks = [];
    }

    function mark(query) {
      if (!query) return;

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const p = node.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          if (p.closest("nav,button,input,textarea,select,script,style,.toc-float,.section-topbar,.search-modal")) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      const q = query.toLowerCase();
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      for (const node of nodes) {
        const text = node.nodeValue;
        const low = text.toLowerCase();
        let idx = low.indexOf(q);
        if (idx < 0) continue;

        const frag = document.createDocumentFragment();
        let last = 0;

        while (idx !== -1) {
          frag.appendChild(document.createTextNode(text.slice(last, idx)));
          const m = document.createElement("mark");
          m.className = "search-hit";
          m.textContent = text.slice(idx, idx + query.length);
          frag.appendChild(m);
          marks.push(m);
          last = idx + query.length;
          idx = low.indexOf(q, last);
        }

        frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      }
    }

    let t = null;
    input.addEventListener("input", () => {
      clearTimeout(t);
      const v = input.value.trim();
      t = setTimeout(() => {
        clearMarks();
        if (v.length >= 2) mark(v);
      }, 120);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        input.value = "";
        clearMarks();
        input.blur();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    initStickyNavActions();
    initCategoryCards();
    initGlobalSearchModal();
    initHeadingAnchors();
    initTocNav();
    initPageSearchHighlight();
  });

})();