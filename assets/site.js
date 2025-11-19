// AffordAct site JS
// Handles: theme toggle, home section toggle, in-page search, global modal search, pager nav

document.addEventListener("DOMContentLoaded", () => {
  initTheme();           // load saved theme
  initThemeToggle();     // header theme switch
  initSectionToggle();   // home: show/hide individual sections
  initPageSearch();      // bill / section pages: highlight text as you type + from ?q=
  initGlobalSearch();    // home: multi-page bill search (modal)
  initPagerNav();        // prev/next + arrow keys + back-to-top visibility
});

/* -----------------------------
 * Theme handling
 * --------------------------- */

function initTheme() {
  const saved = localStorage.getItem("aa-theme");
  if (saved === "light") {
    document.body.classList.add("theme-light");
  } else {
    document.body.classList.remove("theme-light");
  }
}

function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  const apply = (mode) => {
    if (mode === "light") {
      document.body.classList.add("theme-light");
    } else {
      document.body.classList.remove("theme-light");
    }
    localStorage.setItem("aa-theme", mode);
  };

  btn.addEventListener("click", () => {
    const isLight = document.body.classList.contains("theme-light");
    apply(isLight ? "dark" : "light");
  });
}

/* -----------------------------
 * Home: show/hide section grid
 * --------------------------- */

function initSectionToggle() {
  const toggleBtn = document.querySelector("#toggle-sections");
  const grid = document.querySelector("#sections-grid");
  if (!toggleBtn || !grid) return;

  const updateLabel = () => {
    const isHidden = grid.hasAttribute("hidden");
    const span = toggleBtn.querySelector("span");
    if (span) {
      span.textContent = isHidden
        ? "Show individual sections"
        : "Hide individual sections";
    }
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
 * In-page search + highlighting logic
 * --------------------------------- */

function initPageSearch() {
  const searchInputs = document.querySelectorAll("[data-page-search]");
  const searchRoot =
    document.querySelector(".content") ||
    document.querySelector("[data-search-root]");

  if (searchInputs.length && searchRoot) {
    searchInputs.forEach((input) => {
      input.addEventListener("input", (e) => {
        const term = e.target.value || "";
        highlightTerm(searchRoot, term);
      });

      input.addEventListener("search", (e) => {
        const term = e.target.value || "";
        highlightTerm(searchRoot, term);
      });
    });
  }

  // If arriving at bill/section page with ?q=term, auto-highlight and scroll
  if (searchRoot && searchInputs.length) {
    try {
      const url = new URL(window.location.href);
      const q = url.searchParams.get("q");
      if (q && q.trim()) {
        const term = q.trim();
        searchInputs.forEach((input) => {
          input.value = term;
        });
        highlightTerm(searchRoot, term);
        const firstHit = searchRoot.querySelector(".search-hit");
        if (firstHit) {
          firstHit.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    } catch (e) {
      // ignore URL parsing errors
    }
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
  term = term.trim();
  if (!term) return;

  const lowerTerm = term.toLowerCase();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);

  const hits = [];
  let node;
  while ((node = walker.nextNode())) {
    if (!node.nodeValue.trim()) continue;
    if (node.parentNode.closest(".search-hit")) continue;
    const idx = node.nodeValue.toLowerCase().indexOf(lowerTerm);
    if (idx !== -1) {
      hits.push({ node, idx });
    }
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
 * Global search (home: multi-page, modal)
 * --------------------------------- */

function initGlobalSearch() {
  const headerInput = document.querySelector("[data-global-search]");
  const modal = document.getElementById("global-search-modal");
  const resultsEl = document.getElementById("global-search-results");
  const indexScript = document.getElementById("global-search-index");
  const modalInput = document.getElementById("global-search-modal-input");

  if (!headerInput || !resultsEl || !indexScript || !modal || !modalInput) return;

  // Modal controls
    const openModal = () => {
    modal.removeAttribute("hidden");
    document.body.classList.add("search-modal-open");
    // Sync header value and focus modal input
    modalInput.value = headerInput.value || "";
    modalInput.focus();
    // Trigger search if there's already text
    if (modalInput.value.trim()) {
      runSearch(modalInput.value);
    } else {
      resultsEl.innerHTML = "";
      resultsEl.classList.remove("has-results");
    }
  };

  const closeModal = () => {
    modal.setAttribute("hidden", "");
    document.body.classList.remove("search-modal-open");
  };

  modal.querySelectorAll("[data-search-modal-close]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      closeModal();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hasAttribute("hidden")) {
      closeModal();
    }
  });

  let index;
  try {
    index = JSON.parse(indexScript.textContent);
  } catch (e) {
    console.error("Failed to parse global search index", e);
    return;
  }

  const docs = index && Array.isArray(index.documents) ? index.documents : [];
  if (!docs.length) return;

  const cache = {}; // url -> text content

  const loadDocText = async (doc) => {
    if (cache[doc.url]) return cache[doc.url];

    try {
      const res = await fetch(doc.url, { credentials: "same-origin" });
      if (!res.ok) return "";
      const html = await res.text();

      const parser = new DOMParser();
      const parsed = parser.parseFromString(html, "text/html");
      const contentEl = parsed.querySelector(".content") || parsed.body;
      const text = (contentEl.textContent || "").replace(/\s+/g, " ").trim();
      cache[doc.url] = text;
      return text;
    } catch (err) {
      console.error("Error fetching doc for search", doc.url, err);
      cache[doc.url] = "";
      return "";
    }
  };

  const escapeRegExp = (s) =>
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const renderResults = async (term) => {
    term = term.trim();
    resultsEl.innerHTML = "";
    resultsEl.classList.remove("has-results");

    if (!term) {
      closeModal();
      return;
    }

    const lowerTerm = term.toLowerCase();
    const regex = new RegExp(escapeRegExp(term), "gi");

    const found = [];

    for (const doc of docs) {
      const text = cache[doc.url];
      if (!text) continue;
      const lower = text.toLowerCase();
      const idx = lower.indexOf(lowerTerm);
      if (idx === -1) continue;

      const context = 90;
      let start = Math.max(0, idx - context);
      let end = Math.min(text.length, idx + term.length + context);
      let snippet = text.slice(start, end).trim();

      snippet = snippet.replace(/\s+/g, " ");

      const snippetHtml = snippet.replace(regex, (m) => {
        return `<mark class="search-hit">${m}</mark>`;
      });

      // Include ?q=term so target page auto-highlights and scrolls
      const urlWithQuery =
        doc.url + (doc.url.includes("?") ? "&" : "?") + "q=" + encodeURIComponent(term);

      found.push({
        title: doc.title,
        url: urlWithQuery,
        snippetHtml,
      });
    }

    if (!found.length) {
      resultsEl.innerHTML =
        `<p class="muted">No matches found for "<strong>${escapeHtml(term)}</strong>".</p>`;
      return;
    }

    const frag = document.createDocumentFragment();
    found.forEach((hit) => {
      const div = document.createElement("div");
      div.className = "global-search-result";
      div.innerHTML = `
        <a class="global-search-result__title" href="${hit.url}">
          ${escapeHtml(hit.title)}
        </a>
        <p class="global-search-result__snippet">${hit.snippetHtml}</p>
      `;
      frag.appendChild(div);
    });

    resultsEl.appendChild(frag);
    resultsEl.classList.add("has-results");
    openModal();
  };

  let loadedAll = false;

  const runSearch = async (term) => {
    const trimmed = term.trim();
    if (!trimmed) {
      resultsEl.innerHTML = "";
      resultsEl.classList.remove("has-results");
      closeModal();
      return;
    }

    if (!loadedAll) {
      loadedAll = true;
      await Promise.all(docs.map(loadDocText));
    }

    renderResults(trimmed);
  };

  const debounced = debounce((term) => {
    runSearch(term);
  }, 250);

  // Header input: focusing or pressing Enter opens modal, then you type in modal input
  headerInput.addEventListener("focus", () => {
    openModal();
  });

  headerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      openModal();
    }
  });

  // Actual search happens from the modal input
  modalInput.addEventListener("input", (e) => {
    debounced(e.target.value || "");
  });

  modalInput.addEventListener("search", (e) => {
    debounced(e.target.value || "");
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function debounce(fn, delay) {
  let t = null;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* --------------------------------
 * Pager: prev/next + arrow keys
 * ------------------------------ */

function initPagerNav() {
  const prevLink = document.querySelector("[data-nav-prev]");
  const nextLink = document.querySelector("[data-nav-next]");
  const floatingPager = document.querySelector("[data-floating-pager]");

  if (floatingPager) {
    const homeBtn = floatingPager.querySelector(".pager-btn--home");

    if (homeBtn) {
      homeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  document.addEventListener("keydown", (e) => {
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    if (e.key === "ArrowLeft" && prevLink && prevLink.href) {
      e.preventDefault();
      window.location.href = prevLink.href;
    } else if (e.key === "ArrowRight" && nextLink && nextLink.href) {
      e.preventDefault();
      window.location.href = nextLink.href;
    }
  });
}