// AffordAct site JS
// Handles: home section toggle, in-page search highlighting, pager nav, section jump

document.addEventListener("DOMContentLoaded", () => {
  initSectionToggle();   // home page: show/hide individual sections
  initPageSearch();      // bill / section pages: highlight text as you type
  initPagerNav();        // prev/next + arrow keys + back-to-top visibility
});

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
    const match = text.slice(idx + 0, idx + term.length);
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

  // Always show arrows if present
  if (floatingPager) {
    const homeBtn = floatingPager.querySelector(".pager-btn--home");

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