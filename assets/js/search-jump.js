(() => {
  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function findNthTextMatch(root, re, n) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (p.closest("nav,button,input,textarea,select,script,style,.toc-float,.section-topbar,.search-modal")) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let count = 0;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const txt = node.nodeValue;
      let m;
      re.lastIndex = 0;
      while ((m = re.exec(txt))) {
        if (count === n) return { node, index: m.index, length: m[0].length };
        count++;
      }
    }
    return null;
  }

  function wrapMatch(match, id) {
    const { node, index, length } = match;
    const text = node.nodeValue;
    const before = text.slice(0, index);
    const hit = text.slice(index, index + length);
    const after = text.slice(index + length);

    const span = document.createElement("span");
    span.id = id;

    const mark = document.createElement("mark");
    mark.className = "search-hit";
    mark.textContent = hit;

    const frag = document.createDocumentFragment();
    if (before) frag.appendChild(document.createTextNode(before));
    span.appendChild(mark);
    frag.appendChild(span);
    if (after) frag.appendChild(document.createTextNode(after));

    node.parentNode.replaceChild(frag, node);
    return span;
  }

  window.AffordAct = window.AffordAct || {};
  window.AffordAct.initSearchJump = () => {
    const root = document.querySelector(".content");
    if (!root) return;

    const raw = sessionStorage.getItem("aff_search_jump");
    if (!raw) return;

    let data;
    try { data = JSON.parse(raw); } catch { return; }

    const q = String(data.q || "").trim();
    const hitIndex = Number(data.hit || 0);

    if (!q) return;

    // clear so it only runs once
    sessionStorage.removeItem("aff_search_jump");

    const re = new RegExp(escapeRegExp(q), "ig");
    const match = findNthTextMatch(root, re, hitIndex);
    if (!match) return;

    const id = `aff-hit-${encodeURIComponent(String(data.doc || "doc"))}-${hitIndex}`;
    const anchor = wrapMatch(match, id);
    anchor.scrollIntoView({ behavior: "smooth", block: "start" });
  };
})();