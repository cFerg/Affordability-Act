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
    let ui = null;
    let uiCount = null;

    function createUI() {
      if (ui) return;

      ui = document.createElement("div");
      ui.className = "findpill";
      ui.hidden = true;
      ui.innerHTML = `
        <div class="findpill__inner" role="status" aria-live="polite">
          <span class="findpill__count">0 / 0</span>
          <button type="button" class="findpill__btn" data-find-prev aria-label="Previous match">↑</button>
          <button type="button" class="findpill__btn" data-find-next aria-label="Next match">↓</button>
          <button type="button" class="findpill__btn" data-find-close aria-label="Close">×</button>
        </div>
      `;
      document.body.appendChild(ui);

      uiCount = ui.querySelector(".findpill__count");

      ui.addEventListener("click", (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;

        if (t.matches("[data-find-prev]")) {
          e.preventDefault();
          gotoPrev();
        } else if (t.matches("[data-find-next]")) {
          e.preventDefault();
          gotoNext();
        } else if (t.matches("[data-find-close]")) {
          e.preventDefault();
          clearAll();
          input.value = "";
          input.blur();
        }
      });
    }

    function positionUI() {
      if (!ui || ui.hidden) return;
      const r = input.getBoundingClientRect();
      const top = Math.max(8, r.bottom + 8);
      const left = Math.min(window.innerWidth - 16, Math.max(16, r.left));
      ui.style.top = `${top}px`;
      ui.style.left = `${left}px`;
    }

    function showUI() {
      createUI();
      ui.hidden = false;
      positionUI();
    }

    function hideUI() {
      if (!ui) return;
      ui.hidden = true;
    }

    function updateCount() {
      if (!uiCount) return;
      const total = marks.length;
      const cur = total ? (activeIndex + 1) : 0;
      uiCount.textContent = `${cur} / ${total}`;
    }

    function clearMarks() {
      // Replace marks back to text nodes (best-effort, conservative)
      marks.forEach(m => {
        const parent = m.parentNode;
        if (!parent) return;
        parent.replaceChild(document.createTextNode(m.textContent), m);
        parent.normalize();
      });
      marks = [];
      activeIndex = -1;
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
        let m;
        re.lastIndex = 0;

        if (!re.test(text)) continue;

        re.lastIndex = 0;
        const frag = document.createDocumentFragment();
        let last = 0;

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

      // Clear previous active marker styling
      marks.forEach((m, idx) => m.classList.toggle("search-hit--active", idx === i));
      activeIndex = i;
      updateCount();

      const el = marks[activeIndex];
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function gotoNext() {
      if (!marks.length) return;
      const next = (activeIndex + 1) % marks.length;
      setActive(next);
    }

    function gotoPrev() {
      if (!marks.length) return;
      const prev = (activeIndex - 1 + marks.length) % marks.length;
      setActive(prev);
    }

    function clearAll() {
      clearMarks();
      hideUI();
      updateCount();
    }

    // Re-run search on input changes (debounced)
    let t = null;
    input.addEventListener("input", () => {
      clearTimeout(t);
      const q = input.value.trim();

      t = setTimeout(() => {
        clearMarks();

        if (q.length >= 2) {
          showUI();
          markAll(q);
          if (marks.length) setActive(0);
          else updateCount();
        } else {
          hideUI();
        }
      }, 120);
    });

    // Keyboard controls similar to browser find
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) gotoPrev();
        else gotoNext();
      } else if (e.key === "Escape") {
        e.preventDefault();
        input.value = "";
        clearAll();
        input.blur();
      }
    });

    // Reposition pill on resize/scroll
    window.addEventListener("resize", positionUI, { passive: true });
    window.addEventListener("scroll", positionUI, { passive: true });

    // If focus leaves the input, keep the pill (like ctrl+f) unless query is tiny
    input.addEventListener("blur", () => {
      if ((input.value || "").trim().length < 2) hideUI();
    });
  };
})();