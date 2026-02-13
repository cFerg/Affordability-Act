(() => {
  const $ = window.AffordAct.$;
  const escapeHtml = window.AffordAct.escapeHtml;

  window.AffordAct.initGlobalSearch = () => {
    const trigger = $("input[data-global-search]");
    const modal = $("#global-search-modal");
    const modalInput = $("#global-search-modal-input");
    const resultsEl = $("#global-search-results");
    if (!trigger || !modal || !modalInput || !resultsEl) return;

    let docs = null;
    let loading = false;

    const base = (window.AFFORDACT_BASEURL || "").replace(/\/$/, "");
    const searchUrl = `${base}/search.json`;

    async function ensureLoaded() {
      if (docs || loading) return;
      loading = true;
      try {
        const res = await fetch(searchUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`search.json fetch failed: ${res.status}`);
        const json = await res.json();
        docs = Array.isArray(json) ? json : (json.documents || []);
      } catch (e) {
        console.error("Search load failed", e);
        docs = [];
      } finally {
        loading = false;
      }
    }

    function lockScroll(lock) {
      document.documentElement.classList.toggle("modal-lock", lock);
    }

    function open(prefill) {
      lockScroll(true);
      modal.hidden = false;
      modalInput.value = prefill || "";
      modalInput.focus();
      render();
    }

    function close() {
      lockScroll(false);
      modal.hidden = true;
      resultsEl.innerHTML = "";
      resultsEl.classList.remove("has-results");
    }

    function snippet(content, qLower) {
      const text = String(content || "").replace(/\s+/g, " ").trim();
      if (!text) return "";
      const low = text.toLowerCase();
      const i = low.indexOf(qLower);
      if (i < 0) return text.slice(0, 160) + (text.length > 160 ? "…" : "");
      const start = Math.max(0, i - 60);
      const end = Math.min(text.length, i + 90);
      return (start ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
    }

    function highlight(sn, rawQ) {
      if (!rawQ) return escapeHtml(sn);
      const re = new RegExp(rawQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
      const parts = String(sn).split(re);
      const matches = String(sn).match(re) || [];
      let out = "";
      for (let i = 0; i < parts.length; i++) {
        out += escapeHtml(parts[i]);
        if (i < matches.length) out += `<mark class="search-hit">${escapeHtml(matches[i])}</mark>`;
      }
      return out;
    }

    async function render() {
      const rawQ = modalInput.value.trim();
      const q = rawQ.toLowerCase();
      if (!q) {
        resultsEl.innerHTML = "";
        resultsEl.classList.remove("has-results");
        return;
      }

      await ensureLoaded();

      const hits = [];
      for (const d of docs) {
        const title = String(d.title || "");
        const cat = String(d.category || "");
        const body = String(d.content || d.body || "");
        const lt = title.toLowerCase();
        const lc = cat.toLowerCase();
        const lb = body.toLowerCase();

        let score = 0;
        if (lb.includes(q)) score += 10;
        if (lt.includes(q)) score += 3;
        if (lc.includes(q)) score += 1;
        if (score > 0) hits.push({ d, score });
      }

      hits.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const ao = Number(a.d.order ?? 9999);
        const bo = Number(b.d.order ?? 9999);
        return ao - bo;
      });

      resultsEl.innerHTML = hits.slice(0, 40).map(({ d }) => {
        const catHtml = d.category ? `<div class="muted global-search-result__cat">${escapeHtml(d.category)}</div>` : "";
        const sn = snippet(d.content || d.body || "", q);
        const snHtml = sn ? `<p class="global-search-result__snippet">${highlight(sn, rawQ)}</p>` : "";
        return `
          <div class="global-search-result">
            <a class="global-search-result__title" href="${escapeHtml(d.url || "#")}">${escapeHtml(d.title || "Untitled")}</a>
            ${catHtml}
            ${snHtml}
          </div>`;
      }).join("");

      resultsEl.classList.toggle("has-results", hits.length > 0);
    }

    trigger.addEventListener("focus", () => open(trigger.value));
    trigger.addEventListener("input", () => open(trigger.value));

    modal.addEventListener("click", (e) => {
      const t = e.target;
      if (t && (t.matches("[data-search-modal-close]") || t.closest("[data-search-modal-close]"))) close();
    });

    window.addEventListener("keydown", (e) => {
      if (!modal.hidden && e.key === "Escape") close();
    });

    modalInput.addEventListener("input", render);
  };
})();