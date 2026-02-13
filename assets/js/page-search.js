(() => {
  const $ = window.AffordAct.$;

  window.AffordAct.initPageSearch = () => {
    const input = $("input[data-page-search]");
    const root = document.querySelector(".content");
    if (!input || !root) return;

    let marks = [];
    const clear = () => {
      marks.forEach(m => {
        const p = m.parentNode;
        if (!p) return;
        p.replaceChild(document.createTextNode(m.textContent), m);
        p.normalize();
      });
      marks = [];
    };

    const mark = (query) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const p = node.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          if (p.closest("nav,button,input,textarea,select,script,style,.toc-float,.section-topbar,.search-modal")) return NodeFilter.FILTER_REJECT;
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
    };

    let t = null;
    input.addEventListener("input", () => {
      clearTimeout(t);
      const v = input.value.trim();
      t = setTimeout(() => {
        clear();
        if (v.length >= 2) mark(v);
      }, 120);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        input.value = "";
        clear();
        input.blur();
      }
    });
  };
})();