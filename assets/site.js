(function(){
  const DEBUG = new URLSearchParams(location.search).has('debug');
  const log = (...args) => { if (DEBUG) console.info('AA:', ...args); };

  // Optional on-page debug badge
  if (DEBUG){
    const tag = document.createElement('div');
    tag.textContent = 'AA debug';
    tag.style.cssText = 'position:fixed;right:8px;bottom:8px;padding:4px 8px;font:12px/1.2 ui-monospace;background:#222;color:#0f0;border:1px solid #0f0;border-radius:6px;z-index:9999';
    document.addEventListener('DOMContentLoaded', ()=>document.body.appendChild(tag));
  }

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
      // 1) Prefer sections.json
      try{
        const r = await fetch(urls.sectionsJson(), { cache: 'no-store' });
        if (r.ok) {
          const arr = await r.json();
          if (Array.isArray(arr) && arr.length){ log('sections.json loaded', arr.length); return arr; }
        } else {
          log('sections.json HTTP', r.status);
        }
      }catch(e){ log('sections.json fetch error', e); }
      // 2) Fallback: scrape anchors to /policy/sections/*
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
    log('base init');
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
    if (!toggleBtn || !grid){ log('landing: nothing to init'); return; }

    log('landing: init');
    toggleBtn.addEventListener('click', () => {
      const hidden = grid.hasAttribute('hidden');
      if (hidden) grid.removeAttribute('hidden'); else grid.setAttribute('hidden', '');
      toggleBtn.setAttribute('aria-expanded', String(hidden));
      const span = toggleBtn.querySelector('span');
      if (span) span.textContent = hidden ? 'Hide sections' : 'Show individual sections';
      log('landing: toggle', !hidden ? 'hide' : 'show');
    });

    AA.getSections().then(files => {
      grid.setAttribute('aria-busy', 'false');
      if (!files.length){ log('landing: no sections to render'); return; }
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
      log('landing: rendered', files.length);
    });
  });

  // ---------------- SECTIONS: nav + pager + sidebar + search ----------------
  ready(() => {
    const currentFile = document.body.getAttribute('data-section-file');
    if (!currentFile){ log('section: not a section page'); return; }
    log('section: init for', currentFile);

    const main = document.querySelector('.main') || document.body;

    // Ensure a top nav exists
    let nav = document.querySelector('nav.section-pager');
    if (!nav){
      nav = document.createElement('nav');
      nav.className = 'section-pager';
      nav.setAttribute('aria-label','Section navigation');
      main.prepend(nav);
      log('section: created top nav');
    }

    // Search input
    let searchInput = document.getElementById('section-search');
    if (!searchInput){
      searchInput = document.createElement('input');
      searchInput.id = 'section-search';
      searchInput.type = 'search';
      searchInput.placeholder = 'Search within this section…';
      searchInput.style.cssText = 'flex:1;min-width:200px;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#0b0e12;color:#e9edf1;margin-left:8px;';
      nav.appendChild(searchInput);
      log('section: injected search');
    }

    // Inline pager container
    let pager = document.getElementById('section-pager');
    if (!pager){
      pager = document.createElement('nav');
      pager.id = 'section-pager';
      pager.className = 'section-pager';
      pager.setAttribute('aria-label','Section pagination');
      main.appendChild(pager);
      log('section: created inline pager');
    }

    // Sidebar list
    let sidebarList = document.getElementById('sections-list');
    if (!sidebarList){
      const aside = document.createElement('aside');
      aside.className = 'bill-sidebar';
      const badge = document.createElement('div');
      badge.className = 'badge';
      badge.textContent = 'Affordability Act';
      aside.appendChild(badge);
      sidebarList = document.createElement('ul');
      sidebarList.id = 'sections-list';
      sidebarList.style.listStyle='none';
      sidebarList.style.padding='0';
      sidebarList.style.margin='12px 0 0';
      aside.appendChild(sidebarList);
      main.appendChild(aside);
      log('section: created sidebar');
    }

    function buildPager(files){
      const idx = files.indexOf(currentFile);
      const prev = idx>0 ? files[idx-1] : null;
      const next = (idx>=0 && idx<files.length-1) ? files[idx+1] : null;

      const frag = document.createDocumentFragment();
      const backBtn = document.createElement('a');
      backBtn.className = 'btn btn--ghost';
      backBtn.href = AA.urls.bill();
      backBtn.innerHTML = '<span>← Back to Full Bill</span>';
      frag.appendChild(backBtn);

      if (prev){ const a=document.createElement('a'); a.className='btn'; a.href=AA.urls.section(AA.toSlug(prev)); a.innerHTML='<span>← Previous</span>'; a.setAttribute('data-dir','prev'); frag.appendChild(a); }
      if (next){ const a=document.createElement('a'); a.className='btn'; a.href=AA.urls.section(AA.toSlug(next)); a.innerHTML='<span>Next →</span>'; a.setAttribute('data-dir','next'); frag.appendChild(a); }

      pager.innerHTML = '';
      pager.appendChild(frag);

      // Floating mini-pager
      const miniOld = document.getElementById('mini-pager');
      if (miniOld) miniOld.remove();
      const mini = pager.cloneNode(true);
      mini.id = 'mini-pager';
      mini.classList.add('mini-pager');
      mini.hidden = true;
      document.body.appendChild(mini);
      let visible = false;
      const toggleMini = () => {
        const y = window.scrollY;
        const shouldShow = y > 400;
        if (shouldShow !== visible) {
          visible = shouldShow;
          mini.hidden = !shouldShow;
        }
      };
      window.addEventListener('scroll', toggleMini);

      log('section: pager ok', { idx, prev, next });
    }

    function buildSidebar(files){
      sidebarList.innerHTML = '';
      const ordered = files.slice().sort(AA.naturalSort);
      for (const f of ordered){
        const li = document.createElement('li');
        const a = document.createElement('a');
        const slug = AA.toSlug(f);
        a.href = AA.urls.section(slug);
        a.textContent = AA.prettyTitle(slug);
        li.appendChild(a);
        sidebarList.appendChild(li);
      }
      log('section: sidebar ok', ordered.length);
    }

    AA.getSections().then(files => {
      if (!files.length){ log('section: no files discovered'); return; }
      buildPager(files);
      buildSidebar(files);
    });

    // In-section quick filter
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      const blocks = document.querySelectorAll('.main p, .main li');
      let shown = 0;
      blocks.forEach(el=>{
        if (!q) { el.style.display=''; shown++; return; }
        const hit = el.textContent.toLowerCase().includes(q);
        el.style.display = hit ? '' : 'none';
        if (hit) shown++;
      });
      log('section: search', q, 'shown:', shown);
    });
  });
})();