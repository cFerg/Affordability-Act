// AffordAct site JS
// Handles: home section toggle, in-page search highlighting, pager nav, theme toggle

document.addEventListener("DOMContentLoaded", () => {
  initTheme();         // load saved theme
  initThemeToggle();   // header theme switch
  initSectionToggle(); // home: show/hide individual sections
  initPageSearch();    // bill / section pages: highlight text as you type
  initPagerNav();      // prev/next + arrow keys + back-to-top visibility
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
  if (!searchInputs.length) return;

  const searchRoot =
    document.querySelector(".content") ||
    document.querySelector("[data-search-root]");
  if (!searchRoot) return;

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

/* --------------------------------
 * Pager: prev/next + arrow keys
 * ------------------------------ */

function initPagerNav() {
  const prevLink = document.querySelector("[data-nav-prev]");
  const nextLink = document.querySelector("[data-nav-next]");
  const floatingPager = document.querySelector("[data-floating-pager]");

  if (floatingPager) {
    const homeBtn = floatingPager.querySelector(".pager-btn--home");

    // Only control home visibility; arrows are always visible via CSS
    if (homeBtn) {
      const onScroll = () => {
        if (window.scrollY > 180) {
          homeBtn.classList.add("is-visible-home");
        } else {
          homeBtn.classList.remove("is-visible-home");
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      // Smooth scroll for back-to-top
      homeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  // Arrow-key navigation: left = prev, right = next
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