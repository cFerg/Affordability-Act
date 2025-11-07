(function(){
  const DEBUG = new URLSearchParams(location.search).has('debug');
  const log = (...args) => { if (DEBUG) console.info('AA:', ...args); };

  function ready(fn){
    if (document.readyState === 'complete' || document.readyState === 'interactive') fn();
    else document.addEventListener('DOMContentLoaded', fn, { once: true });
  }

  // ---------------- Shared helpers ----------------
  const AA = (() => {
    const root = document.documentElement.getAttribute('data-site-root') || '';
    const toSlug = (fname) => fname.replace(/\.md$/i,'');
    const prettyTitle = (slug) => slug.replace(/^\d+_?/, '').replace(/_/g, ' ').trim();
    const urls = {
      home: () => `${root}/`,
      bill: () => `${root}/policy/bill-text/`,
      section: (slug) => `${root}/policy/sections/${slug}/`,
      sectionsJson: () => `${root}/sections.json`,
    };
    const naturalSort = (a,b) => {
      const A=(a.toLowerCase().match(/\d+|[a-z]+/g))||[a];
      const B=(b.toLowerCase().match(/\d+|[a-z]+/g))||[b];
      for(let i=0;i<Math.max(A.length,B.length);i++){
        const x=A[i], y=B[i];
        if(x===undefined) return -1;
        if(y===undefined) return 1;
        const xi=+x, yi=+y;
        if(!Number.isNaN(xi) && !Number.isNaN(yi) && xi!==yi) return xi-yi;
        if(x!==y) return x.localeCompare(y);
      }
      return 0;
    };
    async function getSections() {
      try{
        const r = await fetch(urls.sectionsJson(), { cache: 'no-store' });
        if (r.ok) {
          const arr = await r.json();
          if (Array.isArray(arr) && arr.length){ log('sections.json loaded', arr.length); return arr; }
        }
      }catch(_) {}
      // Fallback: scrape anchors
      const anchors = Array.from(document.querySelectorAll('a[href*="/policy/sections/"]'));
      const md = anchors.map(a => {
        const href = a.getAttribute('href') || '';
        const parts = href.split('/').filter(Boolean);
        const last = parts.pop() || '';
        const slug = last || parts.pop() || '';
        return slug.replace(/\/$/, '') + '.md';
      }).filter(Boolean);
      const dedup = [...new Set(md)].sort(naturalSort);
      log('fallback sections from anchors', dedup.length);
      return dedup;
    }
    return { root, toSlug, prettyTitle, urls, naturalSort, getSections };
  })();

  // ---------------- Base behaviors ----------------
  ready(() => {
    const toTop = document.querySelector('[data-scroll-top]');
    if (toTop){
      toTop.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    const params = new URLSearchParams(location.search);
    if (params.get('open') === 'all'){
      document.querySelectorAll('details.section').forEach(d => d.open = true);
    }
    document.querySelectorAll('.btn').forEach(btn => { btn.style.lineHeight = '1'; });
  });

  // ---------------- LANDING: toggle + fill cards ----------------
  ready(() => {
    const toggleBtn = document.getElementById('toggle-sections');
    const grid = document.getElementById('sections-grid') || document.querySelector('.section-grid');
    if (!toggleBtn || !grid) return;

    toggleBtn.addEventListener('click', () => {
      const hidden = grid.hasAttribute('hidden');
      if (hidden) grid.removeAttribute('hidden'); else grid.setAttribute('hidden', '');
      toggleBtn.setAttribute('aria-expanded', String(hidden));
      const span = toggleBtn.querySelector('span');
      if (span) span.textContent = hidden ? 'Hide sections' : 'Show individual sections';
    });

    AA.getSections().then(files => {
      grid.setAttribute('aria-busy', 'false');
      if (!files.length) return;

      const frag = document.createDocumentFragment();
      for (const fname of files){
        const slug = AA.toSlug(fname);
        const title = AA.prettyTitle(slug);
        const card = document.createElement('div');
        card.className = 'section-card';
        const h = document.createElement('div'); h.className = 'section-card__title'; h.textContent = title;
        const a = document.createElement('a'); a.className = 'btn'; a.href = AA.urls.section(slug); a.innerHTML = '<span>Open</span>';
        card.appendChild(h); card.appendChild(a);
        frag.appendChild(card);
      }
      grid.innerHTML = '';
      grid.appendChild(frag);
    });
  });

  // ---------------- Text highlight (no hiding) ----------------
  function clearHighlights(root){
    root.querySelectorAll('mark.aa-hit').forEach(m => {
      const text = document.createTextNode(m.textContent);
      m.replaceWith(text);
    });
  }
  function highlight(root, query){
    clearHighlights(root);
    if (!query) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node){
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (node.parentElement && (node.parentElement.closest('nav,aside,code,pre,script,style,button,input,textarea'))) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const q = query.toLowerCase();
    const hits = [];
    while (walker.nextNode()){
      const node = walker.currentNode;
      const idx = node.nodeValue.toLowerCase().indexOf(q);
      if (idx >= 0){
        const span = document.createElement('mark');
        span.className = 'aa-hit';
        const before = node.nodeValue.slice(0, idx);
        const match  = node.nodeValue.slice(idx, idx+q.length);
        const after  = node.nodeValue.slice(idx+q.length);
        const parent = node.parentNode;
        parent.insertBefore(document.createTextNode(before), node);
        span.textContent = match;
        parent.insertBefore(span, node);
        parent.insertBefore(document.createTextNode(after), node);
        parent.removeChild(node);
        hits.push(span);
      }
    }
    if (hits.length) hits[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ---------------- SECTIONS & FULL BILL: nav + pager + sidebar + search ----------------
  ready(() => {
    const isSection = document.body.hasAttribute('data-section-file');
    const isBill = location.pathname.endsWith('/policy/bill-text/') || location.pathname.endsWith('/policy/bill-text');

    if (!isSection && !isBill) return;

    const main = document.querySelector('.main') || document.body;

    // Ensure top nav/search exists
    let nav = document.querySelector('nav.section-pager');
    if (!nav){
      nav = document.createElement('nav');
      nav.className = 'section-pager';
      nav.setAttribute('aria-label','Navigation');
      main.prepend(nav);
    }

    // Dropdown of sections (always present)
    let select = document.getElementById('sections-dropdown');
    if (!select){
      select = document.createElement('select');
      select.id = 'sections-dropdown';
      select.style.cssText = 'min-height:38px;padding:8px 10px;border-radius:10px;background:#0b0e12;color:#e9edf1;border:1px solid rgba(255,255,255,.12)';
      nav.appendChild(select);
      select.addEventListener('change', () => {
        const slug = select.value;
        if (slug) location.href = AA.urls.section(slug);
      });
    }

    // Search (works for sections AND full bill)
    let searchInput = document.getElementById('section-search');
    if (!searchInput){
      searchInput = document.createElement('input');
      searchInput.id = 'section-search';
      searchInput.type = 'search';
      searchInput.placeholder = isBill ? 'Search in full bill…' : 'Search within this section…';
      searchInput.style.cssText = 'flex:1;min-width:200px;margin-left:8px;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#0b0e12;color:#e9edf1;';
      nav.appendChild(searchInput);
    }

    // Inline pager (sections only)
    let pager = document.getElementById('section-pager');
    if (!pager){
      pager = document.createElement('nav');
      pager.id = 'section-pager';
      pager.className = 'section-pager';
      pager.setAttribute('aria-label','Section pagination');
      main.appendChild(pager);
    }

    // Sidebar (desktop)
    let sidebarList = document.getElementById('sections-list');
    if (!sidebarList){
      const aside = document.createElement('aside');
      aside.className = 'bill-sidebar';
      const badge = document.createElement('div'); badge.className='badge'; badge.textContent = 'Affordability Act';
      aside.appendChild(badge);
      sidebarList = document.createElement('ul'); sidebarList.id = 'sections-list';
      sidebarList.style.listStyle='none'; sidebarList.style.padding='0'; sidebarList.style.margin='12px 0 0';
      aside.appendChild(sidebarList);
      if (document.querySelector('.main')) document.querySelector('.main').appendChild(aside);
    }

    // Build lists/pager
    AA.getSections().then(files => {
      if (!files.length) return;

      // Populate dropdown + sidebar
      select.innerHTML = '<option value="">Jump to section…</option>';
      sidebarList.innerHTML = '';
      const ordered = files.slice().sort(AA.naturalSort);
      for (const f of ordered){
        const slug = AA.toSlug(f);
        const nice = AA.prettyTitle(slug);
        const opt = document.createElement('option'); opt.value = slug; opt.textContent = nice;
        select.appendChild(opt);
        const li = document.createElement('li');
        const a = document.createElement('a'); a.href = AA.urls.section(slug); a.textContent = nice;
        li.appendChild(a); sidebarList.appendChild(li);
      }

      if (isSection){
        const currentFile = document.body.getAttribute('data-section-file');
        const idx = files.indexOf(currentFile);
        const prev = idx>0 ? files[idx-1] : null;
        const next = (idx>=0 && idx<files.length-1) ? files[idx+1] : null;

        // Build pager
        const frag = document.createDocumentFragment();
        const backBtn = document.createElement('a');
        backBtn.className = 'btn btn--ghost'; backBtn.href = AA.urls.bill();
        backBtn.innerHTML = '<span>← Back to Full Bill</span>';
        frag.appendChild(backBtn);
        if (prev){ const a=document.createElement('a'); a.className='btn'; a.href=AA.urls.section(AA.toSlug(prev)); a.innerHTML='<span>← Previous</span>'; frag.appendChild(a); }
        if (next){ const a=document.createElement('a'); a.className='btn'; a.href=AA.urls.section(AA.toSlug(next)); a.innerHTML='<span>Next →</span>'; frag.appendChild(a); }
        pager.innerHTML = ''; pager.appendChild(frag);

        // Floating mini-pager + safe footer spacing
        const miniOld = document.getElementById('mini-pager'); if (miniOld) miniOld.remove();
        const mini = pager.cloneNode(true); mini.id = 'mini-pager'; mini.classList.add('mini-pager'); mini.hidden = true;
        document.body.appendChild(mini);
        let visible = false;
        const toggleMini = () => {
          const y = window.scrollY;
          const shouldShow = y > 400;
          if (shouldShow !== visible) {
            visible = shouldShow;
            mini.hidden = !shouldShow;
            document.body.classList.toggle('body--mini-pager', shouldShow);
          }
        };
        window.addEventListener('scroll', toggleMini);
      }
    });

    // Highlight search on input (no hiding)
    const contentRoot = document.querySelector('.main') || document.body;
    searchInput.addEventListener('input', () => {
      highlight(contentRoot, searchInput.value.trim());
    });
  });
})();