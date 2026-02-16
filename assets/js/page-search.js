(() => {
  const $ = window.AffordAct.$;

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  window.AffordAct.initPageSearch = () => {
    const input = $("input[data-page-search]");
    const root = document.querySelector(".content");
    if (!input || !root) return;

    let marks = [];
    let activeIndex = -1;

    // Controls pill (no input inside)
    const pill = document.createElement("div");
    pill.className = "findpill findpill--dock";
    pill.hidden = true;
    pill.innerHTML = `
      <div class="findpill__inner" role="status" aria-live="polite">
        <span class="findpill__count">0 / 0</span>
        <button type="button" class="findpill__btn" data-find-prev aria-label="Previous match">↑</button>
        <button type="button" class="findpill__btn" data-find-next aria-label="Next match">↓</button>
        <button type="button" class="findpill__btn" data-find-close aria-label="Close">×</button>
      </div>
    `;
    document.body.appendChild(pill);

    const pillCount = pill.querySelector(".findpill__count");

    function positionPill() {
      if (pill.hidden) return;
      const r = input.getBoundingClientRect();
      const top = Math.round(r.bottom + 8);

      // Align pill to the input's right edge
      const left = Math.min(
        window.innerWidth - 16,
        Math.max(16, Math.round(r.right - pill.offsetWidth))
      );

      pill.style.top = `${top}px`;
      pill.style.left = `${left}px`;
    }

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
    }

    // Debounced search runner
    let t = null;
    function run() {
      clearTimeout(t);
      const q = input.value.trim();

      t = setTimeout(() => {
        clearMarks();

        if (q.length >= 2) {
          pill.hidden = false;
          markAll(q);
          if (marks.length) setActive(0);
          else updateCount();
          positionPill();
        } else {
          pill.hidden = true;
        }
      }, 120);
    }

    input.addEventListener("input", run);

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) gotoPrev();
        else gotoNext();
      } else if (e.key === "Escape") {
        e.preventDefault();
        input.value = "";
        closePill();
        input.blur();
      }
    });

    pill.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.matches("[data-find-prev]")) { e.preventDefault(); gotoPrev(); }
      if (t.matches("[data-find-next]")) { e.preventDefault(); gotoNext(); }
      if (t.matches("[data-find-close]")) { e.preventDefault(); closePill(); }
    });

    // Keep pill in the right spot as page scrolls/resizes
    window.addEventListener("resize", positionPill, { passive: true });
    window.addEventListener("scroll", positionPill, { passive: true });
  };
})();