// AffordAct site JS
// Theme toggle, home sections toggle, in-page search, global modal search, sticky nav

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initThemeToggle();
  initSectionToggle();
  initPageSearch();
  initGlobalSearch();
  initStickyNav();
});

/* -----------------------------
 * Theme
 * --------------------------- */

function initTheme() {
  const saved = localStorage.getItem("aa-theme");
  if (saved === "light") document.body.classList.add("theme-light");
  else document.body.classList.remove("theme-light");
}

function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const isLight = document.body.classList.contains("theme-light");
    document.body.classList.toggle("theme-light", !isLight);
    localStorage.setItem("aa-theme", isLight ? "dark" : "light");
  });
}

/* -----------------------------
 * Home: show/hide sections list
 * --------------------------- */

function initSectionToggle() {
  const toggleBtn = document.querySelector("#toggle-sections");
  const grid = document.querySelector("#sections-grid");
  if (!toggleBtn || !grid) return;

  const updateLabel = () => {
    const isHidden = grid.hasAttribute("hidden");
    const span = toggleBtn.querySelector("span");
    if (span) span.textContent = isHidden ? "Show individual sections" : "Hide individual sections";
    toggleBtn.setAttribute("aria-expanded", isHidden ? "false" : "true");
  };

  toggleBtn.addEventListener("click", () => {
    if (grid.hasAttribute("hidden")) {
      grid.removeAttribute("hidden");
      grid.setAttribute("aria-busy", "false");
    } else {
      grid.setAttribute("hidden", "");
    }
    updateLabel();
  });

  updateLabel();
}

/* -----------------------------------
 * In-page search + highlighting
 * --------------------------------- */

function initPageSearch() {
  const searchInputs = document.querySelectorAll("[data-page-search]");
  const searchRoot = document.querySelector(".content") || document.querySelector("[data-search-root]");
  if (!searchRoot || !searchInputs.length) return;

  searchInputs.forEach((input) => {
    input.addEventListener("input", (e) => highlightTerm(searchRoot, e.target.value || ""));
    input.addEventListener("search", (e) => highlightTerm(searchRoot, e.target.value || ""));
  });

  // Auto highlight on ?q=
  try {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("q");
    if (q && q.trim()) {
      const term = q.trim();
      searchInputs.forEach((i) => (i.value = term));
      highlightTerm(searchRoot, term);
      const firstHit = searchRoot.querySelector(".search-hit");
      if (firstHit) firstHit.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  } catch {
    // ignore
  }
}

function clearHighlights(root) {
  root.querySelectorAll(".search-hit").forEach((span) => {
    const parent = span.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(span.textContent), span);
    parent.normalize();
  });
}

function highlightTerm(root, term) {
  clearHighlights(root);
  term = (term || "").trim();
  if (!term) return;

  const lowerTerm = term.toLowerCase();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);

  const hits = [];
  let node;
  while ((node = walker.nextNode())) {
    if (!node.nodeValue.trim()) continue;
    if (node.parentNode.closest(".search-hit")) continue;

    const idx = node.nodeValue.toLowerCase().indexOf(lowerTerm);
    if (idx !== -1) hits.push({ node, idx });
  }

  hits.forEach(({ node, idx }) => {
    const text = node.nodeValue;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + term.length);
    const after = text.slice(idx + term.length);

    const frag = document.createDocumentFragment();
    if (before) frag.appendChild(document.createTextNode(before));
    const mark = document.createElement("span");
    mark.className = "search-hit";
    mark.textContent = match;
    frag.appendChild(mark);
    if (after) frag.appendChild(document.createTextNode(after));

    node.parentNode.replaceChild(frag, node);
  });
}

/* -----------------------------------
 * Global search (home) in modal
 * --------------------------------- */

function initGlobalSearch() {
  const headerInput = document.querySelector("[data-global-search]");
  const modal = document.getElementById("global-search-modal");
  const resultsEl = document.getElementById("global-search-results");
  const indexScript = document.getElementById("global-search-index");
  const modalInput = document.getElementById("global-search-modal-input");
  if (!headerInput || !modal || !resultsEl || !indexScript || !modalInput) return;

  let index;
  try {
    index = JSON.parse(indexScript.textContent);
  } catch (e) {
    console.error("Failed to parse global search index", e);
    return;
  }

  const docs = index && Array.isArray(index.documents) ? index.documents : [];
  const cache = {}; // url->text

  const preventScroll = (e) => {
    const dialog = modal.querySelector(".search-modal__dialog");
    if (dialog && !dialog.contains(e.target)) e.preventDefault();
  };

  const openModal = () => {
    modal.removeAttribute("hidden");
    document.body.classList.add("search-modal-open");
    document.addEventListener("touchmove", preventScroll, { passive: false });
    modalInput.value = headerInput.value || "";
    modalInput.focus();
    if (modalInput.value.trim()) debounced(modalInput.value);
  };

  const closeModal = () => {
    modal.setAttribute("hidden", "");
    document.body.classList.remove("search-modal-open");
    document.removeEventListener("touchmove", preventScroll);
  };

  modal.querySelectorAll("[data-search-modal-close]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      closeModal();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hasAttribute("hidden")) closeModal();
  });

  headerInput.addEventListener("focus", openModal);
  headerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      openModal();
    }
  });

  const loadDocText = async (doc) => {
    if (cache[doc.url]) return cache[doc.url];
    try {
      const res = await fetch(doc.url, { credentials: "same-origin" });
      if (!res.ok) return "";
      const html = await res.text();
      const parsed = new DOMParser().parseFromString(html, "text/html");
      const contentEl = parsed.querySelector(".content") || parsed.body;
      const text = (contentEl.textContent || "").replace(/\s+/g, " ").trim();
      cache[doc.url] = text;
      return text;
    } catch (err) {
      console.error("Fetch error", doc.url, err);
      cache[doc.url] = "";
      return "";
    }
  };

  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const renderResults = async (term) => {
    term = term.trim();
    resultsEl.innerHTML = "";
    resultsEl.classList.remove("has-results");
    if (!term) return;

    const lowerTerm = term.toLowerCase();
    const regex = new RegExp(escapeRegExp(term), "gi");
    const found = [];

    for (const doc of docs) {
      const text = cache[doc.url] || "";
      const idx = text.toLowerCase().indexOf(lowerTerm);
      if (idx === -1) continue;

      const context = 90;
      const start = Math.max(0, idx - context);
      const end = Math.min(text.length, idx + term.length + context);
      let snippet = text.slice(start, end).trim().replace(/\s+/g, " ");

      const snippetHtml = snippet.replace(regex, (m) => `<mark class="search-hit">${m}</mark>`);
      const urlWithQuery = doc.url + (doc.url.includes("?") ? "&" : "?") + "q=" + encodeURIComponent(term);

      found.push({ title: doc.title, url: urlWithQuery, snippetHtml });
    }

    if (!found.length) {
      resultsEl.innerHTML = `<p class="muted">No matches found for "<strong>${escapeHtml(term)}</strong>".</p>`;
      return;
    }

    const frag = document.createDocumentFragment();
    found.forEach((hit) => {
      const div = document.createElement("div");
      div.className = "global-search-result";
      div.innerHTML = `
        <a class="global-search-result__title" href="${hit.url}">${escapeHtml(hit.title)}</a>
        <p class="global-search-result__snippet">${hit.snippetHtml}</p>
      `;
      frag.appendChild(div);
    });

    resultsEl.appendChild(frag);
    resultsEl.classList.add("has-results");
  };

  let loadedAll = false;

  const runSearch = async (term) => {
    const t = term.trim();
    if (!t) {
      resultsEl.innerHTML = "";
      resultsEl.classList.remove("has-results");
      return;
    }
    if (!loadedAll) {
      loadedAll = true;
      await Promise.all(docs.map(loadDocText));
    }
    renderResults(t);
  };

  const debounced = debounce(runSearch, 250);

  modalInput.addEventListener("input", (e) => debounced(e.target.value || ""));
  modalInput.addEventListener("search", (e) => debounced(e.target.value || ""));
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function debounce(fn, delay) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

/* -----------------------------------
 * Sticky footer nav (bill/sections)
 * --------------------------------- */

function initStickyNav() {
  const nav = document.querySelector("[data-sticky-nav]");
  if (!nav) return;

  const prev = nav.querySelector("[data-nav-prev]");
  const next = nav.querySelector("[data-nav-next]");
  const topBtn = nav.querySelector("[data-nav-top]");

  // Smooth top
  if (topBtn) {
    topBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const el = document.scrollingElement || document.documentElement || document.body;
      el.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Prevent clicking disabled placeholders
  [prev, next].forEach((a) => {
    if (!a) return;
    if (a.classList.contains("is-disabled")) {
      a.addEventListener("click", (e) => e.preventDefault());
    }
  });

  // Arrow keys navigate (avoid when typing)
  document.addEventListener("keydown", (e) => {
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    if (e.key === "ArrowLeft" && prev && !prev.classList.contains("is-disabled") && prev.href) {
      e.preventDefault();
      window.location.href = prev.href;
    } else if (e.key === "ArrowRight" && next && !next.classList.contains("is-disabled") && next.href) {
      e.preventDefault();
      window.location.href = next.href;
    }
  });
}