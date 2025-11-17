// AffordAct site JS
// Handles: section grid toggle on home, page search highlighting, pager/nav helpers

document.addEventListener("DOMContentLoaded", () => {
  initSectionToggle();   // home page sections show/hide
  initPageSearch();      // in-page search highlighting
  initPagerNav();        // prev/next/full bill + arrow keys
  initSectionJump();     // "jump to section" dropdown, if present
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
    toggleBtn.querySelector("span")?.textContent &&
      (toggleBtn.querySelector("span").textContent =
        isHidden ? "Show individual sections" : "Hide individual sections");
    toggleBtn.setAttribute(
      "aria-expanded",
      isHidden ? "false" : "true"
    );
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
  // Any input/field with data-page-search will drive in-page highlight
  const searchInputs = document.querySelectorAll("[data-page-search]");
  if (!searchInputs.length) return;

  // Content root: where bill/section markdown lives
  // You can change this if your content container differs.
  const searchRoot =
    document.querySelector(".content") ||
    document.querySelector("[data-search-root]");
  if (!searchRoot) return;

  searchInputs.forEach((input) => {
    input.addEventListener("input", (e) => {
      const term = e.target.value || "";
      highlightTerm(searchRoot, term);
    });

    // Optional: clear button if using type="search"
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
    parent.normalize(); // merge adjacent text nodes
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
    if (node.parentNode.closest(".search-hit")) continue; // don't re-highlight
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
  // Any link with these data attributes will be considered for keyboard nav
  const prevLink = document.querySelector("[data-nav-prev]");
  const nextLink = document.querySelector("[data-nav-next]");

  // Floating pager visibility on scroll (if present)
  const floatingPager = document.querySelector("[data-floating-pager]");
  if (floatingPager) {
    const onScroll = () => {
      const threshold = 250; // px down before showing
      if (window.scrollY > threshold) {
        floatingPager.classList.add("is-visible");
      } else {
        floatingPager.classList.remove("is-visible");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Arrow-key navigation: left = prev, right = next
  document.addEventListener("keydown", (e) => {
    // ignore if typing in form fields
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

/* -----------------------------------------
 * Section "jump to" dropdown (if present)
 * --------------------------------------- */

function initSectionJump() {
  // e.g. a <select data-section-jump> with <option value="/policy/sections/01_.../">
  const jump = document.querySelector("[data-section-jump]");
  if (!jump) return;

  jump.addEventListener("change", (e) => {
    const url = e.target.value;
    if (url) {
      window.location.href = url;
    }
  });
}