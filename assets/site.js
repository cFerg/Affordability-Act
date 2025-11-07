(function(){
  const DEBUG = new URLSearchParams(location.search).has('debug');
  const log = (...args) => { if (DEBUG) console.info('AA:', ...args); };
  const ready = (fn) => (document.readyState !== 'loading') ? fn() : document.addEventListener('DOMContentLoaded', fn, {once:true});

  // ------- helpers -------
  const AA = (() => {
    const root = document.documentElement.getAttribute('data-site-root') || '';
    const toSlug = (f) => f.replace(/\.md$/i,'');
    const nice = (s) => s.replace(/^\d+_?/, '').replace(/_/g,' ').trim();
    const urls = {
      bill: () => `${root}/policy/bill-text/`,
      section: (slug) => `${root}/policy/sections/${slug}/`,
      sectionsJson: () => `${root}/sections.json`,
    };
    const nsort = (a,b)=> {
      const A=(a.toLowerCase().match(/\d+|[a-z]+/g))||[a], B=(b.toLowerCase().match(/\d+|[a-z]+/g))||[b];
      for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i],y=B[i]; if(x===undefined) return -1; if(y===undefined) return 1;
        const xi=+x, yi=+y; if(!Number.isNaN(xi)&&!Number.isNaN(yi)&&xi!==yi) return xi-yi; if(x!==y) return x.localeCompare(y); }
      return 0;
    };
    async function getSections(){
      try{
        const r = await fetch(urls.sectionsJson(), {cache:'no-store'});
        if(r.ok){ const arr = await r.json(); if(Array.isArray(arr)&&arr.length) return arr; }
      }catch(_){}
      // fallback: scrape
      return [...new Set(Array.from(document.querySelectorAll('a[href*="/policy/sections/"]'))
        .map(a => (a.getAttribute('href')||'').split('/').filter(Boolean).pop()||'')
        .filter(Boolean).map(s => s.replace(/\/$/,'')+'.md'))].sort(nsort);
    }
    return {toSlug:nice?((f)=>toSlug(f)):toSlug, nice, urls, getSections, nsort, toSlug};
  })();

  // ------- landing grid toggle -------
  ready(() => {
    const btn = document.getElementById('toggle-sections');
    const grid = document.getElementById('sections-grid') || document.querySelector('.section-grid');
    if(!btn || !grid) return;
    btn.addEventListener('click', () => {
      const hidden = grid.hasAttribute('hidden');
      if (hidden) grid.removeAttribute('hidden'); else grid.setAttribute('hidden','');
      btn.setAttribute('aria-expanded', String(hidden));
      const span = btn.querySelector('span'); if (span) span.textContent = hidden ? 'Hide sections' : 'Show individual sections';
    });
    // Fill grid if needed
    if (!grid.querySelector('.section-card')){
      AA.getSections().then(files=>{
        if(!files.length) return;
        const frag = document.createDocumentFragment();
        for(const f of files){
          const slug = f.replace(/\.md$/i,'');
          const card = document.createElement('div'); card.className='section-card';
          const h = document.createElement('div'); h.className='section-card__title'; h.textContent = AA.nice(slug);
          const a = document.createElement('a'); a.className='btn'; a.href = AA.urls.section(slug); a.innerHTML = '<span>Open</span>';
          card.append(h,a); frag.append(card);
        }
        grid.innerHTML=''; grid.append(frag);
      });
    }
  });

  // ------- highlighter (multi-match, debounced) -------
  function debounce(fn, ms){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); }; }
  function clearHighlights(root){ root.querySelectorAll('mark.aa-hit').forEach(m=>{ const t=document.createTextNode(m.textContent); m.replaceWith(t);}); }
  function highlightAll(root, q){
    clearHighlights(root);
    if(!q) return;
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n){
        if(!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p=n.parentElement;
        if(!p||p.closest('code,pre,script,style,nav,aside,button,input,textarea')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    for(const node of nodes){
      const text = node.nodeValue;
      if(!re.test(text)) continue;
      const frag = document.createDocumentFragment();
      let last = 0;
      text.replace(re,(m,off)=>{
        frag.appendChild(document.createTextNode(text.slice(last,off)));
        const mark = document.createElement('mark'); mark.className='aa-hit'; mark.textContent = m;
        frag.appendChild(mark);
        last = off + m.length;
        return m;
      });
      frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    }
  }

  // ------- sections + full bill: topbar + pager (no sidebar) -------
  ready(() => {
    const isSection = document.body.hasAttribute('data-section-file');
    const isBill = /\/policy\/bill-text\/?$/.test(location.pathname);
    if(!isSection && !isBill) return;

    const main = document.querySelector('.main') || document.body;
    const topbar = document.getElementById('section-topbar') || (()=>{ const n=document.createElement('nav'); n.id='section-topbar'; n.className='section-topbar'; main.prepend(n); return n; })();

    // Jump dropdown
    let jump = document.getElementById('sections-dropdown');
    if(!jump){
      jump = document.createElement('select');
      jump.id='sections-dropdown';
      topbar.appendChild(jump);
      jump.addEventListener('change', ()=>{ const v=jump.value; if(v) location.href = AA.urls.section(v); });
    }

    // Search input (works on both section + bill)
    let search = document.getElementById('section-search');
    if(!search){
      search = document.createElement('input');
      search.id='section-search'; search.type='search';
      search.placeholder = isBill ? 'Search in full bill…' : 'Search within this section…';
      topbar.appendChild(search);
      const contentRoot = document.querySelector('.content') || main;
      search.addEventListener('input', debounce(()=>highlightAll(contentRoot, search.value.trim()), 120));
    }

    // Build dropdown + pager (if section)
    AA.getSections().then(files=>{
      if(!files.length) return;
      // populate dropdown
      jump.innerHTML = '<option value="">Jump to section…</option>';
      const ordered = files.slice().sort(AA.nsort);
      for(const f of ordered){
        const slug = f.replace(/\.md$/i,'');
        const opt = document.createElement('option');
        opt.value = slug; opt.textContent = AA.nice(slug);
        jump.appendChild(opt);
      }

      if(isSection){
        const current = document.body.getAttribute('data-section-file');
        const idx = files.indexOf(current);
        const prev = idx>0 ? files[idx-1] : null;
        const next = (idx>=0 && idx<files.length-1) ? files[idx+1] : null;

        let pager = document.getElementById('section-pager');
        if(!pager){
          pager = document.createElement('nav');
          pager.id='section-pager'; pager.className='section-pager';
          pager.setAttribute('aria-label','Section pagination');
          main.appendChild(pager);
        }
        const frag = document.createDocumentFragment();
        const back = document.createElement('a'); back.className='btn btn--ghost'; back.href=AA.urls.bill(); back.innerHTML='<span>← Back to Full Bill</span>'; frag.appendChild(back);
        if(prev){ const a=document.createElement('a'); a.className='btn'; a.href=AA.urls.section(prev.replace(/\.md$/i,'')); a.innerHTML='<span>← Previous</span>'; frag.appendChild(a); }
        if(next){ const a=document.createElement('a'); a.className='btn'; a.href=AA.urls.section(next.replace(/\.md$/i,'')); a.innerHTML='<span>Next →</span>'; frag.appendChild(a); }
        pager.innerHTML=''; pager.appendChild(frag);

        // Floating mini-pager + safe footer spacing
        const old = document.getElementById('mini-pager'); if(old) old.remove();
        const mini = pager.cloneNode(true); mini.id='mini-pager'; mini.classList.add('mini-pager'); mini.hidden=true; document.body.appendChild(mini);
        let vis=false; const onScroll=()=>{ const show = window.scrollY>400; if(show!==vis){ vis=show; mini.hidden=!show; document.body.classList.toggle('body--mini-pager', show);} }; 
        window.addEventListener('scroll', onScroll);
      }
    });
  });
})();