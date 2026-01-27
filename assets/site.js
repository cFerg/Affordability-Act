(() => {
  "use strict";

  // ---------------------------
  // Theme: default to system
  // - If no saved choice, do nothing and let CSS @media control
  // - If saved "light", apply body.theme-light
  // - If saved "dark", remove body.theme-light
  // Toggle button: click toggles light/dark and saves
  // Shift-click: reset to system (clears saved)
  // ---------------------------
  const THEME_KEY = "affordact_theme"; // "light" | "dark" | "system" | null
  const body = document.body;

  function getSystemIsLight() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  }

  function applyTheme(mode) {
    // mode: "light" | "dark" | "system"
    if (mode === "light") body.classList.add("theme-light");
    else if (mode === "dark") body.classList.remove("theme-light");
    else {
      // system: remove forced class, let CSS media decide
      body.classList.remove("theme-light");
      // NOTE: we are using media queries for the rest; body.theme-light only forces light
      // If you ever add theme-dark, you can expand this.
    }
  }

  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (!saved || saved === "system") {
      applyTheme("system");
      return "system";
    }
    if (saved === "light" || saved === "dark") {
      applyTheme(saved);
      return saved;
    }
    applyTheme("system");
    return "system";
  }

  function saveTheme(mode) {
    if (!mode || mode === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, mode);
  }

  function initThemeToggle() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;

    let mode = loadTheme(); // "system" | "light" | "dark"

    // If system mode, infer current visible mode for the next toggle
    function currentEffectiveMode() {
      if (mode === "light") return "light";
      if (mode === "dark") return "dark";
      return getSystemIsLight() ? "light" : "dark";
    }

    btn.addEventListener("click", (e) => {
      // Shift-click resets to system
      if (e.shiftKey) {
        mode = "system";
        saveTheme(mode);
        applyTheme(mode);
        return;
      }

      const eff = currentEffectiveMode();
      mode = (eff === "light") ? "dark" : "light";
      saveTheme(mode);
      applyTheme(mode);
    });

    // If user is in system mode and system theme changes while page is open
    if (window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: light)");
      mq.addEventListener?.("change", () => {
        if (mode === "system") applyTheme("system");
      });
    }
  }

  // ---------------------------
  // Home: Category accordion
  // Rules:
  // - If category has 1 section button: header becomes link to that section, no chevron
  // - If category has >= 2 section buttons: start collapsed, header toggles expand/collapse
  // ---------------------------
  function initCategoryAccordion() {
    const home = document.getElementById("home-sections");
    if (!home) return;

    const blocks = home.querySelectorAll("[data-cat-block]");
    blocks.forEach((block) => {
      const header = block.querySelector("[data-cat-toggle]");
      const bodyEl = block.querySelector("[data-cat-body]");
      const meta = block.querySelector("[data-cat-meta]");
      const chevron = block.querySelector(".cat-chevron");

      if (!header || !bodyEl) return;

      const sectionLinks = bodyEl.querySelectorAll("a.section-btn");
      const count = sectionLinks.length;

      if (meta) meta.textContent = (count === 1 ? "1 section" : `${count} sections`);

      if (count <= 1) {
        // Convert header button -> link to the only section (if present)
        if (count === 1) {
          const href = sectionLinks[0].getAttribute("href") || "#";
          const link = document.createElement("a");
          link.className = header.className.replace("cat-header", "cat-header cat-header--link");
          link.href = href;
          link.innerHTML = header.innerHTML;
          header.replaceWith(link);
          // Body stays visible but we can hide it to avoid duplicate link display
          bodyEl.style.display = "none";
        } else {
          // No sections: keep open, nothing to toggle
          if (chevron) chevron.style.display = "none";
        }
        return;
      }

      // Collapse by default for multi-section categories
      header.setAttribute("aria-expanded", "false");
      bodyEl.hidden = true;

      header.addEventListener("click", () => {
        const isOpen = header.getAttribute("aria-expanded") === "true";
        header.setAttribute("aria-expanded", String(!isOpen));
        bodyEl.hidden = isOpen;
      });
    });
  }

  // ---------------------------
  // Sticky nav helpers (if present)
  // - Back to top
  // - Search focus
  // ---------------------------
  function initStickyNav() {
    const nav = document.querySelector("[data-sticky-nav]");
    if (!nav) return;

    const topBtn = nav.querySelector("[data-nav-top]");
    const searchBtn = nav.querySelector("[data-nav-search]");

    if (topBtn) {
      topBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const input = document.querySelector("input[data-page-search]");
        if (input) input.focus();
      });
    }
  }

  // ---------------------------
  // Page search highlighting (if you already have it)
  // If not present in your current site.js, leave this alone.
  // ---------------------------
  function initPageSearch() {
    const input = document.querySelector("input[data-page-search]");
    if (!input) return;

    const root = document.querySelector(".content");
    if (!root) return;

    let lastMark = [];

    function clearMarks() {
      for (const m of lastMark) {
        const parent = m.parentNode;
        if (!parent) continue;
        parent.replaceChild(document.createTextNode(m.textContent), m);
        parent.normalize();
      }
      lastMark = [];
    }

    function markText(query) {
      if (!query) return;

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const p = node.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          if (p.closest(".search-modal, script, style, nav, button, input, textarea")) return NodeFilter.FILTER_REJECT;
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
        if (idx === -1) continue;

        const frag = document.createDocumentFragment();
        let last = 0;

        while (idx !== -1) {
          frag.appendChild(document.createTextNode(text.slice(last, idx)));
          const span = document.createElement("mark");
          span.className = "search-hit";
          span.textContent = text.slice(idx, idx + query.length);
          frag.appendChild(span);
          lastMark.push(span);
          last = idx + query.length;
          idx = low.indexOf(q, last);
        }

        frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      }
    }

    let t = null;
    input.addEventListener("input", () => {
      const v = input.value.trim();
      clearTimeout(t);
      t = setTimeout(() => {
        clearMarks();
        if (v.length >= 2) markText(v);
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

  // ---------------------------
  // Global search modal (home)
  // - opens when the header global input is focused/typed
  // ---------------------------
  function initGlobalSearchModal() {
    const trigger = document.querySelector("input[data-global-search]");
    const modal = document.getElementById("global-search-modal");
    const modalInput = document.getElementById("global-search-modal-input");
    const resultsEl = document.getElementById("global-search-results");
    const indexScript = document.getElementById("global-search-index");

    if (!trigger || !modal || !modalInput || !resultsEl || !indexScript) return;

    let index = null;
    try {
      index = JSON.parse(indexScript.textContent || "{}");
    } catch {
      index = null;
    }
    const docs = (index && Array.isArray(index.documents)) ? index.documents : [];

    function openModal(prefill) {
      document.body.classList.add("search-modal-open");
      modal.hidden = false;
      modalInput.value = prefill || "";
      modalInput.focus();
      render();
    }

    function closeModal() {
      document.body.classList.remove("search-modal-open");
      modal.hidden = true;
      resultsEl.innerHTML = "";
    }

    function render() {
      const q = modalInput.value.trim().toLowerCase();
      if (!q) {
        resultsEl.classList.remove("has-results");
        resultsEl.innerHTML = "";
        return;
      }

      const hits = [];
      for (const d of docs) {
        const t = String(d.title || "").toLowerCase();
        const c = String(d.category || "").toLowerCase();
        if (t.includes(q) || c.includes(q)) hits.push(d);
      }

      resultsEl.innerHTML = hits.slice(0, 40).map(d => {
        const cat = d.category ? `<div class="muted" style="font-size:12px;margin-top:2px;">${escapeHtml(d.category)}</div>` : "";
        return `
          <div class="global-search-result">
            <a class="global-search-result__title" href="${escapeAttr(d.url || '#')}">${escapeHtml(d.title || 'Untitled')}</a>
            ${cat}
          </div>
        `;
      }).join("");

      resultsEl.classList.toggle("has-results", hits.length > 0);
    }

    function escapeHtml(s) {
      return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }
    function escapeAttr(s) {
      return escapeHtml(s).replaceAll("`", "&#96;");
    }

    // Open modal when user starts typing or focuses
    trigger.addEventListener("focus", () => openModal(trigger.value));
    trigger.addEventListener("input", () => openModal(trigger.value));

    // Modal interactions
    modal.addEventListener("click", (e) => {
      const t = e.target;
      if (t && (t.matches("[data-search-modal-close]") || t.closest("[data-search-modal-close]"))) closeModal();
    });

    window.addEventListener("keydown", (e) => {
      if (!modal.hidden && e.key === "Escape") closeModal();
    });

    modalInput.addEventListener("input", render);
  }

  // Boot
  document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    initCategoryAccordion();
    initStickyNav();
    initPageSearch();
    initGlobalSearchModal();
  });

})();