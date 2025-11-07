(function(){
  const ready = (fn) =>
    (document.readyState !== 'loading')
      ? fn()
      : document.addEventListener('DOMContentLoaded', fn, { once: true });

  // ---------- Helpers ----------
  const AA = (() => {
    const root = document.documentElement.getAttribute('data-site-root') || '';
    const toSlug = (fname) => fname.replace(/\.md$/i,'');
    const nice = (slug) => slug.replace(/^\d+_?/, '').replace(/_/g, ' ').trim();
    const urls = {
      bill: () => `${root}/policy/bill-text/`,
      section: (slug) => `${root}/policy/sections/${slug}/`,
      sectionsJson: () => `${root}/sections.json`,
    };
    const nsort = (a,b)=>{
      const A=(a.toLowerCase().match(/\d+|[a-z]+/g))||[a],
            B=(b.toLowerCase().match(/\d+|[a-z]+/g))||[b];
      for(let i=0;i<Math.max(A.length,B.length);i++){
        const x=A[i], y=B[i];
        if(x===undefined) return -1;
        if(y===undefined) return 1;
        const xi=+x, yi=+y;
        if(!Number.isNaN(xi)&&!Number.isNaN(yi)&&xi!==yi) return xi-yi;
        if(x!==y) return x.localeCompare(y);
      }
      return 0;
    };
    async function getSections(){
      try{
        const r = await fetch(urls.sectionsJson(), { cache: 'no-store' });
        if (r.ok){
          const arr = await r.json();
          if (Array.isArray(arr) && arr.length) return arr;
        }
      }catch(_) {}
      // Fallback: scrape links on the page
      const anchors = Array.from(document.querySelectorAll('a[href*="/policy/sections/"]'));
      const md = anchors.map(a=>{
        const parts = (a.getAttribute('href')||'').split('/').filter(Boolean);
        const last = parts.pop() || '';
        const slug = last || parts.pop() || '';
        return slug.replace(/\/$/,'') + '.md';
      }).filter(Boolean);
      return [...new Set(md)].sort(nsort);
    }
    return { toSlug, nice, urls, getSections, nsort };
  })();

  // ---------- Smooth “back to top” ----------
  ready(() => {
    const toTop = document.querySelector('[data-scroll-top]');
    if (toTop){
      toTop.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    document.querySelectorAll('.btn').forEach(b=>b.style.lineHeight='1');
  });

  // ---------- Landing: toggle + fill grid ----------
  ready(() => {
    const btn  = document.getElementById('toggle-sections');
    const grid = document.getElementById('sections-grid') || document.querySelector('.section-grid');
    if (!btn || !grid) return;

    btn.addEventListener('click', () => {
      const hidden = grid.hasAttribute('hidden');
      if (hidden) grid.removeAttribute('hidden'); else grid.setAttribute('hidden','');
      btn.setAttribute('aria-expanded', String(hidden));
      const span = btn.querySelector('span');
      if (span) span.textContent = hidden ? 'Hide sections' : 'Show individual sections';
    });

    // Fill from sections.json if empty (server fallback already covers many cases)
    if (!grid.querySelector('.section-card')){
      AA.getSections().then(files=>{
        if (!files.length) return;
        const frag = document.createDocumentFragment();
        for (const f of files){
          const slug = AA.toSlug(f);
          const card = document.createElement('div'); card.className='section-card';
          const title = document.createElement('div'); title.className='section-card__title'; title.textContent = AA.nice(slug);
          const a = document.createElement('a'); a.className='btn'; a.href = AA.urls.section(slug); a.innerHTML = '<span>Open</span>';
          card.append(title, a); frag.append(card);
        }
        grid.innerHTML=''; grid.append(frag);
      });
    }
  });

  // ---------- Highlighter (multi-term, debounced) ----------
  function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }
  function clearHighlights(root){
    root.querySelectorAll('mark.aa-hit').forEach(m=>{
      m.replaceWith(document.createTextNode(m.textContent));
    });
  }
  function escapeRe(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function highlightAll(root, query){
    clearHighlights(root);
    const q = (query || '').trim();
    if (!q) return;

    // Support multi-word; ignore single-letter terms
    const terms = q.split(/\s+/).filter(w => w.length > 1).map(escapeRe);
    if (!terms.length) return;
    const re = new RegExp(`(${terms.join('|')})`, 'gi');

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n){
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = n.parentElement;
        if (!p || p.closest('code,pre,script,style,nav,aside,button,input,textarea')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    for (const node of nodes){
      const text = node.nodeValue;
      if (!re.test(text)) continue;

      const frag = document.createDocumentFragment();
      let idx = 0;
      text.replace(re, (m, _g1, offset) => {
        frag.appendChild(document.createTextNode(text.slice(idx, offset)));
        const mark = document.createElement('mark');
        mark.className = 'aa-hit';
        mark.textContent = m;
        frag.appendChild(mark);
        idx = offset + m.length;
        return m;
      });
      frag.appendChild(document.createTextNode(text.slice(idx)));
      node.parentNode.replaceChild(frag, node);
    }
  }

  // ---------- Sections + Full bill: topbar + pager (no sidebar) ----------
  ready(() => {
    const isSection = document.body.hasAttribute('data-section-file');
    const isBill = /\/policy\/bill-text\/?$/.test(location.pathname);
    if (!isSection && !isBill) return;

    const main = document.querySelector('.main') || document.body;

    // Ensure topbar exists at the top
    const topbar = document.getElementById('section-topbar') || (() => {
      const n = document.createElement('nav');
      n.id = 'section-topbar';
      n.className = 'section-topbar';
      main.prepend(n);
      return n;
    })();

    // Jump dropdown
    let jump = document.getElementById('sections-dropdown');
    if (!jump){
      jump = document.createElement('select');
      jump.id = 'sections-dropdown';
      jump.style.cssText = 'min-height:38px;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#0b0e12;color:#e9edf1;';
      topbar.appendChild(jump);
      jump.addEventListener('change', ()=>{ const v = jump.value; if (v) location.href = AA.urls.section(v); });
    }

    // Search input (sections & bill)
    let search = document.getElementById('section-search');
    if (!search){
      search = document.createElement('input');
      search.id = 'section-search';
      search.type = 'search';
      search.placeholder = isBill ? 'Search in full bill…' : 'Search within this section…';
      search.style.cssText = 'flex:1;min-width:200px;margin-left:8px;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#0b0e12;color:#e9edf1;';
      topbar.appendChild(search);
      const contentRoot = document.querySelector('.content') || main;
      search.addEventListener('input', debounce(()=>highlightAll(contentRoot, search.value), 120));
    }

    // Populate dropdown + build pager for sections
    AA.getSections().then(files=>{
      if (!files.length) return;

      // Populate dropdown
      jump.innerHTML = '<option value="">Jump to section…</option>';
      const ordered = files.slice().sort(AA.nsort);
      for (const f of ordered){
        const slug = AA.toSlug(f);
        const opt = document.createElement('option');
        opt.value = slug; opt.textContent = AA.nice(slug);
        jump.appendChild(opt);
      }

      if (isSection){
        const current = document.body.getAttribute('data-section-file');
        const idx = files.indexOf(current);
        const prev = idx>0 ? files[idx-1] : null;
        const next = (idx>=0 && idx<files.length-1) ? files[idx+1] : null;

        // Bottom pager
        let pager = document.getElementById('section-pager');
        if (!pager){
          pager = document.createElement('nav');
          pager.id = 'section-pager';
          pager.className = 'section-pager';
          pager.setAttribute('aria-label','Section pagination');
          main.appendChild(pager);
        }
        const frag = document.createDocumentFragment();
        const back = document.createElement('a'); back.className='btn btn--ghost'; back.href=AA.urls.bill(); back.innerHTML='<span>← Back to Full Bill</span>'; frag.appendChild(back);
        if (prev){ const a=document.createElement('a'); a.className='btn'; a.href=AA.urls.section(prev.replace(/\.md$/,'')); a.innerHTML='<span>← Previous</span>'; frag.appendChild(a); }
        if (next){ const a=document.createElement('a'); a.className='btn'; a.href=AA.urls.section(next.replace(/\.md$/,'')); a.innerHTML='<span>Next →</span>'; frag.appendChild(a); }
        pager.innerHTML=''; pager.appendChild(frag);

        // Floating mini-pager
        const old = document.getElementById('mini-pager'); if (old) old.remove();
        const mini = pager.cloneNode(true);
        mini.id = 'mini-pager';
        mini.classList.add('mini-pager');
        mini.hidden = true;
        document.body.appendChild(mini);

        // Appear earlier; always show on desktop
        const mqDesktop = window.matchMedia('(min-width: 1100px)');
        const updateMini = () => {
          const showEarly = window.scrollY > 150;
          const forceDesktop = mqDesktop.matches;
          const show = forceDesktop ? true : showEarly;
          mini.hidden = !show;
          document.body.classList.toggle('body--mini-pager', show);
        };
        updateMini();
        window.addEventListener('scroll', updateMini);
        mqDesktop.addEventListener?.('change', updateMini);
      }
    });
  });
})();