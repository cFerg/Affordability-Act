(() => {
  "use strict";

  // ----------------------------
  // Utilities
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
  // Theme: system default, 2-state UI
  // - Default: no preference => follows system
  // - Click toggle => forces light/dark + saves
  // - Shift-click => reset to system (clears saved)
  // ----------------------------
  const THEME_KEY = "affordact_theme"; // "light" | "dark" | null

  function systemIsLight() {
    return window.matchMedia?.("(prefers-color-scheme: light)")?.matches ?? false;
  }

  function applyTheme(mode) {
    // We only use body.theme-light as an override.
    // Dark is default (unless your CSS prefers-color-scheme sets otherwise).
    if (mode === "light") document.body.classList.add("theme-light");
    else document.body.classList.remove("theme-light");
  }

  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") {
      applyTheme(saved);
      return saved;
    }
    // system mode
    applyTheme(null);
    return null;
  }

  function saveTheme(mode) {
    if (!mode) localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, mode);
  }

  function initThemeToggle() {
    const btn = $("#theme-toggle");
    if (!btn) return;

    let mode = loadTheme(); // "light" | "dark" | null (system)

    function effectiveMode() {
      if (mode === "light" || mode === "dark") return mode;
      return systemIsLight() ? "light" : "dark";
    }

    btn.addEventListener("click", (e) => {
      // Shift-click resets to system
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

    // If system changes while in system mode, reflect it
    const mq = window.matchMedia?.("(prefers-color-scheme: light)");
    mq?.addEventListener?.("change", () => {
      if (!mode) applyTheme(null);
    });
  }

  // ----------------------------
  // Home: Category “accordion only if >1 sections”
  // Expects markup:
  //  - [data-cat-block] containing:
  //      - [data-cat-toggle] header element (button or a)
  //      - [data-cat-body] container with <a.section-btn> children
  //      - optional .cat-meta and .cat-chevron elements
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

      // For single-section categories: header becomes link to that section; hide meta/chevron; hide body
      if (count === 1) {
        const onlyHref = links[0].getAttribute("href") || "#";

        // Convert header button -> link if needed
        const headerBtn = $("[data-cat-toggle]", block);
        if (headerBtn && headerBtn.tagName.toLowerCase() !== "a") {
          const link = document.createElement("a");
          link.href = onlyHref;
          link.className = headerBtn.className + " cat-header--link";
          link.innerHTML = headerBtn.innerHTML;
          headerBtn.replaceWith(link);
        } else if (headerBtn && headerBtn.tagName.toLowerCase() === "a") {
          headerBtn.setAttribute("href", onlyHref);
        }

        if (meta) meta.remove();
        if (chev) chev.remove();

        body.hidden = true;
        body.style.display = "none";
        return;
      }

      // For multi-section categories: true accordion
      if (meta) meta.textContent = `${count} sections`;
      if (chev) chev.style.display = "";

      const header = $("[data-cat-toggle]", block);
      if (!header) return;

      // start collapsed
      header.setAttribute("aria-expanded", "false");
      body.hidden = true;

      header.addEventListener("click", (e) => {
        // if header is a link, don't toggle
        if (header.tagName.toLowerCase() === "a") return;
        e.preventDefault();
        const isOpen = header.getAttribute("aria-expanded") === "true";
        header.setAttribute("aria-expanded", String(!isOpen));
        body.hidden = isOpen;
      });
    });
  }

  // ----------------------------
  // Global search modal (Home): uses /search.json (B style: {documents:[...]})
  // Searches content FIRST, title second, category last.
  //
  // Expected markup exists already in your default.html/index:
  //  - input[data-global-search] in header
  //  - #global-search-modal, #global-search-modal-input, #global-search-results
  //  - elements with [data-search-modal-close]
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

    function lockPageScroll(lock) {
      // Prevent iOS body scroll bleed when modal is open
      if (lock) document.documentElement.classList.add("modal-lock");
      else document.documentElement.classList.remove("modal-lock");
    }

    function openModal(prefill) {
      lockPageScroll(true);
      modal.hidden = false;
      modalInput.value = prefill || "";
      modalInput.focus();
      render();
    }

    function closeModal() {
      lockPageScroll(false);
      modal.hidden = true;
      resultsEl.innerHTML = "";
      resultsEl.classList.remove("has-results");
    }

    function makeSnippet(content, qLower) {
      const text = String(content || "").replace(/\s+/g, " ").trim();
      if (!text) return "";
      const low = text.toLowerCase();
      const i = low.indexOf(qLower);
      if (i < 0) return text.slice(0, 160) + (text.length > 160 ? "…" : "");
      const start = Math.max(0, i - 60);
      const end = Math.min(text.length, i + 90);
      let sn = text.slice(start, end);
      if (start > 0) sn = "…" + sn;
      if (end < text.length) sn = sn + "…";
      return sn;
    }

    function highlightSnippet(snippet, rawQ) {
      if (!rawQ) return escapeHtml(snippet);
      const re = new RegExp(rawQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
      // escape first, then replace by matching escaped token is hard;
      // instead do a safe approach: split by matches on original, then escape pieces.
      const parts = String(snippet).split(re);
      const matches = String(snippet).match(re) || [];
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

        // score: body >> title > category
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

      const top = hits.slice(0, 40).map(({ d }) => {
        const title = d.title || "Untitled";
        const url = d.url || "#";
        const cat = d.category
          ? `<div class="muted global-search-result__cat">${escapeHtml(d.category)}</div>`
          : "";

        const sn = makeSnippet(d.content || d.body || "", q);
        const snHtml = sn
          ? `<p class="global-search-result__snippet">${highlightSnippet(sn, rawQ)}</p>`
          : "";

        return `
          <div class="global-search-result">
            <a class="global-search-result__title" href="${escapeHtml(url)}">${escapeHtml(title)}</a>
            ${cat}
            ${snHtml}
          </div>
        `;
      });

      resultsEl.innerHTML = top.join("");
      resultsEl.classList.toggle("has-results", top.length > 0);
    }

    // Open when typing/focus
    trigger.addEventListener("focus", () => openModal(trigger.value));
    trigger.addEventListener("input", () => openModal(trigger.value));

    // Close handlers
    modal.addEventListener("click", (e) => {
      const t = e.target;
      if (t && (t.matches("[data-search-modal-close]") || t.closest("[data-search-modal-close]"))) closeModal();
    });

    window.addEventListener("keydown", (e) => {
      if (!modal.hidden && e.key === "Escape") closeModal();
    });

    modalInput.addEventListener("input", () => render());
  }

  // ----------------------------
  // Heading jump-links: adds 🔗 to h2/h3/h4
  // ----------------------------
  function initHeadingAnchors() {
    const root = $(".content");
    if (!root) return;

    const heads = $$("h2,h3,h4", root);

    heads.forEach((h) => {
      // skip if inside nav/controls
      if (h.closest("nav")) return;

      if (!h.id) h.id = slugify(h.textContent);

      if ($(".hdr-anchor", h)) return;

      const a = document.createElement("a");
      a.className = "hdr-anchor";
      a.href = `#${h.id}`;
      a.setAttribute("aria-label", "Link to this section");
      a.innerHTML = "🔗";
      h.appendChild(a);
    });
  }

  // ----------------------------
  // TOC (desktop sidebar + mobile dropdown)
  // Injects into #section-topbar (you already have)
  // Desktop: sticky sidebar
  // Mobile: dropdown select
  // ----------------------------
  function initTocNav() {
    const root = $(".content");
    if (!root) return;

    const topbar = $("#section-topbar");
    if (!topbar) return;

    const headings = $$("h2,h3,h4", root).filter(h => !!(h.textContent || "").trim());
    if (headings.length < 2) return;

    // Ensure IDs
    headings.forEach(h => { if (!h.id) h.id = slugify(h.textContent); });

    // Build items
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
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      // update URL hash
      history.replaceState(null, "", `#${id}`);
      select.value = "";
    });

    // Desktop sidebar list
    const sidebar = document.createElement("aside");
    sidebar.className = "toc-sidebar";
    sidebar.innerHTML = `
      <div class="toc-title">On this page</div>
      <nav class="toc-list" aria-label="Table of contents"></nav>
    `;
    const list = $(".toc-list", sidebar);

    for (const it of items) {
      const a = document.createElement("a");
      a.href = `#${it.id}`;
      a.className = `toc-link toc-${it.level}`;
      a.textContent = it.text;
      list.appendChild(a);
    }

    // Place controls
    topbar.innerHTML = "";
    const barWrap = document.createElement("div");
    barWrap.className = "topbar-inner";
    barWrap.appendChild(select);

    // optional in-page search input hook if your layout includes it
    const pageSearch = $("input[data-page-search]");
    if (pageSearch) {
      // move it into topbar on desktop if desired; keep it where it is otherwise
      // We’ll just clone a simple focus button instead of moving nodes around.
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn topbar-search-btn";
      btn.innerHTML = "<span>Search this page</span>";
      btn.addEventListener("click", () => pageSearch.focus());
      barWrap.appendChild(btn);
    }

    topbar.appendChild(barWrap);
    topbar.appendChild(sidebar);

    // Active section highlight (IntersectionObserver)
    const links = $$("a.toc-link", sidebar);

    function setActive(id) {
      links.forEach(a => a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
    }

    const obs = new IntersectionObserver((entries) => {
      // pick the nearest heading above fold
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top));
      if (visible.length) setActive(visible[0].target.id);
    }, { rootMargin: "-20% 0px -70% 0px", threshold: [0, 1] });

    headings.forEach(h => obs.observe(h));
  }

  // ----------------------------
  // Page in-content search highlighting (optional)
  // If you already have a page-search input with data-page-search, this works.
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
          if (p.closest("nav,button,input,textarea,select,script,style,.toc-sidebar,.section-topbar,.search-modal")) {
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

  // Boot
  document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    initCategoryCards();
    initGlobalSearchModal();
    initHeadingAnchors();
    initTocNav();
    initPageSearchHighlight();
  });

})();