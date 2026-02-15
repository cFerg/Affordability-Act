(() => {
  const $ = window.AffordAct.$;

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  window.AffordAct.initPageSearch = () => {
    const headerInput = $("input[data-page-search]");
    const root = document.querySelector(".content");
    if (!headerInput || !root) return;

    let marks = [];
    let activeIndex = -1;

    // Build pill
    const pill = document.createElement("div");
    pill.className = "findpill";
    pill.hidden = true;
    pill.innerHTML = `
      <div class="findpill__inner" role="status" aria-live="polite">
        <input class="findpill__input" type="search" placeholder="Search this page…" autocomplete="off" />
        <span class="findpill__count">0 / 0</span>
        <button type="button" class="findpill__btn" data-find-prev aria-label="Previous match">↑</button>
        <button type="button" class="findpill__btn" data-find-next aria-label="Next match">↓</button>
        <button type="button" class="findpill__btn" data-find-close aria-label="Close">×</button>
      </div>
    `;
    document.body.appendChild(pill);

    const pillInput = pill.querySelector(".findpill__input");
    const pillCount = pill.querySelector(".findpill__count");

    function updateCount() {
      const total = marks.length;
      const cur = total ? (activeIndex + 1) : 0;
      pillCount.textContent = `${cur} / ${total}`;
    }

    function clearMarks() {
      marks.forEach(m => {
        const parent = m.parentNode;
        if (!parent) return;
        parent.replaceChild(document.createTextNode(m.textContent), m);
        parent.normalize();
      });
      marks = [];
      activeIndex = -1;
      updateCount();
    }

    function markAll(query) {
      const re = new RegExp(escapeRegExp(query), "ig");

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const p = node.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          if (p.closest("nav,button,input,textarea,select,script,style,.toc-float,.section-topbar,.search-modal,.findpill")) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      for (const node of nodes) {
        const text = node.nodeValue;
        re.lastIndex = 0;
        if (!re.test(text)) continue;

        re.lastIndex = 0;
        const frag = document.createDocumentFragment();
        let last = 0;
        let m;

        while ((m = re.exec(text))) {
          const idx = m.index;
          const hit = m[0];

          frag.appendChild(document.createTextNode(text.slice(last, idx)));

          const mark = document.createElement("mark");
          mark.className = "search-hit";
          mark.textContent = hit;
          frag.appendChild(mark);
          marks.push(mark);

          last = idx + hit.length;
        }

        frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      }
    }

    function setActive(i) {
      if (!marks.length) {
        activeIndex = -1;
        updateCount();
        return;
      }
      marks.forEach((m, idx) => m.classList.toggle("search-hit--active", idx === i));
      activeIndex = i;
      updateCount();
      marks[activeIndex].scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function gotoNext() {
      if (!marks.length) return;
      setActive((activeIndex + 1) % marks.length);
    }

    function gotoPrev() {
      if (!marks.length) return;
      setActive((activeIndex - 1 + marks.length) % marks.length);
    }

    function closePill() {
      pill.hidden = true;
      clearMarks();
      pillInput.value = "";
      headerInput.value = "";
    }

    // Keep header input and pill input in sync
    function syncFromHeader() {
      pillInput.value = headerInput.value;
    }
    function syncToHeader() {
      headerInput.value = pillInput.value;
    }

    // Main search runner (debounced)
    let t = null;
    function runSearch() {
      clearTimeout(t);
      const q = pillInput.value.trim();

      t = setTimeout(() => {
        clearMarks();
        if (q.length >= 2) {
          pill.hidden = false;
          syncToHeader();
          markAll(q);
          if (marks.length) setActive(0);
          else updateCount();
        } else {
          pill.hidden = true;
        }
      }, 120);
    }

    // Clicking the header input should open the pill near top
    headerInput.addEventListener("focus", () => {
      syncFromHeader();
      pill.hidden = false;
      pillInput.focus();
      pillInput.select();
      runSearch();
    });

    // Typing in header input should open pill
    headerInput.addEventListener("input", () => {
      syncFromHeader();
      pill.hidden = false;
      runSearch();
    });

    // Pill input is the primary control
    pillInput.addEventListener("input", runSearch);

    pill.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.matches("[data-find-prev]")) { e.preventDefault(); gotoPrev(); }
      if (t.matches("[data-find-next]")) { e.preventDefault(); gotoNext(); }
      if (t.matches("[data-find-close]")) { e.preventDefault(); closePill(); }
    });

    // Keyboard behavior
    pillInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) gotoPrev(); else gotoNext();
      } else if (e.key === "Escape") {
        e.preventDefault();
        closePill();
      }
    });

    // Optional: also support Enter on header input
    headerInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        pill.hidden = false;
        pillInput.focus();
        if (e.shiftKey) gotoPrev(); else gotoNext();
      }
    });
  };
})();